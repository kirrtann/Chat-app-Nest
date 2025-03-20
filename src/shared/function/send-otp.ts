import { MESSAGE } from '../constants/constant';
import { renderFile } from 'ejs';
import { join } from 'path';

import { User } from 'src/modules/user/entities/user.entity';
import { EmailService } from '../servies/email-service';

const sendOtp = async (user: User, otp: number) => {
  const emailService = new EmailService();

  const ejsTemplate = await renderFile(
    join(__dirname + '/../../../shared/ejs-temlates/varifition-otp.ejs'),
    {
      name: user.name,
      minutes: 10,
      otp: otp,
    },
  );
  await emailService.sendMail({
    to: user.email,
    subject: MESSAGE.OTP_VERIFICATION,
    html: ejsTemplate,
  });
  return otp;
};

export default sendOtp;
