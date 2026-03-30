import { useMemo } from 'react';
import type { Students } from '../../../types/students';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const getProxyUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const cleanPath = path.replace(`${VITE_API_URL}/storage/`, '');
  return `${VITE_API_URL}/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
};

export const usePreviewData = (
  templateId: number | null, 
  templateName: string, 
  allStudents: Students[],
  activeStudentId: number | null = null,
  overrides: any = {}
) => {
  const activeStudent = useMemo(() => {
    if (!allStudents?.length) return null;

    if (activeStudentId) {
      return allStudents.find(s => s.id === activeStudentId) || null;
    }

    // Default to most recently updated
    return [...allStudents].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    })[0];
  }, [allStudents, templateId, activeStudentId]);

  const previewData = useMemo(() => {
    if (!activeStudent) return null;

    return {
      fullName: overrides.fullName !== undefined ? overrides.fullName : `${activeStudent.first_name} ${activeStudent.last_name}`,
      idNumber: overrides.idNumber !== undefined ? overrides.idNumber : activeStudent.id_number,
      course: overrides.course !== undefined ? overrides.course : (templateName || activeStudent.course || "COURSE"),
      photo: overrides.photo !== undefined ? overrides.photo : getProxyUrl(activeStudent.id_picture),
      signature: overrides.signature !== undefined ? overrides.signature : getProxyUrl(activeStudent.signature_picture),
      guardian_name: overrides.guardian_name !== undefined ? overrides.guardian_name : activeStudent.guardian_name,
      guardian_contact: overrides.guardian_contact !== undefined ? overrides.guardian_contact : activeStudent.guardian_contact,
      address: overrides.address !== undefined ? overrides.address : activeStudent.address,
    };
  }, [activeStudent, templateName, overrides]);

  return { previewData, activeStudent };
};

