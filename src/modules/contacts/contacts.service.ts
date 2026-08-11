import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {}

  async create(createContactDto: CreateContactDto, userId: string): Promise<ContactDocument> {
    const contact = new this.contactModel({
      ...createContactDto,
      userId,
    });
    return contact.save();
  }

  async findAll(userId: string): Promise<ContactDocument[]> {
    return this.contactModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, userId: string): Promise<ContactDocument> {
    const contact = await this.contactModel.findOne({ _id: id, userId });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async findByCompany(companyId: string, userId: string): Promise<ContactDocument[]> {
    return this.contactModel.find({ companyId, userId }).exec();
  }

  async update(id: string, userId: string, updateContactDto: UpdateContactDto): Promise<ContactDocument> {
    const contact = await this.contactModel.findOneAndUpdate(
      { _id: id, userId },
      updateContactDto,
      { new: true, runValidators: true }
    );
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.contactModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Contact not found');
    }
  }
}