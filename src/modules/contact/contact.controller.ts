import { Controller, Post, Body, Res, Get, Param } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('newContect')
  async create(
    @Body() createContactDto: CreateContactDto,
    @Res() res: Response,
  ) {
    return await this.contactService.create(createContactDto, res);
  }

  @Get('getContact/:userid')
  async getContact(@Param('userid') userId: string, @Res() res: Response) {
    return await this.contactService.getContacts(userId, res);
  }

  @Post('acceptContact')
  async acceptContact(
    @Body() createContactDto: CreateContactDto,
    @Res() res: Response,
  ) {
    return await this.contactService.acceptContact(createContactDto, res);
  }
}
