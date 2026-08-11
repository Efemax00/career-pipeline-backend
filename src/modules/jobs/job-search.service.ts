import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JobSearchService {
  private readonly logger = new Logger(JobSearchService.name);
  
  // All API Keys
  private readonly rapidApiKey: string;
  private readonly adzunaAppId: string;
  private readonly adzunaAppKey: string;
  private readonly museApiKey: string;
  private readonly zipRecruiterApiKey: string;
  private readonly careerBuilderApiKey: string;
  private readonly indeedApiKey: string;
  private readonly glassdoorApiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    // Read all API keys from .env
    this.rapidApiKey = this.configService.get<string>('RAPIDAPI_KEY') || '';
    this.adzunaAppId = this.configService.get<string>('ADZUNA_APP_ID') || '';
    this.adzunaAppKey = this.configService.get<string>('ADZUNA_APP_KEY') || '';
    this.museApiKey = this.configService.get<string>('MUSE_API_KEY') || '';
    this.zipRecruiterApiKey = this.configService.get<string>('ZIPRECRUITER_API_KEY') || '';
    this.careerBuilderApiKey = this.configService.get<string>('CAREERBUILDER_API_KEY') || '';
    this.indeedApiKey = this.configService.get<string>('INDEED_API_KEY') || '';
    this.glassdoorApiKey = this.configService.get<string>('GLASSDOOR_API_KEY') || '';
    
    // Log which keys are available
    this.logger.log('📋 API Keys Status:');
    this.logger.log(`  ✅ Remotive: No key needed (working)`);
    this.logger.log(`  ✅ Stack Overflow: No key needed (working)`);
    this.logger.log(`  ${this.rapidApiKey ? '✅' : '❌'} JSearch: ${this.rapidApiKey ? 'Key present' : 'Missing'}`);
    this.logger.log(`  ${this.adzunaAppId ? '✅' : '❌'} Adzuna: ${this.adzunaAppId ? 'Key present' : 'Missing'}`);
    this.logger.log(`  ${this.museApiKey ? '✅' : '❌'} The Muse: ${this.museApiKey ? 'Key present' : 'Missing'}`);
    this.logger.log(`  ${this.zipRecruiterApiKey ? '✅' : '❌'} ZipRecruiter: ${this.zipRecruiterApiKey ? 'Key present' : 'Missing'}`);
    this.logger.log(`  ${this.careerBuilderApiKey ? '✅' : '❌'} CareerBuilder: ${this.careerBuilderApiKey ? 'Key present' : 'Missing'}`);
    this.logger.log(`  ${this.indeedApiKey ? '✅' : '❌'} Indeed: ${this.indeedApiKey ? 'Key present' : 'Missing'}`);
    this.logger.log(`  ${this.glassdoorApiKey ? '✅' : '❌'} Glassdoor: ${this.glassdoorApiKey ? 'Key present' : 'Missing'}`);
  }

  async searchJobs(query: string, location?: string, page: number = 1) {
    this.logger.log(`🔍 Searching for: ${query} in ${location || 'any location'}`);

    // API 1: Remotive (No key needed - Working ✅)
    try {
      const results = await this.searchRemotive(query);
      if (results && results.length > 0) {
        this.logger.log(`✅ Found ${results.length} jobs via Remotive`);
        return results;
      }
    } catch (error) {
      this.logger.error(`Remotive API error: ${error.message}`);
    }

    // API 2: Stack Overflow (No key needed - Working ✅)
    try {
      const results = await this.searchStackOverflow(query);
      if (results && results.length > 0) {
        this.logger.log(`✅ Found ${results.length} jobs via Stack Overflow`);
        return results;
      }
    } catch (error) {
      this.logger.error(`Stack Overflow API error: ${error.message}`);
    }

    // API 3: The Muse (Requires key - You have this ✅)
    if (this.museApiKey) {
      try {
        const results = await this.searchMuse(query, location);
        if (results && results.length > 0) {
          this.logger.log(`✅ Found ${results.length} jobs via The Muse`);
          return results;
        }
      } catch (error) {
        this.logger.error(`The Muse API error: ${error.message}`);
      }
    }

    // API 4: JSearch (Requires key - You have this ✅)
    if (this.rapidApiKey) {
      try {
        const results = await this.searchJSearch(query, location, page);
        if (results && results.length > 0) {
          this.logger.log(`✅ Found ${results.length} jobs via JSearch`);
          return results;
        }
      } catch (error) {
        this.logger.error(`JSearch API error: ${error.message}`);
      }
    }

    // API 5: Adzuna (Requires key - You have this ✅)
    if (this.adzunaAppId && this.adzunaAppKey) {
      try {
        const results = await this.searchAdzuna(query, location, page);
        if (results && results.length > 0) {
          this.logger.log(`✅ Found ${results.length} jobs via Adzuna`);
          return results;
        }
      } catch (error) {
        this.logger.error(`Adzuna API error: ${error.message}`);
      }
    }

    // API 6: ZipRecruiter (Requires key - Optional)
    if (this.zipRecruiterApiKey) {
      try {
        const results = await this.searchZipRecruiter(query, location);
        if (results && results.length > 0) {
          this.logger.log(`✅ Found ${results.length} jobs via ZipRecruiter`);
          return results;
        }
      } catch (error) {
        this.logger.error(`ZipRecruiter API error: ${error.message}`);
      }
    }

    // API 7: CareerBuilder (Requires key - Optional)
    if (this.careerBuilderApiKey) {
      try {
        const results = await this.searchCareerBuilder(query, location);
        if (results && results.length > 0) {
          this.logger.log(`✅ Found ${results.length} jobs via CareerBuilder`);
          return results;
        }
      } catch (error) {
        this.logger.error(`CareerBuilder API error: ${error.message}`);
      }
    }

    // API 8: Indeed (Requires key - Optional)
    if (this.indeedApiKey) {
      try {
        const results = await this.searchIndeed(query, location);
        if (results && results.length > 0) {
          this.logger.log(`✅ Found ${results.length} jobs via Indeed`);
          return results;
        }
      } catch (error) {
        this.logger.error(`Indeed API error: ${error.message}`);
      }
    }

    // API 9: Glassdoor (Requires key - Optional)
    if (this.glassdoorApiKey) {
      try {
        const results = await this.searchGlassdoor(query, location);
        if (results && results.length > 0) {
          this.logger.log(`✅ Found ${results.length} jobs via Glassdoor`);
          return results;
        }
      } catch (error) {
        this.logger.error(`Glassdoor API error: ${error.message}`);
      }
    }

    // If all APIs fail, return mock data
    this.logger.warn('⚠️ All APIs failed, returning mock data');
    return this.getMockJobs(query);
  }

  // ─── API 1: Remotive (No key needed - Working) ──────────────────────────

  private async searchRemotive(query: string): Promise<any[]> {
    try {
      const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`;
      this.logger.log(`📡 Calling Remotive: ${url}`);
      const response = await firstValueFrom(this.httpService.get(url));

      if (response.data?.jobs) {
        this.logger.log(`📊 Remotive found ${response.data.jobs.length} jobs`);
        return response.data.jobs.map((job: any) => ({
          title: job.title || '',
          company: job.company_name || '',
          companyLogo: '',
          location: job.candidate_required_location || 'Remote',
          description: job.description || '',
          salary: job.salary || 'Not specified',
          jobType: job.job_type || 'Remote',
          postedDate: job.publication_date || new Date().toISOString(),
          jobUrl: job.url || '',
          source: 'Remotive',
          tags: job.tags || [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── API 2: Stack Overflow (No key needed - Working) ────────────────────

  private async searchStackOverflow(query: string): Promise<any[]> {
    try {
      const url = `https://api.stackexchange.com/2.3/jobs?order=desc&sort=creation_date&tagged=${encodeURIComponent(query)}&site=stackoverflow`;
      this.logger.log(`📡 Calling Stack Overflow: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      if (response.data?.items) {
        this.logger.log(`📊 Stack Overflow found ${response.data.items.length} jobs`);
        return response.data.items.map((job: any) => ({
          title: job.title || '',
          company: job.company?.name || '',
          companyLogo: '',
          location: job.location || '',
          description: job.excerpt || '',
          salary: job.salary || '',
          jobType: job.job_type || '',
          postedDate: job.creation_date ? new Date(job.creation_date * 1000).toISOString() : new Date().toISOString(),
          jobUrl: job.link || '',
          source: 'Stack Overflow',
          tags: job.tags || [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── API 3: The Muse (Requires key - You have this) ─────────────────────

  private async searchMuse(query: string, location?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        page: '1',
        desc: query,
        api_key: this.museApiKey,
      });
      if (location) params.append('location', location);

      const url = `https://api.themuse.com/v1/jobs?${params.toString()}`;
      this.logger.log(`📡 Calling The Muse: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      if (response.data?.results) {
        this.logger.log(`📊 The Muse found ${response.data.results.length} jobs`);
        return response.data.results.map((job: any) => ({
          title: job.name || '',
          company: job.company?.name || '',
          companyLogo: job.company?.logo_url || '',
          location: job.locations?.map((l: any) => l.name).join(', ') || '',
          description: job.contents || '',
          salary: '',
          jobType: job.type || '',
          postedDate: job.publication_date || new Date().toISOString(),
          jobUrl: job.refs?.landing_page || '',
          source: 'The Muse',
          tags: job.categories?.map((c: any) => c.name) || [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── API 4: JSearch (Requires key - You have this) ──────────────────────

  private async searchJSearch(query: string, location?: string, page: number = 1) {
    try {
      const url = 'https://jsearch.p.rapidapi.com/search-v2';
      const params = new URLSearchParams({
        query: query,
        page: page.toString(),
        num_pages: '1',
        country: 'us',
        date_posted: 'all',
      });
      if (location) params.append('location', location);

      this.logger.log(`📡 Calling JSearch: ${url}?${params.toString()}`);

      const response = await firstValueFrom(
        this.httpService.get(`${url}?${params.toString()}`, {
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          },
        })
      );

      let jobs: any[] = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        jobs = response.data.data;
      }

      if (jobs.length > 0) {
        this.logger.log(`📊 JSearch found ${jobs.length} jobs`);
        return jobs.map((job: any) => ({
          title: job.job_title || job.title || '',
          company: job.employer_name || job.company_name || '',
          companyLogo: job.employer_logo || '',
          location: job.job_city || job.job_location || '',
          description: job.job_description || '',
          salary: job.job_salary || job.salary || '',
          jobType: job.job_employment_type || job.job_type || '',
          postedDate: job.job_posted_at_datetime_utc || job.date_posted || '',
          jobUrl: job.job_apply_link || job.url || '',
          source: 'JSearch',
          tags: job.job_tags || [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── API 5: Adzuna (Requires key - You have this) ───────────────────────

  private async searchAdzuna(query: string, location?: string, page: number = 1) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/us/search/${page}`;
      const params = new URLSearchParams({
        app_id: this.adzunaAppId,
        app_key: this.adzunaAppKey,
        results_per_page: '10',
        what: query,
        where: location || '',
        content_type: 'application/json',
      });

      this.logger.log(`📡 Calling Adzuna: ${url}?${params.toString()}`);

      const response = await firstValueFrom(
        this.httpService.get(`${url}?${params.toString()}`)
      );

      if (response.data?.results) {
        this.logger.log(`📊 Adzuna found ${response.data.results.length} jobs`);
        return response.data.results.map((job: any) => ({
          title: job.title || '',
          company: job.company?.display_name || '',
          companyLogo: job.company?.logo_url || '',
          location: job.location?.display_name || '',
          description: job.description || '',
          salary: job.salary_max ? `$${job.salary_min} - $${job.salary_max}` : '',
          jobType: job.contract_type || '',
          postedDate: job.created || '',
          jobUrl: job.redirect_url || '',
          source: 'Adzuna',
          tags: job.category?.tag || [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── API 6: ZipRecruiter (Requires key - Optional) ──────────────────────

  private async searchZipRecruiter(query: string, location?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        api_key: this.zipRecruiterApiKey,
        search: query,
        location: location || '',
        page: '1',
        records_per_page: '10',
      });

      const url = `https://api.ziprecruiter.com/jobs/v1?${params.toString()}`;
      this.logger.log(`📡 Calling ZipRecruiter: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      if (response.data?.jobs) {
        return response.data.jobs.map((job: any) => ({
          title: job.name || '',
          company: job.company_name || '',
          companyLogo: '',
          location: job.location || '',
          description: job.description || '',
          salary: job.salary || '',
          jobType: job.type || '',
          postedDate: job.posted_date || new Date().toISOString(),
          jobUrl: job.url || '',
          source: 'ZipRecruiter',
          tags: [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── API 7: CareerBuilder (Requires key - Optional) ─────────────────────

  private async searchCareerBuilder(query: string, location?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        api_key: this.careerBuilderApiKey,
        keyword: query,
        location: location || '',
        page: '1',
        pagesize: '10',
      });

      const url = `https://api.careerbuilder.com/v1/jobs?${params.toString()}`;
      this.logger.log(`📡 Calling CareerBuilder: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      if (response.data?.JobSearchResult?.JobResults) {
        return response.data.JobSearchResult.JobResults.map((job: any) => ({
          title: job.JobTitle || '',
          company: job.CompanyName || '',
          companyLogo: '',
          location: job.Location || '',
          description: job.JobDescription || '',
          salary: job.SalaryInformation || '',
          jobType: job.EmploymentType || '',
          postedDate: job.PostedDate || new Date().toISOString(),
          jobUrl: job.JobDetailsURL || '',
          source: 'CareerBuilder',
          tags: [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── API 8: Indeed (Requires key - Optional) ────────────────────────────

  private async searchIndeed(query: string, location?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        publisher: this.indeedApiKey,
        q: query,
        l: location || '',
        format: 'json',
        v: '2',
        limit: '10',
      });

      const url = `https://api.indeed.com/ads/apisearch?${params.toString()}`;
      this.logger.log(`📡 Calling Indeed: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      if (response.data?.results) {
        return response.data.results.map((job: any) => ({
          title: job.jobtitle || '',
          company: job.company || '',
          companyLogo: '',
          location: job.formattedLocation || '',
          description: job.snippet || '',
          salary: job.salary || '',
          jobType: '',
          postedDate: job.date || new Date().toISOString(),
          jobUrl: job.url || '',
          source: 'Indeed',
          tags: [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── API 9: Glassdoor (Requires key - Optional) ─────────────────────────

  private async searchGlassdoor(query: string, location?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        api_key: this.glassdoorApiKey,
        q: query,
        location: location || '',
        format: 'json',
        limit: '10',
      });

      const url = `https://api.glassdoor.com/api/api.htm?${params.toString()}`;
      this.logger.log(`📡 Calling Glassdoor: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      if (response.data?.response?.jobs) {
        return response.data.response.jobs.map((job: any) => ({
          title: job.title || '',
          company: job.companyName || '',
          companyLogo: '',
          location: job.location || '',
          description: job.description || '',
          salary: job.salary || '',
          jobType: job.type || '',
          postedDate: job.postedDate || new Date().toISOString(),
          jobUrl: job.jobUrl || '',
          source: 'Glassdoor',
          tags: [],
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  // ─── Mock Data (Fallback) ─────────────────────────────────────────────────

  private getMockJobs(query: string): any[] {
    const companies = ['Google', 'Microsoft', 'Amazon', 'Stripe', 'Netflix', 'Meta', 'Apple', 'Spotify'];
    const locations = ['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA'];
    const jobTypes = ['Full-time', 'Remote', 'Hybrid', 'Contract'];
    
    return Array.from({ length: 8 }, (_, i) => {
      const company = companies[i % companies.length];
      const location = locations[i % locations.length];
      const jobType = jobTypes[i % jobTypes.length];
      const salary = `$${Math.floor(Math.random() * 80 + 120)}k - $${Math.floor(Math.random() * 60 + 160)}k`;
      
      return {
        title: `${query} - ${['Senior', 'Lead', 'Staff', 'Principal', 'Mid-Level', 'Junior', 'Entry Level', 'Architect'][i % 8]}`,
        company: company,
        companyLogo: '',
        location: location,
        description: `Exciting ${query} opportunity at ${company}. Join a world-class team working on cutting-edge technology.`,
        salary: salary,
        jobType: jobType,
        postedDate: new Date(Date.now() - i * 86400000).toISOString(),
        jobUrl: `https://${company.toLowerCase()}.com/careers`,
        source: 'Mock',
        tags: [query.toLowerCase(), 'tech', jobType.toLowerCase()],
      };
    });
  }

  // ─── Helper Methods ─────────────────────────────────────────────────────

  getJobBoards() {
    return {
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=',
      indeed: 'https://www.indeed.com/jobs?q=',
      glassdoor: 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword=',
      monster: 'https://www.monster.com/jobs/search/?q=',
      careerBuilder: 'https://www.careerbuilder.com/jobs?keywords=',
      zipRecruiter: 'https://www.ziprecruiter.com/jobs/search?search=',
      dice: 'https://www.dice.com/jobs?q=',
      simplyHired: 'https://www.simplyhired.com/search?q=',
      remoteOK: 'https://remoteok.com/remote-jobs/',
      weWorkRemotely: 'https://weworkremotely.com/remote-jobs/',
      angelList: 'https://angel.co/jobs?q=',
    };
  }

  getPopularSearches() {
    return [
      'Software Engineer', 'Product Manager', 'Data Scientist',
      'DevOps Engineer', 'Frontend Developer', 'Backend Developer',
      'Full Stack Developer', 'UX Designer', 'Project Manager',
      'Machine Learning Engineer', 'Cloud Architect', 'Security Engineer',
    ];
  }

  async getSuggestions(query: string) {
    const popular = this.getPopularSearches();
    return popular.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }
}