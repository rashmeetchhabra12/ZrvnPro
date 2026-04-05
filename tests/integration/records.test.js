const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/middleware/auth');

describe('Financial Records API', () => {
  const adminToken = generateToken(1, 'admin');
  const analystToken = generateToken(2, 'analyst');
  const viewerToken = generateToken(3, 'viewer');

  describe('GET /api/records', () => {
    it('should return records for authenticated user', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/records?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/records?type=income')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        res.body.data.forEach((record) => {
          expect(record.type).toBe('income');
        });
      }
    });

    it('should filter by date range', async () => {
      const res = await request(app)
        .get('/api/records?startDate=2026-04-01&endDate=2026-04-30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .get('/api/records');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/records', () => {
    const newRecord = {
      amount: 1000,
      type: 'income',
      category: 'Salary',
      transaction_date: '2026-04-05',
      description: 'Test income',
    };

    it('should allow admin to create record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRecord);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(parseFloat(res.body.data.amount)).toBe(1000);
    });

    it('should reject viewer from creating record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(newRecord);

      expect(res.status).toBe(403);
    });

    it('should reject analyst from creating record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(newRecord);

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1000,
          // Missing type, category, transaction_date
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    it('should validate amount is positive', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newRecord,
          amount: -100,
        });

      expect(res.status).toBe(400);
    });

    it('should validate type is income or expense', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newRecord,
          type: 'invalid',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/records/:id', () => {
    it('should return record by id for any authenticated user', async () => {
      const res = await request(app)
        .get('/api/records/1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
      }
    });

    it('should return 404 for non-existent record', async () => {
      const res = await request(app)
        .get('/api/records/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/records/:id', () => {
    it('should allow admin to update record', async () => {
      const res = await request(app)
        .put('/api/records/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1500,
          description: 'Updated description',
        });

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });

    it('should reject viewer from updating record', async () => {
      const res = await request(app)
        .put('/api/records/1')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ amount: 1500 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/records/:id', () => {
    it('should allow admin to delete record', async () => {
      // First create a record to delete
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100,
          type: 'expense',
          category: 'Test',
          transaction_date: '2026-04-05',
        });

      if (createRes.status === 201) {
        const recordId = createRes.body.data.id;

        const deleteRes = await request(app)
          .delete(`/api/records/${recordId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.success).toBe(true);
      }
    });

    it('should reject viewer from deleting record', async () => {
      const res = await request(app)
        .delete('/api/records/1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/records/categories', () => {
    it('should return list of categories', async () => {
      const res = await request(app)
        .get('/api/records/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
