import React from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import { type ApplicantCard } from '../types/card';
import { resolveTextLayout } from '../utils/designerUtils';

const VITE_API_URL = import.meta.env.VITE_API_URL;

// DESIGN DIMENSIONS (portrait orientation - your working canvas)
const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 500;

const PRINT_WIDTH = 640; 
const PRINT_HEIGHT = 1000; 

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
  return (
    <KonvaImage
      {...common}
      image={img}
    />
  );
};

const IDCardPreview: React.FC<Props> = ({ data, layout, side, scale = 1, isPrinting = false }) => {
  const isFront = side === 'FRONT';

  const getProxyUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('blob:')) return path;
    const storagePath = `${VITE_API_URL}/storage/`;
    let cleanPath = path;
    if (path.startsWith(storagePath)) {
      cleanPath = path.replace(storagePath, '');
    }
    return `${VITE_API_URL}/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
  };

  // const [bgImage] = useImage(isFront ? FRONT_DEFAULT_BG : BACK_DEFAULT_BG, 'anonymous');  
  const [photoImage] = useImage(getProxyUrl(data.photo), 'anonymous');
  const [sigImage] = useImage(getProxyUrl(data.signature), 'anonymous');

  const preRenderedImage = isFront ? layout?.previewImages?.front : layout?.previewImages?.back;
  const currentLayout = layout?.[side.toLowerCase()];

  // Use high-res dimensions for printing, design dimensions for preview
  const canvasWidth = isPrinting ? PRINT_WIDTH : DESIGN_WIDTH;
  const canvasHeight = isPrinting ? PRINT_HEIGHT : DESIGN_HEIGHT;
  
  // Calculate scale factor from design space to print space (BOTH PORTRAIT)
  const printScaleX = isPrinting ? (PRINT_WIDTH / DESIGN_WIDTH) : 1;   // 638/320 = 1.994
  const printScaleY = isPrinting ? (PRINT_HEIGHT / DESIGN_HEIGHT) : 1; // 1012/500 = 2.024

  if (preRenderedImage) {
    return (
      <div
        className="id-card-preview-container overflow-hidden"
        style={{ 
          width: isPrinting ? '100%' : `${DESIGN_WIDTH * scale}px`, 
          height: isPrinting ? '100%' : `${DESIGN_HEIGHT * scale}px`, 
          backgroundColor: 'transparent' 
        }}
      >
        <img src={preRenderedImage} className="w-full h-full object-contain" alt="Final Render" />
      </div>
    );
  }

  if (!currentLayout) return null;

  const renderElement = (key: string, config: any) => {
    const isPhoto = key === 'photo';
    const isSig = key === 'signature';
    const isAsset = isPhoto || isSig;
    const isCustomImage = key.startsWith('img_');
    const isShape = key.startsWith('rect') || key.startsWith('circle');

    // For printing: scale all coordinates proportionally (no rotation needed for portrait->portrait)
    const scaledX = config.x * printScaleX;
    const scaledY = config.y * printScaleY;
    const scaledWidth = (config.width || 200) * printScaleX;
    const scaledHeight = (config.height || 180) * printScaleY;
    
    const textComponentHeight = (config.fit === 'none') ? undefined : scaledHeight;

    const common = {
      key: key,
      x: scaledX,
      y: scaledY,
      width: scaledWidth,
      rotation: config.rotation || 0,
      opacity: config.opacity ?? 1,
    };

    if (isAsset) {
      const img = isPhoto ? photoImage : sigImage;
      return (
        <Group {...common} height={scaledHeight}>
          {img && (
            <KonvaImage
              image={img}
              width={scaledWidth}
              height={scaledHeight}
              sceneFunc={(context, shape) => {
                const nodeW = shape.width();
                const nodeH = shape.height();
                const ratio = Math.min(nodeW / img.width, nodeH / img.height);
                context.drawImage(
                  img,
                  (nodeW - img.width * ratio) / 2,
                  (nodeH - img.height * ratio) / 2,
                  img.width * ratio,
                  img.height * ratio
                );
              }}
            />
          )}
        </Group>
      );
    }

    if (isCustomImage && config.src) {
      return <DynamicImage key={key} src={config.src} common={{...common, height: scaledHeight}} />;
    }

    if (isShape) {
      if (config.type === 'circle') {
        return <Circle {...common} width={scaledWidth} height={scaledHeight} radius={scaledWidth / 2} fill={config.fill || '#00ffe1ff'} />;
      }
      return <Rect {...common} width={scaledWidth} height={scaledHeight} fill={config.fill || '#00ffe1ff'} />;
    }

    const textMap: Record<string, any> = {
      fullName: data.fullName,
      idNumber: data.idNumber,
      course: config.text || data.course,
      guardian_name: data.guardian_name,
      guardian_contact: data.guardian_contact,
      address: data.address
    };

    const displayText = textMap[key] || (data as any)[key] || config.text || "";
    
    // For print, recalculate font size at the scaled dimensions
    let fontSize: number;
    let wrap: 'none' | 'word';
    
    if (isPrinting) {
      // Recalculate layout at print scale
      const scaledConfig = {
        ...config,
        width: scaledWidth,
        height: scaledHeight,
        fontSize: config.fontSize * Math.max(printScaleX, printScaleY)
      };
      const resolved = resolveTextLayout(scaledConfig, displayText);
      fontSize = resolved.fontSize;
      wrap = resolved.wrap;
    } else {
      // Use normal resolution for preview
      const resolved = resolveTextLayout(config, displayText);
      fontSize = resolved.fontSize;
      wrap = resolved.wrap;
    }

    return (
      <Text
        {...common}
        height={textComponentHeight}
        text={displayText}
        fontSize={fontSize}
        fontFamily={config.fontFamily || 'Arial'}
        fontStyle={config.fontStyle || 'bold'}
        fill={config.fill || '#1e293b'}
        align={config.align || 'center'}
        verticalAlign="middle"
        wrap={wrap as any}
        ellipsis={config.overflow === 'ellipsis'}
      />
    );
  };

  return (
    <div
      className={`relative overflow-hidden ${isPrinting ? 'bg-white' : 'rounded-xl bg-white shadow-2xl'}`}
      style={{ 
        width: isPrinting ? '100%' : `${DESIGN_WIDTH * scale}px`, 
        height: isPrinting ? '100%' : `${DESIGN_HEIGHT * scale}px` 
      }}
    >
      <Stage 
        width={canvasWidth * scale} 
        height={canvasHeight * scale} 
        scaleX={scale} 
        scaleY={scale}
        style={{ display: 'block', width: '100%', height: '100%' }}
        pixelRatio={isPrinting ? 2 : 1}
      >
        <Layer>
          {/* Background image - scaled to fit print dimensions */}
          {/* {bgImage && (
            <KonvaImage 
              image={bgImage} 
              width={canvasWidth} 
              height={canvasHeight} 
              listening={false} 
            />
          )} */}

          {/* Render photo and signature first (behind other elements) */}
          {isFront && Object.entries(currentLayout).map(([key, config]) =>
            (key === 'photo' || key === 'signature') ? renderElement(key, config) : null
          )}

          {/* Render all other elements */}
          {Object.entries(currentLayout).map(([key, config]) => {
            const isAsset = ['photo', 'signature'].includes(key);
            if (!isFront) return renderElement(key, config);
            if (isFront && !isAsset) return renderElement(key, config);
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default IDCardPreview;