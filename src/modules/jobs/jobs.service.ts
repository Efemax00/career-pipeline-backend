import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}

  async create(createJobDto: CreateJobDto, userId: string): Promise<JobDocument> {
    const job = new this.jobModel({
      ...createJobDto,
      userId,
    });
    return job.save();
  }

  async saveJob(jobData: any, userId: string): Promise<JobDocument> {
    // Check if job already exists
    const existing = await this.jobModel.findOne({
      title: jobData.title,
      company: jobData.company,
      userId,
    });

    if (existing) {
      return existing;
    }

    const job = new this.jobModel({
      ...jobData,
      isSaved: true,
      status: 'saved',
      userId,
    });
    return job.save();
  }

  async findAll(userId: string): Promise<JobDocument[]> {
    return this.jobModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findSaved(userId: string): Promise<JobDocument[]> {
    return this.jobModel.find({ userId, isSaved: true }).sort({ createdAt: -1 }).exec();
  }

  async findApplied(userId: string): Promise<JobDocument[]> {
    return this.jobModel.find({ userId, isApplied: true }).sort({ appliedDate: -1 }).exec();
  }

  async findByStatus(status: string, userId: string): Promise<JobDocument[]> {
    return this.jobModel.find({ userId, status }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, userId: string): Promise<JobDocument> {
    const job = await this.jobModel.findOne({ _id: id, userId });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async update(id: string, userId: string, updateJobDto: UpdateJobDto): Promise<JobDocument> {
    const job = await this.jobModel.findOneAndUpdate(
      { _id: id, userId },
      updateJobDto,
      { new: true, runValidators: true }
    );
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async markApplied(id: string, userId: string): Promise<JobDocument> {
    const job = await this.jobModel.findOne({ _id: id, userId });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    job.isApplied = true;
    job.isSaved = true;
    job.status = 'applied';
    job.appliedDate = new Date().toISOString().split('T')[0];
    return job.save();
  }

  async updateStatus(id: string, userId: string, status: string): Promise<JobDocument> {
    const job = await this.jobModel.findOne({ _id: id, userId });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    job.status = status;
    return job.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.jobModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Job not found');
    }
  }

  async getStats(userId: string) {
    const [total, saved, applied, interviewed, offers] = await Promise.all([
      this.jobModel.countDocuments({ userId }),
      this.jobModel.countDocuments({ userId, isSaved: true }),
      this.jobModel.countDocuments({ userId, isApplied: true }),
      this.jobModel.countDocuments({ userId, status: 'interview' }),
      this.jobModel.countDocuments({ userId, status: 'offer' }),
    ]);

    return {
      total,
      saved,
      applied,
      interviewed,
      offers,
      conversionRate: total > 0 ? ((applied / total) * 100).toFixed(1) : 0,
    };
  }
}