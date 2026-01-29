/**
 * Centralized dimension constants for ID card design and printing
 * 
 * DESIGN: 320×494px (CardDesigner working area)
 * PRINT:  650×1003px (Export/print output)
 * 
 * Scale factor: 2.0300x (uniform across X and Y axes)
 * Physical: 55×84.91mm @ 300 DPI
 */

// ============================================================
// DESIGN CANVAS DIMENSIONS
// What the user sees and works with in CardDesigner
// ============================================================
export const DESIGN_WIDTH = 320;
export const DESIGN_HEIGHT = 500;

// ============================================================
// PRINT EXPORT DIMENSIONS
// What gets rendered for export/printing
// Calculated: Design scaled uniformly to fit 55mm × 86mm @ 300 DPI
// Formula: 
//   - X: 320px → (55mm / 25.4) * 300 DPI = 650px
//   - Y: 494px × (650/320) = 1003px
// ============================================================
export const PRINT_WIDTH = 661;
export const PRINT_HEIGHT = 1032;

// ============================================================
// SCALE FACTORS (Design → Print Transformation)
// Used to convert design-space coordinates to print-space
// ============================================================
export const SCALE_X = PRINT_WIDTH / DESIGN_WIDTH;      // 650 / 320 = 2.03125
export const SCALE_Y = PRINT_HEIGHT / DESIGN_HEIGHT;    // 1003 / 494 = 2.02834...

// Verify that scales are nearly identical (prevents distortion)
export const SCALES_MATCH = Math.abs(SCALE_X - SCALE_Y) < 0.01; // true
export const SCALE_MATCH_DIFFERENCE = Math.abs(SCALE_X - SCALE_Y); // ~0.0029

// ============================================================
// PHYSICAL CARD SPECIFICATIONS
// ============================================================
export const CARD_WIDTH_MM = 48;
export const CARD_HEIGHT_MM = 86;
export const DPI = 300;

// ============================================================
// EXPORT QUALITY SETTINGS
// ============================================================
// Pixel ratio for high-quality PNG export (for printing)
// This ensures text and details are crisp when printed
// 3.4375 ≈ 2.03 * 1.7 (scale * quality multiplier)
export const EXPORT_PIXEL_RATIO = 3.4375;

// ============================================================
// UI SETTINGS
// ============================================================
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 0.8;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Converts a design-space coordinate to print-space coordinate
 * 
 * @example
 * const printCoord = scaleCoordinate(50, 100);
 * // { x: 102, y: 203 }
 */
export function scaleCoordinate(
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: Math.round(x * SCALE_X),
    y: Math.round(y * SCALE_Y),
  };
}

/**
 * Scales dimensions from design space to print space
 * 
 * @example
 * const printSize = scaleDimensions(200, 100);
 * // { width: 406, height: 203 }
 */
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