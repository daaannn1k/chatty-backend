import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import publicIP from 'ip';

import { IResetPasswordParams } from '@user/interfaces/user.interace';
import { userService } from '@services/db/user.service';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { changePasswordSchema } from '@user/schemes/info';
import { authService } from '@services/db/auth.service';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { resetTemplate } from '@services/emails/templates/reset-password/reset-password-template';
import { emailQueue } from '@services/queues/email.queue';
import moment from 'moment';

export class Update {
  @joiValidation(changePasswordSchema)
  public async password(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;

    const existingUser: IAuthDocument = (await authService.getAuthUserByUsername(req.currentUser!.username)) as IAuthDocument;
    const passwordsMatch: boolean = await existingUser.comparePassword(currentPassword);

    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    const hashedPassword: string = await existingUser.hashPassword(newPassword);
    await userService.updatePassword(`${req.currentUser!.userId}`, hashedPassword);

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD/MM/YYYY HH:mm')
    };

    const template: string = resetTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEmailJob('changePassword', { receiverEmail: existingUser.email!, subject: 'Password update confirmation', template });

    res.status(HTTP_STATUS.OK).json({ message: 'Password updated successfully. You will be redirected shortly to the login page' });
  }
}
