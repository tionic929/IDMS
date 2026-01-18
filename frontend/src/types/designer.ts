export type FitMode = 'none' | 'wrap' | 'shrink' | 'stretch';
export type OverflowMode = 'clip' | 'ellipsis';

export interface LayoutItemSchema {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    fontStyle: string;
    align: 'left' | 'center' | 'right';
    fit: FitMode;
    maxLines: number | null;
    overflow: OverflowMode;
    opacity?: number;
    rotation?: number;
    fill?: string;
    text?: string;
    type?: 'rect' | 'circle' | 'text' | 'image';
}

export interface CardLayout {
  front: Record<string, LayoutItemSchema>;
  back: Record<string, LayoutItemSchema>;
  previewImages?: { front: string; back: string };
}