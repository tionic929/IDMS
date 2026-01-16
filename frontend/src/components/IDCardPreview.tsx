import React from 'react';
import { type ApplicantCard } from '../types/card';
import FRONT_DEFAULT_BG from '../assets/ID/NEWFRONT.png';
import BACK_DEFAULT_BG from '../assets/ID/BACK.png';
import { BsSdCard } from 'react-icons/bs';

interface Props {
  data: ApplicantCard;
  layout: any;
  side: 'FRONT' | 'BACK';
  scale?: number;
}

const IDCardPreview: React.FC<Props> = ({ data, layout, side, scale = 1 }) => {
  const isFront = side === 'FRONT';
  
  const preRenderedImage = isFront 
    ? layout?.previewImages?.front 
    : layout?.previewImages?.back;

  if (preRenderedImage) {
    return (
      <div
        className="relative overflow-hidden rounded-xl bg-white shadow-2xl print-card"
        style={{ width: `${320 * scale}px`, height: `${500 * scale}px` }}
      >
        <img src={preRenderedImage} className="w-full h-full object-contain" alt="Final" />
      </div>
    );
  }

  const sideKey = side.toLowerCase();
  const currentLayout = layout?.[sideKey];
  if (!currentLayout) return null;

  const isTextLayer = (key: string) => {
    return !['photo', 'signature'].includes(key) && !key.startsWith('rect') && !key.startsWith('circle');
  };

  const renderField = (key: string, config: any) => {
    const isPhoto = key === 'photo';
    const isSig = key === 'signature';
    const isShape = key.startsWith('rect') || key.startsWith('circle');
    const isText = isTextLayer(key);

    const commonStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${config.y * scale}px`,
      left: `${config.x * scale}px`,
      width: config.width ? `${config.width * scale}px` : `${200 * scale}px`,
      height: config.height ? `${config.height * scale}px` : `${180 * scale}px`,
      transform: `rotate(${config.rotation || 0}deg)`,
      opacity: config.opacity ?? 1,
      transformOrigin: 'top left',
      display: 'flex',
    };

    if (isPhoto || isSig) {
      const imgSrc = isPhoto ? data.photo : data.signature;
      return (
        <div key={key} style={{ ...commonStyle, alignItems: 'center', justifyContent: 'center' }}>
          {imgSrc && <img src={imgSrc} className={`w-full h-full object-contain ${isSig ? 'mix-blend-multiply' : ''}`} alt={key} />}
        </div>
      );
    }

    if (isShape) {
      return <div key={key} style={{ ...commonStyle, backgroundColor: config.fill, borderRadius: config.type === 'circle' ? '50%' : '0' }} />;
    }

    if (isText) {
      // DEBUG: Log specific key rendering
      // console.log(`Rendering Key: ${key}`, { dataValue: (data as any)[key], address: data.address });

      // Logic to match Designer's previewData mapping
      const textMap: Record<string, any> = {
        fullName: data.fullName,
        idNumber: data.idNumber,
        course: data.course,
        guardian_name: data.guardian_name || (data as any).guardian_name,
        guardian_contact: data.guardian_contact,
        address: data.address || (data as any).address // Force check both
      };

      const displayValue = textMap[key] || (data as any)[key] || config.text;

      return (
        <div key={key} style={{ 
          ...commonStyle,
          width: config.width ? `${config.width * scale}px` : `${200 * scale}px`,
          height: 'auto' }}>
          <p 
            className="uppercase leading-tight text-left whitespace-nowrap" 
            style={{ 
              fontSize: `${(config.fontSize || 18) * scale}px`, 
              color: config.fill || '#1e293b',
              fontFamily: config.fontFamily || 'Arial',
              fontWeight: config.fontStyle === 'bold' || !config.fontStyle ? 'bold' : 'normal',
              fontStyle: config.fontStyle === 'italic' ? 'italic' : 'normal',
              wordBreak: 'break-word',
              whiteSpace: 'normal'
            }}
          >
            {displayValue}
          </p>
          {/* VISUAL DEBUG OVERLAY (Uncomment to see layer keys on the card) */}
          {/* <span style={{position: 'absolute', top: -10, fontSize: '8px', color: 'red'}}>{key}</span> */}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white shadow-2xl"
      style={{ width: `${320 * scale}px`, height: `${500 * scale}px` }}
    >
      {/* 1. FRONT UNDERLAY */}
      {isFront && Object.entries(currentLayout).map(([key, config]) => (key === 'photo' || key === 'signature') ? renderField(key, config) : null)}

      {/* 2. BACKGROUND */}
      <img 
        src={isFront ? FRONT_DEFAULT_BG : BACK_DEFAULT_BG} 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 20 }} 
        alt="BG" 
      />

      {/* 3. OVERLAY (Shapes, Text, Back Signature) */}
      <div className="absolute inset-0" style={{ zIndex: 30 }}>
        {Object.entries(currentLayout).map(([key, config]) => {
          if (!isFront) return renderField(key, config);
          if (isFront && !['photo', 'signature'].includes(key)) return renderField(key, config);
          return null;
        })}
      </div>

      {/* DEBUG: Data existence check */}
      {!data.address && (
        <div className="absolute top-0 left-0 bg-red-500 text-white text-[8px] z-[100] px-1">
          MISSING_ADDRESS_DATA
        </div>
      )}
    </div>
  );
};

export default IDCardPreview;