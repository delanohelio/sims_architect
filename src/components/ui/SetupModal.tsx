import React, { useState } from 'react';
import { X, Layers, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useSimsStore, PRESET_LOTS } from '../../store/useSimsStore';

export function SetupModal() {
  const { 
    isSetupModalOpen, 
    setSetupModalOpen, 
    terrain, 
    setTerrainSize, 
    centerTerrainInViewport 
  } = useSimsStore();

  const [width, setWidth] = useState<number>(terrain.width);
  const [length, setLength] = useState<number>(terrain.length);

  if (!isSetupModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTerrainSize(width, length);
    setSetupModalOpen(false);
    setTimeout(() => {
      centerTerrainInViewport(window.innerWidth, window.innerHeight);
    }, 50);
  };

  const handleSelectPreset = (presetW: number, presetL: number) => {
    setWidth(presetW);
    setLength(presetL);
    setTerrainSize(presetW, presetL);
    setSetupModalOpen(false);
    setTimeout(() => {
      centerTerrainInViewport(window.innerWidth, window.innerHeight);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow de Fundo Ambient */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Modal */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Criar Novo Terreno</h3>
              <p className="text-xs text-slate-400">Escolha as dimensões em metros para a planta</p>
            </div>
          </div>
          <button
            onClick={() => setSetupModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Rápidos */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Formatos Populares</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {PRESET_LOTS.map((preset) => {
              const isSelected = width === preset.width && length === preset.length;
              return (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset.width, preset.length)}
                  className={`p-3 text-left rounded-2xl border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/80 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{preset.description}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 mt-2">
                    {preset.width}m × {preset.length}m ({preset.width * preset.length} m²)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulário Personalizado */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Largura (Metros)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Comprimento (Metros)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex justify-between items-center text-slate-300">
            <span>Área Total Calculada:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{width * length} m²</span>
          </div>

          {/* Botões do Modal */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSetupModalOpen(false)}
              className="w-1/3 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Gerar e Enquadrar Terreno</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
