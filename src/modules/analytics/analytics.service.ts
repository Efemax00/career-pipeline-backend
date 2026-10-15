import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Company, CompanyDocument } from "../companies/schemas/company.schema";
import { Contact, ContactDocument } from "../contacts/schemas/contact.schema";
import { Task, TaskDocument } from "../tasks/schemas/task.schema";
import {
  CalendarEvent,
  CalendarEventDocument,
} from "../calendar/schemas/calendar-event.schema";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
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

    async getOverview(userId: string, verticalSlug: string = "career") {
    const scope = this.scope(userId, verticalSlug);

    const [companies, contacts, tasks, events] = await Promise.all([
      this.companyModel.find(scope).exec(),
      this.contactModel.find(scope).exec(),
      this.taskModel.find(scope).exec(),
      this.calendarModel.find(scope).exec(),
    ]);

    const totalCompanies = companies.length;
    const totalContacts = contacts.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;

    const statusDistribution = companies.reduce(
      (acc, c) => {
        const status = c.status || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const priorityDistribution = companies.reduce(
      (acc, c) => {
        const priority = c.priority || "Unknown";
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const industryDistribution = companies.reduce(
      (acc, c) => {
        const industry = c.industry || "Unknown";
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const countryDistribution = companies.reduce(
      (acc, c) => {
        const country = c.country || "Unknown";
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const remoteCount = companies.filter((c) => c.remote).length;
    const onsiteCount = totalCompanies - remoteCount;

    const relationshipDistribution = contacts.reduce(
      (acc, c) => {
        const relationship = c.relationship || "Unknown";
        acc[relationship] = (acc[relationship] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    const upcomingEvents = events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate <= thirtyDaysLater;
    });

    return {
      overview: {
        totalCompanies,
        totalContacts,
        totalTasks,
        completedTasks,
        pendingTasks,
        remoteCount,
        onsiteCount,
        upcomingEvents: upcomingEvents.length,
      },
      distribution: {
        status: statusDistribution,
        priority: priorityDistribution,
        industry: industryDistribution,
        country: countryDistribution,
        relationship: relationshipDistribution,
      },
      metrics: {
        contactPerCompany:
          totalCompanies > 0
            ? (totalContacts / totalCompanies).toFixed(1)
            : "0",
        taskCompletionRate:
          totalTasks > 0
            ? ((completedTasks / totalTasks) * 100).toFixed(0)
            : "0",
        conversionRate:
          totalCompanies > 0
            ? (
                (companies.filter((c) =>
                  ["Interview", "Offer", "Hired"].includes(c.status),
                ).length /
                  totalCompanies) *
                100
              ).toFixed(0)
            : "0",
      },
    };
  }
  async getPipelineFunnel(userId: string, verticalSlug: string = "career") {
    const companies = await this.companyModel
      .find(this.scope(userId, verticalSlug))
      .exec();

    const stages = [
      { name: "New Target", color: "#6b7280" },
      { name: "Researching", color: "#8b5cf6" },
      { name: "Contact Found", color: "#3b82f6" },
      { name: "Outreach Sent", color: "#06b6d4" },
      { name: "Conversation", color: "#f59e0b" },
      { name: "Applied", color: "#f97316" },
      { name: "Assessment", color: "#ef4444" },
      { name: "Interview", color: "#10b981" },
      { name: "Offer", color: "#22c55e" },
      { name: "Hired", color: "#16a34a" },
      { name: "Closed Lost", color: "#dc2626" },
    ];

    return stages.map((stage) => ({
      ...stage,
      value: companies.filter((c) => c.status === stage.name).length,
    }));
  }

  async getMonthlyTrends(userId: string, verticalSlug: string = "career") {
    const companies = await this.companyModel
      .find(this.scope(userId, verticalSlug))
      .exec();

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString("default", { month: "short" }),
        year: date.getFullYear(),
        monthNum: date.getMonth(),
        yearNum: date.getFullYear(),
      };
    }).reverse();

    const trends = last6Months.map(({ month, monthNum, yearNum }) => {
      const monthStart = new Date(yearNum, monthNum, 1);
      const monthEnd = new Date(yearNum, monthNum + 1, 0);

      const added = companies.filter((c) => {
        const created = c.get("createdAt")
          ? new Date(c.get("createdAt"))
          : new Date();
        return created >= monthStart && created <= monthEnd;
      });

      const movedToInterview = companies.filter((c) => {
        const updated = c.get("updatedAt")
          ? new Date(c.get("updatedAt"))
          : new Date(c.get("createdAt") || Date.now());
        return (
          updated >= monthStart &&
          updated <= monthEnd &&
          ["Interview", "Offer", "Hired"].includes(c.status)
        );
      });

      return {
        month,
        added: added.length,
        interviewed: movedToInterview.length,
        total: companies.filter((c) => {
          const created = c.get("createdAt")
            ? new Date(c.get("createdAt"))
            : new Date();
          return created <= monthEnd;
        }).length,
      };
    });

    return trends;
  }

  async getTopCompanies(userId: string, verticalSlug: string = "career") {
    return this.companyModel
      .find(this.scope(userId, verticalSlug))
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
  }

    async getActivityHeatmap(userId: string, verticalSlug: string = "career") {
    const scope = this.scope(userId, verticalSlug);

    const [companies, tasks, events] = await Promise.all([
      this.companyModel.find(scope).exec(),
      this.taskModel.find(scope).exec(),
      this.calendarModel.find(scope).exec(),
    ]);

    const weeks = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const dayOfWeek = date.getDay();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { weekStart, weekEnd };
    }).reverse();

    return weeks.map(({ weekStart, weekEnd }) => {
      const weekActivities = {
        companies: companies.filter((c) => {
          const created = c.get("createdAt")
            ? new Date(c.get("createdAt"))
            : new Date();
          return created >= weekStart && created <= weekEnd;
        }).length,
        tasks: tasks.filter((t) => {
          const created = t.get("createdAt")
            ? new Date(t.get("createdAt"))
            : new Date();
          return created >= weekStart && created <= weekEnd;
        }).length,
        events: events.filter((e) => {
          const created = e.get("createdAt")
            ? new Date(e.get("createdAt"))
            : new Date();
          return created >= weekStart && created <= weekEnd;
        }).length,
      };

      const weekNumber = Math.ceil((weekStart.getDate() + 1) / 7);
      return {
        week: `W${weekNumber}`,
        ...weekActivities,
        total: Object.values(weekActivities).reduce((a, b) => a + b, 0),
      };
    });
  }
}