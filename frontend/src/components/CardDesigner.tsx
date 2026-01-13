import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import FrontTemplate from '../assets/ID/FRONT.png';
import BackTemplate from '../assets/ID/BACK.png';
import { toast } from 'react-toastify';

import { saveLayout } from '../api/card';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 632;

const CardDesigner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [side, setSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [layouts, setLayouts] = useState<{ FRONT: any; BACK: any }>({ FRONT: null, BACK: null });

  useEffect(() => {
    if (!canvasRef.current) return;
    const fc = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
    });
    setCanvas(fc);
    return () => { fc.dispose(); };
  }, []);

  useEffect(() => {
    if (!canvas) return;
    const renderSide = async () => {
      canvas.clear();
      const bgImageSource = side === 'FRONT' ? FrontTemplate : BackTemplate;

      try {
        const img = await fabric.Image.fromURL(bgImageSource);
        img.set({
          scaleX: CANVAS_WIDTH / img.width!,
          scaleY: CANVAS_HEIGHT / img.height!,
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top',
        });
        canvas.backgroundImage = img;

        if (layouts[side]) {
          // IMPORTANT: We load the JSON but Fabric will treat it as standard objects
          await canvas.loadFromJSON(layouts[side]);
        }
        canvas.renderAll();
      } catch (error) { console.error("Template Error:", error); }
    };
    renderSide();
  }, [side, canvas]);

  // CardExchange Logic: Creating the Mapping Tag
// Inside CardDesigner.tsx - Update these specific functions

  const addSmartField = (label: string, dbField: string, isImage = false) => {
    if (!canvas) return;
    
    let obj: fabric.Object;
    if (isImage) {
      // Placeholder for Photo/Signature
      obj = new fabric.Rect({
        width: 120, height: 140,
        fill: 'rgba(20, 184, 166, 0.2)', // Teal tint
        stroke: '#14b8a6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        left: 100, top: 100,
      });
    } else {
      // Variable placeholder
      obj = new fabric.IText(`{${label}}`, {
        left: 100, top: 250,
        fontSize: 20,
        fontFamily: 'Inter, Arial',
        fontWeight: 'bold',
        fill: '#1e293b',
      });
    }

    // KEY: Attach the metadata
    obj.set('dbField', dbField);
    
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const saveMasterLayout = async () => {
    if (!canvas) return;

    // System Check: Ensure key fields exist before saving
    const currentJSON = canvas.toJSON(['dbField']);
    const hasID = currentJSON.objects.some((o: any) => o.dbField === 'id_number');
    
    if (!hasID && side === 'FRONT') {
      toast.error("Critical Error: Layout is missing ID Number binding!");
      return;
    }

    try {
      const finalFront = side === 'FRONT' ? currentJSON : (layouts.FRONT || { objects: [] });
      const finalBack = side === 'BACK' ? currentJSON : (layouts.BACK || { objects: [] });

      await saveLayout.saveMasterLayout('FRONT', finalFront);
      await saveLayout.saveMasterLayout('BACK', finalBack);
      
      toast.success("Card Template Synced Successfully");
    } catch (err) { 
      toast.error("Database connection failed."); 
    }
  };

  const handleSideChange = (newSide: 'FRONT' | 'BACK') => {
    if (!canvas || side === newSide) return;
    // Exporting with dbField property included
    const currentJSON = canvas.toJSON(['dbField']);
    setLayouts(prev => ({ ...prev, [side]: currentJSON }));
    setSide(newSide);
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.title}>ID Designer (SVG Mode)</h2>
        
        <div style={styles.toggleRow}>
          <button onClick={() => handleSideChange('FRONT')} style={side === 'FRONT' ? styles.activeTab : styles.inactiveTab}>Front</button>
          <button onClick={() => handleSideChange('BACK')} style={side === 'BACK' ? styles.activeTab : styles.inactiveTab}>Back</button>
        </div>

        <div style={styles.section}>
          <p style={styles.label}>TEXT BINDINGS</p>
          <button style={styles.btn} onClick={() => addSmartField('Name', 'full_name')}>+ Full Name</button>
          <button style={styles.btn} onClick={() => addSmartField('ID No', 'id_number')}>+ ID Number</button>
          <button style={styles.btn} onClick={() => addSmartField('Course', 'course')}>+ Course</button>
        </div>

        <div style={styles.section}>
          <p style={styles.label}>IMAGE BINDINGS</p>
          <button style={styles.btn} onClick={() => addSmartField('Photo', 'id_picture', true)}>+ Student Photo</button>
          <button style={styles.btn} onClick={() => addSmartField('Sign', 'signature_picture', true)}>+ Signature</button>
        </div>

        <button onClick={saveMasterLayout} style={styles.saveBtn}>SAVE SVG CONFIG</button>
      </div>

      <div style={styles.workspace}>
        <div style={styles.canvasWrapper}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', background: '#f1f5f9' },
  sidebar: { width: '280px', background: '#fff', padding: '20px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' as const },
  title: { fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' },
  toggleRow: { display: 'flex', gap: '5px', marginBottom: '20px' },
  activeTab: { flex: 1, padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  inactiveTab: { flex: 1, padding: '10px', background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  section: { marginBottom: '15px' },
  label: { fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' },
  btn: { width: '100%', padding: '10px', textAlign: 'left' as const, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '5px', cursor: 'pointer' },
  saveBtn: { marginTop: 'auto', padding: '15px', background: '#0f172a', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  workspace: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  canvasWrapper: { boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#fff', borderRadius: '4px', overflow: 'hidden' }
};

export default CardDesigner;