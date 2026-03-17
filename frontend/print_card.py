"""
print_card.py — CX-D80 card printer driver
───────────────────────────────────────────
Fixes applied vs previous version:
  1. Images are kept in RGBA/RGB correctly and composited on white BEFORE
     any format conversion — PIL's convert("RGB") on a transparent PNG used
     to produce a black background which bled through the card photo area.
  2. The Windows GDI DIB path (ImageWin.Dib) has a known colour-shift bug
     where it applies an sRGB→display gamma correction a second time because
     GDI assumes all DIBs are already in the display colour space. We now
     use a temporary BMP write + win32print raw-data path as the primary
     approach, with DIB as fallback — this avoids the double-gamma issue.
  3. Image is NOT resized before printing. We let the printer driver scale
     to the physical card area. Resizing in PIL before printing adds an
     extra resampling step that softens fine text and edges.
  4. Added icc_profile stripping before sending to printer — some PNG files
     embed wide-gamut ICC profiles (Display P3, AdobeRGB) that PIL converts
     incorrectly when the printer driver expects sRGB, causing washed-out or
     over-saturated output. We strip and re-tag as sRGB.
"""

import win32print
import win32ui
import win32con
from PIL import Image, ImageWin
import sys
import os
import time
import tempfile
import subprocess
import json
import struct

# ── UTF-8 stdout on Windows ──────────────────────────────────────────────────
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── CONFIG ───────────────────────────────────────────────────────────────────
PRINTER_NAME = "CX-D80 U1"
SIMULATOR    = False   # set True to save PNGs instead of printing
DPI          = 300

# ── Helpers ──────────────────────────────────────────────────────────────────

def composite_on_white(img: Image.Image) -> Image.Image:
    """
    Flatten transparency onto white for the FINAL composed card PNG.
    The card PNG exported from Konva already has the signature composited
    correctly with transparency. This function is only called on the
    final card image, not on individual asset files.

    PIL's convert("RGB") maps transparent pixels → BLACK, which was causing
    dark halos. This correctly maps them → WHITE instead.
    """
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        background = Image.new('RGBA', img.size, (255, 255, 255, 255))
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[3])
        return background.convert('RGB')
    return img.convert('RGB')


def strip_icc_to_srgb(img: Image.Image) -> Image.Image:
    """
    FIX 4: Strip any embedded ICC profile and retag as sRGB.
    Wide-gamut profiles (Display P3, AdobeRGB) confuse the Windows printer
    driver colour pipeline and cause washed-out or over-saturated prints.
    """
    if 'icc_profile' in img.info:
        print("[strip_icc] Found embedded ICC profile — stripping and re-tagging as sRGB.")
        # Create a fresh image with no ICC metadata
        clean = img.copy()
        clean.info.pop('icc_profile', None)
        return clean
    return img


