import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GroqProvider } from '../../ai/providers/groq.provider';

@Injectable()
export class LlmMessageGenerator {
  private readonly logger = new Logger(LlmMessageGenerator.name);
  private readonly geminiKey: string;
  private readonly geminiModel: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private groq: GroqProvider,
  ) {
    this.geminiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
  }

  async generate(entity: any, vertical: any, contactName?: string): Promise<string> {
    const { systemPrompt, userPrompt } = this.buildPrompts(entity, vertical, contactName);

    // ─── 1. Try Gemini (primary) ─────────────────────────────
    if (this.geminiKey) {
      try {
        const message = await this.callGemini(systemPrompt, userPrompt);
        if (message) return message;
      } catch (err: any) {
        this.logger.warn(`Gemini failed, falling back to Groq: ${err.message}`);
      }
    }

    // ─── 2. Fallback: Groq ───────────────────────────────────
    if (this.groq.isAvailable()) {
      try {
        const message = await this.groq.chat(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 300 });
        if (message) {
          this.logger.log(`✅ Message generated via Groq for ${entity.name}`);
          return message;
        }
      } catch (err: any) {
        this.logger.error(`Groq also failed: ${err.message}`);
      }
    }

    this.logger.error(`❌ No AI provider available for ${entity.name}`);
    return '';
  }

  // ─── Gemini REST call (no SDK dependency) ──────────────────
  private async callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`;

    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    };

    const response = await firstValueFrom(
      this.httpService.post(url, body, { timeout: 30000 }),
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (text) this.logger.log(`✅ Message generated via Gemini for prompt (${text.length} chars)`);
    return text;
  }

  // ─── Shared prompt builder ────────────────────────────────
  private buildPrompts(entity: any, vertical: any, contactName?: string) {
    const systemPrompt = vertical.messageTemplate?.systemPrompt || 'You write B2B outreach messages.';
    const template = vertical.messageTemplate?.userPromptTemplate || '';
    const valueProps = vertical.messageTemplate?.valueProps || [];
    const meta = entity.metadata || {};
    const extra: Record<string, any> = {};
    for (const f of vertical.extraFields || []) {
      extra[f.key] = meta[f.key] ?? entity[f.key] ?? '';
    }

    let userPrompt = template
      .replace(/{name}/g, entity.name || '')
      .replace(/{city}/g, entity.location?.city || '')
      .replace(/{country}/g, entity.location?.country || '')
      .replace(/{region}/g, entity.location?.region || '')
      .replace(/{role}/g, entity.role || extra.role || '')
      .replace(/{rating}/g, String(extra.rating || ''))
      .replace(/{reviewCount}/g, String(extra.reviewCount || ''))
      .replace(/{amenities}/g, (extra.amenities || []).join?.(', ') || '')
      .replace(/{cuisine}/g, extra.cuisine || '');

    if (valueProps.length > 0 && !userPrompt.includes('value prop')) {
      userPrompt += `\n\nGrowth angles to choose from:\n- ${valueProps.join('\n- ')}`;
    }
    if (contactName) userPrompt += `\n\nAddress the contact by first name: ${contactName}`;

    return { systemPrompt, userPrompt };
  }
}
