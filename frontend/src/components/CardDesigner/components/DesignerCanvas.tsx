
import React, { useRef, useEffect, useState, useCallback } from 'react';

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
  const { selectedId, setSelectedId, hoveredId, setHoveredId } = useLayerContext();

  const trRef = useRef<any>(null);
  const hoverTrRef = useRef<any>(null);
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

  const handleAutoFit = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;

    // We target about 85% of the viewport to leave room for padding/UI
    const padding = 60;
    const availableWidth = container.clientWidth - padding;
    const availableHeight = container.clientHeight - padding;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    const scaleX = availableWidth / DESIGN_WIDTH;
    const scaleY = availableHeight / DESIGN_HEIGHT;

    // Use the smaller scale to ensure it fits both directions
    let newScale = Math.min(scaleX, scaleY);

    // Clamp to existing MIN/MAX zoom
    newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale));

    setZoom(newScale);

    // Trigger recenter after scale change
    setTimeout(handleRecenter, 50);
  }, [handleRecenter, setZoom]);

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

  useEffect(() => {
    const listener = () => handleAutoFit();
    window.addEventListener('autofit-canvas', listener);
    return () => window.removeEventListener('autofit-canvas', listener);
  }, [handleAutoFit]);


  const selectedIdRef = useRef<string | null>(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const getIntersectingIds = (stage: any, pos: any): string[] => {
    if (!pos) return [];
    const intersections = stage.getAllIntersections(pos);
    const candidateIds: string[] = [];

    intersections.forEach((shape: any) => {
      let node = shape;
      while (node && node !== stage) {
        const name = node.name();
        if (name && currentSideData?.[name]) {
          if (!candidateIds.includes(name)) {
            candidateIds.push(name);
          }
          break;
        }
        node = node.getParent();
      }
    });

    return candidateIds;
  };

  const getSmallestElement = (candidateIds: string[]) => {
    if (candidateIds.length === 0) return null;

    const sorted = [...candidateIds].sort((idA, idB) => {
      const itemA = currentSideData[idA];
      const itemB = currentSideData[idB];
      const areaA = (itemA.width || 1) * (itemA.height || 1);
      const areaB = (itemB.width || 1) * (itemB.height || 1);

      if (Math.abs(areaA - areaB) < 0.1) return 0;
      return areaA - areaB;
    });

    return sorted[0];
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    const targetElement = e.target as HTMLElement;
    // If we click on the outer wrapper (grey area) or the padding zone, deselect the selected element
    if (
      targetElement === scrollContainerRef.current ||
      targetElement.classList?.contains('bg-slate-50') ||
      targetElement.id === 'canvas-padding-wrapper'
    ) {
      setSelectedId(null);
    }

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

  const handleStageMouseMove = (e: any) => {
    if (isPanning) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Independent hover select priority based on smallest area
    const candidateIds = getIntersectingIds(stage, pos);
    const targetId = getSmallestElement(candidateIds);

    if (targetId && targetId !== hoveredId && targetId !== selectedIdRef.current) {
      setHoveredId(targetId);
    } else if (!targetId && hoveredId !== null) {
      setHoveredId(null);
    }
  };

  const handleStageMouseLeave = () => {
    if (hoveredId !== null) setHoveredId(null);
  };

  useEffect(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;

    // Primary Transformer
    if (trRef.current) {
      const selectedNode = selectedId ? stage.findOne('.' + selectedId) : null;
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);

        // Fix for "Transformer Dominance":
        // Konva's Transformer renders a transparent back plate ('_back' or 'back') that sits on top of EVERYTHING
        // and catches clicks. We disable it so you can click elements inside the selected item's bounds.
        const back1 = trRef.current.findOne('._back');
        const back2 = trRef.current.findOne('.back');
        if (back1) back1.listening(false);
        if (back2) back2.listening(false);

        trRef.current.getLayer()?.batchDraw();
      } else {
        trRef.current.nodes([]);
      }
    }

    // Hover Transformer
    if (hoverTrRef.current) {
      const showHover = hoveredId && hoveredId !== selectedId;
      const hoveredNode = showHover ? stage.findOne('.' + hoveredId) : null;
      if (hoveredNode) {
        hoverTrRef.current.nodes([hoveredNode]);

        const hoverBack1 = hoverTrRef.current.findOne('._back');
        const hoverBack2 = hoverTrRef.current.findOne('.back');
        if (hoverBack1) hoverBack1.listening(false);
        if (hoverBack2) hoverBack2.listening(false);

        hoverTrRef.current.getLayer()?.batchDraw();
      } else {
        hoverTrRef.current.nodes([]);
      }
    }
  }, [selectedId, hoveredId, editSide, stageRef]);


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
              id="canvas-padding-wrapper"
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
                  onMouseMove={handleStageMouseMove}
                  onMouseLeave={handleStageMouseLeave}
                  onMouseDown={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;

                    if (e.target.getParent()?.className === 'Transformer') {
                      return;
                    }

                    const pos = stage.getPointerPosition();
                    const candidateIds = pos ? getIntersectingIds(stage, pos) : [];

                    if (candidateIds.length > 0) {
                      if (selectedIdRef.current && candidateIds.includes(selectedIdRef.current)) {
                        // Sticky Selection: the click intersects the currently selected element.
                        // Do not change the selection. Allow normal drag to proceed.
                      } else {
                        // Clicked outside the current selection, pick the smallest overlapping
                        const targetId = getSmallestElement(candidateIds);
                        selectedIdRef.current = targetId;
                        setSelectedId(targetId);
                      }
                    } else if (e.target === stage) {
                      selectedIdRef.current = null;
                      setSelectedId(null);
                    }
                  }}
                  onDblClick={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;

                    if (e.target.getParent()?.className === 'Transformer') {
                      return;
                    }

                    const pos = stage.getPointerPosition();
                    const candidateIds = pos ? getIntersectingIds(stage, pos) : [];

                    if (candidateIds.length > 0) {
                      // Force selection change on Double Click to grab the smallest overlapping element
                      const targetId = getSmallestElement(candidateIds);
                      if (targetId) {
                        selectedIdRef.current = targetId;
                        setSelectedId(targetId);
                      }
                    }
                  }}
                  // Intercept drag to allow grabbing a covered selected element natively
                  onDragStart={(e) => {
                    if (e.target.name() === 'background') e.cancelBubble = true;

                    const name = e.target.name();
                    if (name && currentSideData[name] && name !== selectedIdRef.current) {
                      // A non-selected element intercepted the native drag!
                      e.target.stopDrag();

                      // Reroute the drag exactly to the correctly selected sticky element
                      if (selectedIdRef.current) {
                        const selectedNode = e.target.getStage()?.findOne('.' + selectedIdRef.current);
                        if (selectedNode && !currentSideData[selectedIdRef.current]?.locked) {
                          selectedNode.startDrag();
                        }
                      }
                    }
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
                      name="primary-transformer"
                      rotateEnabled={true}
                      flipEnabled={false}
                      enabledAnchors={getEnabledAnchors(selectedId ? currentSideData[selectedId] : null)}
                      boundBoxFunc={(oldBox, newBox) => {
                        // Prevent too small elements
                        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                      // Photoshop Accurate Styles
                      padding={0}
                      anchorSize={8 / zoom}
                      anchorCornerRadius={1}
                      anchorFill="#fff"
                      anchorStroke="#6366f1"
                      anchorStrokeWidth={1 / zoom}
                      borderStroke="#6366f1"
                      borderStrokeWidth={1 / zoom}
                      // Smooth drag experience
                      ignoreStroke={true}
                    />

                    <Transformer
                      ref={hoverTrRef}
                      name="hover-transformer"
                      rotateEnabled={false}
                      flipEnabled={false}
                      enabledAnchors={[]}
                      // Markedly more visible Hover Styles
                      padding={0}
                      borderStroke="#4f46e5"
                      borderStrokeWidth={3 / zoom}
                      opacity={0.8}
                      listening={false}
                      ignoreStroke={true}
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


