import cv2
import numpy as np
from keras_facenet import FaceNet
from scipy.spatial.distance import cosine
import os
import time


def load_facenet_model():
    return FaceNet()

def get_embedding(model, image):
    detections = model.extract(image, threshold=0.95)
    for det in detections:
        emb = det.get('embedding')
        if emb is not None and len(emb) == 512:
            return emb, det['box']
    return None, None

def save_embedding(embedding, path='user_embedding.npy'):
    if embedding is not None:
        np.save(path, embedding)
        print("💾 Embedding guardado correctamente.")
    else:
        print("⚠️ Embedding inválido. No se guardó nada.")

def load_saved_embedding(path='user_embedding.npy'):
    if os.path.exists(path):
        emb = np.load(path)
        print("📂 Embedding cargado correctamente.")
        return emb
    else:
        print("❌ No se encontró el archivo de embedding.")
        return None

def is_match(known, current, threshold=0.8):
    similarity = 1 - cosine(known, current)
    print(f"🔎 Similitud: {similarity:.3f}")
    return similarity > threshold

# -------------------------------
def register_from_image(model, image_path):
    print(f"🖼️ Cargando imagen: {image_path}")
    image = cv2.imread(image_path)
    if image is None:
        print("❌ Error: No se pudo cargar la imagen.")
        return

    embedding, box = get_embedding(model, image)
    if embedding is not None and box:
        x, y, w, h = box
        face_crop = image[y:y+h, x:x+w]
        cv2.imwrite("registro.jpg", face_crop)
        save_embedding(embedding)
        print("✅ Rostro detectado, recortado y registrado.")
    else:
        print("❌ No se detectó ningún rostro válido en la imagen.")



def realtime_verification(model):
    saved_embedding = load_saved_embedding()
    if saved_embedding is None:
        print("❌ No hay embedding guardado. Ejecuta el registro primero.")
        return

    cap = cv2.VideoCapture(0)
    print("🔍 Verificacion en tiempo real. Acércate al centro de la cámara.")

    last_check = 0
    check_interval = 0.8  # segundos

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        frame = cv2.resize(frame, (640, 480))
        current_time = time.time()

        if current_time - last_check >= check_interval:
            embedding, box = get_embedding(model, frame)
            last_check = current_time
        else:
            embedding, box = None, None

        if box:
            x, y, w, h = box
            if embedding is not None and is_match(saved_embedding, embedding):
                label = "SI REGISTRADO"
                color = (0, 255, 0)
                print("🟢 SI REGISTRADO")
            else:
                label = "NO REGISTRADO"
                color = (0, 0, 255)
                print("🔴 NO REGISTRADO")
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            cv2.putText(frame, label, (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        else:
            h, w, _ = frame.shape
            cv2.rectangle(frame, (int(w/4), int(h/4)),
                          (int(3*w/4), int(3*h/4)), (0, 0, 255), 2)

        cv2.imshow("Verificacion facial", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("👋 Verificacion finalizada.")
            break

    cap.release()
    cv2.destroyAllWindows()

# -------------------------------
def main():
    model = load_facenet_model()
    
    # Solo registra si aún no existe
    if not os.path.exists('user_embedding.npy'):
        image_path = "selfie.jpg"  # Cambia este nombre por el tuyo si es necesario
        register_from_image(model, image_path)
        time.sleep(1)

    realtime_verification(model)

if __name__ == "__main__":
    main()
