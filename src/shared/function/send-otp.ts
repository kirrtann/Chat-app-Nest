import { MESSAGE } from '../constants/constant';
import { renderFile } from 'ejs';

import * as path from 'path';
import { User } from 'src/modules/user/entities/user.entity';
import { EmailService } from '../servies/email-service';

const sendOtp = async (user: User, otp: number) => {
  const emailService = new EmailService();

  const ejsTemplatePath = path.join(
    process.cwd(),
    'src',
    'shared',
    'ejs-templates',
    'varifition-otp.ejs',
  );

  const ejsTemplate = await renderFile(ejsTemplatePath, {
    name: user.name,
    minutes: 2,
    otp: otp,
  });

  await emailService.sendMail({
    to: user.email,
    subject: MESSAGE.OTP_VERIFICATION,
    html: ejsTemplate,
  });

  return otp;
};

export default sendOtp;
