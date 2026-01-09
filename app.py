import os
import io
import time
import cv2
import numpy as np
import torch
import threading
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from rembg import remove, new_session
from PIL import Image
from waitress import serve

# Real-ESRGAN & Face Restoration imports
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet
from gfpgan import GFPGANer
 
app = Flask(__name__)
CORS(app)

OUTPUT_DIR = "upscaled_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Global model variables
upsampler = None
face_restorer = None
rembg_session = None
device = 'cuda' if torch.cuda.is_available() else 'cpu'

def init_models():
    global upsampler, face_restorer, rembg_session
    print(f"--- Booting High-End AI Engine on {device} ---")

    # Path to your local weights
    # Using absolute paths to avoid any "file not found" issues
    realesrgan_path = os.path.join(os.getcwd(), 'weights', 'RealESRGAN_x2plus.pth')
    gfpgan_path = os.path.join(os.getcwd(), 'weights', 'GFPGANv1.3.pth')

    # 1. Setup Real-ESRGAN
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
    
    upsampler = RealESRGANer(
        scale=2,
        model_path=realesrgan_path, # Point to local file
        model=model,
        tile=400,
        tile_pad=10,
        pre_pad=0,
        half=True if device == 'cuda' else False,
        device=device
    )

    # 2. Setup GFPGAN
    face_restorer = GFPGANer(
        model_path=gfpgan_path, # Point to local file
        upscale=2,
        arch='clean',
        channel_multiplier=2,
        bg_upsampler=upsampler,
        device=device
    )

    # 3. Setup RemBG
    providers = [('CUDAExecutionProvider', {'device_id': 0}), 'CPUExecutionProvider']
    rembg_session = new_session("isnet-general-use", providers=providers)
    
    print("--- All Models Loaded Locally (No Internet Needed) ---")

threading.Thread(target=init_models, daemon=True).start()

@app.route('/remove-bg', methods=['POST'])
def process_image():

    print(f"--- Received request from {request.remote_addr} ---")
    
    if upsampler is None:
        return jsonify({"error": "AI models are still downloading/loading..."}), 503

    try:
        # 1. Read Image
        file_bytes = np.frombuffer(request.files['image'].read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        # 2. AI Restoration (Upscale + Face Fix)
        # face_restorer uses upsampler for the background and GFPGAN for faces
        _, _, restored_img = face_restorer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)

        # 3. Save the restored version locally
        timestamp = int(time.time())
        restored_path = os.path.join(OUTPUT_DIR, f"restored_{timestamp}.png")
        cv2.imwrite(restored_path, restored_img)

        # 4. Background Removal
        # Convert BGR to RGB for RemBG
        restored_rgb = cv2.cvtColor(restored_img, cv2.COLOR_BGR2RGB)
        no_bg_img = remove(restored_rgb, session=rembg_session, alpha_matting=True)

        # 5. Final output
        final_pil = Image.fromarray(no_bg_img)
        final_path = os.path.join(OUTPUT_DIR, f"final_{timestamp}.png")
        final_pil.save(final_path)

        buf = io.BytesIO()
        final_pil.save(buf, format="PNG")
        buf.seek(0)
        
        return send_file(buf, mimetype='image/png')

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/scan-signature', methods=['POST'])
def scan_signature():
    file = request.files['image'].read()
    npimg = np.frombuffer(file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)

    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 21, 10
    )

    kernel = np.ones((3, 3), np.uint8)
    thick_thresh = cv2.dilate(thresh, kernel, iterations=1)

    black_ink = np.zeros_like(gray)
    rgba = cv2.merge([black_ink, black_ink, black_ink, thick_thresh])

    clean_kernel = np.ones((2, 2), np.uint8)
    rgba = cv2.morphologyEx(rgba, cv2.MORPH_OPEN, clean_kernel)

    is_success, buffer = cv2.imencode(".png", rgba)
    return send_file(io.BytesIO(buffer), mimetype='image/png')

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000, threads=4)