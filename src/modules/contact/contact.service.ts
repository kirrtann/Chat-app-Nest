import { Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';
import response from 'utils/response';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactrerepository: Repository<Contact>,
  ) {}
  async create(createContactDto: CreateContactDto, res: Response) {
    const contact = new Contact();
    contact.user = createContactDto.UserId;
    contact.contact_email = createContactDto.email;
    contact.contact_name = createContactDto.name;
    const savedContact = await this.contactrerepository.save(contact);
    return response.successResponse(
      {
        message: 'Send Request Successfully',
        data: savedContact,
      },
      res,
    );
  }

  async getContacts(userId: string, res: Response) {
    const contacts = await this.contactrerepository.find({
      where: {
        user: { id: userId },
      },
      relations: ['user'],
      select: {
        user: {
          id: true,
          email: true,
          name: true,
        },
      },
    });

    if (contacts.length > 0) {
      return response.successResponse(
        {
          message: 'Contacts found',
          data: contacts,
        },
        res,
      );
    }

    return response.recordNotFound(
      {
        message: 'No contacts found',
        data: [],
      },
      res,
    );
  }

  async acceptContact(createContactDto: CreateContactDto, res: Response) {
    const contact = await this.contactrerepository.findOne({
      where: {
        user: createContactDto.UserId,
        contact_email: createContactDto.email,
      },
    });

    if (!contact) {
      return response.recordNotFound(
        {
          message: 'Contact not found',
          data: [],
        },
        res,
      );
    }

    contact.status = 'active';
    const updatedContact = await this.contactrerepository.save(contact);

    return response.successResponse(
      {
        message: 'Contact accepted successfully',
        data: updatedContact,
      },
      res,
    );
  }
}
