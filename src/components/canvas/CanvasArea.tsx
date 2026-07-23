import React, { useRef } from 'react';
import { useSimsStore } from '../../store/useSimsStore';
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer';
import { useBuildInteractions } from '../../hooks/useBuildInteractions';
import { Viewport3D } from './Viewport3D';
import { WallViewControls } from './WallViewControls';
import { Move, Compass, Sliders, Sofa } from 'lucide-react';

export function CanvasArea() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    terrain,
    viewState,
    gridSettings,
    viewMode,
    activeMode,
    activeBuildTool,
    setCursorPos,
    pan,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    resetRotation,
  } = useSimsStore();

  const {
    handlePointerDown,
    handlePointerUp,
    isSpacePressed,
    draftWall,
    draftFloorRect,
    hoveredTarget,
    hoveredWallTarget,
    pendingFurniturePreview,
  } = useBuildInteractions();

  useCanvasRenderer(canvasRef, {
    draftWall,
    draftFloorRect,
    hoveredTarget,
    hoveredWallTarget,
    pendingFurniturePreview,
  });

  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const updateCursorFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mousePxX = e.clientX - rect.left;
    const mousePxY = e.clientY - rect.top;

    const cellSize = terrain.cellSizePixels;
    const terrainWidthPx = terrain.width * cellSize;
    const terrainLengthPx = terrain.length * cellSize;

    const centerX = terrainWidthPx / 2;
    const centerY = terrainLengthPx / 2;

    const relX = mousePxX - viewState.panX - centerX;
    const relY = mousePxY - viewState.panY - centerY;

    const rad = (-viewState.rotation * Math.PI) / 180;
    const rotX = relX * Math.cos(rad) - relY * Math.sin(rad);
    const rotY = relX * Math.sin(rad) + relY * Math.cos(rad);

    const worldPxX = rotX + centerX;
    const worldPxY = rotY + centerY;

    const worldScale = viewState.zoom * cellSize;

    const meterX = worldPxX / worldScale;
    const meterY = worldPxY / worldScale;

    const isInside = meterX >= 0 && meterX <= terrain.width && meterY >= 0 && meterY <= terrain.length;

    const gridX = isInside ? Math.floor(meterX) : null;
    const gridY = isInside ? Math.floor(meterY) : null;

    const snapStep = gridSettings.snapToGrid ? (gridSettings.showSubgrid ? 0.5 : 1.0) : 0.1;
    const snapVertexX = isInside ? Math.round(meterX / snapStep) * snapStep : null;
    const snapVertexY = isInside ? Math.round(meterY / snapStep) * snapStep : null;

    setCursorPos({
      x: isInside ? Number(meterX.toFixed(2)) : null,
      y: isInside ? Number(meterY.toFixed(2)) : null,
      gridX,
      gridY,
      snapVertexX,
      snapVertexY,
      isInsideTerrain: isInside,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updateCursorFromEvent(e);

    if (isPanningRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      pan(deltaX, deltaY);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerDownWrapper = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeMode === 'settings') {
      if (e.button === 0 || e.button === 1 || isSpacePressed) {
        isPanningRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      isPanningRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0 && (activeMode === 'build' || activeMode === 'buy')) {
      handlePointerDown(e);
    }
  };

  const handlePointerUpWrapper = () => {
    isPanningRef.current = false;
    handlePointerUp();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom(viewState.zoom + delta, focalX, focalY);
  };

  if (viewMode === '3d') {
    return (
      <div className="relative w-full h-full">
        <Viewport3D />
        <WallViewControls />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-slate-950 select-none ${
        activeMode === 'settings' || isSpacePressed || isPanningRef.current
          ? 'cursor-grab active:cursor-grabbing'
          : activeBuildTool === 'eraser'
          ? 'cursor-crosshair'
          : 'cursor-crosshair'
      }`}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDownWrapper}
        onPointerUp={handlePointerUpWrapper}
        onPointerLeave={handlePointerUpWrapper}
        onWheel={handleWheel}
        className="w-full h-full block touch-none"
      />

      {/* HUD BADGE INDICATIVO DA FERRAMENTA OU MODO ATIVO */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-3 pointer-events-none">
        <div className="px-3 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/90 text-xs text-slate-300 shadow-xl flex items-center gap-2">
          {activeMode === 'settings' ? (
            <>
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">Configurações do Lote • Clique e Arraste para Mover (Pan)</span>
            </>
          ) : activeMode === 'buy' ? (
            <>
              <Sofa className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-semibold text-white">
                {pendingFurniturePreview
                  ? 'Modo Compra: Clique para Posicionar o Móvel (Tecla R: Rotacionar +45°)'
                  : 'Modo Compra: Selecione um móvel ou clique em um existente para Mover'}
              </span>
            </>
          ) : (
            <>
              {activeBuildTool === 'wall' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              {activeBuildTool === 'wall_paint' && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
              {activeBuildTool === 'floor' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              {activeBuildTool === 'door_window' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
              {activeBuildTool === 'eraser' && <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />}
              <span className="font-semibold capitalize text-white">
                {activeBuildTool === 'wall' && 'Parede: Clique e Arraste'}
                {activeBuildTool === 'wall_paint' && 'Pintar Parede: O sombreamento indica o lado a ser pintado'}
                {activeBuildTool === 'floor' && 'Piso: Clique e Arraste Área'}
                {activeBuildTool === 'door_window' && 'Esquadria: Posicione na Parede'}
                {activeBuildTool === 'eraser' && 'Marreta: Clique no Objeto'}
              </span>
            </>
          )}
        </div>

        {viewState.rotation !== 0 && (
          <button
            onClick={resetRotation}
            className="pointer-events-auto px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-xs text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-xl transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Resetar Rotação ({viewState.rotation}°)</span>
          </button>
        )}
      </div>

      <div className="absolute top-4 right-6 z-20 px-3 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/90 text-xs text-slate-300 shadow-xl flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Move className="w-3.5 h-3.5 text-slate-400" />
          <span>WASD: Pan</span>
        </span>
        <span className="flex items-center gap-1">
          <span>Z/C/X: Zoom</span>
        </span>
        <span className="flex items-center gap-1">
          <span>Q/E/F/V: Rotação 3D</span>
        </span>
        <span className="flex items-center gap-1">
          <span>R: Girar Móvel (+45°)</span>
        </span>
      </div>

      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1 shadow-2xl text-xs">
          <button
            onClick={zoomIn}
            className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 font-bold hover:text-white transition-all"
          >
            +
          </button>
          <button
            onClick={resetZoom}
            className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 font-mono text-[11px] hover:text-white transition-all"
          >
            {Math.round(viewState.zoom * 100)}%
          </button>
          <button
            onClick={zoomOut}
            className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 font-bold hover:text-white transition-all"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}
