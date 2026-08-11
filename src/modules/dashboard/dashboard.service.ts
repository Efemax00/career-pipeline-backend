import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Note, NoteDocument } from '../notes/schemas/note.schema';
import { CalendarEvent, CalendarEventDocument } from '../calendar/schemas/calendar-event.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(CalendarEvent.name) private calendarModel: Model<CalendarEventDocument>,
  ) {}

  async getStats(userId: string) {
    const [companies, contacts, tasks, notes, events] = await Promise.all([
      this.companyModel.countDocuments({ userId }),
      this.contactModel.countDocuments({ userId }),
      this.taskModel.countDocuments({ userId }),
      this.noteModel.countDocuments({ userId }),
      this.calendarModel.countDocuments({ userId }),
    ]);

    const completedTasks = await this.taskModel.countDocuments({ 
      userId, 
      isCompleted: true 
    });

    const upcomingEvents = await this.calendarModel.countDocuments({
      userId,
      date: { $gte: new Date().toISOString().split('T')[0] }
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

  async getRecentActivity(userId: string) {
    const [recentCompanies, recentTasks, recentNotes, recentEvents] = await Promise.all([
      this.companyModel.find({ userId }).sort({ createdAt: -1 }).limit(5).exec(),
      this.taskModel.find({ userId }).sort({ createdAt: -1 }).limit(5).exec(),
      this.noteModel.find({ userId }).sort({ createdAt: -1 }).limit(5).exec(),
      this.calendarModel.find({ userId }).sort({ date: 1 }).limit(5).exec(),
    ]);

    const activity = [
      ...recentCompanies.map(c => ({
        id: c._id,
        type: 'company',
        text: `Added company: ${c.name}`,
        time: c.get('createdAt') || new Date(),
        icon: 'Building2',
      })),
      ...recentTasks.map(t => ({
        id: t._id,
        type: 'task',
        text: `${t.isCompleted ? 'Completed' : 'Added'} task: ${t.title}`,
        time: t.get('createdAt') || new Date(),
        icon: 'CheckCircle2',
      })),
      ...recentNotes.map(n => ({
        id: n._id,
        type: 'note',
        text: `Added note: ${n.title}`,
        time: n.get('createdAt') || new Date(),
        icon: 'StickyNote',
      })),
      ...recentEvents.map(e => ({
        id: e._id,
        type: 'event',
        text: `Event: ${e.title} on ${e.date}`,
        time: e.get('createdAt') || new Date(),
        icon: 'Calendar',
      })),
    ];

    return activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
  }

  async getFunnelData(userId: string) {
    const companies = await this.companyModel.find({ userId }).exec();
    
    const stages = [
      'New Target',
      'Researching',
      'Contact Found',
      'Outreach Sent',
      'Conversation',
      'Applied',
      'Assessment',
      'Interview',
      'Offer',
      'Hired',
      'Closed Lost'
    ];

    return stages.map(status => ({
      name: status,
      value: companies.filter(c => c.status === status).length,
    }));
  }

  async getUpcomingTasks(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.taskModel.find({
      userId,
      isCompleted: false,
      dueDate: { $gte: today, $lte: nextWeek }
    }).sort({ dueDate: 1 }).limit(10).exec();
  }
}