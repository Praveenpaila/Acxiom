const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AcxiomCRM Enterprise API Documentation',
    version: '1.0.0',
    description:
      'Robust enterprise CRM API supporting role-based access control (Admin, Manager, SalesExecutive), lead lifecycle workflow state machines, weighted revenue pipelines, scheduled follow-up activities, immutable audit logging, and reporting.',
    contact: {
      name: 'AcxiomCRM Engineering',
      email: 'engineering@acxiomcrm.internal',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'AcxiomCRM API Base',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'HttpOnly SameSite JWT authentication cookie.',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Authorization: Bearer <token>',
      },
      csrfHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Requested-With',
        description: 'Required on state-changing cookie requests: XMLHttpRequest',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Detailed error explanation.' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['Admin', 'Manager', 'SalesExecutive'] },
          reportingTo: { type: 'object' },
          isActive: { type: 'boolean' },
          isLocked: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customerCode: { type: 'string', example: 'CUST-1001' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          status: { type: 'string', enum: ['Active', 'Inactive'] },
          createdBy: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Lead: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          leadCode: { type: 'string', example: 'LEAD-1001' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          source: { type: 'string', enum: ['Website', 'Referral', 'Cold Call', 'Trade Show', 'LinkedIn', 'Partner'] },
          status: { type: 'string', enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'] },
          expectedValue: { type: 'number' },
          assignedTo: { type: 'object' },
          createdBy: { type: 'object' },
          convertedCustomerId: { type: 'string' },
          convertedOpportunityId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Opportunity: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          customerId: { type: 'object' },
          leadId: { type: 'object' },
          amount: { type: 'number', minimum: 1 },
          stage: { type: 'string', enum: ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
          probability: { type: 'number', minimum: 0, maximum: 100 },
          expectedCloseDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['Open', 'Won', 'Lost'] },
          weightedAmount: { type: 'number' },
          assignedTo: { type: 'object' },
          createdBy: { type: 'object' },
        },
      },
      FollowUp: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['Call', 'Meeting', 'Email', 'Task'] },
          title: { type: 'string' },
          description: { type: 'string' },
          customerId: { type: 'string' },
          leadId: { type: 'string' },
          opportunityId: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
          status: { type: 'string', enum: ['Pending', 'Completed', 'Cancelled'] },
          assignedTo: { type: 'object' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'object' },
          userEmail: { type: 'string' },
          action: { type: 'string' },
          entityName: { type: 'string' },
          recordId: { type: 'string' },
          oldValue: { type: 'object' },
          newValue: { type: 'object' },
          ipAddress: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in to CRM account',
        description: 'Authenticates user, verifies password, enforces account lockout (5 attempts / 15m), and sets HttpOnly SameSite cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid credentials' },
          403: { description: 'Account locked or deactivated' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        responses: {
          200: { description: 'Authenticated user profile' },
          401: { description: 'Unauthenticated' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out and clear session cookie',
        responses: {
          200: { description: 'Session ended' },
        },
      },
    },
    '/customers': {
      get: {
        tags: ['Customers'],
        summary: 'List customers with scoping, search, and pagination',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['All', 'Active', 'Inactive'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Paginated customer list' },
        },
      },
      post: {
        tags: ['Customers'],
        summary: 'Create customer (auto-generates CUST-xxxx code)',
        responses: {
          201: { description: 'Customer created' },
          409: { description: 'Email or phone already exists' },
        },
      },
    },
    '/customers/{id}': {
      get: {
        tags: ['Customers'],
        summary: 'Get customer by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer details' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Customers'],
        summary: 'Update customer details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer updated' } },
      },
      delete: {
        tags: ['Customers'],
        summary: 'Deactivate or delete customer based on role',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer removed or deactivated' } },
      },
    },
    '/leads': {
      get: {
        tags: ['Leads'],
        summary: 'List leads with role scoping, search, and pagination',
        responses: { 200: { description: 'Paginated lead list' } },
      },
      post: {
        tags: ['Leads'],
        summary: 'Create new lead (auto-generates LEAD-xxxx code)',
        responses: { 201: { description: 'Lead created' } },
      },
    },
    '/leads/{id}/status': {
      patch: {
        tags: ['Leads'],
        summary: 'Transition lead lifecycle status (validates state machine)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Status updated' }, 400: { description: 'Illegal transition' } },
      },
    },
    '/leads/{id}/convert': {
      post: {
        tags: ['Leads'],
        summary: 'Convert Qualified lead into Customer + Opportunity',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lead converted successfully' } },
      },
    },
    '/opportunities': {
      get: {
        tags: ['Opportunities'],
        summary: 'List opportunities with scoping and pipeline stage filters',
        responses: { 200: { description: 'Opportunity list' } },
      },
      post: {
        tags: ['Opportunities'],
        summary: 'Create opportunity with validation (amount > 0, probability 0-100, future date)',
        responses: { 201: { description: 'Opportunity created' } },
      },
    },
    '/opportunities/pipeline/summary': {
      get: {
        tags: ['Opportunities'],
        summary: 'Get weighted revenue pipeline summary and stage breakdown',
        responses: { 200: { description: 'Pipeline metrics' } },
      },
    },
    '/followups': {
      get: {
        tags: ['Follow-Ups & Activities'],
        summary: 'List follow-ups (supports views: pending, overdue, completed)',
        responses: { 200: { description: 'Activities list' } },
      },
      post: {
        tags: ['Follow-Ups & Activities'],
        summary: 'Schedule activity (rejects dates prior to today)',
        responses: { 201: { description: 'Follow-up created' } },
      },
    },
    '/followups/{id}/reschedule': {
      patch: {
        tags: ['Follow-Ups & Activities'],
        summary: 'Reschedule pending follow-up activity',
        responses: { 200: { description: 'Rescheduled' } },
      },
    },
    '/followups/{id}/complete': {
      patch: {
        tags: ['Follow-Ups & Activities'],
        summary: 'Mark follow-up as completed with outcome notes',
        responses: { 200: { description: 'Completed' } },
      },
    },
    '/users': {
      get: {
        tags: ['User Management (Admin Only)'],
        summary: 'List all users in organization',
        responses: { 200: { description: 'User list' }, 403: { description: 'Admin only' } },
      },
      post: {
        tags: ['User Management (Admin Only)'],
        summary: 'Provision new employee user account',
        responses: { 201: { description: 'User created' } },
      },
    },
    '/users/assignable': {
      get: {
        tags: ['User Management (Admin Only)'],
        summary: 'List active users eligible for record assignment',
        responses: { 200: { description: 'Assignable users' } },
      },
    },
    '/users/{id}/status': {
      patch: {
        tags: ['User Management (Admin Only)'],
        summary: 'Toggle active/deactivated status',
        responses: { 200: { description: 'Status updated' } },
      },
    },
    '/users/{id}/reset-lockout': {
      post: {
        tags: ['User Management (Admin Only)'],
        summary: 'Clear account lockout timer and failed attempt counter',
        responses: { 200: { description: 'Lockout cleared' } },
      },
    },
    '/users/{id}/reset-password': {
      post: {
        tags: ['User Management (Admin Only)'],
        summary: 'Admin override password reset',
        responses: { 200: { description: 'Password reset' } },
      },
    },
    '/audit': {
      get: {
        tags: ['Security & Compliance (Admin Only)'],
        summary: 'Inspect append-only immutable audit trail with filters',
        responses: { 200: { description: 'Audit logs' }, 403: { description: 'Admin only' } },
      },
    },
  },
};

module.exports = swaggerSpec;
