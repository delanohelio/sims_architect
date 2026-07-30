import { useState } from 'react';
import { 
  Tag, 
  PenTool, 
  Hand, 
  Trash2, 
  Layers, 
  Maximize,
  Type,
  Ruler
} from 'lucide-react';
import { useSimsStore } from '../../store/useSimsStore';
import type { AnnotationLineStyle } from '../../types/sims';
import { calculatePolygonArea } from '../../hooks/useAnnotationInteractions';

export function AnnotationSidebar() {
  const {
    annotations,
    activeAnnotationTool,
    selectedAnnotationId,
    customAnnotationColor,
    customAnnotationLineStyle,
    customTextContent,
    customTextFontSize,
    setActiveAnnotationTool,
    setSelectedAnnotationId,
    setCustomAnnotationColor,
    setCustomAnnotationLineStyle,
    setCustomTextContent,
    setCustomTextFontSize,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
  } = useSimsStore();

  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  const colors = [
    '#10B981', // Esmeralda
    '#38BDF8', // Ciano
    '#F59E0B', // Âmbar
    '#8B5CF6', // Roxo
    '#EC4899', // Rosa
    '#EF4444', // Vermelho
    '#FFFFFF', // Branco
  ];

  const selectedAnnotation = annotations.find((ann) => ann.id === selectedAnnotationId);

  return (
    <aside className="w-88 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] z-20 shadow-2xl select-none overflow-y-auto custom-scrollbar">
      {/* CABEÇALHO DA SIDEBAR */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Marcação & Textos Livres</h2>
            <p className="text-[11px] text-slate-400">Delimite ambientes, insira textos e mova rótulos</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* 1. SELEÇÃO DA FERRAMENTA */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <PenTool className="w-4 h-4 text-teal-400" />
            <span>Ferramenta de Interação</span>
          </label>

          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveAnnotationTool('draw')}
              className={`flex items-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold transition-all ${
                activeAnnotationTool === 'draw'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Zona (m²)</span>
            </button>

            <button
              onClick={() => setActiveAnnotationTool('ruler')}
              className={`flex items-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold transition-all ${
                activeAnnotationTool === 'ruler'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Régua / Cota</span>
            </button>

            <button
              onClick={() => setActiveAnnotationTool('text')}
              className={`flex items-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold transition-all ${
                activeAnnotationTool === 'text'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Texto Livre</span>
            </button>

            <button
              onClick={() => setActiveAnnotationTool('hand')}
              className={`flex items-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold transition-all ${
                activeAnnotationTool === 'hand'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Mão (Mover)</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            {activeAnnotationTool === 'draw' ? (
              <>💡 <strong>Desenhar Zona:</strong> Clique no grid para adicionar vértices e formar um polígono ($P_1, P_2\dots$). Use <strong>Enter</strong> para concluir ou <strong>Esc</strong> para cancelar.</>
            ) : activeAnnotationTool === 'ruler' ? (
              <>📏 <strong>Régua / Cota de Medida:</strong> Clique no ponto inicial e arraste até o segundo ponto. Clique novamente ou pressione <strong>Enter</strong> para fixar a medida na tela. Use <strong>Esc</strong> para descartar.</>
            ) : activeAnnotationTool === 'text' ? (
              <>📝 <strong>Texto Livre:</strong> Digite o texto desejado no campo abaixo e clique em qualquer lugar do terreno para fixá-lo.</>
            ) : (
              <>✋ <strong>Mão de Reposicionamento:</strong> Clique e arraste na tela os rótulos de <strong>Áreas (m²)</strong>, <strong>Cotas de Régua</strong> ou <strong>Textos Livres</strong> para posicioná-los livremente!</>
            )}
          </p>
        </div>

        {/* 2. OPÇÕES DA FERRAMENTA DE TEXTO LIVRE */}
        {activeAnnotationTool === 'text' && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-teal-400" />
              <span>Configuração do Texto Livre</span>
            </label>

            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  Conteúdo do Texto:
                </label>
                <input
                  type="text"
                  value={customTextContent}
                  onChange={(e) => setCustomTextContent(e.target.value)}
                  placeholder="Ex: Entrada Principal, Área Gourmet..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500 transition-all font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Tamanho da Fonte:</span>
                  <strong className="text-teal-400 font-mono">{customTextFontSize} px</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="32"
                  value={customTextFontSize}
                  onChange={(e) => setCustomTextFontSize(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. ESTILO DA LINHA & COR DA MARCAÇÃO */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Estilo e Cor</span>
          </label>

          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
            {activeAnnotationTool === 'draw' && (
              <div>
                <span className="text-slate-300 block mb-1.5">Estilo da Borda:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['solid', 'dashed', 'invisible'] as AnnotationLineStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setCustomAnnotationLineStyle(style);
                        if (selectedAnnotationId) {
                          updateAnnotation(selectedAnnotationId, { lineStyle: style });
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                        (selectedAnnotation ? selectedAnnotation.lineStyle : customAnnotationLineStyle) === style
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                      }`}
                    >
                      {style === 'solid' ? '— Contínua' : style === 'dashed' ? '--- Pontilhada' : '🚫 Invisível'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-slate-300 block mb-1.5">Cor do Elemento:</span>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCustomAnnotationColor(c);
                      if (selectedAnnotationId) {
                        updateAnnotation(selectedAnnotationId, { color: c });
                      }
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      (selectedAnnotation ? selectedAnnotation.color : customAnnotationColor) === c
                        ? 'border-white scale-110 shadow-md'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. LISTA DE MARCAÇÕES & TEXTOS ATIVOS */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Maximize className="w-4 h-4 text-teal-400" />
              <span>Elementos ({annotations.length})</span>
            </label>
            {annotations.length > 0 && (
              <button
                onClick={clearAnnotations}
                className="text-[10px] text-rose-400 hover:text-rose-300 underline"
              >
                Limpar Todos
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {annotations.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                Nenhum elemento demarcado ainda.<br />Escolha "Zona" ou "Texto Livre" para criar!
              </div>
            ) : (
              annotations.map((ann) => {
                const isText = ann.type === 'text';
                const areaM2 = isText ? 0 : calculatePolygonArea(ann.points);
                const isSelected = ann.id === selectedAnnotationId;

                return (
                  <div
                    key={ann.id}
                    onClick={() => setSelectedAnnotationId(ann.id)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/40 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-slate-950"
                        style={{ backgroundColor: ann.color }}
                      >
                        {isText ? 'T' : 'Z'}
                      </div>
                      <div>
                        {editingNameId === ann.id ? (
                          <input
                            type="text"
                            value={ann.text || ann.name}
                            onChange={(e) => updateAnnotation(ann.id, { name: e.target.value, text: e.target.value })}
                            onBlur={() => setEditingNameId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingNameId(null)}
                            autoFocus
                            className="bg-slate-900 text-white text-xs font-bold px-1.5 py-0.5 rounded border border-teal-500 outline-none w-32"
                          />
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNameId(ann.id);
                            }}
                            className="font-bold text-xs hover:text-teal-300 block"
                          >
                            {ann.text || ann.name}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-teal-400 font-semibold block">
                          {isText ? `[Texto Rótulo - ${ann.fontSize || 14}px]` : `${areaM2.toFixed(2)} m²`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAnnotation(ann.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Excluir elemento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
