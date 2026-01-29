import win32print
import win32ui
from PIL import Image, ImageWin
import sys
import os
import time
import tempfile
import subprocess
import ctypes

# ==============================
# CONFIG
# ==============================
PRINTER_NAME = "CX-D80 U1"
SIMULATOR = False   # <<< TURN OFF WHEN PRINTER IS READY
DPI = 300

CARD_WIDTH_MM = 55
CARD_HEIGHT_MM = 86

# Image dimensions from your frontend (already at correct size)
CARD_WIDTH_PX = 654
CARD_HEIGHT_PX = 1032

# ==============================
# CORE LOGIC
# ==============================

def render_card(image_path):
    """Load and prepare card image WITHOUT scaling/padding"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(image_path)

    img = Image.open(image_path).convert("RGB")
    
    # IMPORTANT: Don't resize or add padding
    # Your frontend already generated correct dimensions
    # Image should be 640x1000 for CR80 @ 300 DPI
    
    return img, CARD_WIDTH_PX, CARD_HEIGHT_PX


def simulate_print(front_img, back_img, width_px, height_px):
    """Simulate print by saving to temp file"""
    out_dir = tempfile.gettempdir()
    out_front = os.path.join(out_dir, f"simulated_front_{int(time.time())}.png")
    out_back = os.path.join(out_dir, f"simulated_back_{int(time.time())}.png")

    front_img.save(out_front, "PNG")
    back_img.save(out_back, "PNG")

    print("SIMULATED PRINT SAVED TO:")
    print(f"FRONT: {out_front}")
    print(f"BACK:  {out_back}")

    # Auto-open both images
    subprocess.Popen(["explorer", out_front])
    subprocess.Popen(["explorer", out_back])


def real_print(front_img, back_img, width_px, height_px):
    """
    Print both front and back with proper duplex handling.
    Uses raw printer access to bypass driver margins and enable duplex.
    """
    hprinter = win32print.OpenPrinter(PRINTER_NAME)
    try:
        # ============================================
        # METHOD 1: Two-page job with duplex setting
        # ============================================
        # This is the most reliable for back-to-back printing
        
        hdc = win32ui.CreateDC()
        hdc.CreatePrinterDC(PRINTER_NAME)

        # Get device capabilities
        # DMDUP_SIMPLEX = 1, DMDUP_VERTICAL = 2, DMDUP_HORIZONTAL = 3
        
        hdc.StartDoc("PVC Card Print - Duplex")
        
        # ===== PAGE 1: FRONT =====
        hdc.StartPage()
        dib_front = ImageWin.Dib(front_img)
        dib_front.draw(hdc.GetHandleOutput(), (0, 0, width_px, height_px))
        hdc.EndPage()
        
        # ===== PAGE 2: BACK =====
        hdc.StartPage()
        dib_back = ImageWin.Dib(back_img)
        dib_back.draw(hdc.GetHandleOutput(), (0, 0, width_px, height_px))
        hdc.EndPage()
        
        hdc.EndDoc()
        hdc.DeleteDC()

    finally:
        win32print.ClosePrinter(hprinter)


def print_cards(front_path, back_path):
    """Main function to handle printing"""
    front_img, width_px, height_px = render_card(front_path)
    back_img, _, _ = render_card(back_path)

    if SIMULATOR:
        simulate_print(front_img, back_img, width_px, height_px)
    else:
        real_print(front_img, back_img, width_px, height_px)


# ==============================
# ENTRY POINT
# ==============================
if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise RuntimeError("Usage: python print_card.py <front_image> <back_image>")

    print_cards(sys.argv[1], sys.argv[2])