import React, { memo, useMemo } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import { type ApplicantCard } from '../types/card';
import FRONT_DEFAULT_BG from '../assets/ID/NEWFRONT.png';
import BACK_DEFAULT_BG from '../assets/ID/BACK.png';
import { resolveTextLayout } from '../utils/designerUtils';

// Dimensions and Constants
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PRINT_WIDTH,
  PRINT_HEIGHT,
  SCALE_X,
  SCALE_Y,
  EXPORT_PIXEL_RATIO
} from '../constants/dimensions';

const VITE_API_URL = import.meta.env.VITE_API_URL;

interface Props {
  data: ApplicantCard;
  layout: any;
  side: 'FRONT' | 'BACK';
  scale?: number;
  isPrinting?: boolean;
}

const DynamicImage = memo(({ src, common }: { src: string; common: any }) => {
  const [img] = useImage(src, 'anonymous');
  if (!img) return null;
  return <KonvaImage {...common} image={img} />;
});

const IDCardPreview: React.FC<Props> = ({ data, layout, side, scale = 1, isPrinting = false }) => {
  const isFront = side === 'FRONT';

  // Improved URL generation: Ensure we get a valid path for the proxy
  const getProxyUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('blob:')) return path;
    const storagePath = `${VITE_API_URL}/storage/`;
    let cleanPath = path;
    if (path.startsWith(storagePath)) cleanPath = path.replace(storagePath, '');
    return `${VITE_API_URL}/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
  };

  const [photoImage] = useImage(getProxyUrl(data.photo), 'anonymous');
  const [sigImage] = useImage(getProxyUrl(data.signature), 'anonymous');

  const currentLayout = layout?.[side.toLowerCase()];
  if (!currentLayout) return null;

  const internalWidth = DESIGN_WIDTH;
  const internalHeight = DESIGN_HEIGHT;

  // When printing, we always use the target PRINT dimensions
  // When previewing, we scale the DESIGN dimensions by the 'scale' prop
  const stageWidth = isPrinting ? PRINT_WIDTH : internalWidth * scale;
  const stageHeight = isPrinting ? PRINT_HEIGHT : internalHeight * scale;

  // IMPORTANT: For printing, we use the SCALE_X/Y constants to map Design units to Print units
  // For previewing, we stay in Design units (scale 1:1) and let Stage handle the CSS scale
  const drawScaleX = isPrinting ? SCALE_X : 1;
  const drawScaleY = isPrinting ? SCALE_Y : 1;

  const renderElement = (key: string, config: any) => {
    const isPhoto = key === 'photo';
    const isSig = key === 'signature';
    const isAsset = isPhoto || isSig;
    const isCustomImage = key.startsWith('img_');
    const isShape = key.startsWith('rect') || key.startsWith('circle');

    const scaledX = config.x * drawScaleX;
    const scaledY = config.y * drawScaleY;
    const scaledWidth = (config.width || 200) * drawScaleX;
    const scaledHeight = (config.height || 180) * drawScaleY;
    const scaledRadius = (config.radius || 0) * Math.min(drawScaleX, drawScaleY);

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
        <Group {...common} height={scaledHeight} key={key}>
          <Group
            clipFunc={(ctx) => {
              ctx.beginPath();
              if (scaledRadius > 0 && (ctx as any).roundRect) {
                (ctx as any).roundRect(0, 0, scaledWidth, scaledHeight, scaledRadius);
              } else {
                ctx.rect(0, 0, scaledWidth, scaledHeight);
              }
              ctx.closePath();
            }}
          >
            {img ? (
              <KonvaImage
                image={img}
                width={scaledWidth}
                height={scaledHeight}
                sceneFunc={(context, shape) => {
                  const ratio = Math.min(scaledWidth / img.width, scaledHeight / img.height);
                  const w = img.width * ratio;
                  const h = img.height * ratio;
                  const x = (scaledWidth - w) / 2;
                  const y = (scaledHeight - h) / 2;
                  context.drawImage(img, x, y, w, h);
                }}
              />
            ) : (
              <Rect width={scaledWidth} height={scaledHeight} fill="#f1f5f9" />
            )}
          </Group>
        </Group>
      );
    }

    if (isCustomImage && config.src) {
      return <DynamicImage key={key} src={config.src} common={{ ...common, height: scaledHeight }} />;
    }

    if (isShape) {
      if (config.type === 'circle') {
        return <Circle {...common} height={scaledHeight} radius={scaledWidth / 2} fill={config.fill || '#00ffe1ff'} key={key} />;
      }
      return <Rect {...common} height={scaledHeight} fill={config.fill || '#00ffe1ff'} cornerRadius={scaledRadius} key={key} />;
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

    const configForLayout = isPrinting
      ? { ...config, width: scaledWidth, height: scaledHeight, fontSize: config.fontSize * drawScaleX }
      : config;

    const resolved = resolveTextLayout(configForLayout, displayText);

    return (
      <Text
        {...common}
        key={key}
        height={textComponentHeight}
        text={displayText}
        fontSize={resolved.fontSize}
        fontFamily={config.fontFamily || 'Arial'}
        fontStyle={config.fontStyle || 'bold'}
        fill={config.fill || '#1e293b'}
        align={config.align || 'center'}
        verticalAlign="middle"
        wrap={resolved.wrap as any}
        ellipsis={config.overflow === 'ellipsis'}
      />
    );
  };

  return (
    <div
      style={{
        width: `${stageWidth}px`,
        height: `${stageHeight}px`,
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: isPrinting ? '0' : '12px',
        overflow: 'hidden',
        boxShadow: isPrinting ? 'none' : '0 10px 15px -3px rgb(0 0 0 / 0.1)'
      }}
    >
      <Stage
        width={stageWidth}
        height={stageHeight}
        scaleX={isPrinting ? 1 : scale}
        scaleY={isPrinting ? 1 : scale}
        pixelRatio={isPrinting ? EXPORT_PIXEL_RATIO : 1}
      >
        <Layer>
          {/* Ensure a solid white background for printing (prevents transparency being turned black by PIL) */}
          <Rect width={internalWidth} height={internalHeight} fill="white" />
          {Object.entries(currentLayout).map(([key, config]) => renderElement(key, config))}
        </Layer>
      </Stage>
    </div>
  );
};

export default memo(IDCardPreview);