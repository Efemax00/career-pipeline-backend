import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<TaskDocument> {
    const task = new this.taskModel({
      ...createTaskDto,
      userId,
    });
    return task.save();
  }

  async findAll(userId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, userId: string): Promise<TaskDocument> {
    const task = await this.taskModel.findOne({ _id: id, userId });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async findByCompany(companyId: string, userId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ companyId, userId }).exec();
  }

  async findByContact(contactId: string, userId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ contactId, userId }).exec();
  }

  async update(id: string, userId: string, updateTaskDto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.taskModel.findOneAndUpdate(
      { _id: id, userId },
      updateTaskDto,
      { new: true, runValidators: true }
    );
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found');
    }
  }
}