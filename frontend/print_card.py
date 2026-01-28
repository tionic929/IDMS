import win32print
import win32ui
from PIL import Image, ImageWin
import sys
import os
import time
import tempfile
import subprocess

# ==============================
# CONFIG
# ==============================
PRINTER_NAME = "CX-D80 U1"
SIMULATOR = True   # <<< TURN OFF WHEN PRINTER IS READY
DPI = 300

CARD_WIDTH_MM = 54
CARD_HEIGHT_MM = 86

# ==============================
# CORE LOGIC
# ==============================
def render_card(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(image_path)

    width_px = int((CARD_WIDTH_MM / 25.4) * DPI)
    height_px = int((CARD_HEIGHT_MM / 25.4) * DPI)

    img = Image.open(image_path).convert("RGB")

    # Overprint bleed
    img = img.resize(
        (width_px + 8, height_px + 8),
        Image.LANCZOS
    )

    return img, width_px, height_px


def simulate_print(img, width_px, height_px):
    out_dir = tempfile.gettempdir()
    out_path = os.path.join(
        out_dir,
        f"simulated_print_{int(time.time())}.png"
    )

    canvas = Image.new("RGB", (width_px, height_px), (255, 255, 255))
    canvas.paste(img, (-4, -4))

    canvas.save(out_path, "PNG")

    print("SIMULATED PRINT SAVED TO:")
    print(out_path)

    # Auto-open image (Windows)
    subprocess.Popen(["explorer", out_path])


def real_print(img, width_px, height_px):
    hprinter = win32print.OpenPrinter(PRINTER_NAME)
    try:
        hdc = win32ui.CreateDC()
        hdc.CreatePrinterDC(PRINTER_NAME)

        hdc.StartDoc("PVC Card Print")
        hdc.StartPage()

        dib = ImageWin.Dib(img)
        dib.draw(
            hdc.GetHandleOutput(),
            (-4, -4, width_px + 4, height_px + 4)
        )

        hdc.EndPage()
        hdc.EndDoc()
        hdc.DeleteDC()

    finally:
        win32print.ClosePrinter(hprinter)


def print_image(image_path):
    img, width_px, height_px = render_card(image_path)

    if SIMULATOR:
        simulate_print(img, width_px, height_px)
    else:
        real_print(img, width_px, height_px)


# ==============================
# ENTRY POINT
# ==============================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise RuntimeError("No image path provided")

    print_image(sys.argv[1])
