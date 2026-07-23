import { 
  Settings, 
  Hammer, 
  ShoppingBag, 
  Download, 
  Maximize2, 
  Sparkles,
  Layers,
  Box,
  Layout
} from 'lucide-react';
import { useSimsStore } from '../../store/useSimsStore';

interface ModeButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}

function ModeButton({ label, icon, active, disabled, badge, onClick }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `${label} estará disponível em breve nas próximas fases!` : label}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
          : disabled
          ? 'opacity-45 cursor-not-allowed bg-slate-800/40 text-slate-400 border border-slate-700/30'
          : 'bg-slate-800/60 text-slate-200 hover:bg-slate-700/70 hover:text-white border border-slate-700/50'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900/80 text-amber-400 border border-amber-500/30">
          {badge}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const { 
    terrain, 
    activeMode, 
    setMode, 
    viewMode, 
    setViewMode, 
    setSetupModalOpen, 
    centerTerrainInViewport 
  } = useSimsStore();

  const handleCenterView = () => {
    centerTerrainInViewport(window.innerWidth, window.innerHeight);
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between shadow-2xl z-30 select-none">
      {/* Esquerda: Logo & Identidade do App */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white tracking-wide text-base leading-none">
              Sims Architect <span className="text-emerald-400 text-xs font-normal">2D / 3D</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Fase 4 Pro
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Planejador 2D & Maquete 3D Interativa</p>
        </div>
      </div>

      {/* Centro: Modos da Aplicação */}
      <nav className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
        <ModeButton
          label="Configurações"
          icon={<Settings className="w-4 h-4" />}
          active={activeMode === 'settings'}
          onClick={() => setMode('settings')}
        />
        <ModeButton
          label="Construção"
          icon={<Hammer className="w-4 h-4" />}
          active={activeMode === 'build'}
          onClick={() => setMode('build')}
        />
        <ModeButton
          label="Compra"
          icon={<ShoppingBag className="w-4 h-4" />}
          active={activeMode === 'buy'}
          onClick={() => setMode('buy')}
        />
        <ModeButton
          label="Exportar"
          icon={<Download className="w-4 h-4" />}
          active={activeMode === 'export'}
          onClick={() => setMode('export')}
        />
      </nav>

      {/* Direita: Alternador 2D/3D, Status e Ações */}
      <div className="flex items-center gap-3">
        {/* Alternador 2D / 3D */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === '2d'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>2D Planta</span>
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === '3d'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Maquete</span>
          </button>
        </div>

        {/* Badge do Lote Atual */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Terreno: <strong className="text-white">{terrain.width}m × {terrain.length}m</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-semibold">{terrain.width * terrain.length} m²</span>
        </div>

        {/* Botão Centralizar Visão */}
        {viewMode === '2d' && (
          <button
            onClick={handleCenterView}
            title="Centralizar Câmera no Terreno"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setSetupModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
        >
          <span>Novo Terreno</span>
        </button>
      </div>
    </header>
  );
}
