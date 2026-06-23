import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { disputesRouter } from '../src/routes/disputes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// Shared fixture — accessible in both the mock factory and test bodies
// ---------------------------------------------------------------------------

const mockDispute = {
  id: 'clx_test_001',
  customerName: 'Jane Smith',
  transactionRef: 'TXN-001',
  paymentType: 'card_transaction',
  issueCategory: 'unauthorized_transaction',
  transactionStatus: 'completed',
  amount: 750.0,
  transactionDate: new Date('2026-05-15T00:00:00.000Z'),
  description: null,
  recommendedAction: 'escalate_to_fraud',
  disputeStatus: 'open',
  createdAt: new Date('2026-06-22T10:00:00.000Z'),
  updatedAt: new Date('2026-06-22T10:00:00.000Z'),
  statusHistory: [],
};

// ---------------------------------------------------------------------------
// Mock Prisma — prevent any real DB access in unit tests
// ---------------------------------------------------------------------------

vi.mock('../src/db.js', () => {
  return {
    default: {
      dispute: {
        create: vi.fn(),
        findMany: vi.fn(),
        // findFirst: used by POST to check for duplicate transactionRef. Default null = no duplicate.
        findFirst: vi.fn().mockResolvedValue(null),
        // findUnique: used by GET /:id and PATCH /:id/status. Default null = not found.
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/disputes', disputesRouter);
  app.use(errorHandler);
  return app;
}

// Reset all mock implementations between tests so they don't bleed across describe blocks.
// After resetAllMocks, restore safe defaults: findFirst and findUnique return null (no record found).
async function resetMocks() {
  vi.resetAllMocks();
  const { default: db } = await import('../src/db.js');
  vi.mocked(db.dispute.findFirst).mockResolvedValue(null);
  vi.mocked(db.dispute.findUnique).mockResolvedValue(null);
}

const validBody = {
  customerName: 'Jane Smith',
  transactionRef: 'TXN-001',
  paymentType: 'card_transaction',
  issueCategory: 'unauthorized_transaction',
  transactionStatus: 'completed',
  amount: 750.0,
  transactionDate: '2026-05-15T00:00:00.000Z',
  description: 'Unauthorised charge.',
};

// ---------------------------------------------------------------------------
// POST /api/disputes
// ---------------------------------------------------------------------------

describe('POST /api/disputes', () => {
  beforeEach(resetMocks);

  it('returns 201 with the created dispute on valid input', async () => {
    const { default: db } = await import('../src/db.js');
    // findUnique returns null by default → no duplicate → create succeeds
    vi.mocked(db.dispute.create).mockResolvedValueOnce({ ...mockDispute });
    const app = buildApp();
    const res = await request(app).post('/api/disputes').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('recommendedAction');
  });

  it('returns 400 VALIDATION_ERROR when required fields are missing', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/disputes')
      .send({ customerName: 'Jane Smith' }); // missing most fields
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeInstanceOf(Array);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('returns 400 VALIDATION_ERROR with details listing all invalid fields', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/disputes').send({
      ...validBody,
      paymentType: 'invalid_type',
      amount: -1,
    });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('paymentType');
    expect(fields).toContain('amount');
  });

  it('returns 409 DUPLICATE_TRANSACTION_REF when a dispute for the same transactionRef already exists', async () => {
    const { default: db } = await import('../src/db.js');
    // findFirst returns an existing dispute → triggers duplicate check in POST route
    vi.mocked(db.dispute.findFirst).mockResolvedValueOnce({ ...mockDispute });
    const app = buildApp();
    const res = await request(app).post('/api/disputes').send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_TRANSACTION_REF');
  });

  it('returns 500 INTERNAL_ERROR when the database fails to persist the dispute — does not return 201', async () => {
    // Requirement 6.4: if persistence fails, must not confirm creation
    const { default: db } = await import('../src/db.js');
    vi.mocked(db.dispute.create).mockRejectedValueOnce(
      new Error('SQLITE_BUSY: database is locked'),
    );
    const app = buildApp();
    const res = await request(app).post('/api/disputes').send(validBody);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    // Explicitly assert no 201 was returned — dispute was not saved
    expect(res.status).not.toBe(201);
  });
});

// ---------------------------------------------------------------------------
// GET /api/disputes
// ---------------------------------------------------------------------------

describe('GET /api/disputes', () => {
  beforeEach(resetMocks);

  it('returns 200 with paginated dispute list', async () => {
    const { default: db } = await import('../src/db.js');
    vi.mocked(db.dispute.findMany).mockResolvedValueOnce([mockDispute]);
    vi.mocked(db.dispute.count).mockResolvedValueOnce(1);
    const app = buildApp();
    const res = await request(app).get('/api/disputes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toMatchObject({ page: 1, pageSize: 50 });
  });

  it('accepts page and pageSize query params', async () => {
    const { default: db } = await import('../src/db.js');
    vi.mocked(db.dispute.findMany).mockResolvedValueOnce([mockDispute]);
    vi.mocked(db.dispute.count).mockResolvedValueOnce(1);
    const app = buildApp();
    const res = await request(app).get('/api/disputes?page=2&pageSize=10');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.pageSize).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// GET /api/disputes/:id
// ---------------------------------------------------------------------------

describe('GET /api/disputes/:id', () => {
  beforeEach(resetMocks);

  it('returns 200 with the full dispute including statusHistory', async () => {
    const { default: db } = await import('../src/db.js');
    vi.mocked(db.dispute.findUnique).mockResolvedValueOnce({ ...mockDispute });
    const app = buildApp();
    const res = await request(app).get('/api/disputes/clx_test_001');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('statusHistory');
  });

  it('returns 404 DISPUTE_NOT_FOUND when dispute does not exist', async () => {
    const { default: db } = await import('../src/db.js');
    // findUnique returns null → dispute not found
    vi.mocked(db.dispute.findUnique).mockResolvedValueOnce(null);
    const app = buildApp();
    const res = await request(app).get('/api/disputes/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DISPUTE_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/disputes/:id/resolve
// ---------------------------------------------------------------------------

describe('PATCH /api/disputes/:id/resolve', () => {
  beforeEach(resetMocks);

  it('returns 200 with the resolved dispute', async () => {
    const { default: db } = await import('../src/db.js');
    // The resolve route calls db.dispute.update directly — no prior findUnique.
    vi.mocked(db.dispute.update).mockResolvedValueOnce({
      ...mockDispute,
      disputeStatus: 'resolved',
      statusHistory: [{ id: 'h1', disputeId: 'clx_test_001', status: 'resolved', reason: 'Case closed', changedAt: new Date() }],
    } as Awaited<ReturnType<typeof db.dispute.update>>);

    const app = buildApp();
    const res = await request(app)
      .patch('/api/disputes/clx_test_001/resolve')
      .send({ reason: 'Case closed.' });

    expect(res.status).toBe(200);
    expect(res.body.disputeStatus).toBe('resolved');
  });

  it('returns 404 DISPUTE_NOT_FOUND when dispute does not exist', async () => {
    const { default: db } = await import('../src/db.js');
    // The resolve route calls db.dispute.update directly (no prior findUnique).
    // It relies on Prisma's P2025 error when the record doesn't exist.
    vi.mocked(db.dispute.update).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
        code: 'P2025',
        clientVersion: '5.0.0',
      }),
    );
    const app = buildApp();
    const res = await request(app)
      .patch('/api/disputes/nonexistent/resolve')
      .send({ reason: 'Some reason.' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DISPUTE_NOT_FOUND');
  });

  it('returns 400 VALIDATION_ERROR when reason is empty', async () => {
    // Validation fires before findUnique is called — no mock needed
    const app = buildApp();
    const res = await request(app)
      .patch('/api/disputes/clx_test_001/resolve')
      .send({ reason: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/disputes/:id/status
// ---------------------------------------------------------------------------

describe('PATCH /api/disputes/:id/status', () => {
  beforeEach(resetMocks);

  it('returns 200 with updated dispute when action is reopen on a resolved dispute', async () => {
    const { default: db } = await import('../src/db.js');
    // findUnique must return a *resolved* dispute — route checks disputeStatus === 'resolved'
    vi.mocked(db.dispute.findUnique).mockResolvedValueOnce({
      ...mockDispute,
      disputeStatus: 'resolved',
    } as Awaited<ReturnType<typeof db.dispute.findUnique>>);
    vi.mocked(db.dispute.update).mockResolvedValueOnce({
      ...mockDispute,
      disputeStatus: 'reopened',
      statusHistory: [{ id: 'h1', disputeId: 'clx_test_001', status: 'reopened', reason: 'New evidence', changedAt: new Date() }],
    } as Awaited<ReturnType<typeof db.dispute.update>>);

    const app = buildApp();
    const res = await request(app)
      .patch('/api/disputes/clx_test_001/status')
      .send({ action: 'reopen', reason: 'Customer provided new evidence.' });
    expect(res.status).toBe(200);
  });

  it('returns 422 INVALID_STATUS_TRANSITION when dispute is not resolved', async () => {
    const { default: db } = await import('../src/db.js');
    // findUnique must return a dispute with *non-resolved* status to trigger the 422
    vi.mocked(db.dispute.findUnique).mockResolvedValueOnce({
      ...mockDispute,
      disputeStatus: 'open',
    } as Awaited<ReturnType<typeof db.dispute.findUnique>>);
    const app = buildApp();
    const res = await request(app)
      .patch('/api/disputes/clx_test_001/status')
      .send({ action: 'reopen', reason: 'Some reason.' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('returns 400 VALIDATION_ERROR when action is invalid', async () => {
    // Validation fires before findUnique is called — no mock needed
    const app = buildApp();
    const res = await request(app)
      .patch('/api/disputes/clx_test_001/status')
      .send({ action: 'close', reason: 'Some reason.' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when reason is empty', async () => {
    // Validation fires before findUnique is called — no mock needed
    const app = buildApp();
    const res = await request(app)
      .patch('/api/disputes/clx_test_001/status')
      .send({ action: 'reopen', reason: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});;
