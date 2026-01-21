import React from 'react';
import useImage from 'use-image';
import { Group, Rect, Text, Image as KonvaImage, Circle } from 'react-konva';
import { type LayoutItemSchema } from '../../types/designer';
import { resolveTextLayout } from '../../utils/designerUtils';

interface CanvasElementProps {
  id: string;
  config: LayoutItemSchema;
  isSelected: boolean;
  zoom: number;
  previewText?: string;
  image?: HTMLImageElement;
  onSelect: (id: string) => void;
  onUpdate: (id: string, attrs: any) => void;
  onTransform: (e: any, id: string, config: LayoutItemSchema) => void;
  onTransformEnd: (e: any, id: string, config: LayoutItemSchema) => void;
  anyItemSelected: boolean; 
}

const CanvasElement: React.FC<CanvasElementProps> = ({
  id, config, isSelected, zoom, previewText, image, anyItemSelected,
  onSelect, onUpdate, onTransform, onTransformEnd
}) => {
  
  const isPhoto = id === 'photo';
  const isSig = id === 'signature';
  const isCustomImage = id.startsWith('img') || config.type === 'image';
  const isShape = id.startsWith('rect') || id.startsWith('circle');
  
  // Load Base64 if it's a custom upload
  const [customImage] = useImage(isCustomImage && !isPhoto && !isSig ? (config.src || '') : '', 'anonymous');
  const activeImage = (isPhoto || isSig) ? image : customImage;

  const calculateListening = () => {
    if (config.locked) return false;
    if (anyItemSelected) return isSelected;
    return true;
  };

  const commonProps = {
    name: id,
    x: config.x,
    y: config.y,
    rotation: config.rotation || 0,
    opacity: config.opacity ?? 1,
    draggable: isSelected && !config.locked, 
    listening: calculateListening(), 
    onClick: (e: any) => { e.cancelBubble = true; onSelect(id); },
    onTap: (e: any) => { e.cancelBubble = true; onSelect(id); },
    onDragEnd: (e: any) => onUpdate(id, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) }),
    onTransform: (e: any) => onTransform(e, id, config),
    onTransformEnd: (e: any) => onTransformEnd(e, id, config)
  };

  // --- 1. RENDER IMAGES (Photo / Sig / Uploads) ---
  if (isPhoto || isSig || isCustomImage) {
    // Default width 200, height 180 as per instructions
    const w = config.width || 200; 
    const h = config.height || 180;

    return (
      <Group {...commonProps} width={w} height={h}>
        <Rect 
          name="Bounds" 
          width={w} 
          height={h} 
          stroke="#14b8a6" 
          strokeWidth={2/zoom} 
          dash={[5,5]} 
          opacity={isSelected ? 1 : 0} 
        />
        {activeImage && (
          <KonvaImage 
            name="Image" 
            image={activeImage} 
            width={w} 
            height={h} 
            sceneFunc={(context, shape) => {
              const nodeW = shape.width();
              const nodeH = shape.height();
              const ratio = Math.min(nodeW / activeImage.width, nodeH / activeImage.height);
              const x = (nodeW - activeImage.width * ratio) / 2;
              const y = (nodeH - activeImage.height * ratio) / 2;
              context.drawImage(activeImage, x, y, activeImage.width * ratio, activeImage.height * ratio);
            }}
          />
        )}
      </Group>
    );
  }

  // --- 2. RENDER SHAPES ---
  if (isShape) {
    const w = config.width || 200;
    const h = config.height || 180;
    if (config.type === 'circle') return <Circle {...commonProps} width={w} height={h} radius={w / 2} fill={config.fill} />;
    return <Rect {...commonProps} width={w} height={h} fill={config.fill} />;
  }

  // --- 3. RENDER TEXT ---
  const finalStr = previewText || config.text || `LABEL: ${id}`;
  const { fontSize, wrap } = resolveTextLayout(config, finalStr);
  const boxWidth = config.width || 200;
  const boxHeight = (config.fit === 'none') ? undefined : (config.height || 40);

  return (
    <Group {...commonProps} width={boxWidth} height={boxHeight}>
      <Rect name="Bounds" width={boxWidth} height={boxHeight} stroke="#14b8a6" strokeWidth={1/zoom} dash={[4,4]} opacity={isSelected ? 0.6 : 0} />
      <Text 
        name="Text" 
        text={finalStr} 
        fontSize={fontSize} 
        width={boxWidth}
        height={config.fit === 'none' ? undefined : boxHeight}
        fontFamily={config.fontFamily || 'Arial'} 
        fontStyle={config.fontStyle || 'bold'}
        fill={config.fill || '#1e293b'} 
        align={config.align || 'center'}
        verticalAlign="middle" 
        wrap={wrap} 
        ellipsis={config.overflow === 'ellipsis'} 
      />
    </Group>
  );
};

export default CanvasElement;