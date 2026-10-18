/**
 * Auth Request/Response Validation Schemas
 */

export const callbackQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      error: { type: 'string' },
      error_description: { type: 'string' }
    }
  }
};

export const authSchemas = {
  callbackQuerySchema
};

export default authSchemas;
