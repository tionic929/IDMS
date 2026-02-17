import React, { useState } from 'react';
import DesignerWorkspace from './DesignerWorkspace';

const CardDesignerPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [saveCount, setSaveCount] = useState<number>(0);

  return (
    <div className="h-full">
      <DesignerWorkspace 
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        saveCount={saveCount}
        setSaveCount={setSaveCount}
      />
    </div>
  );
};

export default CardDesignerPage;