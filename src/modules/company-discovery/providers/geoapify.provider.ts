import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

@Injectable()
export class GeoapifyProvider {
  private readonly logger = new Logger(GeoapifyProvider.name);
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>("GEOAPIFY_API_KEY") || "";
  }

  /** Heuristic: does this string look like a street address, not a name? */
  private looksLikeAddress(str: string): boolean {
    if (!str) return false;
    // Starts with a number (e.g. "60 Agbarha Ughelli Road")
    if (/^\d+\s/.test(str.trim())) return true;
    // Contains road/street suffix words without a distinguishing brand prefix
    const addressWords = [
      "road",
      "street",
      "avenue",
      "lane",
      "close",
      "crescent",
      "drive",
      "way",
      "highway",
      "expressway",
    ];
    const lower = str.toLowerCase();
    const hasAddressWord = addressWords.some((w) => lower.includes(w));
    // A real hotel name often contains "Hotel", "Suites", "Inn", "Lodge", etc.
    const nameWords = [
      "hotel",
      "suites",
      "inn",
      "lodge",
      "resort",
      "apartments",
      "guest",
      "motel",
      "palace",
      "villa",
    ];
    const hasNameWord = nameWords.some((w) => lower.includes(w));
    return hasAddressWord && !hasNameWord;
  }

  private extractName(props: any, city: string): string {
    const candidate = (props.name || "").trim();
    if (candidate && !this.looksLikeAddress(candidate)) {
      return candidate;
    }

    // Try raw OSM tags
    const raw = props.datasource?.raw || {};
    const rawCandidates = [
      raw.name,
      raw["name:en"],
      raw.brand,
      raw.operator,
      raw.official_name,
    ];
    for (const rc of rawCandidates) {
      const val = (rc || "").toString().trim();
      if (val && !this.looksLikeAddress(val)) return val;
    }

    // Last resort: keep candidate if we have nothing else, prefix to be honest
    if (candidate) {
      return `Unnamed accommodation — ${candidate}`;
    }
    return city ? `Unnamed accommodation in ${city}` : "Unnamed accommodation";
  }

  async search(
    query: string,
    options: { searchTypes?: string[]; country?: string; region?: string } = {},
  ): Promise<any[]> {
    if (!this.apiKey) {
      this.logger.error("❌ GEOAPIFY_API_KEY not set");
      return [];
    }

    const { searchTypes = [], country, region } = options;

    let categories = "";
    if (searchTypes.includes("lodging")) {
      categories = "accommodation";
    } else if (
      searchTypes.includes("restaurant") ||
      searchTypes.includes("cafe")
    ) {
      categories = "catering";
    }
    if (!categories) categories = "accommodation";

    // Geocode the region
    let filter = "";
    if (region && country) {
      try {
        const geoResponse = await firstValueFrom(
          this.httpService.get("https://api.geoapify.com/v1/geocode/search", {
            params: {
              text: `${region}, ${country}`,
              apiKey: this.apiKey,
              limit: 1,
            },
            timeout: 15000,
          }),
        );
        const feature = geoResponse.data?.features?.[0];
        if (feature?.geometry?.coordinates) {
          const [lon, lat] = feature.geometry.coordinates;
          filter = `circle:${lon},${lat},50000`;
          this.logger.log(
            `📍 Geocoded "${region}, ${country}" → ${lat},${lon}`,
          );
        }
      } catch (err: any) {
        this.logger.warn(`⚠️ Geocoding failed: ${err.message}`);
      }
    }

    const params: any = { categories, limit: 20, apiKey: this.apiKey };
    if (filter) {
      params.filter = filter;
    } else if (country) {
      params.filter = `countrycode:${this.getCountryCode(country)}`;
    }

    this.logger.log(
      `📡 Geoapify Places: categories=${categories} filter=${filter || params.filter || "none"}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.get("https://api.geoapify.com/v2/places", {
          params,
          timeout: 20000,
        }),
      );

      const places = response.data?.features || [];
      this.logger.log(`✅ Geoapify returned ${places.length} places`);

      const mapped = places.map((feature: any) => {
        const props = feature.properties;
        const city = props.city || props.town || props.village || "";
        const cleanName = this.extractName(props, city);
        const hadRealName =
          cleanName === (props.name || "").trim() ||
          cleanName === props.datasource?.raw?.name;

        return {
          sourceId: props.place_id,
          name: cleanName,
          description: props.description || "",
          website: props.website || "",
          linkedin: "",
          location: {
            country: country || "",
            city,
            region: region || "",
            address: props.formatted || props.address_line1 || "",
            lat: props.lat,
            lng: props.lon,
          },
          industry: props.categories?.[0] || "",
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
          tags: props.categories || [],
          source: "Geoapify",
          metadata: {
            rating: 0,
            reviewCount: 0,
            priceLevel: "",
            phone: props.phone || props.contact?.phone || "",
            businessStatus: "OPERATIONAL",
            amenities: [],
            _realName: hadRealName, // debug flag
          },
          lastUpdated: new Date(),
        };
      });

      const realNames = mapped.filter((m) => m.metadata._realName).length;
      this.logger.log(
        `📊 Names resolved: ${realNames}/${mapped.length} real, ${mapped.length - realNames} fallback`,
      );

      return mapped;
    } catch (error: any) {
      this.logger.error(`❌ Geoapify API error: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
      return [];
    }
  }

  private getCountryCode(country: string): string {
    const map: Record<string, string> = {
      nigeria: "ng",
      usa: "us",
      uk: "gb",
      canada: "ca",
      germany: "de",
    };
    return map[country.toLowerCase()] || country.substring(0, 2).toLowerCase();
  }
}