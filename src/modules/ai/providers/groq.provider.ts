import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class GroqProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private readonly client: Groq | null;
  private readonly model: string;
  private readonly fastModel: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    this.model = this.configService.get<string>('GROQ_MODEL') || 'openai/gpt-oss-120b';
    this.fastModel = this.configService.get<string>('GROQ_FAST_MODEL') || 'openai/gpt-oss-20b';

    if (!apiKey) {
      this.logger.warn('⚠️ GROQ_API_KEY not set — GroqProvider disabled');
      this.client = null;
    } else {
      this.client = new Groq({ apiKey });
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  /**
   * General chat completion — use for analysis, summarization, classification, etc.
   */
  async chat(
    systemPrompt: string,
    userPrompt: string,
    options: { fast?: boolean; json?: boolean; temperature?: number; maxTokens?: number } = {},
  ): Promise<string> {
    if (!this.client) throw new Error('Groq not configured');

    const model = options.fast ? this.fastModel : this.model;

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
        ...(options.json ? { response_format: { type: 'json_object' } } : {}),
      });

      const reply = completion.choices?.[0]?.message?.content?.trim() || '';
      this.logger.log(`✅ Groq (${model}) → ${reply.length} chars`);
      return reply;
    } catch (error: any) {
      this.logger.error(`❌ Groq error: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Structured analysis — returns parsed JSON. Use for scoring, classification, extraction.
   */
  async analyze<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options: { fast?: boolean } = {},
  ): Promise<T | null> {
    try {
      const raw = await this.chat(systemPrompt, userPrompt, { ...options, json: true });
      return JSON.parse(raw) as T;
    } catch (error: any) {
      this.logger.error(`❌ Groq JSON parse failed: ${error.message}`);
      return null;
    }
  }
}
