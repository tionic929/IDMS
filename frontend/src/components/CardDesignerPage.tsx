import React, { useState, useEffect } from 'react';
import DesignerWorkspace from '../components/DesignerWorkspace';
import { getStudents } from '../api/students';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import type { Students } from '../types/students';

const CardDesignerPage: React.FC = () => {
  console.log("DEBUG: CardDesignerPage MOUNTED"); // This confirms the page is active

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [saveCount, setSaveCount] = useState<number>(0);
  const [allStudents, setAllStudents] = useState<Students[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDesignerData = async () => {
      try {
        console.log("DEBUG: Starting API call to getStudents...");
        setLoading(true);
        const studentRes = await getStudents();
        
        console.log("DEBUG: API Response Received:", studentRes);
        
        // Combine data - Check if these properties exist in your API response!
        const combined = [
          ...(studentRes.queueList || []), 
          ...(studentRes.history || [])
        ];
        
        console.log(`DEBUG: Total students combined for preview: ${combined.length}`);
        if (combined.length > 0) {
            console.log("DEBUG: Sample student from API:", combined[0]);
        }
        
        setAllStudents(combined);
      } catch (error) {
        console.error("DEBUG: Designer Load Error:", error);
        toast.error("Failed to load student records for preview");
      } finally {
        setLoading(false);
      }
    };

    loadDesignerData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-teal-500 mb-4" size={40} />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Initializing...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <DesignerWorkspace 
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        saveCount={saveCount}
        setSaveCount={setSaveCount}
        allStudents={allStudents}
      />
    </div>
  );
};

export default CardDesignerPage;