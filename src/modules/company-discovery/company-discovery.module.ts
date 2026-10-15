import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { CompanyDiscoveryController } from './company-discovery.controller';
import { CompanyDiscoveryService } from './company-discovery.service';
import { HotelHunterService } from './hotel-hunter.service';
import { MapboxPlacesProvider } from "./providers/mapbox-places.provider";
import { ApifyEmailEnricher } from './enrichers/apify-email.enricher';
import { CompanyIntelligence, CompanyIntelligenceSchema } from './schemas/company-intelligence.schema';
import { CompaniesModule } from '../companies/companies.module';
import { NotesModule } from '../notes/notes.module';
import { GeminiMessageGenerator } from './generators/gemini-message.generator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyIntelligence.name, schema: CompanyIntelligenceSchema },
    ]),
    CompaniesModule,
    NotesModule,
    HttpModule.register({ timeout: 60000, maxRedirects: 5 }),
  ],
  controllers: [CompanyDiscoveryController],
  providers: [
    CompanyDiscoveryService,
    HotelHunterService,
   MapboxPlacesProvider,
    ApifyEmailEnricher,
    GeminiMessageGenerator,
  ],
  exports: [CompanyDiscoveryService, HotelHunterService],
})
export class CompanyDiscoveryModule {}
