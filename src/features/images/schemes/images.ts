import Joi, { ObjectSchema } from 'joi';

const addImageSchema: ObjectSchema = Joi.object().keys({
  image: Joi.string().required().messages({
    'any.required': 'Image is a required field',
    'string.empty': 'Image should not be empty'
  })
});

export { addImageSchema };
