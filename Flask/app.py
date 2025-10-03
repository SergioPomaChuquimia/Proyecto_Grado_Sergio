from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np, cv2, base64
from facenet import load_facenet_model, get_embedding

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:8000"])

model = load_facenet_model()

def base64_to_image(base64_str):
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    img_bytes = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

def encode_base64_bgr(img_bgr, quality=90):
    ok, buf = cv2.imencode('.jpg', img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    if not ok:
        return None
    b64 = base64.b64encode(buf.tobytes()).decode('utf-8')
    return f'data:image/jpeg;base64,{b64}'

def crop_with_margin(img, box, margin=0.30):
    x, y, w, h = box
    mx, my = int(margin * w), int(margin * h)
    x1 = max(0, x - mx); y1 = max(0, y - my)
    x2 = min(img.shape[1], x + w + mx); y2 = min(img.shape[0], y + h + my)
    return img[y1:y2, x1:x2]

def variance_of_laplacian(gray):
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

@app.post('/api/embed')
def api_embed():
    data = request.get_json() or {}
    img_b64 = data.get('image_base64')
    if not img_b64:
        return jsonify({"error": "image_base64 requerido"}), 400

    image = base64_to_image(img_b64)
    if image is None:
        return jsonify({"error": "Imagen inválida"}), 400

    emb_raw, det = get_embedding(model, image)
    if emb_raw is None or not det:
        return jsonify({"faces_detected": 0, "embedding": None}), 200

    face = crop_with_margin(image, det['box'], margin=0.30)

    if face is None or face.size == 0:
        return jsonify({"faces_detected": 0, "embedding": None}), 200
    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    sharp = variance_of_laplacian(gray)
    h, w = face.shape[:2]

    emb_face, _ = get_embedding(model, face)
    if emb_face is None:
        emb_face = emb_raw

    return jsonify({
        "faces_detected": 1,
        "box": det.get('box'),
        "confidence": float(det.get('confidence', 0.0)),
        "face_base64": encode_base64_bgr(face, quality=90),
        "sharpness": sharp,
        "size": {"w": int(w), "h": int(h)},
        "embedding": list(map(float, emb_face))
    }), 200

@app.get('/api/health')
def health():
    return {"status": "ok"}

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
