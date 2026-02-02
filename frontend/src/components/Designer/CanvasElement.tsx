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
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
  anyItemSelected: boolean; 
}

const CanvasElement: React.FC<CanvasElementProps> = ({
  id, config, isSelected, zoom, previewText, image, anyItemSelected,
  onDragMove, onDragEnd, onSelect, onUpdate
}) => {
  
  const isPhoto = id === 'photo';
  const isSig = id === 'signature';
  const isCustomImage = id.startsWith('img') || config.type === 'image';
  // Standardized shape check
  const isShape = id.startsWith('rect') || id.startsWith('circle') || config.type === 'rect' || config.type === 'circle';
  
  const [customImage] = useImage(isCustomImage && !isPhoto && !isSig ? (config.src || '') : '', 'anonymous');
  const activeImage = (isPhoto || isSig) ? image : customImage;

  const calculateListening = () => {
    if (config.locked) return false;
    return true;
  };

  const selectionColor = '#6366f1'; 

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
    onDragMove: onDragMove,
    onDragEnd: onDragEnd,
  };

  // --- IMAGES & SHAPES (Standardized Group Logic) ---
  if (isPhoto || isSig || isCustomImage || isShape) {
    const w = config.width || 100; 
    const h = config.height || 100;

    return (
      <Group {...commonProps} width={w} height={h}>
        <Rect 
          name="Bounds" 
          width={w} 
          height={h} 
          stroke={selectionColor} 
          strokeWidth={1.5/zoom} 
          opacity={isSelected ? 1 : 0} 
          listening={false}
        />
        
        {/* Render Image logic */}
        {(isPhoto || isSig || isCustomImage) && activeImage && (
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

        {/* Render Shape logic */}
        {isShape && (
          config.type === 'circle' ? (
            <Circle 
              name="Shape"
              x={w / 2}
              y={h / 2}
              radius={w / 2}
              fill={config.fill || '#6366f1'}
            />
          ) : (
            <Rect 
              name="Shape"
              width={w}
              height={h}
              fill={config.fill || '#6366f1'}
              cornerRadius={config.radius || 0}
            />
          )
        )}
      </Group>
    );
  }

  // --- TEXT ---
  const finalStr = previewText || config.text || `${id}`;
  const { fontSize, wrap } = resolveTextLayout(config, finalStr);
  const boxWidth = config.width || 200;
  const boxHeight = (config.fit === 'none') ? undefined : (config.height || 40);

  return (
    <Group {...commonProps} width={boxWidth} height={boxHeight}>
      <Rect 
        name="Bounds" 
        width={boxWidth} 
        height={boxHeight || 20} 
        stroke={selectionColor} 
        strokeWidth={1/zoom} 
        dash={[4, 2]} 
        opacity={isSelected ? 0.8 : 0} 
        listening={false}
      />
      <Text 
        name="Text" 
        text={finalStr} 
        fontSize={fontSize} 
        width={boxWidth}
        height={boxHeight}
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