import { Eye, EyeOff, Layers } from 'lucide-react';
import { useSimsStore } from '../../store/useSimsStore';
import type { WallViewMode } from '../../types/sims';

export function WallViewControls() {
  const { wallViewMode, setWallViewMode, viewMode } = useSimsStore();

  // Exibe o widget APENAS quando a visão 3D estiver ativa
  if (viewMode !== '3d') return null;

  const modes: { id: WallViewMode; label: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      id: 'full',
      label: 'Paredes Altas (2.8m)',
      icon: <Layers className="w-3.5 h-3.5" />,
      tooltip: 'Paredes em altura máxima completa de 2.8 metros em 3D',
    },
    {
      id: 'half',
      label: 'Meia Parede (1.4m)',
      icon: <Eye className="w-3.5 h-3.5" />,
      tooltip: 'Visão de corte em meia altura (1.4m) para inspeção do interior',
    },
    {
      id: 'low',
      label: 'Apenas Base (0.2m)',
      icon: <EyeOff className="w-3.5 h-3.5" />,
      tooltip: 'Paredes rebaixadas no nível do chão (0.2m) para demarcação de planta',
    },
  ];

  return (
    <div className="absolute top-4 right-6 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1.5 shadow-2xl select-none">
      <span className="text-[11px] text-slate-400 font-semibold px-2.5 flex items-center gap-1.5 border-r border-slate-800">
        <span>Altura 3D:</span>
      </span>

      {modes.map((m) => {
        const active = wallViewMode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setWallViewMode(m.id)}
            title={m.tooltip}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              active
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
