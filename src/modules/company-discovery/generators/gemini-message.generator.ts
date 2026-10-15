import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GroqProvider } from "../../ai/providers/groq.provider";

@Injectable()
export class GeminiMessageGenerator {
  private readonly logger = new Logger(GeminiMessageGenerator.name);
  private readonly genAI: GoogleGenerativeAI | null;
  private readonly geminiKey: string;
  private readonly geminiModel: string;

  constructor(
    private configService: ConfigService,
    private groq: GroqProvider,
  ) {
    this.geminiKey = this.configService.get<string>("GEMINI_API_KEY") || "";
    this.geminiModel =
      this.configService.get<string>("GEMINI_MODEL") || "gemini-2.5-flash";
    this.genAI = this.geminiKey ? new GoogleGenerativeAI(this.geminiKey) : null;

    this.logger.log(
      `🔧 Gemini generator: model=${this.geminiModel} key=${this.geminiKey ? "set" : "missing"}`,
    );
  }

  async generate(
    entity: any,
    vertical: any,
    contactName?: string,
  ): Promise<string> {
    const systemPrompt =
      vertical.messageTemplate?.systemPrompt ||
      "You write B2B outreach messages.";
    const userPrompt = this.buildUserPrompt(entity, vertical, contactName);

    // 1. Gemini (primary)
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: this.geminiModel,
          systemInstruction: systemPrompt,
        });
        const result = await model.generateContent(userPrompt);
        const message = (await result.response).text().trim();
        if (message) {
          this.logger.log(
            `✅ Gemini (${this.geminiModel}) → ${message.length} chars for ${entity.name}`,
          );
          return message;
        }
      } catch (err: any) {
        const detail =
          err?.response?.data?.error?.message ||
          err?.message ||
          "unknown error";
        this.logger.warn(
          `⚠️ Gemini (${this.geminiModel}) failed, falling back to Groq: ${detail}`,
        );
      }
    } else {
      this.logger.warn("⚠️ GEMINI_API_KEY not set — using Groq only");
    }

    // 2. Groq (fallback)
    if (this.groq.isAvailable()) {
      try {
        const message = await this.groq.chat(systemPrompt, userPrompt, {
          temperature: 0.7,
          maxTokens: 400,
        });
        if (message) {
          this.logger.log(
            `✅ Groq → ${message.length} chars for ${entity.name}`,
          );
          return message;
        }
      } catch (err: any) {
        this.logger.error(`❌ Groq also failed: ${err.message}`);
      }
    }

    this.logger.error(
      `❌ No AI provider produced a message for ${entity.name}`,
    );
    return "";
  }

  private buildUserPrompt(
    entity: any,
    vertical: any,
    contactName?: string,
  ): string {
    const template = vertical.messageTemplate?.userPromptTemplate || "";
    const valueProps = vertical.messageTemplate?.valueProps || [];
    const meta = entity.metadata || {};
    const extraFields: Record<string, any> = {};
    for (const f of vertical.extraFields || []) {
      extraFields[f.key] = meta[f.key] ?? entity[f.key] ?? "";
    }

    let prompt = template
      .replace(/{name}/g, entity.name || "")
      .replace(/{city}/g, entity.location?.city || "")
      .replace(/{country}/g, entity.location?.country || "")
      .replace(/{region}/g, entity.location?.region || "")
      .replace(/{role}/g, entity.role || extraFields.role || "")
      .replace(/{rating}/g, String(extraFields.rating || ""))
      .replace(/{reviewCount}/g, String(extraFields.reviewCount || ""))
      .replace(/{amenities}/g, (extraFields.amenities || []).join?.(", ") || "")
      .replace(/{cuisine}/g, extraFields.cuisine || "");

    if (valueProps.length > 0 && !prompt.includes("value prop")) {
      prompt += `\n\nGrowth angles to choose from:\n- ${valueProps.join("\n- ")}`;
    }
    if (contactName) {
      prompt += `\n\nAddress the contact by first name: ${contactName}`;
    }
    return prompt;
  }
}