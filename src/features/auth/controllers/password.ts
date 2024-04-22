import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import crypto from 'crypto';
import publicIP from 'ip';
import moment from 'moment';

import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { config } from '@root/config';
import { authService } from '@services/db/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { emailSchema, passwordSchema } from '@auth/schemes/password';
import { forgotTemplate } from '@services/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@services/queues/email.queue';
import { IResetPasswordParams } from '@user/interfaces/user.interace';
import { resetTemplate } from '@services/emails/templates/reset-password/reset-password-template';

export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const foundUser: IAuthDocument | null = await authService.getAuthUserByEmail(email);

    if (!foundUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');

    await authService.updatePasswordToken(`${foundUser._id}`, randomCharacters, Date.now() + 60 * 60 * 1000);

    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
    const template: string = forgotTemplate.passwordResetTemplate(foundUser.username, resetLink);
    emailQueue.addEmailJob('forgotEmailPassword', { receiverEmail: 'vladislavdandara@gmail.com', subject: 'Forgot password', template });

    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent' });
  }

  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password } = req.body;
    const { token } = req.params;

    const foundUser: IAuthDocument | null = await authService.getAuthUserByPasswordToken(token);

    if (!foundUser) {
      throw new BadRequestError('Reset token has expired');
    }

    foundUser.password = password;
    foundUser.passwordResetExpires = undefined;
    foundUser.passwordResetToken = undefined;

    await foundUser.save();

    const templateParams: IResetPasswordParams = {
      username: foundUser.username,
      email: foundUser.email,
      ipaddress: publicIP.address(),
      date: moment().format('DD/MM/YYYY HH:mm')
    };

    const template: string = resetTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEmailJob('forgotEmailPassword', { receiverEmail: 'vladislavdandara@gmail.com', subject: 'Reset password', template });

    res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated' });
  }
}
