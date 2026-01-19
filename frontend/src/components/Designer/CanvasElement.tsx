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
}

const CanvasElement: React.FC<CanvasElementProps> = ({
  id, config, isSelected, zoom, previewText, image,
  onSelect, onUpdate, onTransform, onTransformEnd
}) => {
  
  const isPhoto = id === 'photo';
  const isSig = id === 'signature';
  const isShape = id.startsWith('rect') || id.startsWith('circle');
  const isCustomImage = config.type === 'image' && !isPhoto && !isSig;
  
  const [customImage] = useImage(isCustomImage ? (config.src || '') : '', 'anonymous');
  const activeImage = (isPhoto || isSig) ? image : customImage;

  // --- EDITOR REFINEMENTS ---
  // 1. "listening" determines if this layer catches clicks or lets them pass through
  // 2. Cursor logic provides visual feedback to the user
  const commonProps = {
    name: id,
    x: config.x,
    y: config.y,
    rotation: config.rotation || 0,
    opacity: config.opacity ?? 1,
    draggable: !config.locked, // Cannot drag if locked
    listening: !config.locked, // Clicks pass through if locked
    onClick: (e: any) => { 
      e.cancelBubble = true; 
      onSelect(id); 
    },
    onMouseEnter: (e: any) => {
      const stage = e.target.getStage();
      if (stage && !config.locked) stage.container().style.cursor = 'move';
    },
    onMouseLeave: (e: any) => {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'default';
    },
    onDragEnd: (e: any) => onUpdate(id, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) }),
    onTransform: (e: any) => onTransform(e, id, config),
    onTransformEnd: (e: any) => onTransformEnd(e, id, config)
  };

  // --- 1. RENDER PHOTO / SIG / CUSTOM IMAGES ---
  if (isPhoto || isSig || isCustomImage) {
    const w = config.width || 200;
    const h = config.height || 180;
    return (
      <Group {...commonProps} width={w} height={h}>
        <Rect 
          name="Bounds" 
          width={w} 
          height={h} 
          stroke={isPhoto ? "#14b8a6" : "#6366f1"} 
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
      <Rect 
        name="Bounds" 
        width={boxWidth} 
        height={boxHeight} 
        stroke="#14b8a6" 
        strokeWidth={1/zoom} 
        dash={[4,4]} 
        opacity={isSelected ? 0.6 : 0} 
      />
      <Text 
        name="Text" 
        x={0} 
        y={0} 
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