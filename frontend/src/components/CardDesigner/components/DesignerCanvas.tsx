
﻿import React, { useRef, useEffect, useState, useCallback } from 'react';

import { Stage, Layer, Line, Transformer, Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';
import { Grid3X3, Maximize, Magnet, Focus, Ruler } from 'lucide-react';

import { useDesignerContext } from '../context/DesignerContext';
import { useCanvasContext } from '../context/CanvasContext';
import { useLayerContext } from '../context/LayerContext';

import { useSnapping } from '../hooks/useSnapping';


import { useCanvasTransform } from '../hooks/useCanvasTransform';

import { RulerHorizontal, RulerVertical } from './CanvasRulers';
import CanvasElement from '../../../components/Designer/CanvasElement';
import { getEnabledAnchors } from '../../../utils/designerUtils';

import FRONT_BG_SRC from '../../../assets/ID/NEWFRONT.png';
import BACK_BG_SRC from '../../../assets/ID/BACK.png';
import { DESIGN_WIDTH, DESIGN_HEIGHT, MIN_ZOOM, MAX_ZOOM } from '../../../constants/dimensions';


export const DesignerCanvas: React.FC<{ stageRef: React.RefObject<any> }> = ({ stageRef }) => {
  const { editSide, currentSideData, templateId, templateName, updateItem, previewData } = useDesignerContext();
  const {
    zoom, setZoom,
    showGrid,
    snapEnabled,
    snapMode,
    gridUnit,
    showSnapGuides, snapLines, setSnapLines

  } = useCanvasContext();
  const { selectedId, setSelectedId } = useLayerContext();

  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isPanning, setIsPanning] = useState(false);

  const [frontBg] = useImage(FRONT_BG_SRC);
  const [backBg] = useImage(BACK_BG_SRC);
  const activeBg = editSide === 'FRONT' ? frontBg : backBg;




  const [photoImage] = useImage(previewData?.photo || '', 'anonymous');
  const [sigImage] = useImage(previewData?.signature || '', 'anonymous');

  const { handleDragMove } = useSnapping(layerRef);
  useCanvasTransform(trRef, layerRef);

  // Recenter Logic
  const handleRecenter = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollWidth = container.scrollWidth;
    const scrollHeight = container.scrollHeight;
    const clientWidth = container.clientWidth;
    const clientHeight = container.clientHeight;

    container.scrollTo({
      left: (scrollWidth - clientWidth) / 2,
      top: (scrollHeight - clientHeight) / 2,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(handleRecenter, 100);
    return () => clearTimeout(timer);
  }, [handleRecenter, editSide]);

  // CTRL + WHEEL Zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
      }
    };
    const container = scrollContainerRef.current;
    if (container) container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container?.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  // Nudge & Spacebar Pan Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') {
        if (!isPanning) setIsPanning(true);
        e.preventDefault();
      }
      if (selectedId && currentSideData?.[selectedId]) {
        const moveAmount = e.shiftKey ? 10 : 1;
        const item = currentSideData[selectedId];
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();

          updateItem(selectedId, {

            x: item.x + (e.key === 'ArrowLeft' ? -moveAmount : e.key === 'ArrowRight' ? moveAmount : 0),
            y: item.y + (e.key === 'ArrowUp' ? -moveAmount : e.key === 'ArrowDown' ? moveAmount : 0)
          });
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setIsPanning(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedId, currentSideData, isPanning, updateItem]);


  // Event listener for external re-center requests
  useEffect(() => {
    const listener = () => handleRecenter();
    window.addEventListener('recenter-canvas', listener);
    return () => window.removeEventListener('recenter-canvas', listener);
  }, [handleRecenter]);


  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (isPanning || e.button === 1) {
      e.preventDefault();
      const container = scrollContainerRef.current;
      if (!container) return;
      const startX = e.pageX + container.scrollLeft;
      const startY = e.pageY + container.scrollTop;
      const onMouseMove = (moveEvent: MouseEvent) => {
        container.scrollLeft = startX - moveEvent.pageX;
        container.scrollTop = startY - moveEvent.pageY;
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  useEffect(() => {
    if (!stageRef.current || !trRef.current) return;
    const selectedNode = stageRef.current.findOne('.' + selectedId);
    trRef.current.nodes(selectedNode ? [selectedNode] : []);
  }, [selectedId, editSide, stageRef]);


  return (
    <div className="flex-1 relative bg-slate-100 flex flex-col overflow-hidden">


      <div className="flex-1 flex relative overflow-hidden">
        <RulerVertical zoom={zoom} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <RulerHorizontal zoom={zoom} />


          <div
            ref={scrollContainerRef}
            onMouseDown={handleContainerMouseDown}
            className={`flex-1 overflow-auto bg-slate-50 relative scrollbar-hide ${isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
          >
            <div
              className="flex items-center justify-center min-w-full min-h-full"
              style={{ padding: '2000px' }}
            >
              <div
                className="bg-white relative shrink-0 z-0 shadow-2xl shadow-slate-200 transition-shadow hover:shadow-slate-300"
                style={{
                  width: DESIGN_WIDTH * zoom,

                  height: DESIGN_HEIGHT * zoom,
                  pointerEvents: isPanning ? 'none' : 'auto'
                }}
              >

                {/* Dot Grid */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.2] z-10"
                    style={{
                      backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,

                      backgroundSize: `${20 * zoom}px ${20 * zoom}px`
                    }}
                  />
                )}

                <Stage
                  ref={stageRef}
                  width={DESIGN_WIDTH * zoom}
                  height={DESIGN_HEIGHT * zoom}
                  scaleX={zoom}
                  scaleY={zoom}
                  onMouseDown={(e) => {
                    if (e.target === e.target.getStage()) setSelectedId(null);
                  }}
                >
                  <Layer ref={layerRef}>
                    {activeBg && (
                      <Rect
                        name="background"
                        fill="white"
                        width={DESIGN_WIDTH}
                        height={DESIGN_HEIGHT}
                        listening={false}
                      />
                    )}

                    {currentSideData && Object.entries(currentSideData).map(([key, config]: any) =>
                      config.visible !== false ? (
                        <CanvasElement
                          key={key}
                          id={key}
                          config={config}
                          isSelected={selectedId === key}
                          zoom={zoom}
                          image={key === 'photo' ? photoImage : key === 'signature' ? sigImage : undefined}
                          previewText={(previewData as any)?.[key] || (key === 'course' ? templateName : undefined)}
                          onSelect={setSelectedId}
                          onUpdate={updateItem}
                          onDragMove={handleDragMove}
                          onDragEnd={(e) => {
                            updateItem(key, {
                              x: Math.round(e.target.x()),
                              y: Math.round(e.target.y())
                            });
                            setSnapLines({ vertical: [], horizontal: [] });
                          }}
                          anyItemSelected={!!selectedId}
                        />
                      ) : null
                    )}

                    {snapEnabled && showSnapGuides && (
                      <>
                        {snapLines.vertical.map((v, i) => (

                          <Line key={`v-${i}`} points={[v, -5000, v, 5000]} stroke="#0f172a" strokeWidth={1 / zoom} dash={[4, 4]} opacity={0.5} listening={false} />
                        ))}
                        {snapLines.horizontal.map((h, i) => (
                          <Line key={`h-${i}`} points={[-5000, h, 5000, h]} stroke="#0f172a" strokeWidth={1 / zoom} dash={[4, 4]} opacity={0.5} listening={false} />

                        ))}
                      </>
                    )}

                    <Transformer
                      ref={trRef}
                      rotateEnabled={true}
                      enabledAnchors={getEnabledAnchors(selectedId ? currentSideData[selectedId] : null)}

                      anchorSize={6 / zoom}
                      anchorCornerRadius={10}
                      borderStrokeWidth={1.5 / zoom}
                      anchorStroke="#0f172a"
                      anchorFill="#fff"
                      borderStroke="#0f172a"
                      ignoreStroke={true}
                      padding={4}

                    />
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};


