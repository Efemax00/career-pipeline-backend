import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

/**
 * Maps internal searchTypes → Mapbox canonical category IDs.
 * Mapbox uses its own taxonomy, not Google's.
 */
const CATEGORY_MAP: Record<string, string> = {
  lodging: "hotel",
  restaurant: "restaurant",
  cafe: "cafe",
  meal_delivery: "restaurant",
  meal_takeaway: "fast_food",
};

@Injectable()
export class MapboxPlacesProvider {
  private readonly logger = new Logger(MapboxPlacesProvider.name);
  private readonly token: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.token = this.configService.get<string>("MAPBOX_ACCESS_TOKEN") || "";
    if (!this.token) {
      this.logger.warn("⚠️ MAPBOX_ACCESS_TOKEN not set — provider disabled");
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
        const msg =
          err?.response?.data?.message || err?.message || "unknown";
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

  /** Geocode "region, country" → [lng, lat] */
    private async geocode(
    region: string = "",
    country: string = "",
  ): Promise<[number, number] | null> {
    try {
      const query = encodeURIComponent(`${region}, ${country}`);
      const response = await this.withRetry("Geocode", () =>
        firstValueFrom(
          this.httpService.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`,
            {
              params: {
                access_token: this.token,
                limit: 1,
                types: "region,place,district",
              },
              timeout: 20000,
            },
          ),
        ),
      );
      const feature = response.data?.features?.[0];
      if (feature?.center && feature.center.length === 2) {
        const [lng, lat] = feature.center;
        this.logger.log(
          `📍 Geocoded "${region}, ${country}" → ${lat},${lng}`,
        );
        return [lng, lat];
      }
      this.logger.warn(`⚠️ No geocode result for "${region}, ${country}"`);
      return null;
    } catch (err: any) {
      this.logger.warn(`⚠️ Geocode failed: ${err.message}`);
      return null;
    }
  }

  async search(
    query: string,
    options: { searchTypes?: string[]; country?: string; region?: string } = {},
  ): Promise<any[]> {
    if (!this.token) {
      this.logger.error("❌ MAPBOX_ACCESS_TOKEN not set");
      return [];
    }

    const { searchTypes = [], country, region } = options;

    // ─── 1. Resolve category ────────────────────────────────
    const primaryType = searchTypes[0] || "lodging";
    const category = CATEGORY_MAP[primaryType] || "hotel";

    // ─── 2. Geocode the region ──────────────────────────────
    let proximity: string | null = null;
    if (region && country) {
     const coords = await this.geocode(region || "", country || "");
      if (coords) proximity = `${coords[0]},${coords[1]}`;
    }

    if (!proximity) {
      this.logger.warn(
        "⚠️ No proximity resolved — Mapbox search will be weaker. Falling back to country-based forward search.",
      );
    }

    this.logger.log(
      `📡 Mapbox category search: category=${category} proximity=${proximity || "none"}`,
    );

    // ─── 3. Category browse ─────────────────────────────────
    try {
      const params: any = {
        access_token: this.token,
        limit: 20,
        language: "en",
      };
      if (proximity) params.proximity = proximity;
      if (country) params.country = this.getCountryCode(country);

      const response = await this.withRetry("Category", () =>
        firstValueFrom(
          this.httpService.get(
            `https://api.mapbox.com/search/searchbox/v1/category/${category}`,
            {
              params,
              timeout: 30000,
            },
          ),
        ),
      );

      const features = response.data?.features || [];
      this.logger.log(`✅ Mapbox returned ${features.length} places`);

      const mapped = features
        .map((f: any) => this.normalize(f, region || "", country || ""))
        .filter((m: any) => m && m.name && m.name.length > 1);

      this.logger.log(
        `📊 Kept ${mapped.length}/${features.length} named places`,
      );

      return mapped;
    } catch (error: any) {
      const status = error?.response?.status || "";
      const detail =
        error?.response?.data?.message || error.message || "unknown";
      this.logger.error(`❌ Mapbox failed (${status}): ${detail}`);
      return [];
    }
  }

    private normalize(
    feature: any,
    region: string = "",
    country: string = "",
  ): any | null {
    const props = feature.properties || {};
    const name = (props.name || props.name_preferred || "").trim();
    if (!name) return null;

    const [lng, lat] = feature.geometry?.coordinates || [null, null];

    const ctx = props.context || {};
    const city =
      ctx.place?.name ||
      ctx.locality?.name ||
      ctx.neighborhood?.name ||
      "";
    const regionName = ctx.region?.name || region || "";
    const countryName = ctx.country?.name || country || "";

    const metadata = props.metadata || {};
    const phone =
      metadata.phone ||
      props.phone ||
      "";

    return {
      sourceId: props.mapbox_id || feature.id,
      name,
      description: props.description || "",
      website: props.website || metadata.website || "",
      linkedin: "",
      location: {
        country: countryName,
        city,
        region: regionName,
        address: props.full_address || props.address || "",
        lat,
        lng,
      },
      industry: categoryLabel(props.poi_category) || "lodging",
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
      tags: props.poi_category || [],
      source: "Mapbox",
      metadata: {
        rating: metadata.rating || 0,
        reviewCount: metadata.review_count || 0,
        priceLevel: metadata.price_level || "",
        phone,
        businessStatus: "OPERATIONAL",
        amenities: [],
        _realName: true,
      },
      lastUpdated: new Date(),
    };
  }

  private getCountryCode(country: string): string {
    const map: Record<string, string> = {
      nigeria: "NG",
      usa: "US",
      uk: "GB",
      canada: "CA",
      germany: "DE",
    };
    return (
      map[country.toLowerCase()] ||
      country.substring(0, 2).toUpperCase()
    );
  }
}

function categoryLabel(categories: string[] | undefined): string {
  if (!categories || categories.length === 0) return "lodging";
  const first = categories[0];
  // "hotel" → "Lodging", "restaurant" → "Restaurant", etc.
  if (first === "hotel" || first === "lodging") return "Lodging";
  if (first === "restaurant" || first === "cafe") return "Food";
  return first;
}