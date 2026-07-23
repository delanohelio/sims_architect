import React, { useRef, useState } from 'react';
import { Palette, Upload, Link as LinkIcon, Trash2, Check, Image as ImageIcon, Plus } from 'lucide-react';
import { useSimsStore } from '../../store/useSimsStore';
import { urlToDataUrl, fileToDataUrl } from '../../utils/imageStorage';

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

  const handleChooseColor = (color: string) => {
    onSelectColor(color);
    if (handleSelectTex) {
      handleSelectTex(undefined);
    }
    setAppearanceType('color');
  };

  const handleChooseTexture = (url: string) => {
    if (handleSelectTex) {
      handleSelectTex(url);
    }
    setAppearanceType('texture');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        addCustomTexture(file.name.substring(0, 16), dataUrl);
        handleChooseTexture(dataUrl);
      } catch (err) {
        console.error('Erro ao ler arquivo de imagem:', err);
      }
    }
  };

  const handleAddUrlTexture = async () => {
    if (urlInputValue.trim()) {
      const rawUrl = urlInputValue.trim();
      const offlineUrl = await urlToDataUrl(rawUrl);
      addCustomTexture('Textura Web', offlineUrl);
      handleChooseTexture(offlineUrl);
      setUrlInputValue('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs select-none w-full min-w-0 overflow-hidden">
      {/* TÍTULO & ALTERNADOR COR vs TEXTURA */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-white flex items-center gap-1.5 text-xs truncate min-w-0">
          <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{label}</span>
        </span>

        <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
          <button
            type="button"
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
            type="button"
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
      {appearanceType === 'color' && !activeTextureUrl && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <label className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-all">
            <input
              type="color"
              value={activeColor}
              onChange={(e) => handleChooseColor(e.target.value)}
              className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer p-0 shrink-0"
            />
            <span className="font-mono text-slate-200 uppercase text-xs truncate">{activeColor}</span>
          </label>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold block">Paleta de Cores:</span>
            <div className="grid grid-cols-8 gap-1">
              {presetColors.map((color) => {
                const isSelected = activeColor.toLowerCase() === color.toLowerCase() && !activeTextureUrl;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleChooseColor(color)}
                    className={`w-full aspect-square rounded-lg border border-slate-700/80 transition-all hover:scale-105 flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-amber-400 scale-105 shadow' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-slate-950 drop-shadow shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: GALERIA DE TEXTURAS DE IMAGEM */}
      {(appearanceType === 'texture' || activeTextureUrl) && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-white flex items-center gap-1 min-w-0 truncate">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Texturas</span>
            </span>

            <div className="flex items-center gap-1 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Fazer Upload de Arquivo de Imagem (.png, .jpg)"
                className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
              >
                <Upload className="w-3 h-3 shrink-0" />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                title="Adicionar por Link de Imagem URL"
                className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
              >
                <LinkIcon className="w-3 h-3 shrink-0" />
                <span>URL</span>
              </button>
            </div>
          </div>

          {/* CAMPO DE ENTRADA DE URL */}
          {showUrlInput && (
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-cyan-500/40">
              <input
                type="url"
                placeholder="Cole o link (https://...)"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                className="flex-1 bg-transparent px-2 py-1 text-[10px] text-white outline-none min-w-0"
              />
              <button
                type="button"
                onClick={handleAddUrlTexture}
                className="px-2 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-0.5 shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>OK</span>
              </button>
            </div>
          )}

          {/* GALERIA DE TEXTURAS DE IMAGEM */}
          {customTextures.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
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
                      type="button"
                      onClick={() => handleChooseTexture(tex.url)}
                      className="w-full h-10 block bg-slate-900 overflow-hidden"
                    >
                      <img
                        src={tex.url}
                        alt={tex.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomTexture(tex.id);
                      }}
                      title="Excluir Textura"
                      className="absolute top-0.5 right-0.5 p-1 bg-rose-950/90 text-rose-300 border border-rose-600/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 hover:text-white"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>

                    {isSelected && (
                      <div className="absolute bottom-0.5 right-0.5 p-0.5 bg-cyan-500 text-slate-950 rounded-full shadow">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-slate-400 text-[10px]">
              Nenhuma textura cadastrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
