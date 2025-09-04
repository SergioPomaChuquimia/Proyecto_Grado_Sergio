from flask import Flask, request, jsonify
import numpy as np
import cv2
import base64
from facenet import load_facenet_model, get_embedding, load_saved_embedding, is_match
from flask_cors import CORS

app = Flask(__name__)
# Permitir CORS solo desde localhost:3000 (tu React)
CORS(app, origins=["http://localhost:3000"])

model = load_facenet_model()
saved_embedding = load_saved_embedding()

def base64_to_image(base64_str):
    # Elimina el encabezado 'data:image/...;base64,' si existe
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    img_bytes = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

@app.route('/api/verify_face', methods=['POST'])
def verify_face():
    if saved_embedding is None:
        return jsonify({'error': 'No registered embedding found.'}), 400

    data = request.get_json()
    img_base64 = data.get('image')
    if not img_base64:
        return jsonify({'error': 'No image provided.'}), 400

    image = base64_to_image(img_base64)
    embedding, box = get_embedding(model, image)
    if embedding is None:
        return jsonify({'result': 'no_face_detected'})

    match = is_match(saved_embedding, embedding)
    return jsonify({'result': 'registered' if match else 'not_registered'})

if __name__ == '__main__':
    app.run(debug=True)
