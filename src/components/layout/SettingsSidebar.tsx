import { useState } from 'react';
import { 
  Settings, 
  Grid, 
  Ruler, 
  Maximize2, 
  Palette,
  Sparkles,
  Check
} from 'lucide-react';
import { useSimsStore, PRESET_LOTS } from '../../store/useSimsStore';
import type { TerrainTheme } from '../../types/sims';
import { ColorTexturePicker } from '../ui/ColorTexturePicker';

export function SettingsSidebar() {
  const { 
    terrain, 
    setTerrainSize, 
    setTerrainTheme, 
    setCustomTerrain,
    gridSettings, 
    toggleGrid, 
    toggleSubgrid, 
    toggleMeters,
    toggleSnapToGrid,
    centerTerrainInViewport
  } = useSimsStore();

  const [terrainMode, setTerrainMode] = useState<'preset' | 'colors' | 'texture'>(
    terrain.customTextureUrl ? 'texture' : terrain.customColor ? 'colors' : 'preset'
  );

  const themes: { id: TerrainTheme; name: string; colorClass: string }[] = [
    { id: 'grass', name: 'Grama Sims', colorClass: 'bg-emerald-700 border-emerald-500' },
    { id: 'blueprint', name: 'Blueprint Azul', colorClass: 'bg-blue-900 border-blue-400' },
    { id: 'dark', name: 'Dark Slate', colorClass: 'bg-slate-900 border-cyan-500' },
    { id: 'concrete', name: 'Concreto Urbano', colorClass: 'bg-slate-300 border-slate-500' },
  ];

  return (
    <aside className="w-88 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] z-20 shadow-2xl select-none overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Configurações do Terreno</h2>
            <p className="text-[11px] text-slate-400">Ajuste dimensões, temas e exibição do grid</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* 1. DIMENSÕES DO TERRENO */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-emerald-400" />
              <span>Dimensões do Terreno (Metros)</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {terrain.width * terrain.length} m²
            </span>
          </label>

          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Largura:</span>
                <strong className="text-white font-mono">{terrain.width} m</strong>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={terrain.width}
                onChange={(e) => setTerrainSize(Number(e.target.value), terrain.length)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Comprimento:</span>
                <strong className="text-white font-mono">{terrain.length} m</strong>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={terrain.length}
                onChange={(e) => setTerrainSize(terrain.width, Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => centerTerrainInViewport(window.innerWidth, window.innerHeight)}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-all mt-1"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Centralizar Câmera no Terreno</span>
            </button>
          </div>
        </div>

        {/* 2. PRESETS RÁPIDOS DE LOTE */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Presets de Lote Sims</span>
          </label>

          <div className="grid grid-cols-1 gap-2">
            {PRESET_LOTS.map((lot) => {
              const isSelected = terrain.width === lot.width && terrain.length === lot.length;
              return (
                <button
                  key={lot.name}
                  onClick={() => setTerrainSize(lot.width, lot.length)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/80 text-white ring-1 ring-emerald-500/40 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-xs text-white">
                    <span>{lot.name}</span>
                    <span className="font-mono text-[10px] text-emerald-400">{lot.width}m × {lot.length}m</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{lot.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ESTILO E APARÊNCIA DO TERRENO (3 SEÇÕES SEPARADAS) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Aparência do Terreno</span>
            </label>
          </div>

          {/* Selector de Abas do Estilo de Terreno */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setTerrainMode('preset')}
              className={`py-1.5 rounded-xl transition-all ${
                terrainMode === 'preset'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Temas
            </button>
            <button
              type="button"
              onClick={() => setTerrainMode('colors')}
              className={`py-1.5 rounded-xl transition-all ${
                terrainMode === 'colors'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2 Cores (Xadrez)
            </button>
            <button
              type="button"
              onClick={() => setTerrainMode('texture')}
              className={`py-1.5 rounded-xl transition-all ${
                terrainMode === 'texture'
                  ? 'bg-purple-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Textura
            </button>
          </div>

          {/* OPÇÃO 1: TEMAS PREDEFINIDOS */}
          {terrainMode === 'preset' && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
              {themes.map((t) => {
                const isSelected = terrain.theme === t.id && !terrain.customColor && !terrain.customTextureUrl;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTerrainTheme(t.id);
                      setCustomTerrain(undefined, undefined, undefined);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/80 text-white ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${t.colorClass} border shrink-0`} />
                    <span className="text-xs font-semibold truncate">{t.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* OPÇÃO 2: 2 CORES PERSONALIZADAS (COR PRIMÁRIA & SECUNDÁRIA) */}
          {terrainMode === 'colors' && (
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3.5 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Grid Xadrez de 2 Cores</span>
                </span>
              </div>

              {/* Cor Primária */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">Cor Primária do Terreno:</span>
                <label className="flex items-center gap-2.5 p-2 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-all">
                  <input
                    type="color"
                    value={terrain.customColor || '#15803D'}
                    onChange={(e) =>
                      setCustomTerrain(e.target.value, terrain.customSecondaryColor || '#166534', undefined)
                    }
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer p-0 shrink-0"
                  />
                  <span className="font-mono text-slate-200 uppercase text-xs">
                    {terrain.customColor || '#15803D'}
                  </span>
                </label>
              </div>

              {/* Cor Secundária */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold block">Cor Secundária do Grid (Xadrez):</span>
                  {terrain.customSecondaryColor && (
                    <button
                      type="button"
                      onClick={() => setCustomTerrain(terrain.customColor || '#15803D', undefined, undefined)}
                      className="text-[10px] text-rose-400 hover:underline font-normal"
                    >
                      Remover 2ª Cor
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2.5 p-2 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-all">
                  <input
                    type="color"
                    value={terrain.customSecondaryColor || '#166534'}
                    onChange={(e) =>
                      setCustomTerrain(terrain.customColor || '#15803D', e.target.value, undefined)
                    }
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer p-0 shrink-0"
                  />
                  <span className="font-mono text-slate-200 uppercase text-xs">
                    {terrain.customSecondaryColor || 'Desativado (Monocromático)'}
                  </span>
                </label>
              </div>

              {/* Presets Rápidos de Xadrez 2 Cores */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Presets de Combinação:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCustomTerrain('#15803D', '#166534', undefined)}
                    className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 flex items-center justify-center gap-1"
                  >
                    🟩 Grama 2 Cores
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTerrain('#0F172A', '#06B6D4', undefined)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-[11px] font-semibold text-cyan-300 flex items-center justify-center gap-1"
                  >
                    🟦 Dark / Ciano
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTerrain('#E2E8F0', '#475569', undefined)}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1"
                  >
                    ⬜ Concreto / Slate
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTerrain('#78350F', '#D97706', undefined)}
                    className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[11px] font-semibold text-amber-300 flex items-center justify-center gap-1"
                  >
                    🟫 Madeira / Areia
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OPÇÃO 3: TEXTURA DE IMAGEM */}
          {terrainMode === 'texture' && (
            <div className="animate-in fade-in duration-150">
              <ColorTexturePicker
                label="Textura de Imagem do Terreno"
                currentColor={terrain.customColor || '#15803D'}
                currentTextureUrl={terrain.customTextureUrl}
                onSelectColor={() => {}}
                onSelectTextureUrl={(url) => setCustomTerrain(undefined, undefined, url)}
              />
            </div>
          )}
        </div>

        {/* 4. OPÇÕES DO GRID & RÓTULOS */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Grid className="w-4 h-4 text-emerald-400" />
            <span>Visualização do Grid & Snap</span>
          </label>

          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
              <span>Exibir Grid Métrico (1m × 1m)</span>
              <input
                type="checkbox"
                checked={gridSettings.showGrid}
                onChange={toggleGrid}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
              <span>Exibir Subgrid Fino (0.5m)</span>
              <input
                type="checkbox"
                checked={gridSettings.showSubgrid}
                onChange={toggleSubgrid}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
              <span>Exibir Rótulos Métricos (0m, 5m...)</span>
              <input
                type="checkbox"
                checked={gridSettings.showMeters}
                onChange={toggleMeters}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white pt-1 border-t border-slate-800">
              <span>Imantação / Snap to Grid</span>
              <input
                type="checkbox"
                checked={gridSettings.snapToGrid}
                onChange={toggleSnapToGrid}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
