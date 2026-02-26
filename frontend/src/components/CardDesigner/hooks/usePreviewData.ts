import { useMemo } from 'react';
import type { Students } from '../../../types/students';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const getProxyUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const cleanPath = path.replace(`${VITE_API_URL}/storage/`, '');
  return `${VITE_API_URL}/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
};

export const usePreviewData = (templateId: number | null, templateName: string, allStudents: Students[]) => {
  const activeStudent = useMemo(() => {
    if (!templateId || !allStudents?.length) return null;

    // Return most recently updated student from the provided list
    return [...allStudents].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    })[0];
  }, [allStudents, templateId]);

  const previewData = useMemo(() => {
    if (!activeStudent) return null;

    return {
      fullName: `${activeStudent.first_name} ${activeStudent.last_name}`,
      idNumber: activeStudent.id_number,
      course: templateName || activeStudent.course || "COURSE",
      photo: getProxyUrl(activeStudent.id_picture),
      signature: getProxyUrl(activeStudent.signature_picture),
      guardian_name: activeStudent.guardian_name,
      guardian_contact: activeStudent.guardian_contact,
      address: activeStudent.address,
    };
  }, [activeStudent, templateName]);

  return { previewData, activeStudent };
};

