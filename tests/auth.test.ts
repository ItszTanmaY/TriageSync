import { describe, it, expect } from 'vitest';
import { DEMO_USERS } from '../lib/auth/types';
import { POST as loginHandler } from '../app/api/auth/login/route';
import { POST as registerHandler } from '../app/api/auth/register/route';
import { NextRequest } from 'next/server';

describe('Role-Based Authentication & Registration System', () => {
  describe('Pre-configured Demo Role Profiles', () => {
    it('provides all 4 distinct roles with appropriate affiliations', () => {
      const roles = DEMO_USERS.map((u) => u.role);
      expect(roles).toContain('citizen');
      expect(roles).toContain('hospital_staff');
      expect(roles).toContain('paramedic');
      expect(roles).toContain('dispatcher');

      const staff = DEMO_USERS.find((u) => u.role === 'hospital_staff');
      expect(staff?.hospital_id).toBe('hosp-001');
      expect(staff?.hospital_name).toBe('Sahyadri Super Speciality Hospital');

      const paramedic = DEMO_USERS.find((u) => u.role === 'paramedic');
      expect(paramedic?.badge_number).toBe('APEX-101');
    });
  });

  describe('Login API Endpoint (/api/auth/login)', () => {
    it('authenticates demo hospital staff and returns affiliated facility', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'priya@sahyadri.health', password: 'password123' }),
      });

      const res = await loginHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.user.role).toBe('hospital_staff');
      expect(json.user.hospital_name).toBe('Sahyadri Super Speciality Hospital');
    });

    it('rejects invalid email formats with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'pass' }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(400);
    });
  });

  describe('Registration API Endpoint (/api/auth/register)', () => {
    it('registers a normal citizen successfully', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Tanmay Deshmukh',
          email: 'tanmay@citizen.in',
          password: 'securePassword123',
          role: 'citizen',
        }),
      });

      const res = await registerHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.user.full_name).toBe('Tanmay Deshmukh');
      expect(json.user.role).toBe('citizen');
    });

    it('requires a hospital_id when registering as hospital_staff', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Dr. John Doe',
          email: 'johndoe@hospital.com',
          role: 'hospital_staff',
          // hospital_id missing!
        }),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
    });

    it('registers hospital staff with assigned facility', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Dr. Sunita Rao',
          email: 'sunita@rubyhall.com',
          role: 'hospital_staff',
          hospital_id: 'hosp-002',
        }),
      });

      const res = await registerHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.user.role).toBe('hospital_staff');
      expect(json.user.hospital_name).toBe('Deccan Neuro & Multispeciality');
    });
  });
});
