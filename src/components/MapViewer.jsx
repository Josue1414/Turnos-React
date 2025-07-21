import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';

const MapViewer = ({ imageUrl, show, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setZoomLevel(1);
      setTranslateX(0);
      setTranslateY(0);
    }
  }, [show]);

  const clampTranslation = useCallback((newTranslateX, newTranslateY) => {
    if (!imageRef.current || !containerRef.current || zoomLevel === 1) {
      return { x: 0, y: 0 }; 
    }

    const imageDisplayedWidth = imageRef.current.offsetWidth;
    const imageDisplayedHeight = imageRef.current.offsetHeight;

    const currentImageScaledWidth = imageDisplayedWidth * zoomLevel;
    const currentImageScaledHeight = imageDisplayedHeight * zoomLevel;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    let maxX = 0;
    let maxY = 0;

    if (currentImageScaledWidth > containerWidth) {
      maxX = (currentImageScaledWidth - containerWidth) / 2;
    }
    if (currentImageScaledHeight > containerHeight) {
      maxY = (currentImageScaledHeight - containerHeight) / 2;
    }

    const clampedX = Math.max(-maxX, Math.min(maxX, newTranslateX));
    const clampedY = Math.max(-maxY, Math.min(maxY, newTranslateY));

    return { x: clampedX, y: clampedY };
  }, [zoomLevel]);


  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const scaleAmount = 0.1;
    let newZoomLevel = zoomLevel;

    if (e.deltaY < 0) { // Zoom in
      newZoomLevel = Math.min(zoomLevel + scaleAmount, 3);
    } else { // Zoom out
      newZoomLevel = Math.max(zoomLevel - scaleAmount, 1);
    }
    
    setZoomLevel(newZoomLevel);
    setTranslateX(prevX => clampTranslation(prevX, translateY).x);
    setTranslateY(prevY => clampTranslation(translateX, prevY).y);
  }, [zoomLevel, translateX, translateY, clampTranslation]);

  useEffect(() => {
    const container = containerRef.current;
    if (container && show) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [show, handleWheel]);


  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setDragging(true);
      setStartX(e.clientX);
      setStartY(e.clientY);
      if (imageRef.current) {
        imageRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging || zoomLevel === 1) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newTranslateX = translateX + deltaX;
    const newTranslateY = translateY + deltaY;
    
    const clamped = clampTranslation(newTranslateX, newTranslateY);
    setTranslateX(clamped.x);
    setTranslateY(clamped.y);

    setStartX(e.clientX);
    setStartY(e.clientY);
  };

  const handleMouseUp = () => {
    setDragging(false);
    if (imageRef.current) {
      imageRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
    }
  };

  const handleMouseLeave = () => {
    if (dragging) {
      setDragging(false);
      if (imageRef.current) {
        imageRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
      }
    }
  };

  const zoomIn = () => {
    const newZoomLevel = Math.min(zoomLevel + 0.2, 3);
    setZoomLevel(newZoomLevel);
    setTranslateX(prevX => clampTranslation(prevX, translateY).x);
    setTranslateY(prevY => clampTranslation(translateX, prevY).y);
  };

  const zoomOut = () => {
    const newZoomLevel = Math.max(zoomLevel - 0.2, 1);
    setZoomLevel(newZoomLevel);
    setTranslateX(prevX => clampTranslation(prevX, translateY).x);
    setTranslateY(prevY => clampTranslation(translateX, prevY).y);
  };

  const panAmount = 50;

  const pan = (direction) => {
    let newTranslateX = translateX;
    let newTranslateY = translateY;

    switch (direction) {
      case 'up':
        newTranslateY += panAmount; // Si el usuario espera que la imagen "baje" al presionar "arriba"
        break;
      case 'down':
        newTranslateY -= panAmount; // Si el usuario espera que la imagen "suba" al presionar "abajo"
        break;
      case 'left':
        newTranslateX += panAmount; // Si el usuario espera que la imagen se mueva "derecha" al presionar "izquierda"
        break;
      case 'right':
        newTranslateX -= panAmount; // Si el usuario espera que la imagen se mueva "izquierda" al presionar "derecha"
        break;
      default:
        break;
    }
    const clamped = clampTranslation(newTranslateX, newTranslateY);
    setTranslateX(clamped.x);
    setTranslateY(clamped.y);
  };

  const resetView = () => {
    setZoomLevel(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Croquis de Cajas</Modal.Title>
      </Modal.Header>
      <Modal.Body 
        ref={containerRef}
        className="d-flex justify-content-center align-items-center" 
        style={{ 
          overflow: 'hidden', 
          userSelect: 'none', 
          backgroundColor: '#e9ecef', 
          position: 'relative', 
          minHeight: '60vh', 
          maxHeight: '80vh' 
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {imageUrl ? (
          <div
            ref={imageRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              
              transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
              transformOrigin: '50% 50%',

              cursor: zoomLevel > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
              transition: dragging ? 'none' : 'transform 0.1s ease-out',
              willChange: 'transform',
              position: 'absolute',
              left: '0',
              top: '0',
              right: '0',
              bottom: '0',
            }}
          >
            <img
              src={imageUrl}
              alt="Croquis de Cajas Expandido"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                display: 'block' 
              }}
            />
          </div>
        ) : (
          <p>No se ha cargado ninguna imagen del croquis. Sube una desde el "Menú Admin".</p>
        )}

        {imageUrl && (
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1050 }}>
            <div className="d-flex flex-column align-items-center">
              <Button variant="dark" size="sm" onClick={() => pan('up')} className="mb-1">⬆️</Button>
              <div className="d-flex">
                <Button variant="dark" size="sm" onClick={() => pan('left')} className="me-1">⬅️</Button>
                <Button variant="dark" size="sm" onClick={resetView}>🔄</Button>
                <Button variant="dark" size="sm" onClick={() => pan('right')} className="ms-1">➡️</Button>
              </div>
              <Button variant="dark" size="sm" onClick={() => pan('down')} className="mt-1">⬇️</Button>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        {imageUrl && (
          <div className="d-flex align-items-center gap-2 mx-auto">
            <Button variant="dark" size="sm" onClick={zoomOut}>➖</Button>
            <Button variant="dark" size="sm" onClick={zoomIn}>➕</Button>
          </div>
        )}
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MapViewer;