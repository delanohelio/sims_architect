import React from 'react';
import { useSimsStore, CATALOG_FURNITURE } from '../../store/useSimsStore';
import { ColorTexturePicker } from '../ui/ColorTexturePicker';
import { urlToDataUrl } from '../../utils/imageStorage';
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
  Save,
  Trash2,
  Check,
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
    savedCustomFurniture,
    addCustomCatalogItem,
    removeCustomCatalogItem,
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
    customFurnitureCategory,
    setCustomFurnitureCategory,
    customFurnitureShape,
    setCustomFurnitureShape,
  } = useSimsStore();

  // Itens padrão do catálogo para a categoria selecionada
  const defaultItems = CATALOG_FURNITURE.filter((item) => item.category === selectedBuyCategory);

  // Itens customizados salvos pelo usuário para esta categoria (ou todos na aba 'custom')
  const customSavedItems = savedCustomFurniture.filter(
    (item) => selectedBuyCategory === 'custom' || item.category === selectedBuyCategory
  );

  // Lista combinada para exibição no catálogo
  const combinedItems = selectedBuyCategory === 'custom' ? customSavedItems : [...defaultItems, ...customSavedItems];

  const handleSelectCatalogItem = (item: FurnitureCatalogItem) => {
    setPendingFurnitureItem({
      catalogItem: item,
      rotation: 0,
    });
  };

  const handleBuildCustomItem = async (shouldSaveToCatalog: boolean) => {
    let offlineTextureUrl = customFurnitureTextureUrl;
    if (customFurnitureTextureUrl) {
      offlineTextureUrl = await urlToDataUrl(customFurnitureTextureUrl);
    }

    const targetCategory = customFurnitureCategory || (selectedBuyCategory === 'custom' ? 'bedroom' : selectedBuyCategory);

    const customItem: FurnitureCatalogItem = {
      catalogId: `custom_furn_${Date.now()}`,
      name: customFurnitureName.trim() || 'Móvel Customizado',
      category: targetCategory,
      width: customFurnitureWidth,
      depth: customFurnitureDepth,
      height: customFurnitureHeight,
      color: customFurnitureColor,
      textureUrl: offlineTextureUrl,
      primitiveShape: customFurnitureShape,
      isCustom: true,
    };

    if (shouldSaveToCatalog) {
      addCustomCatalogItem(customItem);
    }

    setPendingFurnitureItem({
      catalogItem: customItem,
      rotation: 0,
    });
  };

  return (
    <aside className="w-80 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col z-10 shadow-2xl text-slate-200 select-none overflow-hidden">
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
              Rotacionar +45° (R)
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

      {/* CONTEÚDO PRINCIPAL (CATÁLOGO + FORMULÁRIO CUSTOMIZADO) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {selectedBuyCategory === 'custom' && (
          /* FORMULÁRIO DE MÓVEL GENÉRICO CUSTOMIZADO */
          <div className="space-y-3.5 bg-slate-950/80 p-3.5 rounded-2xl border border-purple-500/30 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
              <Sliders className="w-4 h-4" />
              <span>Criar Móvel Customizado</span>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Nome do Móvel</label>
              <input
                type="text"
                value={customFurnitureName}
                onChange={(e) => setCustomFurnitureName(e.target.value)}
                placeholder="Ex: Armário de Canto, Puff, Poltrona"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Categoria Principal</label>
              <select
                value={customFurnitureCategory}
                onChange={(e) => setCustomFurnitureCategory(e.target.value as FurnitureCategory)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="bedroom">Quarto</option>
                <option value="living">Sala</option>
                <option value="kitchen">Cozinha</option>
                <option value="bathroom">Banheiro</option>
                <option value="outdoor">Exterior</option>
                <option value="custom">Geral / Customizado</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">Largura (W)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="5.0"
                  value={customFurnitureWidth}
                  onChange={(e) => setCustomFurnitureWidth(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">Profund. (D)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="5.0"
                  value={customFurnitureDepth}
                  onChange={(e) => setCustomFurnitureDepth(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">Altura (H)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="5.0"
                  value={customFurnitureHeight}
                  onChange={(e) => setCustomFurnitureHeight(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-400 block mb-1">Formato Geométrico 3D</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomFurnitureShape('box')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                    customFurnitureShape === 'box'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Caixa (Box)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomFurnitureShape('cylinder')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                    customFurnitureShape === 'cylinder'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Cilindro
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Cor ou Textura de Imagem</label>
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

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleBuildCustomItem(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar no Catálogo
              </button>

              <button
                type="button"
                onClick={() => handleBuildCustomItem(false)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                title="Usar apenas uma vez sem salvar no catálogo"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Usar 1x
              </button>
            </div>
          </div>
        )}

        {/* LISTA DE MÓVEIS DO CATÁLOGO (CADA CARD É UM BOTÃO CLICÁVEL COMPLETO) */}
        <div className="space-y-2.5">
          {combinedItems.length > 0 ? (
            combinedItems.map((item) => {
              const isSelected = pendingFurnitureItem?.catalogItem.catalogId === item.catalogId;
              const isCustomItem = Boolean(item.isCustom);

              return (
                <div
                  key={item.catalogId}
                  onClick={() => handleSelectCatalogItem(item)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2.5 w-full overflow-hidden ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-400 ring-2 ring-purple-500/40 shadow-xl scale-[1.01]'
                      : isCustomItem
                      ? 'bg-slate-900/80 border-purple-500/50 hover:border-purple-400 hover:bg-slate-900 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* ESQUERDA: MINIATURA + INFORMAÇÕES */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner shrink-0 overflow-hidden bg-slate-950"
                      style={{
                        backgroundColor: item.color,
                        borderColor: isSelected
                          ? 'rgba(168, 85, 247, 0.8)'
                          : isCustomItem
                          ? 'rgba(168, 85, 247, 0.4)'
                          : 'rgba(255,255,255,0.12)',
                      }}
                    >
                      {item.textureUrl ? (
                        <img
                          src={item.textureUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : item.primitiveShape === 'cylinder' ? (
                        <div className="w-6 h-6 rounded-full bg-white/30 border border-white/50" />
                      ) : (
                        <div className="w-6 h-5 rounded bg-white/30 border border-white/50" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-xs text-white leading-tight truncate">{item.name}</h3>
                        {isCustomItem && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        {item.width}m × {item.depth}m <span className="text-slate-500">(Alt: {item.height}m)</span>
                      </div>
                    </div>
                  </div>

                  {/* DIREITA: ÍCONE SELECIONADO OU REMOVER ITEM CUSTOMIZADO */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isCustomItem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomCatalogItem(item.catalogId);
                        }}
                        title="Remover móvel customizado do catálogo"
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isSelected && (
                      <div className="p-1.5 rounded-xl bg-purple-500 text-white shadow">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl text-center text-slate-400 text-xs">
              Nenhum móvel nesta categoria ainda.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
