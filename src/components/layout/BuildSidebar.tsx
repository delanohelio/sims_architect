import { 
  Hammer, 
  Palette, 
  DoorClosed, 
  Trash2, 
  Check, 
  Info,
  Ruler,
  Sparkles,
  Layers,
  RotateCcw,
  Paintbrush,
  Sliders
} from 'lucide-react';
import { useSimsStore, CATALOG_DOORS_WINDOWS } from '../../store/useSimsStore';
import type { BuildTool, FloorTextureId } from '../../types/sims';
import { ColorTexturePicker } from '../ui/ColorTexturePicker';

export function BuildSidebar() {
  const { 
    activeBuildTool, 
    setActiveBuildTool,
    selectedFloorTexture,
    setSelectedFloorTexture,
    selectedFloorColor,
    setSelectedFloorColor,
    selectedFloorCustomTexture,
    setSelectedFloorCustomTexture,
    selectedWallColor,
    setSelectedWallColor,
    selectedWallTexture,
    setSelectedWallTexture,
    selectedDoorWindow,
    setSelectedDoorWindow,
    customDoorWidth,
    setCustomDoorWidth,
    customDoorHeight,
    setCustomDoorHeight,
    customDoorFrameColor,
    setCustomDoorFrameColor,
    walls,
    floors,
    doorsWindows,
    pendingDoor,
    cancelPendingDoor,
    toggleDoorFlip,
    clearWalls,
    clearFloors
  } = useSimsStore();

  const floorOptions: { id: FloorTextureId; name: string; desc: string; previewClass: string; iconSvg: React.ReactNode }[] = [
    { 
      id: 'wood', 
      name: 'Madeira Parquet', 
      desc: 'Tons quentes de madeira clássica', 
      previewClass: 'bg-amber-800 border-amber-600',
      iconSvg: (
        <svg className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 12h18M12 3v18M7 3v9M17 12v9" />
        </svg>
      )
    },
    { 
      id: 'marble', 
      name: 'Mármore Frio', 
      desc: 'Porcelanato branco polido', 
      previewClass: 'bg-slate-200 border-slate-400',
      iconSvg: (
        <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M4 4l16 16M4 12l8 8M12 4l8 8" />
        </svg>
      )
    },
    { 
      id: 'tile', 
      name: 'Cerâmica Cinza', 
      desc: 'Piso cerâmico cinza com rejunte', 
      previewClass: 'bg-slate-600 border-slate-400',
      iconSvg: (
        <svg className="w-5 h-5 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="8" height="8" />
          <rect x="13" y="3" width="8" height="8" />
          <rect x="3" y="13" width="8" height="8" />
          <rect x="13" y="13" width="8" height="8" />
        </svg>
      )
    },
    { 
      id: 'slate', 
      name: 'Laminado Slate', 
      desc: 'Vinílico escuro contemporâneo', 
      previewClass: 'bg-slate-900 border-cyan-500',
      iconSvg: (
        <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18" />
        </svg>
      )
    },
    { 
      id: 'grass', 
      name: 'Grama / Jardim', 
      desc: 'Grama natural decorativa', 
      previewClass: 'bg-emerald-700 border-emerald-500',
      iconSvg: (
        <svg className="w-5 h-5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
          <path d="M8 14s1.5-2 4-2 4 2 4 2" />
        </svg>
      )
    },
    { 
      id: 'dirt', 
      name: 'Terra / Cascalho', 
      desc: 'Superfície rústica terrosa', 
      previewClass: 'bg-amber-950 border-amber-800',
      iconSvg: (
        <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="7" cy="7" r="2" />
          <circle cx="17" cy="9" r="3" />
          <circle cx="10" cy="16" r="2" />
        </svg>
      )
    },
  ];

  const tools: { id: BuildTool; label: string; icon: React.ReactNode }[] = [
    { id: 'wall', label: 'Paredes', icon: <Layers className="w-4 h-4" /> },
    { id: 'wall_paint', label: 'Pintar Paredes', icon: <Paintbrush className="w-4 h-4" /> },
    { id: 'floor', label: 'Pisos', icon: <Palette className="w-4 h-4" /> },
    { id: 'door_window', label: 'Portas/Janelas', icon: <DoorClosed className="w-4 h-4" /> },
    { id: 'eraser', label: 'Marreta', icon: <Hammer className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-88 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] z-20 shadow-2xl select-none overflow-y-auto custom-scrollbar">
      {/* Seletor de Ferramentas de Construção */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Hammer className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Modo Construção</h2>
            <p className="text-[11px] text-slate-400">Edite paredes, tintas, pisos e esquadrias</p>
          </div>
        </div>

        {/* Abas das Ferramentas */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-2xl border border-slate-800">
          {tools.map((t) => {
            const active = activeBuildTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveBuildTool(t.id);
                  cancelPendingDoor();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {t.icon}
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Dinâmico por Ferramenta Selecionada */}
      <div className="p-5 space-y-5 flex-1">
        {/* ABA: FERRAMENTA DE PAREDES */}
        {activeBuildTool === 'wall' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                <span>Desenho de Paredes</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {walls.length} paredes
              </span>
            </div>

            <ColorTexturePicker
              label="Cor / Textura Inicial da Parede"
              currentColor={selectedWallColor}
              currentTextureUrl={selectedWallTexture}
              onSelectColor={setSelectedWallColor}
              onSelectTextureUrl={setSelectedWallTexture}
            />

            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Instruções:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
                <li>Clique em um vértice do grid para iniciar a parede.</li>
                <li>Arraste em qualquer direção (<strong>ortogonal ou diagonal</strong>).</li>
                <li>Alterne para o modo <strong>3D Maquete</strong> no topo para ver as paredes em 3D!</li>
              </ul>
            </div>
          </div>
        )}

        {/* ABA: PINTURA DE PAREDES */}
        {activeBuildTool === 'wall_paint' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-amber-400" />
                <span>Pintura de Paredes</span>
              </label>
            </div>

            <ColorTexturePicker
              label="Cor ou Imagem de Parede"
              currentColor={selectedWallColor}
              currentTextureUrl={selectedWallTexture}
              onSelectColor={setSelectedWallColor}
              onSelectTextureUrl={setSelectedWallTexture}
            />

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              Clique em qualquer parede existente para aplicar a cor ou textura de imagem escolhida!
            </div>
          </div>
        )}

        {/* ABA: FERRAMENTA DE PISOS */}
        {activeBuildTool === 'floor' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Catálogo de Pisos</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {Object.keys(floors).length} m² pintados
              </span>
            </div>

            <ColorTexturePicker
              label="Cor / Imagem Personalizada de Piso"
              currentColor={selectedFloorColor || '#78350F'}
              currentTextureUrl={selectedFloorCustomTexture}
              onSelectColor={(color) => {
                setSelectedFloorColor(color);
                setSelectedFloorTexture('custom');
              }}
              onSelectTextureUrl={(url) => {
                setSelectedFloorCustomTexture(url);
                setSelectedFloorTexture('custom');
              }}
            />

            <div className="grid grid-cols-1 gap-2 border-t border-slate-800/80 pt-3">
              {floorOptions.map((f) => {
                const isSelected = selectedFloorTexture === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFloorTexture(f.id);
                      setSelectedFloorCustomTexture(undefined);
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/80 text-white ring-1 ring-emerald-500/40 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                      {f.iconSvg}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-semibold text-xs text-white">
                        <span>{f.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{f.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA: PORTAS & JANELAS */}
        {activeBuildTool === 'door_window' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <DoorClosed className="w-4 h-4 text-cyan-400" />
                <span>Portas & Janelas</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {doorsWindows.length} instaladas
              </span>
            </div>

            {/* Passo Ativo de Inserção da Porta */}
            {pendingDoor && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-xs space-y-2 text-amber-200 animate-pulse">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    {pendingDoor.step === 'hinge' && 'Passo 2: Clique no Ponto da Dobradiça no Canvas'}
                    {pendingDoor.step === 'swing' && 'Passo 3: Clique na Área Sombreada para o Lado de Abertura'}
                  </span>
                </div>
                <button
                  onClick={cancelPendingDoor}
                  className="w-full py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700"
                >
                  Cancelar Colocação
                </button>
              </div>
            )}

            {/* Opções Personalizadas para Esquadria Genérica */}
            {selectedDoorWindow.isCustom && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dimensões da Esquadria Genérica</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 text-[11px]">Largura:</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="4.0"
                        value={customDoorWidth}
                        onChange={(e) => setCustomDoorWidth(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg text-center font-mono py-1 text-white"
                      />
                      <span className="text-slate-400 text-[11px]">m</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Altura:</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0.8"
                        max="3.5"
                        value={customDoorHeight}
                        onChange={(e) => setCustomDoorHeight(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg text-center font-mono py-1 text-white"
                      />
                      <span className="text-slate-400 text-[11px]">m</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">Cor da Moldura / Esquadria:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={customDoorFrameColor}
                      onChange={(e) => setCustomDoorFrameColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer p-0"
                    />
                    <span className="font-mono text-white text-xs">{customDoorFrameColor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lista do Catálogo com Miniaturas Detalhadas (Maçaneta / Vidro Duplo) */}
            <div className="grid grid-cols-1 gap-2.5">
              {CATALOG_DOORS_WINDOWS.map((item) => {
                const isSelected = selectedDoorWindow.catalogId === item.catalogId;
                return (
                  <button
                    key={item.catalogId}
                    onClick={() => {
                      setSelectedDoorWindow(item);
                      cancelPendingDoor();
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/80 text-white ring-1 ring-cyan-500/40 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Miniatura Ilustrativa Aprimorada */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0 text-cyan-400">
                      {item.type === 'door' ? (
                        <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="3" width="14" height="18" rx="1" />
                          <circle cx="15.5" cy="12" r="1.2" fill="#FACC15" stroke="#FACC15" />
                          <path d="M5 3a14 14 0 0 0 14 0" strokeDasharray="2 2" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="5" width="18" height="14" rx="1" fill="rgba(6,182,212,0.15)" />
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="3" y1="12" x2="21" y2="12" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-semibold text-xs text-white">
                        <span className="truncate">{item.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {item.isCustom ? `${customDoorWidth}m × ${customDoorHeight}m` : `${item.width}m`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Giro Rápido de Porta Instalada */}
            {doorsWindows.length > 0 && (
              <button
                onClick={() => {
                  const last = doorsWindows[doorsWindows.length - 1];
                  toggleDoorFlip(last.id);
                }}
                className="w-full py-2.5 px-3 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Inverter Giro da Última Porta (Tecla: R)</span>
              </button>
            )}
          </div>
        )}

        {/* ABA: MARRETA (APAGAR) */}
        {activeBuildTool === 'eraser' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Hammer className="w-4 h-4 text-rose-400" />
                <span>Ferramenta Marreta</span>
              </label>
            </div>

            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs space-y-2 text-rose-200">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>Remoção Inteligente:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-rose-300/80 list-disc list-inside">
                <li>Clique em uma <strong>parede</strong> para apagá-la.</li>
                <li>Clique em uma <strong>porta ou janela</strong> para removê-la.</li>
                <li>Clique em um <strong>piso</strong> para limpá-lo.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={clearWalls}
                disabled={walls.length === 0}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-rose-950/80 hover:border-rose-700/60 text-slate-300 hover:text-rose-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-slate-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Todas as Paredes</span>
              </button>

              <button
                onClick={clearFloors}
                disabled={Object.keys(floors).length === 0}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-rose-950/80 hover:border-rose-700/60 text-slate-300 hover:text-rose-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-slate-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Todos os Pisos</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
