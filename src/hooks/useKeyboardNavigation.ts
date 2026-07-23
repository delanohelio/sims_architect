import { useEffect, useRef } from 'react';
import { useSimsStore } from '../store/useSimsStore';

export function useKeyboardNavigation() {
  const { 
    pan, 
    zoomIn, 
    zoomOut, 
    resetZoom, 
    rotateClockwise, 
    rotateCounterClockwise,
    doorsWindows,
    toggleDoorFlip,
    activeBuildTool,
    selectedDoorWindow
  } = useSimsStore();

  const keysPressedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o foco estiver em elementos de entrada de texto
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      keysPressedRef.current[e.code] = true;

      // Atalhos individuais imediatos
      if (e.code === 'KeyZ') {
        zoomIn();
      } else if (e.code === 'KeyC') {
        zoomOut();
      } else if (e.code === 'KeyX') {
        resetZoom();
      } else if (e.code === 'KeyQ') {
        rotateCounterClockwise();
      } else if (e.code === 'KeyE') {
        rotateClockwise();
      } else if (e.code === 'KeyR') {
        // Se houver portas instaladas, inverte a última ou a selecionada
        if (doorsWindows.length > 0) {
          const lastDoor = doorsWindows[doorsWindows.length - 1];
          toggleDoorFlip(lastDoor.id);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      delete keysPressedRef.current[e.code];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Loop de Navegação Contínua WASD / Setas (Pan suave)
    let animationFrameId: number;
    const speed = 12; // Pixels por frame

    const tick = () => {
      const keys = keysPressedRef.current;
      let dx = 0;
      let dy = 0;

      if (keys['KeyW'] || keys['ArrowUp']) dy += speed;
      if (keys['KeyS'] || keys['ArrowDown']) dy -= speed;
      if (keys['KeyA'] || keys['ArrowLeft']) dx += speed;
      if (keys['KeyD'] || keys['ArrowRight']) dx -= speed;

      if (dx !== 0 || dy !== 0) {
        pan(dx, dy);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pan, zoomIn, zoomOut, resetZoom, rotateClockwise, rotateCounterClockwise, doorsWindows, toggleDoorFlip, activeBuildTool, selectedDoorWindow]);
}
