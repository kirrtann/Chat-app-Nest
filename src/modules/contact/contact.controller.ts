import { ContactService } from './contact.service';
import { Controller, Get, Param,  NotFoundException, Post } from '@nestjs/common';



@Controller('contact')
export class ContactController {
  constructor(private readonly ContactService: ContactService) {}

@Post('contact')
async createxontent(@Param('name') name: string) {  
  console.log(`Searching for user: ${name}`);
  const user = await this.ContactService.createcontact(name);
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;  
}

}
