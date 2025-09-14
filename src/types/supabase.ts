export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member' | 'trainer' | 'nutritionist' | 'superadmin';
  gym_id: string | null;
  created_at: string;
  profile?: MemberProfile | null;
}

export interface MemberProfile {
  user_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  age: number | null;
}
