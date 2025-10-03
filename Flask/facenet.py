from keras_facenet import FaceNet

def load_facenet_model():
    return FaceNet()

def get_embedding(model, image):
    # Devuelve (embedding, det) donde det trae 'box', 'confidence', etc.
    detections = model.extract(image, threshold=0.95)
    for det in detections:
        emb = det.get('embedding')
        if emb is not None and len(emb) == 512:
            return emb, det
    return None, None
