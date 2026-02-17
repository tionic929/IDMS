import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Grid3X3, Maximize, Magnet, Focus, Ruler } from 'lucide-react';

import { useDesignerContext } from '../context/DesignerContext';
import { useCanvasContext } from '../context/CanvasContext';
import { useLayerContext } from '../context/LayerContext';
import { usePreviewData } from '../hooks/usePreviewData';
import { useSnapping } from '../hooks/useSnapping';
import { useCanvasTransform } from '../hooks/useCanvasTransform';

import { RulerHorizontal, RulerVertical } from './CanvasRulers';
import CanvasElement from '../../../components/Designer/CanvasElement';
import { getEnabledAnchors } from '../../../utils/designerUtils';

import FRONT_BG_SRC from '../../../assets/ID/NEWFRONT.png';
import BACK_BG_SRC from '../../../assets/ID/BACK.png';
import { DESIGN_WIDTH, DESIGN_HEIGHT, MIN_ZOOM, MAX_ZOOM } from '../../../constants/dimensions';

const IconButton = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-2 rounded-lg transition-all flex items-center gap-1.5 justify-center relative ${
      active
        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'
    }`}
  >
    <Icon size={18} strokeWidth={2} />
    {badge && (
      <span className="text-[9px] font-bold uppercase tracking-tighter bg-zinc-800 px-1 rounded border border-zinc-700">
        {badge}
      </span>
    )}
  </button>
);

export const DesignerCanvas: React.FC<{ stageRef: React.RefObject<any> }> = ({ stageRef }) => {
  const { editSide, currentSideData, templateId, templateName, updateItem } = useDesignerContext();
  const { 
    zoom, setZoom, 
    showGrid, setShowGrid, 
    snapEnabled, setSnapEnabled, 
    snapMode, setSnapMode,
    gridUnit, setGridUnit,
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

  const { previewData } = usePreviewData(templateId, templateName);
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

  // Handlers for cycling modes
  const cycleSnapMode = () => {
    const modes: ('smart' | 'grid' | 'both')[] = ['smart', 'grid', 'both'];
    const currentIndex = modes.indexOf(snapMode);
    setSnapMode(modes[(currentIndex + 1) % modes.length]);
  };

  const cycleGridUnit = () => {
    const units: ('px' | 'inch' | 'mm')[] = ['px', 'inch', 'mm'];
    const currentIndex = units.indexOf(gridUnit);
    setGridUnit(units[(currentIndex + 1) % units.length]);
  };

  return (
    <div className="flex-1 relative bg-[#09090b] flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 py-1 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <IconButton
            icon={Magnet}
            active={snapEnabled}
            onClick={() => setSnapEnabled(!snapEnabled)}
            label="Toggle Snapping"
          />
          <IconButton
            icon={Focus}
            active={snapEnabled}
            onClick={cycleSnapMode}
            label={`Snap Mode: ${snapMode}`}
            badge={snapMode}
          />
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <IconButton
            icon={Grid3X3}
            active={showGrid}
            onClick={() => setShowGrid(!showGrid)}
            label="Toggle Grid Visibility"
          />
          <IconButton
            icon={Ruler}
            onClick={cycleGridUnit}
            label={`Grid Unit: ${gridUnit}`}
            badge={gridUnit}
          />
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <IconButton
            icon={Maximize}
            onClick={handleRecenter}
            label="Recenter Canvas"
          />
          <div className="w-px h-4 bg-zinc-800 mx-2" />
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">
            Canvas: {DESIGN_WIDTH} × {DESIGN_HEIGHT}px
          </span>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <RulerVertical zoom={zoom} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <RulerHorizontal zoom={zoom} />
          
          <div 
            ref={scrollContainerRef}
            onMouseDown={handleContainerMouseDown}
            className={`flex-1 overflow-auto bg-zinc-900 relative scrollbar-hide ${
              isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
          >
            <div 
              className="flex items-center justify-center min-w-full min-h-full"
              style={{ padding: '1000px' }}
            >
              <div
                className="shadow-[0_0_100px_rgba(0,0,0,0.1)] bg-white relative shrink-0 z-0"
                style={{ 
                  width: DESIGN_WIDTH * zoom, 
                  height: DESIGN_HEIGHT * zoom,
                  pointerEvents: isPanning ? 'none' : 'auto'
                }}
              >
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.05] z-10"
                    style={{
                      backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
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
                      <KonvaImage
                        name="background"
                        image={activeBg}
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
                          <Line key={`v-${i}`} points={[v, -5000, v, 5000]} stroke="#6366f1" strokeWidth={1/zoom} dash={[4, 4]} listening={false} />
                        ))}
                        {snapLines.horizontal.map((h, i) => (
                          <Line key={`h-${i}`} points={[-5000, h, 5000, h]} stroke="#6366f1" strokeWidth={1/zoom} dash={[4, 4]} listening={false} />
                        ))}
                      </>
                    )}

                    <Transformer
                      ref={trRef}
                      rotateEnabled={true}
                      enabledAnchors={getEnabledAnchors(selectedId ? currentSideData[selectedId] : null)}
                      anchorSize={8 / zoom}
                      anchorCornerRadius={2}
                      borderStrokeWidth={1.5 / zoom}
                      anchorStroke="#6366f1"
                      anchorFill="#fff"
                      borderStroke="#6366f1"
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