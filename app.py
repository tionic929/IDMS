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
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024 # Allow up to 32MB
CORS(app)

# Safeguard: Max dimension before AI processing
MAX_INPUT_DIM = 1200 

upsampler = None
face_restorer = None
rembg_session = None
device = 'cuda' if torch.cuda.is_available() else 'cpu'

def init_models():
    global upsampler, face_restorer, rembg_session
    print(f"--- Booting High-End AI Engine on {device} ---")
    BASE_DIR = os.getcwd()
    realesrgan_path = os.path.join(BASE_DIR, 'weights', 'RealESRGAN_x2plus.pth')
    gfpgan_path = os.path.join(BASE_DIR, 'weights', 'GFPGANv1.3.pth')

    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
    upsampler = RealESRGANer(scale=2, model_path=realesrgan_path, model=model, tile=400, tile_pad=10, pre_pad=0, half=False, device=device)
    face_restorer = GFPGANer(model_path=gfpgan_path, upscale=2, arch='clean', channel_multiplier=2, bg_upsampler=upsampler, device=device)
    
    providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if device == 'cuda' else ['CPUExecutionProvider']
    rembg_session = new_session("isnet-general-use", providers=providers)
    print("--- AI Models Ready ---")

threading.Thread(target=init_models, daemon=True).start()

@app.route('/remove-bg', methods=['POST'])
def process_image():
    if face_restorer is None:
        return jsonify({"error": "AI models loading..."}), 503

    try:
        # 1. Read and Debug Input
        raw_data = request.files['image'].read()
        print(f"\n[DEBUG] Incoming file size: {len(raw_data) / (1024*1024):.2f} MB")

        file_bytes = np.frombuffer(raw_data, np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        # 2. Resize massive inputs for stability
        h, w = img.shape[:2]
        if max(h, w) > MAX_INPUT_DIM:
            scale = MAX_INPUT_DIM / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_LANCZOS4)
            print(f"[DEBUG] Resized input to {img.shape[1]}x{img.shape[0]}")

        # 3. AI Upscaling & Face Restoration
        # This doubles the size, so a 1200px image becomes 2400px
        _, _, restored_img = face_restorer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)
        restored_rgb = cv2.cvtColor(restored_img, cv2.COLOR_BGR2RGB)
        
        # 4. Background Removal (FIXED TO PREVENT CHOLESKY ERROR)
        # We disable alpha_matting here because it's unstable with upscaled AI images
        no_bg_img = remove(
            restored_rgb, 
            session=rembg_session, 
            alpha_matting=False # Set to False to stop the error
        )

        # 5. Post-Process Edges (Softens the cut without the math error)
        final_pil = Image.fromarray(no_bg_img)
        
        # 6. Save and Debug Output
        buf = io.BytesIO()
        # Using format="PNG" is high quality, but if files are too big, 
        # you can try format="WEBP", quality=85
        final_pil.save(buf, format="PNG")
        
        output_size_mb = buf.tell() / (1024 * 1024)
        print(f"[DEBUG] Final AI image size: {output_size_mb:.2f} MB")
        
        buf.seek(0)
        return send_file(buf, mimetype='image/png')

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/scan-signature', methods=['POST'])
def scan_signature():
    try:
        file = request.files['image'].read()
        npimg = np.frombuffer(file, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # Clean signature logic
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 21, 10
        )

        # Thicken lines slightly for better printing
        kernel = np.ones((3, 3), np.uint8)
        thick_thresh = cv2.dilate(thresh, kernel, iterations=1)

        black_ink = np.zeros_like(gray)
        rgba = cv2.merge([black_ink, black_ink, black_ink, thick_thresh])

        # Remove noise
        clean_kernel = np.ones((2, 2), np.uint8)
        rgba = cv2.morphologyEx(rgba, cv2.MORPH_OPEN, clean_kernel)

        is_success, buffer = cv2.imencode(".png", rgba)
        return send_file(io.BytesIO(buffer), mimetype='image/png')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000, threads=4, channel_timeout=300)
