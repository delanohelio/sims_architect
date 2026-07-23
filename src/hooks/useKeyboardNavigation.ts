import { useEffect, useRef } from 'react';
import { useSimsStore } from '../store/useSimsStore';

export function useKeyboardNavigation() {
  const keysPressedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o foco estiver em elementos de entrada de texto
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      keysPressedRef.current[e.code] = true;

      const store = useSimsStore.getState();

      // Executa atalhos individuais apenas quando estiver no Modo 2D (Modo 3D possui controle próprio)
      if (store.viewMode === '2d') {
        if (e.code === 'KeyZ') {
          store.zoomIn();
        } else if (e.code === 'KeyC') {
          store.zoomOut();
        } else if (e.code === 'KeyX') {
          store.resetZoom();
        } else if (e.code === 'KeyQ') {
          store.rotateCounterClockwise();
        } else if (e.code === 'KeyE') {
          store.rotateClockwise();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      delete keysPressedRef.current[e.code];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Loop de Navegação Contínua WASD / Setas no Modo 2D (Pan suave)
    let animationFrameId: number;
    const speed = 12; // Pixels por frame

    const tick = () => {
      const store = useSimsStore.getState();
      if (store.viewMode === '2d') {
        const keys = keysPressedRef.current;
        let dx = 0;
        let dy = 0;

        if (keys['KeyW'] || keys['ArrowUp']) dy += speed;
        if (keys['KeyS'] || keys['ArrowDown']) dy -= speed;
        if (keys['KeyA'] || keys['ArrowLeft']) dx += speed;
        if (keys['KeyD'] || keys['ArrowRight']) dx -= speed;

        if (dx !== 0 || dy !== 0) {
          store.pan(dx, dy);
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
}
