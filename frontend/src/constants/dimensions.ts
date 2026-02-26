// Card Designer Canvas Dimensions (Design Space)
export const DESIGN_WIDTH = 332; // 664 / 2
export const DESIGN_HEIGHT = 518; // 1036 / 2

// Print Output Dimensions (Final Physical Size: 664x1036 px)
export const PRINT_WIDTH = 664;
export const PRINT_HEIGHT = 1036;

// Scale factors from design space to print space
export const SCALE_X = PRINT_WIDTH / DESIGN_WIDTH;   // Exactly 2.0
export const SCALE_Y = PRINT_HEIGHT / DESIGN_HEIGHT; // Exactly 2.0

// Grid settings
export const GRID_SIZE = 10; // pixels
export const SNAP_THRESHOLD = 5; // pixels

export const SCALES_MATCH = Math.abs(SCALE_X - SCALE_Y) < 0.05; // true
export const SCALE_MATCH_DIFFERENCE = Math.abs(SCALE_X - SCALE_Y); // 0

export const CARD_WIDTH_MM = 53.98;
export const CARD_HEIGHT_MM = 85.6;
export const DPI = 300;

/**
 * EXPORT_PIXEL_RATIO=1 ensures that the pixel dimensions of the captured image
 * exactly match the DRAWING units expected by the printer driver (300 units/inch).
 * Higher values would cause the output to look "zoomed in" and clipped.
 */
export const EXPORT_PIXEL_RATIO = 1;

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 1.2;

export function scaleCoordinate(
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: Math.round(x * SCALE_X),
    y: Math.round(y * SCALE_Y),
  };
}

export function scaleDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  return {
    width: Math.round(width * SCALE_X),
    height: Math.round(height * SCALE_Y),
  };
}

/**
 * Scales a font size from design to print
 * Uses average of X and Y scales for consistency
 * 
 * @example
 * const printFontSize = scaleFontSize(20);
 * // 41 (20 * ~2.03)
 */
export function scaleFontSize(fontSize: number): number {
  const avgScale = (SCALE_X + SCALE_Y) / 2;
  return Math.round(fontSize * avgScale);
}

/**
 * Inverse operation: converts print-space to design-space
 * Useful for error checking or reverse calculations
 */
export function unscaleCoordinate(
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: Math.round(x / SCALE_X),
    y: Math.round(y / SCALE_Y),
  };
}

// ============================================================
// DEBUG/INFO FUNCTIONS
// ============================================================

/**
 * Logs all dimension information for debugging
 */
export function logDimensionInfo(): void {
  console.log('╔════════════════════════════════════════╗');
  console.log('║    ID Card Dimension Information       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`Design Canvas:       ${DESIGN_WIDTH}×${DESIGN_HEIGHT}px`);
  console.log(`Print Export:        ${PRINT_WIDTH}×${PRINT_HEIGHT}px`);
  console.log('');
  console.log(`Scale X:             ${SCALE_X.toFixed(5)}x`);
  console.log(`Scale Y:             ${SCALE_Y.toFixed(5)}x`);
  console.log(`Difference:          ${SCALE_MATCH_DIFFERENCE.toFixed(5)}x`);
  console.log(`Scales Match:        ${SCALES_MATCH ? '✓ YES' : '✗ NO'}`);
  console.log('');
  console.log(`Physical Card:       ${CARD_WIDTH_MM}×${CARD_HEIGHT_MM}mm @ ${DPI} DPI`);
  console.log(`Effective Print DPI: ${(PRINT_WIDTH / (CARD_WIDTH_MM / 25.4)).toFixed(0)} DPI`);
  console.log('');
  console.log(`Export Pixel Ratio:  ${EXPORT_PIXEL_RATIO}`);
  console.log('');
}

/**
 * Validates that dimensions are configured correctly
 */
export function validateDimensions(): boolean {
  const errors: string[] = [];

  if (DESIGN_WIDTH <= 0 || DESIGN_HEIGHT <= 0) {
    errors.push('❌ Design dimensions must be positive');
  }

  if (PRINT_WIDTH <= 0 || PRINT_HEIGHT <= 0) {
    errors.push('❌ Print dimensions must be positive');
  }

  if (!SCALES_MATCH) {
    errors.push('⚠️  Scale factors differ significantly (may cause distortion)');
  }

  if (errors.length > 0) {
    errors.forEach(err => console.error(err));
    return false;
  }

  console.log('✓ All dimensions validated successfully');
  return true;
}

if (typeof window !== 'undefined') {
  // Only validate in browser environment
  console.log('ID Card dimensions loaded:');
  console.log(`  Design: ${DESIGN_WIDTH}×${DESIGN_HEIGHT}px`);
  console.log(`  Print: ${PRINT_WIDTH}×${PRINT_HEIGHT}px`);
  console.log(`  Scale: ${SCALE_X.toFixed(4)}x / ${SCALE_Y.toFixed(4)}x`);
}