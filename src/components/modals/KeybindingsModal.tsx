import { useState, useEffect } from 'react';
import { 
  Keyboard, 
  X, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  Layers, 
  Camera, 
  ShoppingBag 
} from 'lucide-react';
import { useSimsStore } from '../../store/useSimsStore';
import type { ShortcutAction } from '../../types/sims';

interface ActionGroup {
  title: string;
  icon: React.ReactNode;
  actions: { id: ShortcutAction; label: string }[];
}

export function KeybindingsModal() {
  const { 
    keybindings, 
    setKeybinding, 
    resetKeybindings, 
    isKeybindingsModalOpen, 
    setIsKeybindingsModalOpen 
  } = useSimsStore();

  const [listeningAction, setListeningAction] = useState<ShortcutAction | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isKeybindingsModalOpen) {
      setListeningAction(null);
      setConflictMessage(null);
    }
  }, [isKeybindingsModalOpen]);

  if (!isKeybindingsModalOpen) return null;

  const groups: ActionGroup[] = [
    {
      title: '🎥 Navegação & Câmera',
      icon: <Camera className="w-4 h-4 text-cyan-400" />,
      actions: [
        { id: 'zoomIn', label: 'Aumentar Zoom (+)' },
        { id: 'zoomOut', label: 'Diminuir Zoom (-)' },
        { id: 'zoomReset', label: 'Resetar Zoom (100%)' },
        { id: 'rotateCCW', label: 'Girar Câmera Anti-Horário' },
        { id: 'rotateCW', label: 'Girar Câmera Horário' },
        { id: 'toggleGrid', label: 'Alternar Grid Métrico' },
      ],
    },
    {
      title: '🧱 Modo Construção',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
      actions: [
        { id: 'toolSelect', label: 'Mão (Selecionar / Mover)' },
        { id: 'toolWall', label: 'Construir Parede' },
        { id: 'toolPaint', label: 'Pintar Parede (Dual-Face)' },
        { id: 'toolFloor', label: 'Aplicação de Pisos' },
        { id: 'toolDoorWindow', label: 'Esquadrias (Portas / Janelas)' },
        { id: 'hammer', label: 'Ferramenta Marreta (Borracha)' },
      ],
    },
    {
      title: '🛋️ Modo Compra & Categorias',
      icon: <ShoppingBag className="w-4 h-4 text-purple-400" />,
      actions: [
        { id: 'rotateItem', label: 'Rotacionar Móvel (+45°)' },
        { id: 'catBedroom', label: 'Categoria: Quarto' },
        { id: 'catLiving', label: 'Categoria: Sala' },
        { id: 'catKitchen', label: 'Categoria: Cozinha' },
        { id: 'catBathroom', label: 'Categoria: Banheiro' },
        { id: 'catOutdoor', label: 'Categoria: Exterior' },
        { id: 'catCustom', label: 'Categoria: Customizado' },
      ],
    },
  ];

  const actionLabels: Record<ShortcutAction, string> = {
    zoomIn: 'Aumentar Zoom (+)',
    zoomOut: 'Diminuir Zoom (-)',
    zoomReset: 'Resetar Zoom (100%)',
    rotateCCW: 'Girar Câmera Anti-Horário',
    rotateCW: 'Girar Câmera Horário',
    rotateItem: 'Rotacionar Móvel (+45°)',
    hammer: 'Ferramenta Marreta',
    toggleGrid: 'Alternar Grid Métrico',
    toolSelect: 'Mão (Selecionar / Mover)',
    toolWall: 'Construir Parede',
    toolPaint: 'Pintar Parede',
    toolFloor: 'Aplicação de Pisos',
    toolDoorWindow: 'Esquadrias (Portas / Janelas)',
    catBedroom: 'Categoria: Quarto',
    catLiving: 'Categoria: Sala',
    catKitchen: 'Categoria: Cozinha',
    catBathroom: 'Categoria: Banheiro',
    catOutdoor: 'Categoria: Exterior',
    catCustom: 'Categoria: Customizado',
  };

  const formatKeyName = (code: string) => {
    if (!code) return '-';
    if (code.startsWith('Key')) return code.replace('Key', '').toUpperCase();
    if (code.startsWith('Digit')) return code.replace('Digit', '');
    return code;
  };

  const handleStartListening = (action: ShortcutAction) => {
    setListeningAction(action);
    setConflictMessage(null);

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.code === 'Escape' || e.code === 'Tab') {
        setListeningAction(null);
        window.removeEventListener('keydown', onKeyDown);
        return;
      }

      const requestedKey = e.code;
      const keyDisplay = formatKeyName(requestedKey);

      // DUPLICATE PREVENTION: Check if requestedKey is assigned to another action
      const conflictEntry = Object.entries(keybindings).find(
        ([act, k]) => act !== action && k.toLowerCase() === requestedKey.toLowerCase()
      );

      if (conflictEntry) {
        const conflictActionId = conflictEntry[0] as ShortcutAction;
        const conflictName = actionLabels[conflictActionId] || conflictActionId;
        setConflictMessage(`⚠️ A tecla [ ${keyDisplay} ] já está atribuída a "${conflictName}". Escolha uma tecla diferente.`);
        setListeningAction(null);
        window.removeEventListener('keydown', onKeyDown);
        return;
      }

      const success = setKeybinding(action, requestedKey);
      if (!success) {
        setConflictMessage(`⚠️ A tecla [ ${keyDisplay} ] já está em uso por outro atalho.`);
      } else {
        setConflictMessage(null);
      }

      setListeningAction(null);
      window.removeEventListener('keydown', onKeyDown);
    };

    window.addEventListener('keydown', onKeyDown, { once: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* CABEÇALHO DO MODAL */}
        <div className="p-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Configurar Atalhos de Teclado</h2>
              <p className="text-xs text-slate-400">Personalize os atalhos. Teclas duplicadas são bloqueadas automaticamente.</p>
            </div>
          </div>
          <button
            onClick={() => setIsKeybindingsModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE CONFLITO DE ATALHO DUPLICADO */}
        {conflictMessage && (
          <div className="px-5 py-3 bg-rose-950/90 border-b border-rose-800/80 flex items-center gap-2.5 text-xs text-rose-200 font-semibold animate-in slide-in-from-top duration-150">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{conflictMessage}</span>
          </div>
        )}

        {/* CONTEÚDO COM SCROLL */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          {groups.map((group) => (
            <div key={group.title} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                {group.icon}
                <span>{group.title}</span>
              </div>

              <div className="grid grid-cols-1 gap-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
                {group.actions.map((act) => {
                  const currentCode = keybindings[act.id] || '';
                  const keyDisplay = formatKeyName(currentCode);
                  const isListening = listeningAction === act.id;

                  return (
                    <div
                      key={act.id}
                      className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/80 transition-all"
                    >
                      <span className="text-xs font-medium text-slate-300">{act.label}</span>

                      <button
                        onClick={() => handleStartListening(act.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border shadow ${
                          isListening
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 animate-pulse scale-105'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {isListening ? 'Pressione a tecla...' : `[ ${keyDisplay} ]`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* RODAPÉ COM AÇÕES */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              resetKeybindings();
              setConflictMessage(null);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            onClick={() => setIsKeybindingsModalOpen(false)}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Concluído</span>
          </button>
        </div>
      </div>
    </div>
  );
}
