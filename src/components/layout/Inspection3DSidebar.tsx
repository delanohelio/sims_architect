import { 
  Box, 
  Layers, 
  DoorClosed, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Palette, 
  Info,
  Maximize2
} from 'lucide-react';
import { useSimsStore } from '../../store/useSimsStore';
import type { WallViewMode } from '../../types/sims';

export function Inspection3DSidebar() {
  const { 
    terrain, 
    walls, 
    floors, 
    doorsWindows, 
    wallViewMode, 
    setWallViewMode,
    selectedWallColor
  } = useSimsStore();

  // Cálculo de Métricas do Projeto
  const totalFloorArea = Object.keys(floors).length;
  
  const totalWallLength = walls.reduce((sum, w) => {
    return sum + Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
  }, 0);

  const doorCount = doorsWindows.filter((dw) => dw.type === 'door').length;
  const windowCount = doorsWindows.filter((dw) => dw.type === 'window').length;

  const wallModes: { id: WallViewMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'full',
      label: 'Paredes Altas (2.8m)',
      desc: 'Visualização tridimensional completa de 2.8 metros',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'half',
      label: 'Meia Parede (1.4m)',
      desc: 'Corte em meia altura para inspeção dos cômodos',
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'low',
      label: 'Baixar Paredes / Apenas Base (0.2m)',
      desc: 'Rebaixa todas as paredes no chão para vista aérea total',
      icon: <EyeOff className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <aside className="w-88 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] z-20 shadow-2xl select-none overflow-y-auto custom-scrollbar">
      {/* Topo: Modo Inspeção 3D */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Modo Inspeção 3D</h2>
            <p className="text-[11px] text-slate-400">Resumo da Maquete & Visualização</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* 1. OPÇÕES DE VISUALIZAÇÃO 3D (BAIXAR PAREDES) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Modos de Visibilidade das Paredes</span>
          </label>

          <div className="grid grid-cols-1 gap-2">
            {wallModes.map((m) => {
              const isSelected = wallViewMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setWallViewMode(m.id)}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/80 text-white ring-1 ring-cyan-500/40 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0 mt-0.5">
                    {m.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">{m.label}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. RESUMO DO PROJETO ARQUITETÔNICO */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Resumo do Projeto</span>
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Área de Piso */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <Palette className="w-3.5 h-3.5" />
                <span>Piso Construído</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 font-mono">{totalFloorArea} m²</div>
              <span className="text-[10px] text-slate-500">Área interna pavimentada</span>
            </div>

            {/* Paredes Totais */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>Paredes</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 font-mono">{totalWallLength.toFixed(1)} m</div>
              <span className="text-[10px] text-slate-500">{walls.length} segmentos</span>
            </div>

            {/* Portas */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                <DoorClosed className="w-3.5 h-3.5" />
                <span>Portas</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 font-mono">{doorCount}</div>
              <span className="text-[10px] text-slate-500">Entradas instaladas</span>
            </div>

            {/* Janelas */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Janelas</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 font-mono">{windowCount}</div>
              <span className="text-[10px] text-slate-500">Aberturas de luz</span>
            </div>
          </div>
        </div>

        {/* 3. INFORMAÇÕES DE TERRENO E COR */}
        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Dimensão do Terreno:</span>
            <span className="font-bold text-white">{terrain.width}m × {terrain.length}m</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Cor de Parede Ativa:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full border border-slate-600" style={{ backgroundColor: selectedWallColor }} />
              <span className="font-mono text-[11px] text-slate-200 uppercase">{selectedWallColor}</span>
            </div>
          </div>
        </div>

        {/* Dicas de Navegação */}
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>No modo 3D, use <strong>WASD</strong> para mover a visão, <strong>Q / E</strong> para girar e <strong>Z / C / X</strong> para zoom!</span>
        </div>
      </div>
    </aside>
  );
}
