import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyIntelligence, CompanyIntelligenceDocument } from './schemas/company-intelligence.schema';
import { CompaniesService } from '../companies/companies.service';
import { NotesService } from '../notes/notes.service';
import { MapboxPlacesProvider } from "./providers/mapbox-places.provider";
import { ApifyEmailEnricher } from './enrichers/apify-email.enricher';
import { VerticalsService } from '../verticals/verticals.service';
import { GeminiMessageGenerator } from './generators/gemini-message.generator';

@Injectable()
export class HotelHunterService {
  private readonly logger = new Logger(HotelHunterService.name);

  constructor(
    @InjectModel(CompanyIntelligence.name) private companyModel: Model<CompanyIntelligenceDocument>,
    private companiesService: CompaniesService,
    private notesService: NotesService,
    private placesProvider: MapboxPlacesProvider,
    private emailEnricher: ApifyEmailEnricher,
    private llmGenerator: GeminiMessageGenerator,
    private verticalsService: VerticalsService,
  ) {}

  async hunt(
    query: string,
    userId: string,
    options: { verticalSlug?: string; region?: string; country?: string; limit?: number } = {},
  ) {
    const verticalSlug = options.verticalSlug || 'hospitality';
    const vertical = await this.verticalsService.findBySlug(verticalSlug);

    this.logger.log(`🎯 Hunting ${vertical.name} leads for user ${userId}`);

    const results = await this.placesProvider.search(query, {
  searchTypes: vertical.discovery.searchTypes,
  country: options.country || vertical.discovery.defaultCountry,
  region: options.region || vertical.discovery.defaultRegion,
});

    const limited = results.slice(0, options.limit || 10);
    const enriched: any[] = [];

    for (const place of limited) {
      // 2. Enrich with email + socials
      const { emails, socials } = await this.emailEnricher.enrichWithEmail({
        name: place.name,
        website: place.website,
        location: place.location,
      });

      place.metadata = place.metadata || {};
      place.metadata.emails = emails;
      place.metadata.socials = socials;
      place.noteCreated = false;
      place.inPipeline = false;

      // 3. Save intelligence
      await this.companyModel.updateOne(
        { sourceId: place.sourceId, source: 'GooglePlaces' }, // <--- CHANGED
        { $set: place },
        { upsert: true },
      );

      // 4. Generate message
      const message = await this.llmGenerator.generate(place, vertical);
      place.generatedMessage = message;

      // 5. Add to pipeline
      try {
        const pipelineResult = await this.companiesService.create(
          {
            name: place.name,
            industry: place.industry || vertical.name,
            country: place.location?.country || '',
            size: 'Unknown',
            remote: false,
            website: place.website || '',
            role: 'To Research',
            priority: this.getPriority(place.metadata?.rating),
            tags: [...(place.tags || []), verticalSlug, 'hunt'],
          } as any,
          userId,
          verticalSlug,
        );
        place.pipelineId = pipelineResult._id;
        place.inPipeline = true;

        // 6. Auto-create Note with the message
        if (message) {
          try {
            const note = await this.notesService.create(
              {
                title: `Outreach — ${place.name}`,
                content: message,
                folder: `${vertical.name} Outreach`,
                tags: [verticalSlug, 'outreach', 'first-message'],
                type: 'outreach',
              } as any,
              userId,
            );
            place.noteId = note._id;
            place.noteCreated = true;
          } catch (err) {
            this.logger.warn(`Note creation failed for ${place.name}: ${err.message}`);
            place.noteCreated = false;
          }
        }
      } catch (err) {
        this.logger.warn(`Pipeline add failed for ${place.name}: ${err.message}`);
        place.inPipeline = false;
      }

      enriched.push(place);
      this.logger.log(`✅ ${place.name} — emails:${emails.length} pipeline:${place.inPipeline} note:${place.noteCreated}`);
    }

    return {
      vertical: vertical.slug,
      verticalName: vertical.name,
      total: enriched.length,
      results: enriched,
    };
  }

  private getPriority(rating: number): string {
    if (rating >= 4.5) return 'High';
    if (rating >= 4.0) return 'Medium';
    return 'Low';
  }
}
