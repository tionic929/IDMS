import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../../../api/students';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const getProxyUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const cleanPath = path.replace(`${VITE_API_URL}/storage/`, '');
  return `${VITE_API_URL}/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
};

export const usePreviewData = (templateId: number | null, templateName: string) => {
  // Fetch only ONE student for preview
  const { data: activeStudent, isLoading } = useQuery({
    queryKey: ['preview-student'],
    queryFn: async () => {
      const res = await getStudents();
      const allStudents = [...(res.queueList || []), ...(res.history || [])];

      if (!allStudents?.length) return null;

      // Return most recently updated student
      return [...allStudents].sort((a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
      )[0];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!templateId, // Only fetch when template is selected
  });

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

  return { previewData, activeStudent, isLoading };
};