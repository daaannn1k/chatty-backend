import { IFileImageDocument } from '@images/interfaces/image.interface';
import { imageService } from '@services/db/image.service';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class Get {
  public async images(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const images: IFileImageDocument[] = await imageService.getImages(userId);

    res.status(HTTP_STATUS.OK).json({ message: 'User images', images });
  }
}
