import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

const QUERY_MAP: Record<string, string> = {
  lodging: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  meal_delivery: "food delivery",
  meal_takeaway: "takeaway restaurants",
};

@Injectable()
export class GooglePlacesProvider {
  private readonly logger = new Logger(GooglePlacesProvider.name);
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>("GOOGLE_PLACES_API_KEY") || "";
    if (!this.apiKey) {
      this.logger.warn("⚠️ GOOGLE_PLACES_API_KEY not set — provider disabled");
    }
  }

  private async withRetry<T>(
    label: string,
    fn: () => Promise<T>,
    attempts: number = 3,
  ): Promise<T> {
    let lastErr: any;
    for (let i = 1; i <= attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status || "";
        const msg = err?.response?.data?.error?.message || err?.message || "";
        this.logger.warn(
          `⚠️ ${label} attempt ${i}/${attempts} failed (${status}): ${msg}`,
        );
        if (i < attempts) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i - 1)));
        }
      }
    }
    throw lastErr;
  }

  async search(
    query: string,
    options: { searchTypes?: string[]; country?: string; region?: string } = {},
  ): Promise<any[]> {
    if (!this.apiKey) {
      this.logger.error("❌ GOOGLE_PLACES_API_KEY not set");
      return [];
    }

    const { searchTypes = [], country, region } = options;

    // Translate internal type → natural-language query Google understands
    const primaryType = searchTypes[0] || "lodging";
    const noun = QUERY_MAP[primaryType] || query || "hotels";

    const parts = [noun];
    if (region) parts.push(`in ${region}`);
    if (country) parts.push(country);
    const textQuery = parts.join(" ");

    this.logger.log(`📡 Google Places text search: "${textQuery}"`);

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.userRatingCount",
      "places.websiteUri",
      "places.nationalPhoneNumber",
      "places.internationalPhoneNumber",
      "places.businessStatus",
      "places.primaryType",
      "places.types",
      "places.priceLevel",
    ].join(",");

    try {
      const response = await this.withRetry("Places", () =>
        firstValueFrom(
          this.httpService.post(
            "https://places.googleapis.com/v1/places:searchText",
            {
              textQuery,
              maxResultCount: 20,
              languageCode: "en",
            },
            {
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": this.apiKey,
                "X-Goog-FieldMask": fieldMask,
              },
              timeout: 30000,
            },
          ),
        ),
      );

      const places = response.data?.places || [];
      this.logger.log(`✅ Google Places returned ${places.length} places`);

      const mapped = places
        .map((p: any) => {
          const displayName: string = p.displayName?.text?.trim() || "";
          if (!displayName) return null;

          const [lng, lat] = [
            p.location?.longitude ?? null,
            p.location?.latitude ?? null,
          ];

          return {
            sourceId: p.id,
            name: displayName,
            description: "",
            website: p.websiteUri || "",
            linkedin: "",
            location: {
              country: country || "",
              city: "",
              region: region || "",
              address: p.formattedAddress || "",
              lat,
              lng,
            },
            industry: p.primaryType || "lodging",
            companySize: "",
            foundedYear: undefined,
            businessModel: "",
            stage: "",
            funding: {
              total: undefined,
              stage: "",
              lastRound: "",
              lastAmount: undefined,
              lastDate: undefined,
              investors: [],
            },
            remote: false,
            hiring: { status: "Unknown", positions: [] },
            technology: [],
            competitors: [],
            tags: p.types || [],
            source: "GooglePlaces",
            metadata: {
              rating: p.rating || 0,
              reviewCount: p.userRatingCount || 0,
              priceLevel: p.priceLevel || "",
              phone:
                p.nationalPhoneNumber || p.internationalPhoneNumber || "",
              businessStatus: p.businessStatus || "OPERATIONAL",
              amenities: [],
              _realName: true,
            },
            lastUpdated: new Date(),
          };
        })
        .filter(Boolean);

      const named = mapped.filter((m: any) => m.name && m.name.length > 1).length;
      this.logger.log(
        `📊 Kept ${named}/${mapped.length} named places`,
      );

      return mapped;
    } catch (error: any) {
      const status = error?.response?.status || "";
      const detail =
        error?.response?.data?.error?.message || error.message || "unknown";
      this.logger.error(
        `❌ Google Places failed (${status}): ${detail}`,
      );
      return [];
    }
  }
}