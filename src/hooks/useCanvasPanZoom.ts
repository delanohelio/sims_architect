import { useState, useCallback, useRef, useEffect } from 'react';
import { useSimsStore } from '../store/useSimsStore';

export function useCanvasPanZoom(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { viewState, terrain, setZoom, pan, setCursorPos, rotateClockwise, rotateCounterClockwise } = useSimsStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const screenToTerrainCoords = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0, gridX: 0, gridY: 0, isInside: false };

      const rect = canvasRef.current.getBoundingClientRect();
      const relativeX = screenX - rect.left;
      const relativeY = screenY - rect.top;

      const pixelX = relativeX - viewState.panX;
      const pixelY = relativeY - viewState.panY;

      const unzoomedX = pixelX / viewState.zoom;
      const unzoomedY = pixelY / viewState.zoom;

      const cellSize = terrain.cellSizePixels;
      const centerX = (terrain.width * cellSize) / 2;
      const centerY = (terrain.length * cellSize) / 2;

      const rad = (-viewState.rotation * Math.PI) / 180;
      const dx = unzoomedX - centerX;
      const dy = unzoomedY - centerY;

      const rotatedX = dx * Math.cos(rad) - dy * Math.sin(rad) + centerX;
      const rotatedY = dx * Math.sin(rad) + dy * Math.cos(rad) + centerY;

      const meterX = rotatedX / cellSize;
      const meterY = rotatedY / cellSize;

      const gridX = Math.floor(meterX);
      const gridY = Math.floor(meterY);

      const isInside =
        meterX >= 0 && meterX <= terrain.width && meterY >= 0 && meterY <= terrain.length;

      return {
        x: Number(meterX.toFixed(2)),
        y: Number(meterY.toFixed(2)),
        gridX: isInside ? gridX : null,
        gridY: isInside ? gridY : null,
        isInside,
      };
    },
    [canvasRef, viewState.panX, viewState.panY, viewState.zoom, viewState.rotation, terrain.cellSizePixels, terrain.width, terrain.length]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = screenToTerrainCoords(e.clientX, e.clientY);
      setCursorPos({
        x: coords.x,
        y: coords.y,
        gridX: coords.gridX,
        gridY: coords.gridY,
        snapVertexX: coords.isInside ? Math.round(coords.x) : null,
        snapVertexY: coords.isInside ? Math.round(coords.y) : null,
        isInsideTerrain: coords.isInside,
      });

      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        pan(deltaX, deltaY);
      }
    },
    [isDragging, pan, screenToTerrainCoords, setCursorPos]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
      const newZoom = viewState.zoom + zoomDelta;

      setZoom(newZoom, mouseX, mouseY);
    },
    [canvasRef, viewState.zoom, setZoom]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        rotateCounterClockwise();
      } else if (e.key === 'e' || e.key === 'E') {
        rotateClockwise();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotateClockwise, rotateCounterClockwise]);

  return {
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    screenToTerrainCoords,
  };
}
