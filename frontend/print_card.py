import win32print
import win32ui
from PIL import Image, ImageWin
import sys
import os
import time
import tempfile
import subprocess
import json

# ==============================
# FIX FOR WINDOWS UNICODE
# ==============================
# Force UTF-8 output on Windows to handle Unicode characters
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ==============================
# CONFIG
# ==============================
PRINTER_NAME = "CX-D80 U1"
SIMULATOR = False   # <<< TURN OFF WHEN PRINTER IS READY
DPI = 300

# ==============================
# MARGIN HANDLING
# ==============================

def apply_margins(image, margins):
    """
    Apply margins to image by adding white space around it.
    
    margins: dict with keys 'top', 'bottom', 'left', 'right' (in pixels)
    """
    if not margins or all(v == 0 for v in margins.values()):
        return image
    
    top = margins.get('top', 0)
    bottom = margins.get('bottom', 0)
    left = margins.get('left', 0)
    right = margins.get('right', 0)
    
    # Create new image with margins
    new_width = image.width + left + right
    new_height = image.height + top + bottom
    
    # Create white background
    new_image = Image.new('RGB', (new_width, new_height), 'white')
    
    # Paste original image in center
    new_image.paste(image, (left, top))
    
    print(f"[apply_margins] Applied margins: L={left}px T={top}px R={right}px B={bottom}px")
    print(f"[apply_margins] New size: {new_width}x{new_height}px")
    
    return new_image

# ==============================
# CORE LOGIC
# ==============================

def render_card(image_path, margins=None):
    """
    Load card image and read ACTUAL dimensions from the image itself.
    Optionally apply margins.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(image_path)

    img = Image.open(image_path).convert("RGB")

    # Read actual image dimensions
    width_px, height_px = img.size
    
    print(f"[render_card] Loaded image: {width_px}x{height_px}px")

    # Apply margins if provided
    if margins:
        img = apply_margins(img, margins)
        width_px, height_px = img.size
        print(f"[render_card] After margins: {width_px}x{height_px}px")
    
    return img, width_px, height_px


def simulate_print(front_img, back_img, front_width, front_height, back_width, back_height):
    """Simulate print by saving to temp file"""
    out_dir = tempfile.gettempdir()
    out_front = os.path.join(out_dir, f"simulated_front_{int(time.time())}.png")
    out_back = os.path.join(out_dir, f"simulated_back_{int(time.time())}.png")

    front_img.save(out_front, "PNG")
    back_img.save(out_back, "PNG")

    print("SIMULATED PRINT SAVED TO:")
    print(f"FRONT: {out_front} ({front_width}x{front_height}px)")
    print(f"BACK:  {out_back} ({back_width}x{back_height}px)")

    # Auto-open both images
    try:
        subprocess.Popen(["explorer", out_front])
        subprocess.Popen(["explorer", out_back])
    except Exception as e:
        print(f"Could not open explorer: {e}")


def real_print(front_img, back_img, front_width, front_height, back_width, back_height):
    """
    Print both front and back with proper duplex handling.
    Uses the actual image dimensions (with margins applied if any).
    """
    print(f"[real_print] Printing to: {PRINTER_NAME}")
    print(f"[real_print] Front: {front_width}x{front_height}px")
    print(f"[real_print] Back:  {back_width}x{back_height}px")
    
    hprinter = win32print.OpenPrinter(PRINTER_NAME)
    try:

        hdc = win32ui.CreateDC()
        hdc.CreatePrinterDC(PRINTER_NAME)




        hdc.StartDoc("PVC Card Print - Duplex")

        # Get actual paper dimensions for centering
        # 8 = HORZRES, 10 = VERTRES, 110 = PHYSICALWIDTH, 111 = PHYSICALHEIGHT
        # 112 = PHYSICALOFFSETX, 113 = PHYSICALOFFSETY
        printable_w = hdc.GetDeviceCaps(8)
        printable_h = hdc.GetDeviceCaps(10)
        phys_w = hdc.GetDeviceCaps(110)
        phys_h = hdc.GetDeviceCaps(111)
        phys_off_x = hdc.GetDeviceCaps(112)
        phys_off_y = hdc.GetDeviceCaps(113)
        
        print(f"[real_print] Printable Area: {printable_w}x{printable_h}px")
        print(f"[real_print] Physical Paper: {phys_w}x{phys_h}px")
        print(f"[real_print] Physical Offsets: x={phys_off_x}, y={phys_off_y}")

        # ===== PAGE 1: FRONT =====
        print(f"[real_print] Printing FRONT page (Auto-Fit to {printable_w}x{printable_h})...")
        hdc.StartPage()
        
        # Auto-Fit: Draw to the full printable area (0, 0, W, H)
        # ImageWin.Dib handles the scaling automatically
        dib_front = ImageWin.Dib(front_img)
        dib_front.draw(hdc.GetHandleOutput(), (0, 0, printable_w, printable_h))
        hdc.EndPage()

        # ===== PAGE 2: BACK =====
        print(f"[real_print] Printing BACK page (Auto-Fit to {printable_w}x{printable_h})...")
        hdc.StartPage()

        # Auto-Fit: Draw to the full printable area (0, 0, W, H)
        dib_back = ImageWin.Dib(back_img)
        dib_back.draw(hdc.GetHandleOutput(), (0, 0, printable_w, printable_h))
        hdc.EndPage()

        hdc.EndDoc()
        hdc.DeleteDC()
        
        print("[real_print] Print job submitted successfully!")

    except Exception as e:
        print(f"[real_print] ERROR: {e}")
        raise
    finally:
        win32print.ClosePrinter(hprinter)


def print_cards(front_path, back_path, margins=None):
    """
    Main function to handle printing.
    Uses dynamic dimensions from actual images.
    Applies margins if provided.
    """
    print("=" * 70)
    print("PRINTING WITH DYNAMIC DIMENSIONS AND MARGINS")
    print("=" * 70)
    
    # Load both images and get their ACTUAL dimensions
    # Apply margins during loading
    front_img, front_width, front_height = render_card(front_path, margins)
    back_img, back_width, back_height = render_card(back_path, margins)
    
    print(f"\nImage dimensions loaded:")
    print(f"  Front: {front_width}x{front_height}px")
    print(f"  Back:  {back_width}x{back_height}px")
    
    # Verify dimensions match (sanity check)
    if front_width != back_width or front_height != back_height:
        print(f"\nWARNING: Front and back have different dimensions!")
        print(f"   Front: {front_width}x{front_height}px")
        print(f"   Back:  {back_width}x{back_height}px")
        print(f"   This may cause alignment issues.")
    
    if SIMULATOR:
        simulate_print(front_img, back_img, front_width, front_height, back_width, back_height)
    else:
        real_print(front_img, back_img, front_width, front_height, back_width, back_height)
    
    print("=" * 70)


# ==============================
# ENTRY POINT
# ==============================
if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise RuntimeError("Usage: python print_card.py <front_image> <back_image> [margins_json]")

    front_path = sys.argv[1]
    back_path = sys.argv[2]
    
    # Optional: Parse margins from JSON if provided
    margins = None
    if len(sys.argv) > 3:
        try:
            margins = json.loads(sys.argv[3])
            print(f"[main] Margins: {margins}")
        except json.JSONDecodeError as e:
            print(f"[main] Warning: Could not parse margins JSON: {e}")
            margins = None

    try:
        print_cards(front_path, back_path, margins)
        print("\n[SUCCESS] Print job completed successfully!")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)