import React, { useRef, useState } from 'react';
import { 
  Download, 
  Save, 
  FolderOpen, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Layers,
  FileSignature
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useSimsStore } from '../../store/useSimsStore';
import { exportPlanToDataUrl } from '../../utils/planExporter';

export function ExportSidebar() {
  const { 
    terrain, 
    walls, 
    floors, 
    doorsWindows, 
    items, 
    projectName,
    projectDescription,
    setProjectName,
    setProjectDescription,
    exportJSON, 
    importJSON, 
    resetProject,
    setViewMode
  } = useSimsStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. SALVAR PROJETO (.JSON)
  const handleSaveJSON = () => {
    try {
      const jsonString = exportJSON();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = (projectName || 'projeto-sims').toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `${safeName}-${terrain.width}x${terrain.length}m.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('success', 'Projeto salvo com sucesso em arquivo .JSON!');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao exportar arquivo JSON do projeto.');
    }
  };

  // 2. CARREGAR PROJETO (.JSON)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importJSON(content);
        if (success) {
          showNotification('success', 'Projeto carregado com sucesso!');
        } else {
          showNotification('error', 'Arquivo JSON inválido ou corrompido.');
        }
      }
    };
    reader.onerror = () => {
      showNotification('error', 'Erro ao ler arquivo selecionado.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Obtém o DataURL seguro da planta baixa com Cotas Métricas (à prova de SecurityError / CORS)
  const getSafePlanDataUrl = (): string => {
    setViewMode('2d');
    const domCanvas = (document.getElementById('sims-canvas-2d') as HTMLCanvasElement) || document.querySelector('canvas');
    return exportPlanToDataUrl(domCanvas, {
      terrain,
      walls,
      floors,
      doorsWindows,
      items,
      projectName,
      projectDescription,
    });
  };

  // 3. EXPORTAR PLANTA BAIXA (PNG)
  const handleExportPNG = () => {
    try {
      const dataUrl = getSafePlanDataUrl();
      const link = document.createElement('a');
      link.href = dataUrl;
      const safeName = (projectName || 'planta-baixa').toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `${safeName}-${terrain.width}x${terrain.length}m.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('success', 'Planta baixa em PNG (com cotas métricas) exportada com sucesso!');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao gerar imagem PNG.');
    }
  };

  // 4. EXPORTAR PLANTA BAIXA EM PDF (jsPDF)
  const handleExportPDF = () => {
    try {
      const imgData = getSafePlanDataUrl();

      // Cria documento PDF A4 em Orientação Paisagem (Landscape)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const pageHeight = 210;

      // 1. Faixa de Cabeçalho Superior Elegante (Dark Theme)
      const headerHeight = projectDescription.trim() ? 44 : 38;
      pdf.setFillColor(15, 23, 42); // slate-900
      pdf.rect(0, 0, pageWidth, headerHeight, 'F');

      // Linha decorativa verde esmeralda
      pdf.setFillColor(16, 185, 129); // emerald-500
      pdf.rect(0, headerHeight - 2, pageWidth, 2, 'F');

      // Título do Projeto (Nome Customizado)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      const displayTitle = projectName.trim() ? projectName : 'Sims Architect — Planta Baixa Arquitetônica';
      pdf.text(displayTitle, 14, 14);

      // Data e Hora de Geração
      const dateStr = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(`Gerado em: ${dateStr}`, pageWidth - 14, 14, { align: 'right' });

      // Descrição Opcional do Projeto
      if (projectDescription.trim()) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(203, 213, 225); // slate-300
        const truncatedDesc = projectDescription.length > 110 ? projectDescription.substring(0, 110) + '...' : projectDescription;
        pdf.text(`Descrição: "${truncatedDesc}"`, 14, 23);
      }

      // Subtítulo de Estatísticas e Métricas Dinâmicas do Projeto
      const totalArea = terrain.width * terrain.length;
      const floorsCount = Object.keys(floors).length;
      const statsText = `Métricas: Lote ${terrain.width}m × ${terrain.length}m | Área Total: ${totalArea}m² | Paredes: ${walls.length} | Pisos: ${floorsCount}m² | Esquadrias: ${doorsWindows.length} | Móveis: ${items.length}`;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(56, 189, 248); // sky-400
      pdf.text(statsText, 14, headerHeight - 7);

      // 2. Centralização da Imagem da Planta Baixa no PDF
      const imgProps = pdf.getImageProperties(imgData);
      const maxImgWidth = 269; // Margens laterais de 14mm
      const maxImgHeight = pageHeight - headerHeight - 20; // Margem vertical dinâmica

      let finalWidth = maxImgWidth;
      let finalHeight = (imgProps.height * maxImgWidth) / imgProps.width;

      if (finalHeight > maxImgHeight) {
        finalHeight = maxImgHeight;
        finalWidth = (imgProps.width * maxImgHeight) / imgProps.height;
      }

      const xPos = (pageWidth - finalWidth) / 2;
      const yPos = headerHeight + 4 + (maxImgHeight - finalHeight) / 2;

      // Moldura e Fundo Branco para o Desenho
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xPos - 2, yPos - 2, finalWidth + 4, finalHeight + 4, 'F');
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.rect(xPos - 2, yPos - 2, finalWidth + 4, finalHeight + 4, 'D');

      // Desenha a imagem no PDF
      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);

      // 3. Rodapé do Documento
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Sims Architect 2D/3D Planner — Desenho Técnico com Cotas Métricas', 14, pageHeight - 6);
      pdf.text('Página 1 de 1', pageWidth - 14, pageHeight - 6, { align: 'right' });

      // Salva o PDF com o nome seguro do projeto
      const safeName = (projectName || 'projeto-arquitetonico').toLowerCase().replace(/[^a-z0-9]/g, '-');
      pdf.save(`${safeName}-${terrain.width}x${terrain.length}m.pdf`);
      showNotification('success', 'Documento PDF com cotas e cabeçalho gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao gerar documento PDF.');
    }
  };

  // 5. NOVO PROJETO (LIMPAR TUDO)
  const handleConfirmReset = () => {
    resetProject();
    setShowResetConfirm(false);
    showNotification('success', 'Novo projeto iniciado! Todos os elementos foram limpos.');
  };

  const totalArea = terrain.width * terrain.length;
  const paintedFloors = Object.keys(floors).length;

  return (
    <aside className="w-88 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] z-20 shadow-2xl select-none overflow-y-auto custom-scrollbar">
      {/* Input de Arquivo JSON Oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Cabeçalho do Painel */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Modo Exportar & Salvar</h2>
            <p className="text-[11px] text-slate-400">Gerencie detalhes, arquivos e exportações com cotas</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Notificações / Toast de Feedback */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
        )}

        {/* IDENTIFICAÇÃO DO PROJETO (NOME & DESCRIÇÃO OPÇÕES) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-cyan-400" />
            <span>Identificação do Projeto</span>
          </label>

          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                Nome do Projeto:
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Residência Villa Sims, Casa de Praia..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                Descrição do Projeto (Opcional):
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={2}
                placeholder="Ex: Sobrado moderno de 2 pavimentos com área gourmet integrando sala..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-all resize-none font-normal"
              />
            </div>
          </div>
        </div>

        {/* RESUMO DAS MÉTRICAS DO PROJETO ATUAL */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Métricas do Projeto Atual</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Dimensão do Lote</span>
              <strong className="text-white text-sm font-mono">{terrain.width}m × {terrain.length}m</strong>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Área Total</span>
              <strong className="text-emerald-400 text-sm font-mono">{totalArea} m²</strong>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Paredes / Esquadrias</span>
              <strong className="text-cyan-400 text-sm font-mono">{walls.length} p / {doorsWindows.length} esq</strong>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Pisos / Móveis</span>
              <strong className="text-purple-400 text-sm font-mono">{paintedFloors}m² / {items.length} móv</strong>
            </div>
          </div>
        </div>

        {/* 5 BOTÕES DE AÇÃO PRINCIPAIS COM COTAS E PROJETO */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Ações de Exportação com Cotas Métricas</span>
          </label>

          <div className="space-y-2.5">
            {/* 1. 💾 SALVAR PROJETO (.JSON) */}
            <button
              onClick={handleSaveJSON}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-between transition-all group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Save className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">1. Salvar Projeto (.json)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Baixa arquivo de backup completo</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">.JSON</span>
            </button>

            {/* 2. 📂 CARREGAR PROJETO (.JSON) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-between transition-all group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">2. Carregar Projeto (.json)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Restaura projeto de arquivo local</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">Abrir</span>
            </button>

            {/* 3. 🖼️ EXPORTAR PLANTA (PNG COM COTAS) */}
            <button
              onClick={handleExportPNG}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center justify-between transition-all group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">3. Exportar Planta (PNG com Cotas)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Imagem HD com dimensões e nome</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">.PNG</span>
            </button>

            {/* 4. 📄 EXPORTAR PLANTA (PDF COM COTAS & DETALHES) */}
            <button
              onClick={handleExportPDF}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center justify-between transition-all group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">4. Exportar Planta (PDF com Cotas)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Prancha A4 com título e cotas métricas</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">.PDF</span>
            </button>

            {/* 5. 🗑️ NOVO PROJETO (LIMPAR TUDO) */}
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 font-semibold text-xs flex items-center justify-center gap-2 transition-all mt-2"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>5. Novo Projeto (Limpar Tudo)</span>
              </button>
            ) : (
              <div className="p-3.5 bg-rose-950/80 border border-rose-600/60 rounded-2xl space-y-2.5 text-xs text-rose-200 animate-in fade-in duration-150">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Tem certeza? Todos os elementos serão apagados!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleConfirmReset}
                    className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow"
                  >
                    Sim, Limpar Tudo
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INDICADOR DE AUTO-SAVE */}
        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Persistência Automática Ativa</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Nome do projeto, descrição e estruturas são salvos automaticamente no navegador (<code className="text-emerald-400 font-mono">sims-architect-storage</code>).
          </p>
        </div>
      </div>
    </aside>
  );
}
