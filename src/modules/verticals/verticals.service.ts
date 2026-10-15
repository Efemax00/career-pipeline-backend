import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vertical, VerticalDocument } from './schemas/vertical.schema';
import { SYSTEM_VERTICALS } from './seeds/system-verticals.seed';

@Injectable()
export class VerticalsService implements OnModuleInit {
  private readonly logger = new Logger(VerticalsService.name);

  constructor(
    @InjectModel(Vertical.name) private verticalModel: Model<VerticalDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSystemVerticals();
  }

  private async seedSystemVerticals() {
    this.logger.log('🌱 Seeding system verticals...');
    for (const v of SYSTEM_VERTICALS) {
      await this.verticalModel.updateOne(
        { slug: v.slug },
        { $set: v },
        { upsert: true },
      );
    }
    this.logger.log(`✅ ${SYSTEM_VERTICALS.length} system verticals ready`);
  }

  async findAll(userId?: string): Promise<VerticalDocument[]> {
    // System verticals + user's custom verticals
    return this.verticalModel
      .find({
        $or: [{ isSystem: true }, { userId }],
      })
      .sort({ isSystem: -1, name: 1 })
      .exec();
  }

  async findBySlug(slug: string): Promise<VerticalDocument> {
    const vertical = await this.verticalModel.findOne({ slug });
    if (!vertical) {
      throw new NotFoundException(`Vertical "${slug}" not found`);
    }
    return vertical;
  }

  async findById(id: string): Promise<VerticalDocument> {
    const vertical = await this.verticalModel.findById(id);
    if (!vertical) {
      throw new NotFoundException('Vertical not found');
    }
    return vertical;
  }

  async createCustom(data: Partial<Vertical>, userId: string): Promise<VerticalDocument> {
    const slug = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const vertical = new this.verticalModel({
      ...data,
      slug,
      isSystem: false,
      userId,
    });
    return vertical.save();
  }

  async update(id: string, data: Partial<Vertical>, userId: string): Promise<VerticalDocument> {
    const vertical = await this.verticalModel.findOneAndUpdate(
      { _id: id, userId, isSystem: false },
      data,
      { new: true },
    );
    if (!vertical) {
      throw new NotFoundException('Custom vertical not found or cannot edit system vertical');
    }
    return vertical;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.verticalModel.deleteOne({
      _id: id,
      userId,
      isSystem: false,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Custom vertical not found');
    }
  }
}
