import type { Students } from '@/types/students';
import { type ApplicantCard } from '@/types/card';

const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getUrl = (path: string | null) =>
    !path ? '' : path.startsWith('http') ? path : `${VITE_API_URL}/storage/${path}`;

export const toCard = (s: Students): ApplicantCard => ({
    id: s.id,
    fullName: `${s.first_name} ${s.last_name}`,
    manual_full_name: s.manual_full_name,
    idNumber: s.id_number,
    course: s.course,
    photo: getUrl(s.id_picture),
    signature: getUrl(s.signature_picture),
    guardian_name: s.guardian_name,
    guardian_contact: s.guardian_contact,
    address: s.address,
    email: s.email,
});

export const Courses: Record<string, { color: string; border: string }> = {
    'BSGE': { color: 'text-red-600', border: 'border-red-200' },
    'BSN': { color: 'text-pink-500', border: 'border-pink-200' },
    'BSIT': { color: 'text-cyan-600', border: 'border-cyan-200' },
    'BSBA': { color: 'text-amber-600', border: 'border-amber-200' },
    'BSCRIM': { color: 'text-zinc-700', border: 'border-zinc-200' },
    'BSED': { color: 'text-violet-600', border: 'border-violet-200' },
    'BSCS': { color: 'text-blue-600', border: 'border-blue-200' },
    'HE': { color: 'text-rose-600', border: 'border-rose-200' },
    'MIDWIFERY': { color: 'text-fuchsia-600', border: 'border-fuchsia-200' },
    'ABM': { color: 'text-orange-600', border: 'border-orange-200' },
    'JD': { color: 'text-indigo-600', border: 'border-indigo-200' },
};
