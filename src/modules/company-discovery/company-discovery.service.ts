import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyIntelligence, CompanyIntelligenceDocument } from './schemas/company-intelligence.schema';
import { SearchCompaniesDto } from './dto/search-companies.dto';
import { CompaniesService } from '../companies/companies.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CompanyDiscoveryService {
  private readonly logger = new Logger(CompanyDiscoveryService.name);
  private readonly googleApiKey: string;

  constructor(
    @InjectModel(CompanyIntelligence.name) private companyModel: Model<CompanyIntelligenceDocument>,
    private companiesService: CompaniesService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_KNOWLEDGE_GRAPH_API_KEY') || '';
  }

  async searchCompanies(searchDto: SearchCompaniesDto) {
    const { query, country, industry, remote, page = 1, limit = 20 } = searchDto;

    // Build filter for database search
    const filter: any = {};

    if (query) {
      const words = query.split(' ').filter(w => w.length > 2);
      if (words.length > 1) {
        filter.$or = words.map(word => ({
          $or: [
            { name: { $regex: word, $options: 'i' } },
            { description: { $regex: word, $options: 'i' } },
            { tags: { $in: [new RegExp(word, 'i')] } },
            { industry: { $regex: word, $options: 'i' } },
          ]
        }));
      } else {
        filter.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
          { industry: { $regex: query, $options: 'i' } },
        ];
      }
    }

    if (country) {
      filter['location.country'] = { $regex: country, $options: 'i' };
    }

    if (industry) {
      filter.industry = { $regex: industry, $options: 'i' };
    }

    if (remote !== undefined) {
      filter.remote = remote;
    }

    const skip = (page - 1) * limit;

    // First, try to find results in database
    let companies = await this.companyModel.find(filter).skip(skip).limit(limit).lean().exec();
    this.logger.log(`📋 Found ${companies.length} companies in database`);

    // If no results and there's a query, try Google Knowledge Graph
    if (companies.length === 0 && query && this.googleApiKey) {
      this.logger.log(`🔍 Searching Google Knowledge Graph for: "${query}"`);
      const realCompanies = await this.searchGoogleKnowledgeGraph(query, country);
      
      if (realCompanies.length > 0) {
        // Save to DB for future use
        let savedCount = 0;
        for (const company of realCompanies) {
          try {
            await this.companyModel.updateOne(
              { name: company.name },
              company,
              { upsert: true },
            );
            savedCount++;
          } catch (err) {
            this.logger.error(`Failed to save ${company.name}: ${err.message}`);
          }
        }
        this.logger.log(`💾 Saved ${savedCount} new companies to database`);
        
        // Return the companies directly from the API result
        companies = realCompanies;
      }
    }

    // If we have companies from Google API but they weren't saved, use them
    if (companies.length === 0 && query) {
      const simpleFilter = query ? { name: { $regex: query.split(' ').slice(0, 2).join('|'), $options: 'i' } } : {};
      companies = await this.companyModel.find(simpleFilter).skip(skip).limit(limit).lean().exec();
    }

    const total = await this.companyModel.countDocuments(filter);

    return {
      companies: companies || [],
      total: companies?.length || 0,
      page,
      limit,
      totalPages: Math.ceil((companies?.length || 0) / limit),
    };
  }

  // ─── Google Knowledge Graph API Integration ──────────────────

  private async searchGoogleKnowledgeGraph(query: string, country?: string): Promise<any[]> {
    try {
      if (!this.googleApiKey) {
        this.logger.warn('⚠️ Google Knowledge Graph API key not set.');
        return [];
      }

      // Build search query with context
      let searchQuery = query;
      
      // If country is specified in the search or detected in query, add it for better results
      if (country) {
        searchQuery = `${query} ${country}`;
      }

      // Detect country keywords in query and use them
      const countryKeywords = [
        'nigeria', 'canada', 'usa', 'uk', 'germany', 'france', 
        'australia', 'india', 'japan', 'china', 'brazil', 'mexico',
        'canadian', 'american', 'british', 'german', 'french', 'nigerian'
      ];
      
      const queryLower = query.toLowerCase();
      let detectedCountry = '';
      for (const keyword of countryKeywords) {
        if (queryLower.includes(keyword)) {
          detectedCountry = keyword;
          break;
        }
      }

      // If country detected in query, use it for better results
      if (detectedCountry) {
        searchQuery = query;
        this.logger.log(`📍 Detected country in query: ${detectedCountry}`);
      }

      const url = `https://kgsearch.googleapis.com/v1/entities:search`;
      const params = new URLSearchParams({
        query: searchQuery,
        key: this.googleApiKey,
        limit: '25',
        types: 'Organization',
      });

      this.logger.log(`📡 Calling Google Knowledge Graph with query: "${searchQuery}"`);

      const response = await firstValueFrom(
        this.httpService.get(`${url}?${params.toString()}`)
      );

      if (response.data?.itemListElement) {
        const entities = response.data.itemListElement;
        this.logger.log(`✅ Google Knowledge Graph found ${entities.length} entities`);
        
        // Map all entities to companies
        const companies = entities
          .map((item: any) => {
            const entity = item.result;
            
            const isOrganization = entity['@type']?.some((t: string) => 
              t === 'Organization' || t === 'Corporation' || t === 'Thing'
            );
            
            if (!isOrganization || !entity.name) {
              return null;
            }

            // Extract location from description if available
            let detectedLocation = '';
            const description = entity.detailedDescription?.articleBody || entity.description || '';
            const locationMatch = description.match(/(in|of|based in|located in)\s+([A-Z][a-z]+)/i);
            if (locationMatch) {
              detectedLocation = locationMatch[2];
            }

            // Check if company matches the country context
            const nameLower = entity.name.toLowerCase();
            const descLower = description.toLowerCase();
            const queryLower = query.toLowerCase();
            
            // If query has a country, try to verify the company is from that country
            let countryMatch = true;
            const countryKeywords = ['nigeria', 'canada', 'usa', 'uk', 'germany', 'france', 'australia'];
            for (const keyword of countryKeywords) {
              if (queryLower.includes(keyword)) {
                // Check if company description or name mentions the country
                const hasCountry = nameLower.includes(keyword) || 
                                  descLower.includes(keyword) || 
                                  detectedLocation.toLowerCase().includes(keyword);
                if (!hasCountry) {
                  // Don't filter out, but we could add a confidence score
                  // For now, keep all results but note the location
                }
                break;
              }
            }

            return {
              name: entity.name,
              logo: '',
              description: entity.detailedDescription?.articleBody || entity.description || '',
              website: entity.detailedDescription?.url || entity.url || '',
              linkedin: '',
              location: {
                country: detectedLocation || '',
                city: '',
                region: '',
              },
              industry: '',
              companySize: '',
              foundedYear: undefined,
              businessModel: '',
              stage: '',
              funding: {
                total: undefined,
                stage: '',
                lastRound: '',
                lastAmount: undefined,
                lastDate: undefined,
                investors: [],
              },
              remote: false,
              hiring: {
                status: 'Unknown',
                positions: [],
              },
              technology: [],
              competitors: [],
              tags: entity['@type'] || [],
              source: 'Google Knowledge Graph',
              sourceId: entity['@id'] || '',
              lastUpdated: new Date(),
            };
          })
          .filter((company: any) => company !== null);

        this.logger.log(`✅ Returning ${companies.length} companies from Google`);
        
        if (companies.length > 0) {
          this.logger.log(`📝 Sample companies: ${companies.slice(0, 5).map((c: any) => c.name).join(', ')}`);
        }
        
        return companies;
      }
      
      return [];
    } catch (error) {
      this.logger.error(`❌ Google Knowledge Graph API error: ${error.message}`);
      return [];
    }
  }

  // ─── Other Methods ──────────────────────────────────────────────

  async getCompanyDetails(id: string): Promise<CompanyIntelligenceDocument> {
    const company = await this.companyModel.findById(id).lean().exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async getFilterOptions() {
    const [countries, industries, stages, sizes] = await Promise.all([
      this.companyModel.distinct('location.country'),
      this.companyModel.distinct('industry'),
      this.companyModel.distinct('stage'),
      this.companyModel.distinct('companySize'),
    ]);

    return {
      countries: countries.filter(Boolean),
      industries: industries.filter(Boolean),
      stages: stages.filter(Boolean),
      sizes: sizes.filter(Boolean),
      remote: [true, false],
    };
  }

  async checkCompanyInPipeline(companyId: string, userId: string) {
    const intelligence = await this.companyModel.findById(companyId).lean().exec();
    if (!intelligence) {
      throw new NotFoundException('Company not found');
    }

    const allCompanies = await this.companiesService.findAll(userId);
    const existing = allCompanies.find((c: any) => c.name === intelligence.name);

    if (existing) {
      return {
        exists: true,
        companyId: existing._id,
        status: existing.status,
      };
    }

    return { exists: false };
  }

  async addToPipeline(companyId: string, userId: string) {
    const intelligence = await this.companyModel.findById(companyId).lean().exec();
    if (!intelligence) {
      throw new NotFoundException('Company not found');
    }

    const allCompanies = await this.companiesService.findAll(userId);
    const existing = allCompanies.find((c: any) => c.name === intelligence.name);

    if (existing) {
      return {
        success: false,
        message: 'Company already in your pipeline',
        companyId: existing._id,
      };
    }

    const newCompany = await this.companiesService.create(
      {
        name: intelligence.name,
        industry: intelligence.industry || 'Technology',
        country: intelligence.location?.country || '',
        size: intelligence.companySize || 'Unknown',
        remote: intelligence.remote || false,
        website: intelligence.website || '',
        role: 'To Research',
        priority: 'Medium',
        tags: intelligence.tags || [],
      },
      userId,
    );

    return {
      success: true,
      message: 'Company added to pipeline',
      companyId: newCompany._id,
    };
  }
}