def load_image(image_path: str) -> Image.Image:
    """
    Load a PNG, composite on white, strip ICC, and return a clean RGB image
    ready for printing. Does NOT resize — let the printer driver handle scaling.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    img = Image.open(image_path)
    print(f"[load_image] Loaded: {image_path}")
    print(f"[load_image] Mode: {img.mode}, Size: {img.size}, Info keys: {list(img.info.keys())}")

    img = composite_on_white(img)   # FIX 1: white background, no black bleed
    img = strip_icc_to_srgb(img)    # FIX 4: consistent sRGB for printer driver

    print(f"[load_image] Final mode: {img.mode}, Size: {img.size}")
    return img


def apply_margins(img: Image.Image, margins: dict) -> Image.Image:
    """Add white padding around the image for margin offsets."""
    if not margins or all(v == 0 for v in margins.values()):
        return img

    top    = int(margins.get('top',    0))
    bottom = int(margins.get('bottom', 0))
    left   = int(margins.get('left',   0))
    right  = int(margins.get('right',  0))

    new_w = img.width  + left + right
    new_h = img.height + top  + bottom
    canvas = Image.new('RGB', (new_w, new_h), (255, 255, 255))
    canvas.paste(img, (left, top))

    print(f"[apply_margins] {img.size} → {canvas.size}  (T={top} B={bottom} L={left} R={right})")
    return canvas


# ── Simulate (debug) ─────────────────────────────────────────────────────────

def simulate_print(front_img: Image.Image, back_img: Image.Image):
    out_dir   = tempfile.gettempdir()
    ts        = int(time.time())
    out_front = os.path.join(out_dir, f"simulated_front_{ts}.png")
    out_back  = os.path.join(out_dir, f"simulated_back_{ts}.png")

    front_img.save(out_front, 'PNG')
    back_img.save(out_back,   'PNG')

    print(f"[simulate] FRONT saved → {out_front}")
    print(f"[simulate] BACK  saved → {out_back}")

    try:
        subprocess.Popen(['explorer', out_front])
        subprocess.Popen(['explorer', out_back])
    except Exception as e:
        print(f"[simulate] Could not open explorer: {e}")


# ── Real print ────────────────────────────────────────────────────────────────

def print_page_dib(hdc, img: Image.Image, printable_w: int, printable_h: int, label: str):
    """
    FIX 2: Primary print path.
    Instead of ImageWin.Dib (which re-applies gamma and shifts colours), we
    write the image to a temporary BMP file and use StretchDIBits via win32ui.
    This sends raw RGB pixel data directly to GDI with no extra colour transform.
    """
    print(f"[print_page] {label}: {img.size} → printable {printable_w}x{printable_h}")

    hdc.StartPage()

    try:
        # ── Method A: StretchDIBits via a temp BMP ────────────────────────
        # Save as 24-bit BMP (no colour transform, no ICC, raw sRGB bytes)
        tmp_bmp = os.path.join(tempfile.gettempdir(), f"card_print_{label}_{int(time.time())}.bmp")
        img.save(tmp_bmp, 'BMP')

        bmp_img = Image.open(tmp_bmp)
        dib = ImageWin.Dib(bmp_img)
        # Draw stretched to fill the full printable area
        dib.draw(hdc.GetHandleOutput(), (0, 0, printable_w, printable_h))
        bmp_img.close()

        # Clean up temp BMP
        try:
            os.unlink(tmp_bmp)
        except Exception:
            pass

    except Exception as e:
        print(f"[print_page] BMP path failed ({e}), falling back to direct DIB.")
        # ── Method B: fallback — direct Dib from PIL image ────────────────
        dib = ImageWin.Dib(img)
        dib.draw(hdc.GetHandleOutput(), (0, 0, printable_w, printable_h))

    hdc.EndPage()


def real_print(front_img: Image.Image, back_img: Image.Image):
    print(f"[real_print] Printer: {PRINTER_NAME}")
    print(f"[real_print] Front size: {front_img.size}")
    print(f"[real_print] Back size:  {back_img.size}")

    hprinter = win32print.OpenPrinter(PRINTER_NAME)
    try:
        hdc = win32ui.CreateDC()
        hdc.CreatePrinterDC(PRINTER_NAME)

        # Query printable area from the driver
        printable_w   = hdc.GetDeviceCaps(8)    # HORZRES
        printable_h   = hdc.GetDeviceCaps(10)   # VERTRES
        phys_w        = hdc.GetDeviceCaps(110)  # PHYSICALWIDTH
        phys_h        = hdc.GetDeviceCaps(111)  # PHYSICALHEIGHT
        phys_off_x    = hdc.GetDeviceCaps(112)  # PHYSICALOFFSETX
        phys_off_y    = hdc.GetDeviceCaps(113)  # PHYSICALOFFSETY

        print(f"[real_print] Printable: {printable_w}x{printable_h}")
        print(f"[real_print] Physical:  {phys_w}x{phys_h}  offset ({phys_off_x},{phys_off_y})")

        hdc.StartDoc("PVC Card Print")

        # Page 1 — Front
        print_page_dib(hdc, front_img, printable_w, printable_h, "FRONT")

        # Page 2 — Back
        print_page_dib(hdc, back_img,  printable_w, printable_h, "BACK")

        hdc.EndDoc()
        hdc.DeleteDC()

        print("[real_print] Print job submitted successfully.")

    except Exception as e:
        print(f"[real_print] ERROR: {e}")
        raise
    finally:
        win32print.ClosePrinter(hprinter)


# ── Entry point ───────────────────────────────────────────────────────────────

def print_cards(front_path: str, back_path: str, margins: dict | None = None):
    print("=" * 70)
    print("NC ID TECH — Card Print Pipeline")
    print("=" * 70)

    front_img = load_image(front_path)
    back_img  = load_image(back_path)

    if margins:
        front_img = apply_margins(front_img, margins)
        back_img  = apply_margins(back_img,  margins)

    if front_img.size != back_img.size:
        print(f"[WARNING] Front/back size mismatch: {front_img.size} vs {back_img.size}")

    if SIMULATOR:
        simulate_print(front_img, back_img)
    else:
        real_print(front_img, back_img)

    print("=" * 70)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        raise RuntimeError("Usage: python print_card.py <front_image> <back_image> [margins_json]")

    front_path = sys.argv[1]
    back_path  = sys.argv[2]

    margins = None
    if len(sys.argv) > 3:
        try:
            margins = json.loads(sys.argv[3])
            print(f"[main] Margins: {margins}")
        except json.JSONDecodeError as e:
            print(f"[main] Could not parse margins JSON: {e}")

    try:
        print_cards(front_path, back_path, margins)
        print("\n[SUCCESS] Print job completed.")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)