import fs from 'fs';
import ejs from 'ejs';
import { IResetPasswordParams } from '@user/interfaces/user.interace';

class ResetPasswordTemplate {
  public passwordResetConfirmationTemplate(templatesParams: IResetPasswordParams): string {
    const {username, email, ipaddress, date} = templatesParams;
    return ejs.render(fs.readFileSync(__dirname + '/reset-password-template.ejs', 'utf8'), {
      username,
      email,
      ipaddress,
      date,
      image_url: 'https://media.istockphoto.com/id/936681148/vector/lock-icon.jpg?s=612x612&w=0&k=20&c=_0AmWrBagdcee-KDhBUfLawC7Gh8CNPLWls73lKaNVA=',
    });
  }
}

export const resetTemplate: ResetPasswordTemplate = new ResetPasswordTemplate();
