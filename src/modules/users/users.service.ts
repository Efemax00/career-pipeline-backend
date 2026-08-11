import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findOne(uid: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ uid });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(uid: string, updateProfileDto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { uid },
      updateProfileDto,
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async remove(uid: string): Promise<void> {
    const result = await this.userModel.deleteOne({ uid });
    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }
}