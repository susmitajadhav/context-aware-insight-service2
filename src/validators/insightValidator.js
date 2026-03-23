
// FILE: src/validators/insightValidator.js


import Joi from 'joi';

export const insightSchema = Joi.object({
  tenantId: Joi.string()
    .pattern(/^tenant_[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      'string.pattern.base':
        'tenantId must follow format: tenant_<name>',
    }),

  queryText: Joi.string().min(3).required(),
});