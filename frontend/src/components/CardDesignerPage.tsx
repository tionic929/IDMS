import React, { useState, useEffect } from 'react';
import DesignerWorkspace from '../components/DesignerWorkspace';
import { getStudents } from '../api/students';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import type { Students } from '../types/students';

import { useStudents } from '../context/StudentContext';

const CardDesignerPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [saveCount, setSaveCount] = useState<number>(0);
  const { allStudents, loading } = useStudents();

  if (loading && allStudents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
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