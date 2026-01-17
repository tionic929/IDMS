import React from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import { type ApplicantCard } from '../types/card';
import FRONT_DEFAULT_BG from '../assets/ID/NEWFRONT.png';
import BACK_DEFAULT_BG from '../assets/ID/BACK.png';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 500;

interface Props {
  data: ApplicantCard;
  layout: any;
  side: 'FRONT' | 'BACK';
  scale?: number;
}

const IDCardPreview: React.FC<Props> = ({ data, layout, side, scale = 1 }) => {
  const isFront = side === 'FRONT';

  // --- ENGINE HELPERS ---
  const calculateShrinkFontSize = (
    text: string,
    width: number,
    maxFontSize: number,
    maxLines: number = 1,
    fontFamily: string = 'Arial',
    fontStyle: string = 'normal'
  ): number => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return maxFontSize;

    let low = 1;
    let high = maxFontSize;
    let bestFit = low;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      ctx.font = `${fontStyle} ${mid}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      const estimatedLines = Math.ceil(metrics.width / (width - 4));

      if (estimatedLines <= maxLines) {
        bestFit = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return bestFit;
  };

  const resolveTextLayout = (config: any, text: string) => {
    const mode = config.fit || 'none';
    const baseSize = config.fontSize || 18;
    const width = config.width || 200;
    const maxLines = config.maxLines || 1;

    let resolvedFontSize = baseSize;
    let wrapString: "none" | "word" = "none";

    if (mode === 'shrink') {
      resolvedFontSize = calculateShrinkFontSize(text, width, baseSize, maxLines, config.fontFamily, config.fontStyle);
      wrapString = maxLines > 1 ? "word" : "none";
    } else if (mode === 'wrap') {
      wrapString = "word";
    } else if (mode === 'stretch') {
      resolvedFontSize = (config.height || 180) * 0.8;
    }

    return { fontSize: resolvedFontSize, wrap: wrapString };
  };

  // --- IMAGE PROXY LOGIC ---
// --- IMAGE PROXY LOGIC ---
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

  const [bgImage] = useImage(isFront ? FRONT_DEFAULT_BG : BACK_DEFAULT_BG, 'anonymous');  
  const [photoImage] = useImage(getProxyUrl(data.photo), 'anonymous');
  const [sigImage] = useImage(getProxyUrl(data.signature), 'anonymous');

  const preRenderedImage = isFront ? layout?.previewImages?.front : layout?.previewImages?.back;
  const currentLayout = layout?.[side.toLowerCase()];

  if (preRenderedImage) {
    return (
      <div
        className="relative overflow-hidden rounded-xl bg-white shadow-2xl print-card"
        style={{ width: `${DESIGN_WIDTH * scale}px`, height: `${DESIGN_HEIGHT * scale}px` }}
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
    const isShape = key.startsWith('rect') || key.startsWith('circle');

    const textMap: Record<string, any> = {
      fullName: data.fullName,
      idNumber: data.idNumber,
      course: config.text || data.course,
      guardian_name: data.guardian_name,
      guardian_contact: data.guardian_contact,
      address: data.address
    };

    const common = {
      key: key,
      x: config.x,
      y: config.y,
      width: config.width || 200,
      height: config.height || 180,
      rotation: config.rotation || 0,
      opacity: config.opacity ?? 1,
    };

    if (isAsset) {
      const img = isPhoto ? photoImage : sigImage;
      return (
        <Group {...common}>
          {img && (
            <KonvaImage
              image={img}
              width={common.width}
              height={common.height}
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

    if (isShape) {
      if (config.type === 'circle') {
        return <Circle {...common} radius={common.width / 2} fill={config.fill || '#00ffe1ff'} />;
      }
      return <Rect {...common} fill={config.fill || '#00ffe1ff'} />;
    }

    const displayText = textMap[key] || (data as any)[key] || config.text || "";
    const { fontSize, wrap } = resolveTextLayout(config, displayText);

    return (
      <Text
        {...common}
        text={displayText}
        fontSize={fontSize}
        fontFamily={config.fontFamily || 'Arial'}
        fontStyle={config.fontStyle || 'bold'}
        fill={config.fill || '#1e293b'}
        align={config.align || 'center'}
        verticalAlign="middle"
        wrap={wrap}
        ellipsis={config.overflow === 'ellipsis'}
      />
    );
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white shadow-2xl"
      style={{ width: `${DESIGN_WIDTH * scale}px`, height: `${DESIGN_HEIGHT * scale}px` }}
    >
      <Stage width={DESIGN_WIDTH * scale} height={DESIGN_HEIGHT * scale} scaleX={scale} scaleY={scale}>
        <Layer>
          {/* Layer 1: Front Assets Under the Background Template */}
          {isFront && Object.entries(currentLayout).map(([key, config]) =>
            (key === 'photo' || key === 'signature') ? renderElement(key, config) : null
          )}

          {/* Layer 2: The Physical Card Template (BG) */}
          <KonvaImage image={bgImage} width={DESIGN_WIDTH} height={DESIGN_HEIGHT} listening={false} />

          {/* Layer 3: Text, Shapes, and Back Assets Overlay */}
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