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
  FileSignature,
  Printer,
  Sliders
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useSimsStore } from '../../store/useSimsStore';
import { exportPlanToDataUrl } from '../../utils/planExporter';
import type { ExportQuality } from '../../types/sims';
import { calculatePolygonArea } from '../../hooks/useAnnotationInteractions';

export function ExportSidebar() {
  const { 
    terrain, 
    walls, 
    floors, 
    doorsWindows, 
    items,
    annotations,
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

  // OPÇÕES DE CONFIGURAÇÃO DA EXPORTAÇÃO
  const [exportQuality, setExportQuality] = useState<ExportQuality>('high');
  const [useWhiteBackground, setUseWhiteBackground] = useState<boolean>(true);

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

  // Obtém o DataURL seguro da planta baixa com Cotas Métricas e Qualidade Escolhida
  const getSafePlanDataUrl = (overrideQuality?: ExportQuality, overrideWhiteBg?: boolean): string => {
    setViewMode('2d');
    const domCanvas = (document.getElementById('sims-canvas-2d') as HTMLCanvasElement) || document.querySelector('canvas');
    return exportPlanToDataUrl(domCanvas, {
      terrain,
      walls,
      floors,
      doorsWindows,
      items,
      annotations,
      projectName,
      projectDescription,
      quality: overrideQuality || exportQuality,
      useWhiteBackground: overrideWhiteBg !== undefined ? overrideWhiteBg : useWhiteBackground,
    });
  };

  // 3. EXPORTAR PLANTA BAIXA (PNG)
  const handleExportPNG = () => {
    try {
      const dataUrl = getSafePlanDataUrl();
      const link = document.createElement('a');
      link.href = dataUrl;
      const safeName = (projectName || 'planta-baixa').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const qSuffix = exportQuality === 'high' ? '4k' : exportQuality === 'low' ? 'sd' : 'hd';
      link.download = `${safeName}-${terrain.width}x${terrain.length}m-${qSuffix}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('success', `Planta baixa em PNG (${exportQuality.toUpperCase()}) exportada com sucesso!`);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao gerar imagem PNG.');
    }
  };

  // 4. EXPORTAR PDF MULTI-PÁGINAS (PÁG 1: PLANTA EM ALTA RESOLUÇÃO; PÁG 2+: MARCAÇÕES E RELATÓRIO DE MATERIAIS)
  const handleExportPDF = () => {
    try {
      // Sempre gera com alta qualidade e fundo branco na primeira página do PDF para impressão
      const imgData = getSafePlanDataUrl('high', true);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const pageHeight = 210;

      // ==========================================
      // PÁGINA 1: PLANTA BAIXA ARQUITETÔNICA HD
      // ==========================================
      const headerHeight = 36;

      // Cabeçalho Fundo Limpo
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(0, 0, pageWidth, headerHeight, 'F');
      pdf.setFillColor(16, 185, 129); // emerald-500
      pdf.rect(0, headerHeight - 1.5, pageWidth, 1.5, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      const displayTitle = projectName.trim() ? projectName : 'Sims Architect — Planta Baixa Executiva';
      pdf.text(displayTitle, 14, 14);

      const dateStr = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Data: ${dateStr} | Prancha 01/02`, pageWidth - 14, 14, { align: 'right' });

      if (projectDescription.trim()) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        pdf.text(projectDescription.substring(0, 110), 14, 22);
      }

      const totalArea = terrain.width * terrain.length;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(14, 165, 233);
      pdf.text(
        `Lote: ${terrain.width}m × ${terrain.length}m (${totalArea} m²) | Paredes: ${walls.length} | Zonas Demarcadas: ${annotations.length}`,
        14,
        headerHeight - 6
      );

      // Imagem HD da Planta
      const imgProps = pdf.getImageProperties(imgData);
      const maxImgWidth = 269;
      const maxImgHeight = pageHeight - headerHeight - 18;

      let finalWidth = maxImgWidth;
      let finalHeight = (imgProps.height * maxImgWidth) / imgProps.width;

      if (finalHeight > maxImgHeight) {
        finalHeight = maxImgHeight;
        finalWidth = (imgProps.width * maxImgHeight) / imgProps.height;
      }

      const xPos = (pageWidth - finalWidth) / 2;
      const yPos = headerHeight + 2 + (maxImgHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);

      // Rodapé Pág 1
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Sims Architect 2D/3D Planner — Desenho Técnico Arquitetônico', 14, pageHeight - 5);
      pdf.text('Página 1 de 2', pageWidth - 14, pageHeight - 5, { align: 'right' });

      // ==========================================
      // PÁGINA 2: SUMÁRIO DE MARCAÇÕES & QUANTITATIVO DE MATERIAIS
      // ==========================================
      pdf.addPage('a4', 'landscape');

      // Cabeçalho Pág 2
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 0, pageWidth, 28, 'F');
      pdf.setFillColor(14, 165, 233);
      pdf.rect(0, 26.5, pageWidth, 1.5, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Relatório Executivo — Marcações de Ambientes & Quantitativo de Materiais', 14, 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Projeto: ${projectName}`, pageWidth - 14, 14, { align: 'right' });

      let currentY = 36;

      // TABELA 1: MARCAÇÕES DE ÁREAS (ZONAS)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(16, 185, 129);
      pdf.text('1. Sumário de Marcações de Ambientes e Áreas (m²)', 14, currentY);
      currentY += 6;

      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, currentY, 269, 7, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Nome do Ambiente / Zona', 18, currentY + 5);
      pdf.text('Estilo do Contorno', 110, currentY + 5);
      pdf.text('Cor', 180, currentY + 5);
      pdf.text('Área Calculada (m²)', 240, currentY + 5);
      currentY += 8;

      let totalZonesArea = 0;
      if (annotations.length === 0) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        pdf.text('Nenhuma marcação de ambiente cadastrada no projeto.', 18, currentY + 4);
        currentY += 10;
      } else {
        annotations.forEach((ann) => {
          const areaM2 = calculatePolygonArea(ann.points);
          totalZonesArea += areaM2;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(30, 41, 59);
          pdf.text(ann.name, 18, currentY + 4);
          pdf.text(ann.lineStyle === 'solid' ? 'Contínua' : ann.lineStyle === 'dashed' ? 'Pontilhada' : 'Invisível', 110, currentY + 4);
          pdf.text(ann.color, 180, currentY + 4);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${areaM2.toFixed(2)} m²`, 240, currentY + 4);

          pdf.setDrawColor(241, 245, 249);
          pdf.line(14, currentY + 6, 283, currentY + 6);
          currentY += 7;
        });

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(16, 185, 129);
        pdf.text(`Total Demarcado: ${totalZonesArea.toFixed(2)} m² (${((totalZonesArea / totalArea) * 100).toFixed(1)}% do lote)`, 240, currentY + 4);
        currentY += 12;
      }

      // TABELA 2: QUANTITATIVO DE ESTRUTURAS & MATERIAIS
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(14, 165, 233);
      pdf.text('2. Relatório Quantitativo de Estruturas & Esquadrias', 14, currentY);
      currentY += 6;

      // Cálculo de Metros Lineares de Parede
      let totalWallMeters = 0;
      walls.forEach((w) => {
        totalWallMeters += Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
      });

      // Contagem de Esquadrias
      let doorsCount = 0;
      let slidingDoorsCount = 0;
      let windowsCount = 0;
      doorsWindows.forEach((dw) => {
        if (dw.isSliding || dw.catalogId === 'door_sliding') slidingDoorsCount++;
        else if (dw.type === 'door') doorsCount++;
        else windowsCount++;
      });

      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, currentY, 269, 7, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Elemento Construtivo', 18, currentY + 5);
      pdf.text('Quantidade / Extensão Total', 180, currentY + 5);
      currentY += 8;

      const structRows = [
        { name: 'Paredes Estruturais (Comprimento Total)', val: `${totalWallMeters.toFixed(2)} metros lineares` },
        { name: 'Área Total de Pisos Pintados no Lote', val: `${Object.keys(floors).length} m²` },
        { name: 'Portas Simples / Duplas com Dobradiça', val: `${doorsCount} unidade(s)` },
        { name: 'Portas de Correr Especiais (Sem Dobradiça)', val: `${slidingDoorsCount} unidade(s)` },
        { name: 'Janelas e Aberturas Panorâmicas', val: `${windowsCount} unidade(s)` },
        { name: 'Mobiliário e Objetos Colocados', val: `${items.length} item(ns)` },
      ];

      structRows.forEach((row) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(30, 41, 59);
        pdf.text(row.name, 18, currentY + 4);
        pdf.setFont('helvetica', 'bold');
        pdf.text(row.val, 180, currentY + 4);

        pdf.setDrawColor(241, 245, 249);
        pdf.line(14, currentY + 6, 283, currentY + 6);
        currentY += 7;
      });

      // Rodapé Pág 2
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Sims Architect 2D/3D Planner — Relatório Executivo de Quantitativos', 14, pageHeight - 5);
      pdf.text('Página 2 de 2', pageWidth - 14, pageHeight - 5, { align: 'right' });

      // Salva o PDF
      const safeName = (projectName || 'projeto-arquitetonico').toLowerCase().replace(/[^a-z0-9]/g, '-');
      pdf.save(`${safeName}-${terrain.width}x${terrain.length}m.pdf`);
      showNotification('success', 'Documento PDF de 2 páginas (Planta HD + Relatório) gerado com sucesso!');
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
            <p className="text-[11px] text-slate-400">Exporte imagens HD, PDF multi-páginas e relatórios</p>
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

        {/* IDENTIFICAÇÃO DO PROJETO */}
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
                placeholder="Ex: Residência Villa Sims..."
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
                placeholder="Ex: Sobrado moderno com área gourmet integrando sala..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-all resize-none font-normal"
              />
            </div>
          </div>
        </div>

        {/* CONFIGURAÇÃO DE QUALIDADE DE EXPORTAÇÃO */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Qualidade da Imagem e Impressão</span>
          </label>

          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-[11px] text-slate-300 font-semibold block mb-1.5">
                Resolução da Imagem:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setExportQuality('high')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    exportQuality === 'high'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🖨️ Alta (4K)
                </button>
                <button
                  onClick={() => setExportQuality('medium')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    exportQuality === 'medium'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  📱 Média (HD)
                </button>
                <button
                  onClick={() => setExportQuality('low')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    exportQuality === 'low'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  ⚡ Baixa (SD)
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[11px] text-slate-300 font-semibold block">
                Estilo do Fundo da Exportação:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUseWhiteBackground(false)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    !useWhiteBackground
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Fundo Tema ({terrain.theme})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseWhiteBackground(true)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    useWhiteBackground
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fundo Branco (Prancha)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMO DAS MÉTRICAS */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Métricas do Projeto</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Lote & Área</span>
              <strong className="text-white text-sm font-mono">{terrain.width}x{terrain.length}m ({totalArea}m²)</strong>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Zonas Demarcadas</span>
              <strong className="text-teal-400 text-sm font-mono">{annotations.length} zonas</strong>
            </div>
          </div>
        </div>

        {/* BOTÕES DE EXPORTAÇÃO */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Ações de Exportação</span>
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
                  <div className="text-[10px] text-slate-400 font-normal">Backup completo com zonas e atalhos</div>
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

            {/* 3. 🖼️ EXPORTAR PLANTA (PNG EM ALTA QUALIDADE) */}
            <button
              onClick={handleExportPNG}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center justify-between transition-all group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">3. Exportar Imagem PNG ({exportQuality.toUpperCase()})</div>
                  <div className="text-[10px] text-slate-400 font-normal">Imagem de alta definição com cotas</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">.PNG</span>
            </button>

            {/* 4. 📄 EXPORTAR PDF MULTI-PÁGINAS (PLANTA + MARCAÇÕES & MATERIAIS) */}
            <button
              onClick={handleExportPDF}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center justify-between transition-all group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">4. Exportar PDF Multi-Páginas (Prancha + Relatório)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Pág 1: Planta HD; Pág 2+: Sumário & Materiais</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">.PDF</span>
            </button>

            {/* 5. 🗑️ NOVO PROJETO */}
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
            Nome do projeto, zonas de marcação e atalhos customizados são salvos automaticamente no navegador (<code className="text-emerald-400 font-mono">sims-architect-storage</code>).
          </p>
        </div>
      </div>
    </aside>
  );
}
