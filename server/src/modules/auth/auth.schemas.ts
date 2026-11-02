/**
 * Auth Request/Response Validation Schemas
 */

export const callbackQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      state: { type: 'string' },
      error: { type: 'string' },
      error_description: { type: 'string' }
    }
  }
};

export const exchangeCodeSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['code'],
    properties: {
      code: { type: 'string', minLength: 20, maxLength: 200 }
    }
  }
};

export const authSchemas = {
  callbackQuerySchema,
  exchangeCodeSchema
};

export default authSchemas;
