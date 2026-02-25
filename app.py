import os
import io
import time
import cv2
import numpy as np
import torch
import threading
import requests
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

# Configuration
LARAVEL_API_URL = "http://localhost:8000/api/students"
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

def process_id_picture(file_bytes):
    """Enhance face and remove background."""
    img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    if max(h, w) > MAX_INPUT_DIM:
        scale = MAX_INPUT_DIM / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_LANCZOS4)
    
    _, _, restored_img = face_restorer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)
    restored_rgb = cv2.cvtColor(restored_img, cv2.COLOR_BGR2RGB)
    
    no_bg_img = remove(restored_rgb, session=rembg_session, alpha_matting=False)
    final_pil = Image.fromarray(no_bg_img)
    
    buf = io.BytesIO()
    final_pil.save(buf, format="PNG")
    buf.seek(0)
    return buf

def process_sig_picture(file_bytes):
    """Clean and sharpen signature."""
    img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
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
    return io.BytesIO(buffer)

@app.route('/application-submit', methods=['POST'])
def bridge_application():
    if face_restorer is None:
        return jsonify({"error": "AI models loading..."}), 503

    try:
        # 1. Extract form data
        form_data = request.form.to_dict()
        print(f"\n[BRIDGE] Received application for: {form_data.get('firstName')} {form_data.get('lastName')}")

        # 2. Process Pictures if they exist
        files_to_forward = {}
        
        if 'id_picture' in request.files:
            print("[BRIDGE] Processing ID Picture...")
            id_buf = process_id_picture(request.files['id_picture'].read())
            files_to_forward['id_picture'] = ('id.png', id_buf, 'image/png')

        if 'signature_picture' in request.files:
            print("[BRIDGE] Processing Signature...")
            sig_buf = process_sig_picture(request.files['signature_picture'].read())
            files_to_forward['signature_picture'] = ('sig.png', sig_buf, 'image/png')

        # 3. Forward to Laravel
        print(f"[BRIDGE] Forwarding to Laravel: {LARAVEL_API_URL}")
        response = requests.post(
            LARAVEL_API_URL,
            data=form_data,
            files=files_to_forward,
            timeout=30
        )

        # 4. Return Laravel's response back to original caller
        return (response.content, response.status_code, response.headers.items())

    except Exception as e:
        print(f"[BRIDGE ERROR] {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/remove-bg', methods=['POST'])
def api_remove_bg():
    # Legacy support (internal use)
    if face_restorer is None: return jsonify({"error": "AI models loading..."}), 503
    try:
        buf = process_id_picture(request.files['image'].read())
        return send_file(buf, mimetype='image/png')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/scan-signature', methods=['POST'])
def api_scan_signature():
    # Legacy support (internal use)
    try:
        buf = process_sig_picture(request.files['image'].read())
        return send_file(buf, mimetype='image/png')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000, threads=4, channel_timeout=300)
