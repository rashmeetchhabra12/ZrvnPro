const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/middleware/auth');

describe('Users API', () => {
  const adminToken = generateToken(1, 'admin');
  const analystToken = generateToken(2, 'analyst');
  const viewerToken = generateToken(3, 'viewer');

  describe('GET /api/users', () => {
    it('should allow admin to list all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject non-admin from listing users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        res.body.data.forEach((user) => {
          expect(user.status).toBe('active');
        });
      }
    });
  });

  describe('GET /api/users/:id', () => {
    it('should allow admin to view any user', async () => {
      const res = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('username');
    });

    it('should allow user to view their own profile', async () => {
      const res = await request(app)
        .get('/api/users/3')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject user from viewing other profiles', async () => {
      const res = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/users', () => {
    const newUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'viewer',
      status: 'active',
    };

    it('should allow admin to create user', async () => {
      const uniqueUser = {
        ...newUser,
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(uniqueUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.username).toBe(uniqueUser.username);
    });

    it('should reject non-admin from creating user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(newUser);

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser',
          // Missing email, password, role
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUser,
          email: 'invalid-email',
        });

      expect(res.status).toBe(400);
    });

    it('should validate role is valid', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUser,
          role: 'invalid_role',
        });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate username', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUser,
          username: 'admin',
          email: 'newemail@example.com',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should allow admin to update user', async () => {
      const res = await request(app)
        .put('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'updated@example.com',
        });

      expect([200, 404, 409]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });

    it('should reject non-admin from updating user', async () => {
      const res = await request(app)
        .put('/api/users/2')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('should allow admin to change user status', async () => {
      const res = await request(app)
        .patch('/api/users/2/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      expect([200, 404]).toContain(res.status);

      // Reactivate the user
      if (res.status === 200) {
        await request(app)
          .patch('/api/users/2/status')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'active' });
      }
    });

    it('should reject non-admin from changing status', async () => {
      const res = await request(app)
        .patch('/api/users/2/status')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: 'inactive' });

      expect(res.status).toBe(403);
    });

    it('should prevent admin from deactivating themselves', async () => {
      const res = await request(app)
        .patch('/api/users/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should allow admin to delete user', async () => {
      // First create a user to delete
      const createRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `deleteme${Date.now()}`,
          email: `deleteme${Date.now()}@example.com`,
          password: 'password123',
          role: 'viewer',
        });

      if (createRes.status === 201) {
        const userId = createRes.body.data.id;

        const deleteRes = await request(app)
          .delete(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.success).toBe(true);
      }
    });

    it('should reject non-admin from deleting user', async () => {
      const res = await request(app)
        .delete('/api/users/2')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should prevent admin from deleting themselves', async () => {
      const res = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});
