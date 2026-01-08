from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from rembg import remove, new_session
from PIL import Image, ImageFilter
import io
import numpy as np
import cv2
import threading
import onnxruntime as ort
import os

# -----------------------------
# Flask app setup
# -----------------------------
app = Flask(__name__)
CORS(app)

# -----------------------------
# Max image dimension for speed
# -----------------------------
MAX_DIM = 1024

# -----------------------------
# Model session (load asynchronously)
# -----------------------------
session = None

def load_model():
    global session
    print("Loading U2Net model...")
    # Explicitly try to use GPU providers
    providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
    session = new_session("u2net_human_seg", providers=providers)
    print(f"✅ Model loaded using: {session.inner_session.get_providers()}")

# Start model loading in background
threading.Thread(target=load_model, daemon=True).start()

# -----------------------------
# Check for GPU
# -----------------------------
gpu_available = any("CUDA" in p.upper() for p in ort.get_available_providers())
print("ONNX Runtime GPU available:", gpu_available)
print("Available providers:", ort.get_available_providers())

# -----------------------------
# /remove-bg endpoint
# -----------------------------
@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    global session
    if session is None:
        return jsonify({"error": "Model is still loading, please try again shortly."}), 503

    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']
    THRESHOLD = 128
    SOFTNESS_FACTOR = 1.5
    FILL_HOLES = True

    try:
        input_data = file.read()
        original_img = Image.open(io.BytesIO(input_data)).convert("RGBA")

        # Resize large images to MAX_DIM for speed
        original_img.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)
        buf = io.BytesIO()
        original_img.save(buf, format="PNG")
        input_data = buf.getvalue()

        # Remove background
        output_bytes = remove(
            input_data,
            session=session,
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10
        )

        rembg_result = Image.open(io.BytesIO(output_bytes)).convert("RGBA")
        alpha = rembg_result.split()[3]

        # Threshold alpha
        alpha = alpha.point(lambda p: 255 if p > THRESHOLD else 0)

        if FILL_HOLES:
            alpha_np = np.array(alpha)
            contours, _ = cv2.findContours(alpha_np, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            mask = np.zeros_like(alpha_np)
            cv2.drawContours(mask, contours, -1, 255, thickness=cv2.FILLED)
            alpha = Image.fromarray(mask)

        if SOFTNESS_FACTOR > 0:
            alpha = alpha.filter(ImageFilter.GaussianBlur(radius=SOFTNESS_FACTOR))

        original_img.putalpha(alpha)

        buffer = io.BytesIO()
        original_img.save(buffer, format="PNG")
        buffer.seek(0)

        return send_file(buffer, mimetype='image/png')

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# /scan-signature endpoint
# -----------------------------
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
    from waitress import serve
    print("Starting server on http://0.0.0.0:5000 ...")
    serve(app, host='0.0.0.0', port=5000, threads=2, connection_limit=10)
