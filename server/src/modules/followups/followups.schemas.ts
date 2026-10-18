/**
 * Follow-Ups Validation Schemas (Fastify JSON Schemas)
 */

export const generateDraftSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      tone: {
        type: 'string',
        enum: ['polite_nudge', 'value_add', 'polite_breakup'],
        default: 'polite_nudge'
      }
    }
  }
};

export const dismissReminderSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      snoozeDays: { type: 'integer', minimum: 1, maximum: 30, default: 7 }
    }
  }
};

export const logSentSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      draftBody: { type: 'string' }
    }
  }
};
