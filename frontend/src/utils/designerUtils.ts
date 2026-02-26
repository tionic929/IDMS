import { type LayoutItemSchema } from '../types/designer';

export const reorderLayer = (
  data: Record<string, any>,
  id: string,
  direction: 'up' | 'down' | 'top' | 'bottom'
): Record<string, any> => {
  const keys = Object.keys(data);
  const index = keys.indexOf(id);
  if (index === -1) return data;

  const newKeys = [...keys];

  if (direction === 'up' && index < keys.length - 1) {
    [newKeys[index], newKeys[index + 1]] = [newKeys[index + 1], newKeys[index]];
  } else if (direction === 'down' && index > 0) {
    [newKeys[index], newKeys[index - 1]] = [newKeys[index - 1], newKeys[index]];
  } else if (direction === 'top') {
    newKeys.splice(index, 1);
    newKeys.push(id);
  } else if (direction === 'bottom') {
    newKeys.splice(index, 1);
    newKeys.unshift(id);
  }

  const result: Record<string, any> = {};
  newKeys.forEach((k) => {
    result[k] = data[k];
  });
  return result;
};

export const getNewElementPosition = (data: Record<string, any>) => {
  const count = Object.keys(data).length;
  // Offset each new item by 20px so they don't stack perfectly on top of each other
  return {
    x: 50 + (count * 20 % 100),
    y: 50 + (count * 20 % 100)
  };
};

export const calculateShrinkFontSize = (
  text: string,
  width: number,
  height: number,
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
    const fontSize = Math.floor((low + high) / 2);
    ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;

    // 1. Estimate Line Height (Konva default is usually ~1.2)
    const lineHeight = fontSize * 1.2;

    // 2. Simulate Word Wrapping
    const words = text.split(' ');
    let currentLine = words[0];
    let lines = 1;
    
    // We subtract a larger padding (10px) to be safe against Konva's internal anti-aliasing/padding
    // This prevents the "last word cut off" issue.
    const maxWidth = width - 10; 

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines++;
        currentLine = word;
      }
    }

    // 3. Check Constraints
    const fitsLines = lines <= maxLines;
    // Check if the total height of lines fits within the box height
    const fitsHeight = (lines * lineHeight) <= height;

    if (fitsLines && fitsHeight) {
      bestFit = fontSize;
      low = fontSize + 1;
    } else {
      high = fontSize - 1;
    }
  }
  return bestFit;
};

// Determines final font size and wrap settings based on config
export const resolveTextLayout = (config: LayoutItemSchema, text: string) => {
  const mode = config.fit || 'none';
  const baseSize = config.fontSize || 18;
  const width = config.width || 200;
  const height = config.height || 180; // We now capture height
  const maxLines = config.maxLines || 1;

  let resolvedFontSize = baseSize;
  let wrapString: "none" | "word" = "none";

  if (mode === 'shrink') {
    // PASS HEIGHT TO CALCULATOR
    resolvedFontSize = calculateShrinkFontSize(
      text, 
      width, 
      height, 
      baseSize, 
      maxLines, 
      config.fontFamily, 
      config.fontStyle
    );
    // If maxLines > 1, we must enable wrapping so it actually uses the lines
    wrapString = maxLines > 1 ? "word" : "none";
  } else if (mode === 'wrap') {
    wrapString = "word";
  }

  return { fontSize: resolvedFontSize, wrap: wrapString };
};

export const getEnabledAnchors = (config: LayoutItemSchema | null): string[] => {
    if (!config) return [];
    if (config.type === 'circle') { return ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']; }
    if (config.type === 'rect') { return ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']; }
    if (config.fit === 'none') return [];
    if (config.fit === 'wrap') return ['middle-left', 'middle-right'];
    // Shrink mode now cares about Height, so we enable corner anchors
    if (config.fit === 'shrink') return ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'];
    if (config.fit === 'stretch') return ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    return ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'];
};
