export type UserRole = 'citizen' | 'hospital_staff' | 'paramedic' | 'dispatcher';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  hospital_id?: string;
  hospital_name?: string;
  badge_number?: string;
  created_at: string;
}

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr-citizen-01',
    email: 'asha@citizen.medpass.in',
    full_name: 'Asha Kulkarni',
    role: 'citizen',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'usr-hospital-01',
    email: 'priya@sahyadri.health',
    full_name: 'Dr. Priya Nair',
    role: 'hospital_staff',
    hospital_id: 'hosp-001',
    hospital_name: 'Sahyadri Super Speciality Hospital',
    created_at: '2026-01-20T10:30:00Z',
  },
  {
    id: 'usr-paramedic-01',
    email: 'paramedic101@pune-ems.gov',
    full_name: 'Paramedic Rajesh Jadhav',
    role: 'paramedic',
    badge_number: 'APEX-101',
    created_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 'usr-dispatch-01',
    email: 'command@punemc.gov',
    full_name: 'Chief Dispatcher Sanjay Verma',
    role: 'dispatcher',
    badge_number: 'CMD-01',
    created_at: '2026-01-10T09:00:00Z',
  },
];
