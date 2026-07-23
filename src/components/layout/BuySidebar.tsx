import React from 'react';
import { useSimsStore, CATALOG_FURNITURE } from '../../store/useSimsStore';
import { ColorTexturePicker } from '../ui/ColorTexturePicker';
import type { FurnitureCategory, FurnitureCatalogItem } from '../../types/sims';
import {
  Bed,
  Sofa,
  Utensils,
  Bath,
  Trees,
  Box,
  RotateCw,
  X,
  CheckCircle2,
  Sliders,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: { id: FurnitureCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'bedroom', label: 'Quarto', icon: Bed },
  { id: 'living', label: 'Sala', icon: Sofa },
  { id: 'kitchen', label: 'Cozinha', icon: Utensils },
  { id: 'bathroom', label: 'Banheiro', icon: Bath },
  { id: 'outdoor', label: 'Exterior', icon: Trees },
  { id: 'custom', label: 'Customizado', icon: Box },
];

export function BuySidebar() {
  const {
    selectedBuyCategory,
    setSelectedBuyCategory,
    pendingFurnitureItem,
    setPendingFurnitureItem,
    rotatePendingFurnitureItem,
    cancelPendingFurnitureItem,
    customFurnitureName,
    setCustomFurnitureName,
    customFurnitureWidth,
    setCustomFurnitureWidth,
    customFurnitureDepth,
    setCustomFurnitureDepth,
    customFurnitureHeight,
    setCustomFurnitureHeight,
    customFurnitureColor,
    setCustomFurnitureColor,
    customFurnitureTextureUrl,
    setCustomFurnitureTextureUrl,
    customFurnitureShape,
    setCustomFurnitureShape,
  } = useSimsStore();

  const filteredCatalog = CATALOG_FURNITURE.filter((item) => item.category === selectedBuyCategory);

  const handleSelectCatalogItem = (item: FurnitureCatalogItem) => {
    setPendingFurnitureItem({
      catalogItem: item,
      rotation: 0,
    });
  };

  const handleSelectCustomItem = () => {
    const customItem: FurnitureCatalogItem = {
      catalogId: `custom_furn_${Date.now()}`,
      name: customFurnitureName.trim() || 'Móvel Customizado',
      category: selectedBuyCategory === 'custom' ? 'bedroom' : selectedBuyCategory,
      width: customFurnitureWidth,
      depth: customFurnitureDepth,
      height: customFurnitureHeight,
      color: customFurnitureColor,
      textureUrl: customFurnitureTextureUrl,
      primitiveShape: customFurnitureShape,
      isCustom: true,
    };

    setPendingFurnitureItem({
      catalogItem: customItem,
      rotation: 0,
    });
  };

  return (
    <aside className="w-80 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col z-10 shadow-2xl text-slate-200 select-none">
      {/* HEADER DA SIDEBAR COMPRA */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sofa className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-base">Modo Compra</h2>
            <p className="text-xs text-slate-400">Catálogo de Mobiliário 2D/3D</p>
          </div>
        </div>
      </div>

      {/* PAINEL DE ITEM PENDENTE DE INSERÇÃO */}
      {pendingFurnitureItem && (
        <div className="p-3 m-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Posicionando Móvel
            </span>
            <button
              onClick={cancelPendingFurnitureItem}
              className="p-1 rounded-lg hover:bg-purple-900/50 text-slate-400 hover:text-white transition-all"
              title="Cancelar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm font-bold text-white truncate">{pendingFurnitureItem.catalogItem.name}</div>

          <div className="flex items-center justify-between text-xs text-purple-200/90 font-mono">
            <span>
              Dimensões: {pendingFurnitureItem.catalogItem.width}m × {pendingFurnitureItem.catalogItem.depth}m
            </span>
            <span className="text-amber-300 font-semibold">{pendingFurnitureItem.rotation}°</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={rotatePendingFurnitureItem}
              className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Rotacionar (R)
            </button>
          </div>
        </div>
      )}

      {/* ABAS DE CATEGORIAS */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="grid grid-cols-3 gap-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedBuyCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedBuyCategory(cat.id)}
                className={`py-2 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  isActive
                    ? 'bg-purple-600/90 text-white border border-purple-400/30 shadow-lg'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate text-[11px]">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (CATÁLOGO OU FORMULÁRIO CUSTOMIZADO) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedBuyCategory === 'custom' ? (
          /* FORMULÁRIO DE MÓVEL GENÉRICO CUSTOMIZADO */
          <div className="space-y-4 bg-slate-850/50 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
              <Sliders className="w-4 h-4" />
              <span>Móvel Genérico Customizado</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Nome do Móvel</label>
              <input
                type="text"
                value={customFurnitureName}
                onChange={(e) => setCustomFurnitureName(e.target.value)}
                placeholder="Ex: Bancada de Estudos, Puff, Armário"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Largura (W)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="5.0"
                  value={customFurnitureWidth}
                  onChange={(e) => setCustomFurnitureWidth(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Profund. (D)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="5.0"
                  value={customFurnitureDepth}
                  onChange={(e) => setCustomFurnitureDepth(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Altura (H)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="5.0"
                  value={customFurnitureHeight}
                  onChange={(e) => setCustomFurnitureHeight(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Formato Geométrico 3D</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCustomFurnitureShape('box')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                    customFurnitureShape === 'box'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Caixa (Box)
                </button>
                <button
                  onClick={() => setCustomFurnitureShape('cylinder')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                    customFurnitureShape === 'cylinder'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Cilindro
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Cor ou Textura de Imagem</label>
              <ColorTexturePicker
                selectedColor={customFurnitureColor}
                selectedTextureUrl={customFurnitureTextureUrl}
                onSelectColor={(color) => {
                  setCustomFurnitureColor(color);
                  setCustomFurnitureTextureUrl(undefined);
                }}
                onSelectTexture={(url) => {
                  setCustomFurnitureTextureUrl(url);
                }}
              />
            </div>

            <button
              onClick={handleSelectCustomItem}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selecionar Móvel Customizado
            </button>
          </div>
        ) : (
          /* CATÁLOGO DE MÓVEIS DA CATEGORIA */
          <div className="grid grid-cols-1 gap-3">
            {filteredCatalog.map((item) => {
              const isSelected = pendingFurnitureItem?.catalogItem.catalogId === item.catalogId;
              return (
                <div
                  key={item.catalogId}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner shrink-0"
                      style={{ backgroundColor: item.color, borderColor: 'rgba(255,255,255,0.2)' }}
                    >
                      {item.primitiveShape === 'cylinder' ? (
                        <div className="w-6 h-6 rounded-full bg-white/30 border border-white/50" />
                      ) : (
                        <div className="w-6 h-5 rounded bg-white/30 border border-white/50" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium text-xs text-white leading-tight">{item.name}</h3>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        {item.width}m × {item.depth}m (Alt: {item.height}m)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectCatalogItem(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'Selecionado' : 'Selecionar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
