import React, { useRef, useState } from 'react';
import { Palette, Upload, Link as LinkIcon, Trash2, Check, Image as ImageIcon, Plus } from 'lucide-react';
import { useSimsStore } from '../../store/useSimsStore';

interface ColorTexturePickerProps {
  label?: string;
  currentColor?: string;
  currentTextureUrl?: string;
  selectedColor?: string;
  selectedTextureUrl?: string;
  onSelectColor: (color: string) => void;
  onSelectTextureUrl?: (url: string | undefined) => void;
  onSelectTexture?: (url: string | undefined) => void;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  '#F1F5F9', '#94A3B8', '#475569', '#1E293B',
  '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#A855F7',
  '#78350F', '#451A03', '#D97706', '#059669',
];

export function ColorTexturePicker({
  label = 'Aparência',
  currentColor,
  currentTextureUrl,
  selectedColor,
  selectedTextureUrl,
  onSelectColor,
  onSelectTextureUrl,
  onSelectTexture,
  presetColors = DEFAULT_PRESET_COLORS,
}: ColorTexturePickerProps) {
  const activeColor = selectedColor || currentColor || '#E2E8F0';
  const activeTextureUrl = selectedTextureUrl || currentTextureUrl;
  const handleSelectTex = onSelectTexture || onSelectTextureUrl;

  const { customTextures, addCustomTexture, removeCustomTexture } = useSimsStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [appearanceType, setAppearanceType] = useState<'color' | 'texture'>(activeTextureUrl ? 'texture' : 'color');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  // Seleção de Cor Sólida: Limpa a textura ativa e define a cor
  const handleChooseColor = (color: string) => {
    onSelectColor(color);
    if (handleSelectTex) {
      handleSelectTex(undefined);
    }
    setAppearanceType('color');
  };

  // Seleção de Textura: Define a URL da textura ativa
  const handleChooseTexture = (url: string) => {
    if (handleSelectTex) {
      handleSelectTex(url);
    }
    setAppearanceType('texture');
  };

  // Upload de Imagem de Arquivo Local
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          addCustomTexture(file.name.substring(0, 16), dataUrl);
          handleChooseTexture(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Adição via Link / URL de Imagem Pública
  const handleAddUrlTexture = () => {
    if (urlInputValue.trim()) {
      const url = urlInputValue.trim();
      addCustomTexture('Textura Web', url);
      handleChooseTexture(url);
      setUrlInputValue('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-3.5 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs select-none">
      {/* Título & Alternador de Tipo de Aparência (Cor Sólida vs Textura) */}
      <div className="flex items-center justify-between font-semibold text-white">
        <span className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>{label}</span>
        </span>

        {/* Abas: Cor Sólida / Textura Imagem */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              if (handleSelectTex) handleSelectTex(undefined);
              setAppearanceType('color');
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              appearanceType === 'color' && !activeTextureUrl
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cor Sólida
          </button>
          <button
            onClick={() => setAppearanceType('texture')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              appearanceType === 'texture' || activeTextureUrl
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Textura
          </button>
        </div>
      </div>

      {/* ABA 1: CORES SÓLIDAS */}
      {(appearanceType === 'color' && !activeTextureUrl) && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Seletor Hex Customizado */}
          <label className="flex items-center gap-2.5 p-2 bg-slate-900 border border-slate-700/80 rounded-xl cursor-pointer hover:border-slate-500 transition-all">
            <input
              type="color"
              value={activeColor}
              onChange={(e) => handleChooseColor(e.target.value)}
              className="w-6 h-6 rounded-lg border-0 bg-transparent cursor-pointer p-0"
            />
            <span className="font-mono text-slate-200 uppercase text-xs">{activeColor}</span>
          </label>

          {/* Paleta de Cores Rápidas */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold">Paleta de Cores:</span>
            <div className="grid grid-cols-8 gap-1.5">
              {presetColors.map((color) => {
                const isSelected = activeColor.toLowerCase() === color.toLowerCase() && !activeTextureUrl;
                return (
                  <button
                    key={color}
                    onClick={() => handleChooseColor(color)}
                    className={`w-6 h-6 rounded-lg border border-slate-700 transition-all hover:scale-110 flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-amber-400 scale-110 shadow-lg' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-slate-950 drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: GALERIA DE TEXTURAS DE IMAGEM */}
      {(appearanceType === 'texture' || activeTextureUrl) && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Galeria de Texturas de Imagem</span>
            </span>

            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Fazer Upload de Arquivo de Imagem (.png, .jpg)"
                className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
              >
                <Upload className="w-3 h-3" />
                <span>Upload</span>
              </button>

              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                title="Adicionar por Link de Imagem URL"
                className="p-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Link URL</span>
              </button>
            </div>
          </div>

          {/* Campo de Entrada de URL de Link de Imagem */}
          {showUrlInput && (
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 rounded-xl border border-cyan-500/40">
              <input
                type="url"
                placeholder="Cole o link da imagem (https://...)"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                className="flex-1 bg-transparent px-2 py-1 text-[11px] text-white outline-none"
              />
              <button
                onClick={handleAddUrlTexture}
                className="px-2 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Salvar</span>
              </button>
            </div>
          )}

          {/* Mostra a Galeria de Texturas de Imagem */}
          {customTextures.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {customTextures.map((tex) => {
                const isSelected = activeTextureUrl === tex.url;
                return (
                  <div
                    key={tex.id}
                    className={`relative group rounded-xl border overflow-hidden transition-all ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-500/60 scale-105 shadow-lg shadow-cyan-500/20'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <button
                      onClick={() => handleChooseTexture(tex.url)}
                      className="w-full h-12 block bg-slate-900"
                    >
                      <img src={tex.url} alt={tex.name} className="w-full h-full object-cover" />
                    </button>

                    {/* Botão de Exclusão da Textura */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomTexture(tex.id);
                      }}
                      title="Excluir Textura (Objetos revertem para cor sólida)"
                      className="absolute top-1 right-1 p-1 bg-rose-950/80 text-rose-300 border border-rose-600/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {isSelected && (
                      <div className="absolute bottom-1 right-1 p-0.5 bg-cyan-500 text-slate-950 rounded-full shadow">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-slate-400 text-[11px]">
              Nenhuma textura de imagem cadastrada. Faça upload ou cole um link acima para usar como textura!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
