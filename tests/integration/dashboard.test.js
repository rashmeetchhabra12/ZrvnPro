const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/middleware/auth');

describe('Dashboard API', () => {
  const adminToken = generateToken(1, 'admin');
  const analystToken = generateToken(2, 'analyst');
  const viewerToken = generateToken(3, 'viewer');

  describe('GET /api/dashboard/summary', () => {
    it('should return financial summary for any authenticated user', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_income');
      expect(res.body.data).toHaveProperty('total_expense');
      expect(res.body.data).toHaveProperty('net_balance');
      expect(res.body.data).toHaveProperty('total_transactions');
    });

    it('should support date filtering', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary?startDate=2026-04-01&endDate=2026-04-30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/category-breakdown', () => {
    it('should allow analyst to view category breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow admin to view category breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject viewer from viewing category breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/dashboard/category-breakdown?type=income')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        res.body.data.forEach((item) => {
          expect(item.type).toBe('income');
        });
      }
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should allow analyst to view trends', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow admin to view trends', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject viewer from viewing trends', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should support period parameter', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?period=weekly')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should default to monthly period', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/recent-activity', () => {
    it('should return recent activity for any authenticated user', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-activity')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-activity?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/dashboard', () => {
    it('should return comprehensive dashboard data', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('recent_activity');
      expect(res.body.data).toHaveProperty('top_categories');
    });

    it('should be accessible to viewers', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
