/**
 * Applications Validation Schemas (Fastify JSON Schemas)
 */

export const createApplicationSchema = {
  body: {
    type: 'object',
    required: ['companyName', 'roleTitle'],
    properties: {
      companyName: { type: 'string', minLength: 1 },
      companyDomain: { type: 'string' },
      roleTitle: { type: 'string', minLength: 1 },
      location: { type: 'string' },
      salaryRange: { type: 'string' },
      jobUrl: { type: 'string' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' }
    }
  }
};

export const updateStatusSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['APPLIED', 'OA_TEST', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED']
      }
    }
  }
};

export const updateApplicationSchema = {
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
      companyName: { type: 'string', minLength: 1 },
      companyDomain: { type: 'string' },
      roleTitle: { type: 'string', minLength: 1 },
      location: { type: 'string' },
      salaryRange: { type: 'string' },
      jobUrl: { type: 'string' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      notes: { type: 'string' }
    }
  }
};

export const filterApplicationsSchema = {
  querystring: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['APPLIED', 'OA_TEST', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED']
      },
      search: { type: 'string' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }
    }
  }
};

export const getByIdSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  }
};
