import {
  Controller, Get, Put, Body, UseGuards, Request, Param,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VerticalsService } from '../verticals/verticals.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private verticalsService: VerticalsService,
  ) {}

  @Get('me')
  async getMe(@Request() req) {
    const user = await this.userModel.findOne({ uid: req.user.userId });
    return user;
  }

  @Put('me/vertical/:verticalId')
  async setActiveVertical(
    @Param('verticalId') verticalId: string,
    @Request() req,
  ) {
    // Verify vertical exists
    await this.verticalsService.findById(verticalId);

    const user = await this.userModel.findOneAndUpdate(
      { uid: req.user.userId },
      { activeVerticalId: verticalId },
      { new: true },
    );
    return user;
  }
}
