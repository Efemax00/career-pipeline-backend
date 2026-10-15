import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  CalendarEvent,
  CalendarEventDocument,
} from "./schemas/calendar-event.schema";
import { CreateCalendarEventDto } from "./dto/create-calendar-event.dto";
import { UpdateCalendarEventDto } from "./dto/update-calendar-event.dto";

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarEvent.name)
    private calendarModel: Model<CalendarEventDocument>,
  ) {}

  private scope(userId: string, verticalSlug: string) {
    if (verticalSlug === "career") {
      return {
        userId,
        $or: [
          { verticalSlug: "career" },
          { verticalSlug: { $exists: false } },
          { verticalSlug: null },
        ],
      };
    }
    return { userId, verticalSlug };
  }

  async create(
    createDto: CreateCalendarEventDto,
    userId: string,
    verticalSlug: string = "career",
  ): Promise<CalendarEventDocument> {
    const event = new this.calendarModel({
      ...createDto,
      userId,
      verticalSlug,
    });
    return event.save();
  }

  async findAll(
    userId: string,
    verticalSlug: string = "career",
  ): Promise<CalendarEventDocument[]> {
    return this.calendarModel
      .find(this.scope(userId, verticalSlug))
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async findByMonth(
    month: string,
    year: string,
    userId: string,
    verticalSlug: string = "career",
  ): Promise<CalendarEventDocument[]> {
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = `${year}-${month.padStart(2, "0")}-31`;
    return this.calendarModel
      .find({
        ...this.scope(userId, verticalSlug),
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async findByCompany(
    companyId: string,
    userId: string,
  ): Promise<CalendarEventDocument[]> {
    return this.calendarModel
      .find({ companyId, userId })
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<CalendarEventDocument> {
    const event = await this.calendarModel.findOne({ _id: id, userId });
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    return event;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateCalendarEventDto,
  ): Promise<CalendarEventDocument> {
    const event = await this.calendarModel.findOneAndUpdate(
      { _id: id, userId },
      updateDto,
      { new: true, runValidators: true },
    );
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    return event;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.calendarModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundException("Event not found");
    }
  }
}