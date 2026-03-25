import React, { memo, useMemo } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import { type ApplicantCard } from '../types/card';
import { resolveTextLayout } from '../utils/designerUtils';

import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PRINT_WIDTH,
  PRINT_HEIGHT,
  SCALE_X,
  SCALE_Y,
  EXPORT_PIXEL_RATIO,
} from '../constants/dimensions';

const VITE_API_URL = import.meta.env.VITE_API_URL;

interface Props {
  data: ApplicantCard;
  layout: any;
  side: 'FRONT' | 'BACK';
  scale?: number;
  isPrinting?: boolean;
}

// ─── DynamicImage ─────────────────────────────────────────────────────────────
const DynamicImage = memo(({ src, common }: { src: string; common: any }) => {
  const [img] = useImage(src, 'anonymous');
  if (!img) return null;
  return <KonvaImage {...common} image={img} />;
});

// ─── IDCardPreview ────────────────────────────────────────────────────────────
const IDCardPreview = React.forwardRef<any, Props>(
  ({ data, layout, side, scale = 1, isPrinting = false }, ref) => {

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

    // ── Dimensions ─────────────────────────────────────────────────────
    // Preview: stage is DESIGN_WIDTH * scale, elements drawn at design units,
    //          Stage.scaleX/Y handles the zoom.
    // Print:   stage is PRINT_WIDTH/HEIGHT (physical pixels), elements are
    //          manually scaled by SCALE_X/Y to map design → print coords.
    const stageWidth = isPrinting ? PRINT_WIDTH : DESIGN_WIDTH * scale;
    const stageHeight = isPrinting ? PRINT_HEIGHT : DESIGN_HEIGHT * scale;
    const drawScaleX = isPrinting ? SCALE_X : 1;
    const drawScaleY = isPrinting ? SCALE_Y : 1;

    // ── Element renderer ───────────────────────────────────────────────
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

      const common = {
        key,
        x: scaledX,
        y: scaledY,
        width: scaledWidth,
        rotation: config.rotation || 0,
        opacity: config.opacity ?? 1,
      };

      // ── Photo ─────────────────────────────────────────────────────
      // Photo gets a white rect behind it so card background never bleeds
      // through transparent edges, and uses object-fit:cover scaling.
      if (isPhoto) {
        return (
          <Group key={key} x={scaledX} y={scaledY} width={scaledWidth} height={scaledHeight}
            rotation={config.rotation || 0} opacity={config.opacity ?? 1}>

            {/* White backing — ensures no card background bleeds through */}
            <Rect
              x={0} y={0}
              width={scaledWidth} height={scaledHeight}
              fill="white"
              cornerRadius={scaledRadius}
              listening={false}
            />

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
              {photoImage ? (
                <KonvaImage
                  image={photoImage}
                  width={scaledWidth}
                  height={scaledHeight}
                  // object-fit: cover — fills box without stretching
                  sceneFunc={(context) => {
                    const iw = photoImage.width;
                    const ih = photoImage.height;
                    const ratio = Math.max(scaledWidth / iw, scaledHeight / ih);
                    const w = iw * ratio;
                    const h = ih * ratio;
                    const x = (scaledWidth - w) / 2;
                    const y = (scaledHeight - h) / 2;
                    context.drawImage(photoImage, x, y, w, h);
                  }}
                />
              ) : (
                <Rect width={scaledWidth} height={scaledHeight} fill="#f1f5f9" />
              )}
            </Group>
          </Group>
        );
      }

      // ── Signature ─────────────────────────────────────────────────
      // Signatures are transparent PNGs that must overlay the card
      // background — NO white rect behind them. Uses object-fit: contain
      // so the full signature is visible without cropping.
      if (isSig) {
        return (
          <Group key={key} x={scaledX} y={scaledY} width={scaledWidth} height={scaledHeight}
            rotation={config.rotation || 0} opacity={config.opacity ?? 1}>
            {sigImage ? (
              <KonvaImage
                image={sigImage}
                width={scaledWidth}
                height={scaledHeight}
                // object-fit: contain — keeps full sig visible, transparent outside
                sceneFunc={(context) => {
                  const iw = sigImage.width;
                  const ih = sigImage.height;
                  const ratio = Math.min(scaledWidth / iw, scaledHeight / ih);
                  const w = iw * ratio;
                  const h = ih * ratio;
                  const x = (scaledWidth - w) / 2;
                  const y = (scaledHeight - h) / 2;
                  context.drawImage(sigImage, x, y, w, h);
                }}
              />
            ) : (
              // Placeholder: transparent, only shows dashed border in preview
              <Rect
                width={scaledWidth} height={scaledHeight}
                fill="transparent"
                stroke="#cbd5e1"
                strokeWidth={1}
                dash={[4, 4]}
              />
            )}
          </Group>
        );
      }

      // ── Custom image element ──────────────────────────────────────
      if (isCustomImage && config.src) {
        return (
          <DynamicImage
            key={key}
            src={config.src}
            common={{ ...common, height: scaledHeight }}
          />
        );
      }

      // ── Shape elements ────────────────────────────────────────────
      if (isShape) {
        if (config.type === 'circle') {
          return (
            <Circle {...common} height={scaledHeight}
              radius={scaledWidth / 2} fill={config.fill || '#00ffe1ff'} />
          );
        }
        return (
          <Rect {...common} height={scaledHeight}
            fill={config.fill || '#00ffe1ff'} cornerRadius={scaledRadius} />
        );
      }

      // ── Text elements ─────────────────────────────────────────────
      const textMap: Record<string, any> = {
        fullName: data.fullName,
        idNumber: data.idNumber,
        course: data.course || config.text,
        guardian_name: data.guardian_name,
        guardian_contact: data.guardian_contact,
        address: data.address,
      };

      const displayText = textMap[key] || (data as any)[key] || config.text || '';

      const configForLayout = isPrinting
        ? {
          ...config,
          width: scaledWidth,
          height: scaledHeight,
          fontSize: config.fontSize * drawScaleX,
        }
        : config;

      const resolved = resolveTextLayout(configForLayout, displayText);
      const textComponentHeight = config.fit === 'none' ? undefined : scaledHeight;

      return (
        <Text
          {...common}
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
          boxShadow: isPrinting ? 'none' : '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        }}
      >
        <Stage
          ref={ref}
          width={stageWidth}
          height={stageHeight}
          /*
           * Preview mode: let Stage handle zoom via scaleX/Y so all
           * design-unit coordinates stay consistent.
           * Print mode:   scale is 1 — elements are already in print
           *               pixel coords via drawScaleX/Y.
           */
          scaleX={isPrinting ? 1 : scale}
          scaleY={isPrinting ? 1 : scale}
          /*
           * FIX 3: pixelRatio only in print mode. In preview mode it
           * should always be 1 (screen density) — setting it to
           * EXPORT_PIXEL_RATIO in preview blows up the canvas size
           * and causes blurry scaling artefacts.
           */
          pixelRatio={isPrinting ? EXPORT_PIXEL_RATIO : 1}
        >
          <Layer imageSmoothingEnabled={true}>
            {/*
                         * FIX 4: White background rect MUST cover the full STAGE
                         * dimensions, not design dimensions. When isPrinting=true,
                         * stageWidth/Height = PRINT_WIDTH/HEIGHT. The old code used
                         * internalWidth/internalHeight (design dims) which left a
                         * gap and allowed PIL's black background to show through.
                         */}
            <Rect
              x={0} y={0}
              width={stageWidth}
              height={stageHeight}
              fill="white"
              listening={false}
            />

            {Object.entries(currentLayout).map(([key, config]) =>
              renderElement(key, config as any)
            )}
          </Layer>
        </Stage>
      </div>
    );
  }
);

export default memo(IDCardPreview);