import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Maximize, 
  MousePointer, 
  Move, 
  Box,
  Compass
} from 'lucide-react';
import { useSimsStore } from '../../store/useSimsStore';

export function CanvasHUD() {
  const { 
    terrain, 
    viewState, 
    zoomIn, 
    zoomOut, 
    resetZoom, 
    rotateClockwise,
    rotateCounterClockwise,
    resetRotation,
    centerTerrainInViewport, 
    cursorPos 
  } = useSimsStore();

  const zoomPercentage = Math.round(viewState.zoom * 100);
  const currentAngle = viewState.rotation;

  const handleFitScreen = () => {
    centerTerrainInViewport(window.innerWidth, window.innerHeight);
  };

  const getCompassDirectionLabel = (angle: number) => {
    switch (angle) {
      case 0: return 'Norte (0°)';
      case 90: return 'Leste (90°)';
      case 180: return 'Sul (180°)';
      case 270: return 'Oeste (270°)';
      default: return `${angle}°`;
    }
  };

  return (
    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none z-20 select-none">
      {/* HUD Esquerda: Dimensões do Terreno e Leitura de Coordenadas */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Card Terreno */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 px-4 text-xs shadow-2xl flex items-center gap-3 text-slate-200">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {terrain.width}m × {terrain.length}m
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {terrain.width * terrain.length} m²
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Escala: 1m² por quadrante</p>
          </div>
        </div>

        {/* Card Coordenadas em Tempo Real */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 px-4 text-xs shadow-2xl flex items-center gap-3 text-slate-200">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <MousePointer className="w-4 h-4" />
          </div>
          <div>
            {cursorPos.isInsideTerrain ? (
              <div>
                <div className="flex items-center gap-2 font-mono text-white">
                  <span>X: <strong className="text-cyan-400">{cursorPos.x}m</strong></span>
                  <span>Y: <strong className="text-cyan-400">{cursorPos.y}m</strong></span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span>Quadrante:</span>
                  <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 rounded border border-amber-500/20">
                    [{cursorPos.gridX}, {cursorPos.gridY}]
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-slate-400 text-[11px]">Fora do Lote</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Passe o mouse no terreno</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HUD Centro: Dica de Navegação */}
      <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800/80 text-[11px] text-slate-400 shadow-xl pointer-events-auto">
        <Move className="w-3.5 h-3.5 text-emerald-400" />
        <span>Arraste para Pan • Scroll Zoom • <strong className="text-emerald-400">Q / E</strong> para Girar</span>
      </div>

      {/* HUD Direita: Controles de Câmera (Zoom e Rotação) */}
      <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1.5 shadow-2xl pointer-events-auto text-xs text-slate-300">
        {/* Controles de Rotação */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60">
          <button
            onClick={rotateCounterClockwise}
            title="Girar 90° Anti-horário (Teclas: Q)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Bússola Interativa */}
          <button
            onClick={resetRotation}
            title="Clique para Resetar Visão Norte (0°)"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-mono font-semibold text-emerald-400 transition-all border border-slate-800"
          >
            <Compass 
              className="w-3.5 h-3.5 transition-transform duration-300 text-emerald-400"
              style={{ transform: `rotate(${-currentAngle}deg)` }}
            />
            <span className="text-[10px]">{getCompassDirectionLabel(currentAngle)}</span>
          </button>

          <button
            onClick={rotateClockwise}
            title="Girar 90° Horário (Teclas: E)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-slate-800 my-auto mx-0.5" />

        {/* Controles de Zoom */}
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="px-2 font-mono font-bold text-white text-xs w-14 text-center">
          {zoomPercentage}%
        </span>

        <button
          onClick={zoomIn}
          title="Zoom In"
          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={resetZoom}
          title="Reset Zoom 100%"
          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
        >
          <span className="text-[10px] font-bold">1:1</span>
        </button>

        <button
          onClick={handleFitScreen}
          title="Enquadrar Terreno na Tela"
          className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95 flex items-center gap-1 font-semibold text-[11px]"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span>Ajustar</span>
        </button>
      </div>
    </div>
  );
}
