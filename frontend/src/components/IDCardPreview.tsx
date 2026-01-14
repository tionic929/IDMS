import React from 'react';
import { type ApplicantCard } from '../types/card';
import FRONT_DEFAULT_BG from '../assets/ID/NEWFRONT.png';
import BACK_DEFAULT_BG from '../assets/ID/BACK.png';

interface Props {
  data: ApplicantCard;
  layout: any;
  side: 'FRONT' | 'BACK';
  scale?: number;
}

const IDCardPreview: React.FC<Props> = ({ data, layout, side, scale = 1 }) => {
  const isFront = side === 'FRONT';
  
  // 1. Check for Pre-rendered PNG from Designer (Priority)
  const preRenderedImage = isFront 
    ? layout?.previewImages?.front 
    : layout?.previewImages?.back;

  if (preRenderedImage) {
    return (
      <div
        className="relative overflow-hidden rounded-xl bg-white shadow-2xl print-card"
        style={{
          width: `${320 * scale}px`,
          height: `${500 * scale}px`,
        }}
      >
        <img
          src={preRenderedImage}
          className="w-full h-full object-contain"
          alt={`${side} Card Final`}
        />
      </div>
    );
  }

  // 2. Manual Fallback (If PNG hasn't been generated yet)
  const currentLayout = isFront ? layout?.front : layout?.back;
  if (!currentLayout) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white shadow-2xl"
      style={{
        width: `${320 * scale}px`,
        height: `${500 * scale}px`,
      }}
    >
      <img 
        src={isFront ? FRONT_DEFAULT_BG : BACK_DEFAULT_BG} 
        className="absolute inset-0 w-full h-full z-0" 
        alt="Card Base" 
      />
      
      {isFront ? (
        <>
          {/* Photo Container */}
          <div 
            className="absolute z-10 overflow-hidden" 
            style={{ 
              top: `${currentLayout.photo.y * scale}px`, 
              left: `${currentLayout.photo.x * scale}px`, 
              width: `${(currentLayout.photo.width || 200) * scale}px`, 
              height: `${(currentLayout.photo.height || 180) * scale}px` 
            }}
          >
            {data.photo && (
              <img 
                src={data.photo} 
                className="w-full h-full object-cover" 
                alt="Student" 
              />
            )}
          </div>

          {/* Text Fields */}
          {['fullName', 'idNumber', 'course'].map((key) => {
            const field = currentLayout[key];
            if (!field) return null;
            return (
              <div 
                key={key} 
                className="absolute z-40" 
                style={{ 
                  top: `${field.y * scale}px`, 
                  left: `${field.x * scale}px`, 
                  width: `${field.width * scale}px` 
                }}
              >
                <p 
                  className="uppercase leading-none text-left font-bold" 
                  style={{ 
                    fontSize: `${(field.fontSize || 25) * scale}px`, 
                    color: '#1e293b' 
                  }}
                >
                  {(data as any)[key]}
                </p>
              </div>
            );
          })}
        </>
      ) : (
        <>
          {/* Signature Container */}
          <div 
            className="absolute z-40" 
            style={{ 
              top: `${currentLayout.signature.y * scale}px`, 
              left: `${currentLayout.signature.x * scale}px`, 
              width: `${(currentLayout.signature.width || 200) * scale}px`, 
              height: `${(currentLayout.signature.height || 180) * scale}px` 
            }}
          >
            {data.signature && (
              <img 
                src={data.signature} 
                className="w-full h-full object-contain mix-blend-multiply" 
                alt="Signature" 
              />
            )}
          </div>

          {/* Guardian Name Field */}
          <div 
            className="absolute z-40" 
            style={{ 
              top: `${currentLayout.guardian_name.y * scale}px`, 
              left: `${currentLayout.guardian_name.x * scale}px`, 
              width: `${currentLayout.guardian_name.width * scale}px` 
            }}
          >
            <p 
              className="text-[#1e293b] font-bold uppercase text-left leading-none" 
              style={{ 
                fontSize: `${(currentLayout.guardian_name.fontSize || 10) * scale}px` 
              }}
            >
              {data.guardianName}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default IDCardPreview;