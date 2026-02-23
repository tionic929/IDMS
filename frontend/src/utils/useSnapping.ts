import { useCallback } from 'react';
import { useCanvasContext, type SnapMode, type GridUnit } from '../context/CanvasContext';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants/dimensions';

// Photoshop-style snap tolerance constants (closer = more precise)
const SNAP_DISTANCE = 8; // px
const MAGNETIC_SNAP_DISTANCE = 15; // Stronger pull when very close
const SPACING_SNAP_TOLERANCE = 3;
const PIXELS_PER_INCH = 96;
const PIXELS_PER_MM = 3.78;

// Snap priority weights
const SNAP_PRIORITY = {
    CANVAS_EDGE: 4,      // Highest
    CANVAS_CENTER: 3.5,
    OBJECT_EDGE: 3,
    OBJECT_CENTER: 2.5,
    GRID: 2,             // Lower than objects
    SPACING: 1,
};

interface SnapPoint {
    position: number;
    type: 'edge' | 'center' | 'canvas-edge' | 'canvas-center' | 'spacing' | 'grid';
    priority: number;
    source?: string;
}

interface SnapResult {
    position: number;
    diff: number;
    offset: number;
    type: string;
    priority: number;
}

export const useSnapping = (layerRef: React.RefObject<any>) => {
    const {
        snapEnabled,
        isTransforming,
        setSnapLines,
        snapMode,
        gridUnit
    } = useCanvasContext();

    /**
     * Logic: Calculate grid step based on physical units
     */
    const getGridStep = useCallback(() => {
        switch (gridUnit) {
            case 'inch': return PIXELS_PER_INCH / 4; // 0.25 inch
            case 'mm': return PIXELS_PER_MM * 5;     // 5mm
            default: return 10;                     // 10px
        }
    }, [gridUnit]);

    /**
     * Logic: Detect equal spacing between objects (Smart Guides)
     */
    const detectEqualSpacing = useCallback((objects: any[], direction: 'horizontal' | 'vertical') => {
        if (objects.length < 2) return [];

        // Sort items by position
        const sorted = [...objects].sort((a, b) =>
            direction === 'horizontal' ? a.x - b.x : a.y - b.y
        );

        const equalPositions: number[] = [];

        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            // Calculate gap between end of prev and start of curr
            const gap = direction === 'horizontal'
                ? curr.x - (prev.x + prev.width)
                : curr.y - (prev.y + prev.height);

            if (gap > 0) {
                // Suggest a position for a potential 3rd object to maintain this gap
                equalPositions.push(direction === 'horizontal'
                    ? curr.x + curr.width + gap
                    : curr.y + curr.height + gap
                );
            }
        }
        return equalPositions;
    }, []);

    /**
     * Logic: Get the edges of the dragging object (Scale Aware)
     */
    const getObjectEdges = useCallback((node: any) => {
        const x = node.x();
        const y = node.y();
        // IMPORTANT: Use scale to get actual visual dimensions
        const width = node.width() * node.scaleX();
        const height = node.height() * node.scaleY();
        const rotation = node.rotation();

        return {
            vertical: [
                { position: x, offset: 0, type: 'left' },
                { position: x + width / 2, offset: -width / 2, type: 'center' },
                { position: x + width, offset: -width, type: 'right' },
            ],
            horizontal: [
                { position: y, offset: 0, type: 'top' },
                { position: y + height / 2, offset: -height / 2, type: 'center' },
                { position: y + height, offset: -height, type: 'bottom' },
            ],
            isRotated: Math.abs(rotation % 360) > 1,
        };
    }, []);

    /**
     * Logic: Get all potential snap points from Canvas and Objects
     */
    const getSnapPoints = useCallback((skipShape: any) => {
        const vertical: SnapPoint[] = [
            { position: 0, type: 'canvas-edge', priority: SNAP_PRIORITY.CANVAS_EDGE, source: 'canvas-left' },
            { position: DESIGN_WIDTH, type: 'canvas-edge', priority: SNAP_PRIORITY.CANVAS_EDGE, source: 'canvas-right' },
            { position: DESIGN_WIDTH / 2, type: 'canvas-center', priority: SNAP_PRIORITY.CANVAS_CENTER, source: 'canvas-center-v' },
        ];

        const horizontal: SnapPoint[] = [
            { position: 0, type: 'canvas-edge', priority: SNAP_PRIORITY.CANVAS_EDGE, source: 'canvas-top' },
            { position: DESIGN_HEIGHT, type: 'canvas-edge', priority: SNAP_PRIORITY.CANVAS_EDGE, source: 'canvas-bottom' },
            { position: DESIGN_HEIGHT / 2, type: 'canvas-center', priority: SNAP_PRIORITY.CANVAS_CENTER, source: 'canvas-center-h' },
        ];

        if (!layerRef.current) return { vertical, horizontal };

        const objects: any[] = [];
        layerRef.current.children.forEach((item: any) => {
            // Skip irrelevant items
            if (
                item === skipShape ||
                item.name() === 'background' ||
                item.getClassName() === 'Transformer' ||
                item.getClassName() === 'Line' ||
                !item.visible()
            ) return;

            const config = {
                x: item.x(),
                y: item.y(),
                width: item.width() * item.scaleX(),
                height: item.height() * item.scaleY(),
                name: item.name()
            };
            objects.push(config);

            // Only add Object snap points if in Smart mode
            if (snapMode === 'smart' || snapMode === 'both') {
                vertical.push(
                    { position: config.x, type: 'edge', priority: SNAP_PRIORITY.OBJECT_EDGE, source: `${config.name}-l` },
                    { position: config.x + config.width / 2, type: 'center', priority: SNAP_PRIORITY.OBJECT_CENTER, source: `${config.name}-c` },
                    { position: config.x + config.width, type: 'edge', priority: SNAP_PRIORITY.OBJECT_EDGE, source: `${config.name}-r` }
                );
                horizontal.push(
                    { position: config.y, type: 'edge', priority: SNAP_PRIORITY.OBJECT_EDGE, source: `${config.name}-t` },
                    { position: config.y + config.height / 2, type: 'center', priority: SNAP_PRIORITY.OBJECT_CENTER, source: `${config.name}-c` },
                    { position: config.y + config.height, type: 'edge', priority: SNAP_PRIORITY.OBJECT_EDGE, source: `${config.name}-b` }
                );
            }
        });

        // Add Spacing Guides
        if (snapMode === 'smart' || snapMode === 'both') {
            detectEqualSpacing(objects, 'horizontal').forEach(pos =>
                vertical.push({ position: pos, type: 'spacing', priority: SNAP_PRIORITY.SPACING, source: 'spacing' }));
            detectEqualSpacing(objects, 'vertical').forEach(pos =>
                horizontal.push({ position: pos, type: 'spacing', priority: SNAP_PRIORITY.SPACING, source: 'spacing' }));
        }

        return { vertical, horizontal };
    }, [layerRef, snapMode, detectEqualSpacing]);

    /**
     * Logic: Find the best snap with weighted priorities and magnetic pull
     */
    const findBestSnap = useCallback((
        objectEdges: any[],
        snapPoints: SnapPoint[]
    ): SnapResult | null => {
        const candidates: SnapResult[] = [];

        objectEdges.forEach((edge) => {
            snapPoints.forEach((point) => {
                const diff = Math.abs(point.position - edge.position);
                const magneticThreshold = diff < MAGNETIC_SNAP_DISTANCE ? MAGNETIC_SNAP_DISTANCE : SNAP_DISTANCE;

                if (diff < magneticThreshold) {
                    candidates.push({
                        position: point.position,
                        diff,
                        offset: edge.offset,
                        type: `${edge.type}-to-${point.type}`,
                        priority: point.priority,
                    });
                }
            });
        });

        if (candidates.length === 0) return null;

        // Sort by priority (Canvas > Objects > Grid), then by distance
        return candidates.sort((a, b) => {
            if (Math.abs(a.priority - b.priority) > 0.1) return b.priority - a.priority;
            return a.diff - b.diff;
        })[0];
    }, []);

    /**
     * Main Drag Handler
     */
    const handleDragMove = useCallback((e: any) => {
        if (!snapEnabled || isTransforming) {
            setSnapLines({ vertical: [], horizontal: [] });
            return;
        }

        const node = e.target;
        const objectEdges = getObjectEdges(node);

        // Skip snapping if rotated (too complex for standard guides)
        if (objectEdges.isRotated) {
            setSnapLines({ vertical: [], horizontal: [] });
            return;
        }

        const { vertical: vPoints, horizontal: hPoints } = getSnapPoints(node);

        // IMPORTANT: Inject Grid Points here if enabled
        if (snapMode === 'grid' || snapMode === 'both') {
            const step = getGridStep();
            // Calculate nearest grid lines for left/right edges
            objectEdges.vertical.forEach(edge => {
                const nearestGrid = Math.round(edge.position / step) * step;
                vPoints.push({ position: nearestGrid, type: 'grid', priority: SNAP_PRIORITY.GRID });
            });
            // Calculate nearest grid lines for top/bottom edges
            objectEdges.horizontal.forEach(edge => {
                const nearestGrid = Math.round(edge.position / step) * step;
                hPoints.push({ position: nearestGrid, type: 'grid', priority: SNAP_PRIORITY.GRID });
            });
        }

        const bestV = findBestSnap(objectEdges.vertical, vPoints);
        const bestH = findBestSnap(objectEdges.horizontal, hPoints);

        const activeLines: { vertical: number[], horizontal: number[] } = { vertical: [], horizontal: [] };

        if (bestV) {
            node.x(bestV.position + bestV.offset);
            activeLines.vertical.push(bestV.position);
        }
        if (bestH) {
            node.y(bestH.position + bestH.offset);
            activeLines.horizontal.push(bestH.position);
        }

        setSnapLines(activeLines);
    }, [snapEnabled, isTransforming, getObjectEdges, getSnapPoints, findBestSnap, setSnapLines, snapMode, getGridStep]);

    /**
     * Logic: Programmatic snap for keyboard/nudging
     */
    const snapToNearest = useCallback((node: any, axis?: 'vertical' | 'horizontal' | 'both') => {
        if (!snapEnabled) return;

        const snapPoints = getSnapPoints(node);
        const objectEdges = getObjectEdges(node);

        // Also inject grid points for keyboard nudge
        if (snapMode === 'grid' || snapMode === 'both') {
            const step = getGridStep();
            objectEdges.vertical.forEach(edge => {
                snapPoints.vertical.push({ position: Math.round(edge.position / step) * step, type: 'grid', priority: SNAP_PRIORITY.GRID });
            });
            objectEdges.horizontal.forEach(edge => {
                snapPoints.horizontal.push({ position: Math.round(edge.position / step) * step, type: 'grid', priority: SNAP_PRIORITY.GRID });
            });
        }

        if (axis === 'vertical' || axis === 'both') {
            const bestV = findBestSnap(objectEdges.vertical, snapPoints.vertical);
            if (bestV) node.x(bestV.position + bestV.offset);
        }
        if (axis === 'horizontal' || axis === 'both') {
            const bestH = findBestSnap(objectEdges.horizontal, snapPoints.horizontal);
            if (bestH) node.y(bestH.position + bestH.offset);
        }
    }, [snapEnabled, getSnapPoints, getObjectEdges, findBestSnap, snapMode, getGridStep]);

    return { handleDragMove, snapToNearest };
};
