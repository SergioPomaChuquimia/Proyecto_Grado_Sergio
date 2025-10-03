import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const CapturePhoto = ({ onCapture }) => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
    onCapture(imageSrc);
  }, [onCapture]);

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width="100%"
        videoConstraints={{ facingMode: "user" }}
      />
      <button onClick={capture}>Capturar Foto</button>
      {image && (
        <div>
          <h3>Vista previa:</h3>
          <img src={image} alt="captura" />
        </div>
      )}
    </div>
  );
};

export default CapturePhoto;
