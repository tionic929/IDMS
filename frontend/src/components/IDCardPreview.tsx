import React, { useMemo } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import { type ApplicantCard } from '../types/card';
import { resolveTextLayout } from '../utils/designerUtils';

// 1. DEFINE YOUR EXACT RATIOS
const DESIGN_WIDTH = 317;
const DESIGN_HEIGHT = 500;

// Standard CR80 Card @ 300 DPI usually requires approx 1011-1032px height
const PRINT_WIDTH = 654; 
const PRINT_HEIGHT = 1032; 

interface Props {
  data: ApplicantCard;
  layout: any;
  side: 'FRONT' | 'BACK';
  scale?: number;
  isPrinting?: boolean;
}

const DynamicImage = ({ src, common }: { src: string; common: any }) => {
  const [img] = useImage(src, 'anonymous');
  if (!img) return null;
  return <KonvaImage {...common} image={img} />;
};

const IDCardPreview: React.FC<Props> = ({ data, layout, side, scale = 1, isPrinting = false }) => {
  const isFront = side === 'FRONT';
  
  // 2. CALCULATE THE SCALE FACTOR
  // If we are printing, we must scale the 320px coordinates UP to fit 654px
  // If we are just previewing, we use the passed 'scale' prop (usually 1 or 0.6)
  const renderScale = isPrinting ? (PRINT_WIDTH / DESIGN_WIDTH) : scale;
  
  // The Stage dimensions depend on mode
  const stageWidth = isPrinting ? PRINT_WIDTH : DESIGN_WIDTH * scale;
  const stageHeight = isPrinting ? PRINT_HEIGHT : DESIGN_HEIGHT * scale;

  // 3. THIS IS THE KEY FIX
  // When printing, we tell Konva to "zoom in" on the group layer
  // effectively converting x=10 to x=20.4 automatically.
  const contentScale = isPrinting ? (PRINT_WIDTH / DESIGN_WIDTH) : scale;

  const getProxyUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}/storage/${path}`;
  };

  const currentLayout = isFront ? layout?.front : layout?.back;
  if (!currentLayout) return <div className="bg-red-100 w-full h-full flex items-center justify-center text-xs text-red-500">No Layout</div>;

  const renderElement = (key: string, config: any) => {
    // ... (This logic remains exactly the same as your original file)
    // ...
    // Note: I will copy the logic here for completeness, but the logic inside 
    // doesn't need to change because the <Group> below handles the math.
    
    const commonProps = {
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
      rotation: config.rotation || 0,
      opacity: config.opacity ?? 1,
      id: key,
    };

    if (key === 'photo') {
      const photoUrl = getProxyUrl(data.photo);
      return (
        <Group key={key} x={config.x} y={config.y} width={config.width} height={config.height} rotation={config.rotation || 0}>
           {/* Clip Group for Photo */}
           <Rect width={config.width} height={config.height} cornerRadius={config.radius || 0} />
           <Group clipFunc={(ctx) => {
              ctx.beginPath();
              // @ts-ignore
              ctx.roundRect(0, 0, config.width, config.height, config.radius || 0);
              ctx.closePath();
           }}>
             {photoUrl ? <DynamicImage src={photoUrl} common={{ width: config.width, height: config.height }} /> : <Rect width={config.width} height={config.height} fill="#e4e4e7" />}
           </Group>
           {config.borderWidth > 0 && (
             <Rect width={config.width} height={config.height} stroke={config.borderColor} strokeWidth={config.borderWidth} cornerRadius={config.radius || 0} listening={false} />
           )}
        </Group>
      );
    }
    
    // ... (Repeat for signature, text, images, rects as per your original file)
    if (key === 'signature') {
       const sigUrl = getProxyUrl(data.signature);
       return sigUrl ? <DynamicImage key={key} src={sigUrl} common={commonProps} /> : null;
    }

    if (key.startsWith('text')) {
      const txt = resolveTextLayout(config.content, data);
      return (
        <Text
          key={key}
          {...commonProps}
          text={txt}
          fontSize={config.fontSize}
          fontFamily={config.fontFamily}
          fill={config.fill}
          fontStyle={config.fontStyle}
          align={config.align}
          verticalAlign={config.verticalAlign || 'middle'}
        />
      );
    }

    if (key.startsWith('img')) {
       return <DynamicImage key={key} src={getProxyUrl(config.src)} common={commonProps} />;
    }

    if (key.startsWith('rect')) {
      return <Rect key={key} {...commonProps} fill={config.fill} cornerRadius={config.radius} stroke={config.stroke} strokeWidth={config.strokeWidth} />;
    }
    
    return null;
  };

  return (
    <div 
      className={`relative overflow-hidden ${!isPrinting ? 'bg-white shadow-sm' : 'bg-white'}`}
      style={{ 
        width: stageWidth,
        height: stageHeight
      }}
    >
      <Stage 
        width={stageWidth} 
        height={stageHeight}
        // NOTE: We do NOT use scaleX/scaleY on the Stage itself for printing
        // because it sometimes messes up high-DPI exports. 
        // We scale the Group inside instead.
      >
        <Layer>
            {/* 4. BACKGROUND IMAGE HANDLING */}
            {/* We scale the BG manually to fill the stage */}
            {/* Assuming layout.previewImages exists from your earlier code */}
            {layout.previewImages?.[isFront ? 'front' : 'back'] && (
                <DynamicImage 
                    src={getProxyUrl(layout.previewImages[isFront ? 'front' : 'back'])}
                    common={{
                        x: 0,
                        y: 0,
                        width: stageWidth,   // Force fill width
                        height: stageHeight, // Force fill height
                        listening: false
                    }}
                />
            )}

            {/* 5. CONTENT GROUP */}
            {/* This Group takes the 320x500 coordinates and multiplies them to fit 654x1032 */}
            <Group 
                scaleX={isPrinting ? (PRINT_WIDTH / DESIGN_WIDTH) : scale}
                scaleY={isPrinting ? (PRINT_HEIGHT / DESIGN_HEIGHT) : scale}
            >
                {/* Render Assets (Photo/Sig) First */}
                {Object.entries(currentLayout).map(([key, config]) =>
                    (key === 'photo' || key === 'signature') ? renderElement(key, config) : null
                )}

                {/* Render Rest */}
                {Object.entries(currentLayout).map(([key, config]) => {
                    const isAsset = ['photo', 'signature'].includes(key);
                    if (!isAsset) return renderElement(key, config);
                    return null;
                })}
            </Group>
        </Layer>
      </Stage>
    </div>
  );
};

export default IDCardPreview;