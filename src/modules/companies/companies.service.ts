import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Company, CompanyDocument } from "./schemas/company.schema";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { CalendarService } from "../calendar/calendar.service";
import { ContactsService } from "../contacts/contacts.service";
import { TasksService } from "../tasks/tasks.service";
import { NotesService } from "../notes/notes.service";


@Injectable()
export class CompaniesService {
  constructor(
  @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  private contactsService: ContactsService,
  private tasksService: TasksService,
  private notesService: NotesService,
  private calendarService: CalendarService,
) {}
  /**
   * Scopes a Mongo filter to a user + vertical.
   * Legacy docs with no verticalSlug are treated as 'career'.
   */
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
    createCompanyDto: any,
    userId: string,
    verticalSlug: string = "career",
  ): Promise<CompanyDocument> {
    const { contactInfo, task, event, note, ...companyData } = createCompanyDto;

    const initials = companyData.name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const company = new this.companyModel({
      ...companyData,
      userId,
      verticalSlug,
      initials: initials || companyData.name.substring(0, 2).toUpperCase(),
      color:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
    });
    const saved = await company.save();

    // Auto-create linked records if provided
    try {
      if (contactInfo && (contactInfo.name || contactInfo.email || contactInfo.phone)) {
        await this.contactsService.create(
          {
            name: contactInfo.name || companyData.ownerName || "Contact",
            title: contactInfo.title || "",
            company: saved.name,
            companyId: saved._id.toString(),
            email: contactInfo.email || companyData.email || "",
            phone: contactInfo.phone || companyData.phone || "",
            country: companyData.country || "",
            relationship: contactInfo.relationship || "Cold",
            notes: contactInfo.notes || "",
          } as any,
          userId,
          verticalSlug,
        );
      }

      if (task && task.title) {
        await this.tasksService.create(
          {
            title: task.title,
            description: task.description || "",
            companyId: saved._id.toString(),
            companyName: saved.name,
            priority: task.priority || "Medium",
            status: task.status || "To Do",
            dueDate: task.dueDate || "",
          } as any,
          userId,
          verticalSlug,
        );
      }

      if (event && event.title && event.date) {
        await this.calendarService.create(
          {
            title: event.title,
            date: event.date,
            time: event.time || "",
            type: event.type || "followup",
            companyId: saved._id.toString(),
            companyName: saved.name,
            description: event.description || "",
          } as any,
          userId,
          verticalSlug,
        );
      }

      if (note && (note.title || note.content)) {
        await this.notesService.create(
          {
            title: note.title || `Note — ${saved.name}`,
            content: note.content || "",
            folder: note.folder || `${verticalSlug} notes`,
            tags: note.tags || [verticalSlug],
            pinned: false,
          } as any,
          userId,
          verticalSlug,
        );
      }
    } catch (err: any) {
      // Don't fail the whole request if a linked record fails
      console.error("Linked record creation failed:", err.message);
    }

    return saved;
  }

    async bulkCreate(
    items: any[],
    userId: string,
    verticalSlug: string = "career",
  ) {
    const created: any[] = [];
    const failed: any[] = [];
    const skipped: any[] = [];

    for (const item of items) {
      try {
        // Skip duplicates by name + phone
        if (item.name) {
          const existing = await this.companyModel.findOne({
            ...this.scope(userId, verticalSlug),
            name: item.name,
          });
          if (existing) {
            skipped.push({ name: item.name, reason: "already exists" });
            continue;
          }
        }

        const c = await this.create(item, userId, verticalSlug);
        created.push({ _id: c._id, name: c.name });
      } catch (err: any) {
        failed.push({
          name: item?.name || "unknown",
          error: err.message,
        });
      }
    }

    return {
      total: items.length,
      created: created.length,
      skipped: skipped.length,
      failed: failed.length,
      items: created,
      skippedItems: skipped,
      failedItems: failed,
    };
  }

  async findAll(
    userId: string,
    verticalSlug: string = "career",
  ): Promise<CompanyDocument[]> {
    return this.companyModel
      .find(this.scope(userId, verticalSlug))
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<CompanyDocument> {
    const company = await this.companyModel.findOne({ _id: id, userId });
    if (!company) {
      throw new NotFoundException("Company not found");
    }
    return company;
  }

  async findByStatus(
    status: string,
    userId: string,
    verticalSlug: string = "career",
  ): Promise<CompanyDocument[]> {
    return this.companyModel
      .find({ ...this.scope(userId, verticalSlug), status })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPipelineStages(userId: string, verticalSlug: string = "career") {
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

    const base = this.scope(userId, verticalSlug);

    const pipeline = await Promise.all(
      stages.map(async (stage) => {
        const companies = await this.companyModel
          .find({ ...base, status: stage })
          .lean();
        return {
          status: stage,
          count: companies.length,
          companies: companies.map((c) => ({
            id: c._id,
            name: c.name,
            initials: c.initials,
            color: c.color,
            role: c.role,
            country: c.country,
            remote: c.remote,
            priority: c.priority,
            lastContact: c.lastContact,
            nextAction: c.nextAction,
            contact: c.contact,
            salary: c.salary,
            tags: c.tags,
          })),
        };
      }),
    );

    return pipeline;
  }

  async moveToStage(
    id: string,
    status: string,
    userId: string,
  ): Promise<CompanyDocument> {
    const company = await this.companyModel.findOneAndUpdate(
      { _id: id, userId },
      { status },
      { new: true, runValidators: true },
    );
    if (!company) {
      throw new NotFoundException("Company not found");
    }
    return company;
  }

  async update(
    id: string,
    userId: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyDocument> {
    const company = await this.companyModel.findOneAndUpdate(
      { _id: id, userId },
      updateCompanyDto,
      { new: true, runValidators: true },
    );
    if (!company) {
      throw new NotFoundException("Company not found");
    }
    return company;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.companyModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundException("Company not found");
    }
  }

  async getPipelineStats(userId: string, verticalSlug: string = "career") {
    const companies = await this.companyModel
      .find(this.scope(userId, verticalSlug))
      .lean();

    const total = companies.length;
    const stages = {
      "New Target": companies.filter((c) => c.status === "New Target").length,
      Researching: companies.filter((c) => c.status === "Researching").length,
      "Contact Found": companies.filter((c) => c.status === "Contact Found")
        .length,
      "Outreach Sent": companies.filter((c) => c.status === "Outreach Sent")
        .length,
      Conversation: companies.filter((c) => c.status === "Conversation")
        .length,
      Applied: companies.filter((c) => c.status === "Applied").length,
      Assessment: companies.filter((c) => c.status === "Assessment").length,
      Interview: companies.filter((c) => c.status === "Interview").length,
      Offer: companies.filter((c) => c.status === "Offer").length,
      Hired: companies.filter((c) => c.status === "Hired").length,
      "Closed Lost": companies.filter((c) => c.status === "Closed Lost")
        .length,
    };

    const conversionRates = {
      toInterview:
        total > 0 ? ((stages.Interview / total) * 100).toFixed(1) : 0,
      toOffer: total > 0 ? ((stages.Offer / total) * 100).toFixed(1) : 0,
      toHired: total > 0 ? ((stages.Hired / total) * 100).toFixed(1) : 0,
    };

    return { total, stages, conversionRates };
  }

    async getExport(userId: string, verticalSlug: string = "career") {
    const companies = await this.companyModel
      .find(this.scope(userId, verticalSlug))
      .sort({ createdAt: -1 })
      .lean();

    return companies.map((c: any) => ({
      _id: c._id,
      name: c.name,
      phone: c.phone || c.contact || "",
      whatsapp: c.whatsapp || "",
      email: c.email || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      country: c.country || "",
      ownerName: c.ownerName || "",
      roomCount: c.roomCount || 0,
      priceRange: c.priceRange || "",
      status: c.status || "",
      priority: c.priority || "",
      website: c.website || "",
      notes: c.notes || "",
      tags: c.tags || [],
      createdAt: c.createdAt,
    }));
  }
}