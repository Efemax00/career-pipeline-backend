import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApifyEmailEnricher {
  private readonly logger = new Logger(ApifyEmailEnricher.name);
  private readonly apiToken: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiToken = this.configService.get<string>('APIFY_API_TOKEN') || '';
  }

  async enrichWithEmail(place: {
    name: string;
    website?: string;
    location?: any;
  }): Promise<{ emails: string[]; socials: Record<string, string> }> {
    if (!this.apiToken) {
      this.logger.warn('⚠️ APIFY_API_TOKEN not set, skipping enrichment');
      return { emails: [], socials: {} };
    }

    if (!place.website) {
      this.logger.warn(`⚠️ No website for ${place.name}, skipping`);
      return { emails: [], socials: {} };
    }

    try {
      const actorId = 'apify~contact-info-scraper';

      const response = await firstValueFrom(
        this.httpService.post(
          `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${this.apiToken}`,
          {
            startUrls: [{ url: place.website }],
            maxRequestsPerCrawl: 5,
            maxConcurrency: 1,
            contactInfoExtraction: true,
          },
          { timeout: 120000 },
        ),
      );

      const items = Array.isArray(response.data) ? response.data : [];
      const emails: string[] = [];
      const socials: Record<string, string> = {};

      for (const item of items) {
        if (item.emails && Array.isArray(item.emails)) emails.push(...item.emails);
        if (item.facebook) socials.facebook = item.facebook;
        if (item.instagram) socials.instagram = item.instagram;
        if (item.tiktok) socials.tiktok = item.tiktok;
        if (item.twitter) socials.twitter = item.twitter;
        if (item.linkedin) socials.linkedin = item.linkedin;
      }

      const uniqueEmails = [...new Set(emails.filter((e) => e && e.includes('@')))];

      this.logger.log(`✅ Found ${uniqueEmails.length} emails for ${place.name}`);
      return { emails: uniqueEmails, socials };
    } catch (error: any) {
      this.logger.error(`❌ Apify enrichment failed for ${place.name}: ${error.message}`);
      return { emails: [], socials: {} };
    }
  }
}
