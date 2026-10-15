import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Company, CompanyDocument } from "../companies/schemas/company.schema";
import { Contact, ContactDocument } from "../contacts/schemas/contact.schema";
import { Task, TaskDocument } from "../tasks/schemas/task.schema";
import { Note, NoteDocument } from "../notes/schemas/note.schema";
import {
  CalendarEvent,
  CalendarEventDocument,
} from "../calendar/schemas/calendar-event.schema";

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
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

  async getStats(userId: string, verticalSlug: string = "career") {
    const scope = this.scope(userId, verticalSlug);

    const [companies, contacts, tasks, notes, events] = await Promise.all([
      this.companyModel.countDocuments(scope),
      this.contactModel.countDocuments(scope),
      this.taskModel.countDocuments(scope),
      this.noteModel.countDocuments(scope),
      this.calendarModel.countDocuments(scope),
    ]);

    const completedTasks = await this.taskModel.countDocuments({
      ...scope,
      isCompleted: true,
    });

    const upcomingEvents = await this.calendarModel.countDocuments({
      ...scope,
      date: { $gte: new Date().toISOString().split("T")[0] },
    });

    return {
      companies,
      contacts,
      tasks,
      notes,
      events,
      completedTasks,
      upcomingEvents,
      totalItems: companies + contacts + tasks + notes + events,
    };
  }

  async getRecentActivity(userId: string, verticalSlug: string = "career") {
    const scope = this.scope(userId, verticalSlug);

    const [recentCompanies, recentTasks, recentNotes, recentEvents] =
      await Promise.all([
        this.companyModel.find(scope).sort({ createdAt: -1 }).limit(5).exec(),
        this.taskModel.find(scope).sort({ createdAt: -1 }).limit(5).exec(),
        this.noteModel.find(scope).sort({ createdAt: -1 }).limit(5).exec(),
        this.calendarModel.find(scope).sort({ date: 1 }).limit(5).exec(),
      ]);

    const noun =
      verticalSlug === "hospitality"
        ? "hotel"
        : verticalSlug === "food-vendors"
          ? "vendor"
          : "company";

    const activity = [
      ...recentCompanies.map((c) => ({
        id: c._id,
        type: "company",
        text: `Added ${noun}: ${c.name}`,
        time: c.get("createdAt") || new Date(),
        icon: "Building2",
      })),
      ...recentTasks.map((t) => ({
        id: t._id,
        type: "task",
        text: `${t.isCompleted ? "Completed" : "Added"} task: ${t.title}`,
        time: t.get("createdAt") || new Date(),
        icon: "CheckCircle2",
      })),
      ...recentNotes.map((n) => ({
        id: n._id,
        type: "note",
        text: `Added note: ${n.title}`,
        time: n.get("createdAt") || new Date(),
        icon: "StickyNote",
      })),
      ...recentEvents.map((e) => ({
        id: e._id,
        type: "event",
        text: `Event: ${e.title} on ${e.date}`,
        time: e.get("createdAt") || new Date(),
        icon: "Calendar",
      })),
    ];

    return activity
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }

  async getFunnelData(userId: string, verticalSlug: string = "career") {
    const companies = await this.companyModel
      .find(this.scope(userId, verticalSlug))
      .exec();

    const stages = [
      "New Target",
      "Researching",
      "Contact Found",
      "Outreach Sent",
      "Conversation",
      "Applied",
      "Assessment",
      "Interview",
      "Offer",
      "Hired",
      "Closed Lost",
    ];

    return stages.map((status) => ({
      name: status,
      value: companies.filter((c) => c.status === status).length,
    }));
  }

  async getUpcomingTasks(userId: string, verticalSlug: string = "career") {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return this.taskModel
      .find({
        ...this.scope(userId, verticalSlug),
        isCompleted: false,
        dueDate: { $gte: today, $lte: nextWeek },
      })
      .sort({ dueDate: 1 })
      .limit(10)
      .exec();
  }
}