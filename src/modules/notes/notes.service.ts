import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Note, NoteDocument } from "./schemas/note.schema";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
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
    createNoteDto: CreateNoteDto,
    userId: string,
    verticalSlug: string = "career",
  ): Promise<NoteDocument> {
    const note = new this.noteModel({
      ...createNoteDto,
      userId,
      verticalSlug,
    });
    return note.save();
  }

  async findAll(
    userId: string,
    verticalSlug: string = "career",
  ): Promise<NoteDocument[]> {
    return this.noteModel
      .find(this.scope(userId, verticalSlug))
      .sort({ pinned: -1, createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<NoteDocument> {
    const note = await this.noteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new NotFoundException("Note not found");
    }
    return note;
  }

  async findByFolder(
    folder: string,
    userId: string,
    verticalSlug: string = "career",
  ): Promise<NoteDocument[]> {
    return this.noteModel
      .find({ ...this.scope(userId, verticalSlug), folder })
      .sort({ pinned: -1, createdAt: -1 })
      .exec();
  }

  async findByTag(
    tag: string,
    userId: string,
    verticalSlug: string = "career",
  ): Promise<NoteDocument[]> {
    return this.noteModel
      .find({ ...this.scope(userId, verticalSlug), tags: tag })
      .sort({ pinned: -1, createdAt: -1 })
      .exec();
  }

  async getFolders(
    userId: string,
    verticalSlug: string = "career",
  ): Promise<string[]> {
    const result = await this.noteModel.distinct(
      "folder",
      this.scope(userId, verticalSlug),
    );
    return result.filter((f) => f && f.length > 0);
  }

  async getTags(
    userId: string,
    verticalSlug: string = "career",
  ): Promise<string[]> {
    const result = await this.noteModel.distinct(
      "tags",
      this.scope(userId, verticalSlug),
    );
    return result.filter((t) => t && t.length > 0);
  }

  async update(
    id: string,
    userId: string,
    updateNoteDto: UpdateNoteDto,
  ): Promise<NoteDocument> {
    const note = await this.noteModel.findOneAndUpdate(
      { _id: id, userId },
      updateNoteDto,
      { new: true, runValidators: true },
    );
    if (!note) {
      throw new NotFoundException("Note not found");
    }
    return note;
  }

  async togglePinned(id: string, userId: string): Promise<NoteDocument> {
    const note = await this.noteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new NotFoundException("Note not found");
    }
    note.pinned = !note.pinned;
    return note.save();
  }

  async toggleStarred(id: string, userId: string): Promise<NoteDocument> {
    const note = await this.noteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new NotFoundException("Note not found");
    }
    note.starred = !note.starred;
    return note.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.noteModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundException("Note not found");
    }
  }
}