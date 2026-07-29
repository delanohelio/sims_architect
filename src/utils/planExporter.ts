import type { TerrainConfig, Wall, FloorTile, DoorWindow, FurnitureItem, ZoneAnnotation, ExportQuality } from '../types/sims';
import { calculatePolygonArea, calculatePolygonCentroid } from '../hooks/useAnnotationInteractions';

interface ExportPlanParams {
  terrain: TerrainConfig;
  walls: Wall[];
  floors: Record<string, FloorTile>;
  doorsWindows: DoorWindow[];
  items: FurnitureItem[];
  annotations?: ZoneAnnotation[];
  projectName?: string;
  projectDescription?: string;
  quality?: ExportQuality;
  useWhiteBackground?: boolean;
  autoRotateForMaxFill?: boolean;
}

const THEME_COLORS: Record<string, { bg: string; fill: string; sec: string }> = {
  grass: { bg: '#0F172A', fill: '#15803D', sec: '#166534' },
  blueprint: { bg: '#0F172A', fill: '#1E3A8A', sec: '#1D4ED8' },
  dark: { bg: '#030712', fill: '#0F172A', sec: '#1E293B' },
  concrete: { bg: '#0F172A', fill: '#334155', sec: '#475569' },
};

/**
  Renderiza e extrai o DataURL seguro da planta baixa com Fidelidade Total de Cores,
  Cotas Métricas, Marcações de Área, Textos Livres, Escolha de Fundo (Tema vs Branco) e Enquadramento Máximo (Auto-Fit & Rotação).
 */
export function exportPlanToDataUrl(
  _domCanvas: HTMLCanvasElement | null,
  params: ExportPlanParams
): string {
  const {
    terrain,
    walls,
    floors,
    doorsWindows,
    items,
    annotations = [],
    projectName = 'Projeto Arquitetônico',
    projectDescription,
    quality = 'high',
    useWhiteBackground = false,
    autoRotateForMaxFill = true,
  } = params;

  // Resolução com base no nível de qualidade selecionado
  let widthPx = 2048;
  let heightPx = 1440;

  if (quality === 'high') {
    widthPx = 4096;
    heightPx = 2880;
  } else if (quality === 'low') {
    widthPx = 1024;
    heightPx = 720;
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = widthPx;
  offscreen.height = heightPx;

  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível inicializar o contexto 2D de exportação.');
  }

  const cellSize = terrain.cellSizePixels || 40;
  const rawTerrainW = terrain.width * cellSize;
  const rawTerrainH = terrain.length * cellSize;

  // AUTO-ROTAÇÃO: Se o lote for vertical/comprido e o canvas for horizontal, rotaciona 90° para preenchimento máximo
  const shouldRotate = autoRotateForMaxFill && terrain.length > terrain.width && widthPx > heightPx;

  const effectiveDrawW = shouldRotate ? rawTerrainH : rawTerrainW;
  const effectiveDrawH = shouldRotate ? rawTerrainW : rawTerrainH;

  const themeColors = THEME_COLORS[terrain.theme] || THEME_COLORS.grass;

  // Fundo do Canvas (Branco para Impressão ou Dark/Tema Elegante)
  ctx.fillStyle = useWhiteBackground ? '#FFFFFF' : themeColors.bg;
  ctx.fillRect(0, 0, widthPx, heightPx);

  const bannerH = quality === 'high' ? 120 : quality === 'low' ? 60 : 80;
  const availW = widthPx - (quality === 'high' ? 160 : 80);
  const availH = heightPx - bannerH - (quality === 'high' ? 120 : 60);

  const scale = Math.min(availW / effectiveDrawW, availH / effectiveDrawH);

  ctx.save();
  const panX = (widthPx - effectiveDrawW * scale) / 2;
  const panY = bannerH + (availH - effectiveDrawH * scale) / 2;

  ctx.translate(panX, panY);
  ctx.scale(scale, scale);

  if (shouldRotate) {
    // Rotaciona a planta 90° em torno do centro do desenho efetivo para maximizar a área útil
    ctx.translate(effectiveDrawW / 2, effectiveDrawH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-rawTerrainW / 2, -rawTerrainH / 2);
  }

  // A. Terreno Base (Grama / Blueprint / Dark / Concreto / Customizado ou Fundo Limpo)
  if (useWhiteBackground) {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, rawTerrainW, rawTerrainH);
  } else {
    ctx.fillStyle = terrain.customColor || themeColors.fill;
    ctx.fillRect(0, 0, rawTerrainW, rawTerrainH);

    const secColor = terrain.customSecondaryColor || themeColors.sec;
    ctx.fillStyle = secColor;
    for (let x = 0; x < terrain.width; x++) {
      for (let y = 0; y < terrain.length; y++) {
        if ((x + y) % 2 === 1) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  // B. Borda do Terreno
  ctx.strokeStyle = useWhiteBackground ? '#64748B' : 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 3 / scale;
  ctx.strokeRect(0, 0, rawTerrainW, rawTerrainH);

  // C. Pisos Pintados com Fidelidade Total de Cores
  Object.values(floors).forEach((floor) => {
    ctx.fillStyle = floor.color || '#78350F';
    ctx.fillRect(floor.x * cellSize, floor.y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(floor.x * cellSize, floor.y * cellSize, cellSize, cellSize);
  });

  // D. Paredes Dual-Face com Fidelidade Total de Cores
  walls.forEach((wall) => {
    const x1 = wall.x1 * cellSize;
    const y1 = wall.y1 * cellSize;
    const x2 = wall.x2 * cellSize;
    const y2 = wall.y2 * cellSize;
    const thickness = (wall.thickness || 0.2) * cellSize;

    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len === 0) return;

    const nx = -(y2 - y1) / len;
    const ny = (x2 - x1) / len;
    const halfW = thickness / 2;

    // Face A
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 + nx * halfW, y2 + ny * halfW);
    ctx.lineTo(x1 + nx * halfW, y1 + ny * halfW);
    ctx.closePath();
    ctx.fillStyle = wall.colorSideA || wall.color || '#E2E8F0';
    ctx.fill();
    ctx.restore();

    // Face B
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - nx * halfW, y2 - ny * halfW);
    ctx.lineTo(x1 - nx * halfW, y1 - ny * halfW);
    ctx.closePath();
    ctx.fillStyle = wall.colorSideB || wall.color || '#CBD5E1';
    ctx.fill();
    ctx.restore();

    // Contorno da Parede
    ctx.save();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * halfW, y1 + ny * halfW);
    ctx.lineTo(x2 + nx * halfW, y2 + ny * halfW);
    ctx.moveTo(x1 - nx * halfW, y1 - ny * halfW);
    ctx.lineTo(x2 - nx * halfW, y2 - ny * halfW);
    ctx.stroke();
    ctx.restore();

    // Cota de Medida de Parede (com offset customizado)
    const wallLenMeters = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
    if (wallLenMeters > 0.3) {
      const midX = ((wall.x1 + wall.x2) / 2 + (wall.labelOffset?.x || 0)) * cellSize;
      const midY = ((wall.y1 + wall.y2) / 2 + (wall.labelOffset?.y || 0)) * cellSize;
      const textStr = `${wallLenMeters.toFixed(2)}m`;

      ctx.save();
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(textStr).width;

      ctx.fillStyle = useWhiteBackground ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = useWhiteBackground ? '#0F172A' : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textStr, midX, midY);
      ctx.restore();
    }
  });

  // E. Esquadrias (Portas e Janelas)
  doorsWindows.forEach((dw) => {
    const wall = walls.find((w) => w.id === dw.wallId);
    if (!wall) return;

    const wx1 = wall.x1 * cellSize;
    const wy1 = wall.y1 * cellSize;
    const wx2 = wall.x2 * cellSize;
    const wy2 = wall.y2 * cellSize;

    const px = wx1 + (wx2 - wx1) * dw.offsetRatio;
    const py = wy1 + (wy2 - wy1) * dw.offsetRatio;

    ctx.save();
    ctx.translate(px, py);
    const angle = Math.atan2(wy2 - wy1, wx2 - wx1);
    ctx.rotate(angle);

    const dwWidthPx = (dw.width || 0.9) * cellSize;
    const isSliding = dw.isSliding || dw.catalogId === 'door_sliding';

    if (isSliding) {
      ctx.fillStyle = '#10B981';
      ctx.fillRect(-dwWidthPx / 2, -6, dwWidthPx / 2 + 2, 5);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-2, 1, dwWidthPx / 2 + 2, 5);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-dwWidthPx / 2, -6, dwWidthPx, 12);
    } else {
      ctx.fillStyle = dw.type === 'door' ? (dw.frameColor || '#F59E0B') : '#38BDF8';
      ctx.fillRect(-dwWidthPx / 2, -5, dwWidthPx, 10);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-dwWidthPx / 2, -5, dwWidthPx, 10);
    }

    const dimText = dw.height ? `${dw.width}m × ${dw.height}m` : `${dw.width}m`;
    ctx.font = 'bold 9px sans-serif';
    const dimWidth = ctx.measureText(dimText).width;

    ctx.fillStyle = useWhiteBackground ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(-dimWidth / 2 - 3, -20, dimWidth + 6, 12);
    ctx.fillStyle = useWhiteBackground ? '#D97706' : '#FACC15';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dimText, 0, -14);

    ctx.restore();
  });

  // F. Móveis Colocados com Fidelidade Total de Cores
  items.forEach((item) => {
    const itemPxX = item.x * cellSize;
    const itemPxY = item.y * cellSize;
    const itemPxW = item.width * cellSize;
    const itemPxD = item.depth * cellSize;

    ctx.save();
    ctx.translate(itemPxX, itemPxY);
    ctx.rotate((item.rotation * Math.PI) / 180);

    ctx.fillStyle = item.color || '#64748B';
    ctx.beginPath();
    if (item.primitiveShape === 'cylinder') {
      ctx.ellipse(0, 0, itemPxW / 2, itemPxD / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.rect(-itemPxW / 2, -itemPxD / 2, itemPxW, itemPxD);
    }
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const dimText = `${item.width.toFixed(1)}m × ${item.depth.toFixed(1)}m`;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(item.name.substring(0, 14), 0, -1);

    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 9px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(dimText, 0, 2);

    ctx.restore();
  });

  // G. MARCAÇÕES DE ÁREA & TEXTOS LIVRES (`annotations`)
  annotations.forEach((ann) => {
    if (!ann.points || ann.points.length === 0) return;

    if (ann.type === 'text' || (!ann.type && ann.points.length === 1)) {
      // TEXTO LIVRE STANDALONE
      const pos = ann.labelPosition || ann.points[0];
      const pxX = pos.x * cellSize;
      const pxY = pos.y * cellSize;
      const textStr = ann.text || ann.name || 'Anotação';

      ctx.save();
      ctx.font = `bold ${ann.fontSize || 14}px Inter, sans-serif`;
      const textW = ctx.measureText(textStr).width;
      const badgeW = textW + 16;
      const badgeH = (ann.fontSize || 14) * 1.6;

      ctx.fillStyle = useWhiteBackground ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = ann.color || '#10B981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pxX - badgeW / 2, pxY - badgeH / 2, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = ann.color || (useWhiteBackground ? '#0F172A' : '#FFFFFF');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textStr, pxX, pxY);
      ctx.restore();
      return;
    }

    if (ann.points.length < 3) return;

    const pointsPx = ann.points.map((p) => ({ x: p.x * cellSize, y: p.y * cellSize }));

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pointsPx[0].x, pointsPx[0].y);
    for (let i = 1; i < pointsPx.length; i++) {
      ctx.lineTo(pointsPx[i].x, pointsPx[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = ann.fillColor || (ann.color ? `${ann.color}22` : 'rgba(16, 185, 129, 0.15)');
    ctx.fill();

    if (ann.lineStyle !== 'invisible') {
      ctx.strokeStyle = ann.color || '#10B981';
      ctx.lineWidth = 2.5;
      if (ann.lineStyle === 'dashed') {
        ctx.setLineDash([8, 6]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
    }

    const areaM2 = calculatePolygonArea(ann.points);
    const labelPos = ann.labelPosition || calculatePolygonCentroid(ann.points);
    const labelPxX = labelPos.x * cellSize;
    const labelPxY = labelPos.y * cellSize;

    const titleStr = ann.name;
    const areaStr = `${areaM2.toFixed(2)} m²`;

    ctx.font = 'bold 11px Inter, sans-serif';
    const w1 = ctx.measureText(titleStr).width;
    ctx.font = 'bold 9px monospace';
    const w2 = ctx.measureText(areaStr).width;
    const badgeW = Math.max(w1, w2) + 14;
    const badgeH = 28;

    ctx.fillStyle = useWhiteBackground ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = ann.color || '#10B981';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.roundRect(labelPxX - badgeW / 2, labelPxY - badgeH / 2, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = useWhiteBackground ? '#0F172A' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(titleStr, labelPxX, labelPxY - badgeH / 2 + 4);

    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(areaStr, labelPxX, labelPxY - badgeH / 2 + 15);

    ctx.restore();
  });

  ctx.restore();

  // BANNER SUPERIOR DE CABEÇALHO DO PROJETO
  ctx.fillStyle = useWhiteBackground ? '#F1F5F9' : 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(0, 0, widthPx, bannerH);
  ctx.fillStyle = '#10B981';
  ctx.fillRect(0, bannerH - 3, widthPx, 3);

  ctx.fillStyle = useWhiteBackground ? '#0F172A' : '#FFFFFF';
  ctx.font = `bold ${quality === 'high' ? '32px' : '22px'} Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(projectName, quality === 'high' ? 45 : 30, quality === 'high' ? 50 : 36);

  ctx.fillStyle = useWhiteBackground ? '#475569' : '#94A3B8';
  ctx.font = `${quality === 'high' ? '18px' : '13px'} Inter, sans-serif`;
  const rotBadge = shouldRotate ? ' [Visão Maximizada Rotacionada 90°]' : '';
  ctx.fillText(
    (projectDescription || `Planta baixa e maquete — Dimensões do Lote: ${terrain.width}m × ${terrain.length}m (${terrain.width * terrain.length} m²)`) + rotBadge,
    quality === 'high' ? 45 : 30,
    quality === 'high' ? 82 : 56
  );

  // MARCA D'ÁGUA INFERIOR DIREITA
  ctx.fillStyle = useWhiteBackground ? '#64748B' : 'rgba(255, 255, 255, 0.6)';
  ctx.font = `bold ${quality === 'high' ? '16px' : '12px'} sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(
    'Sims Architect — Desenho Técnico & Relatório Métrico',
    widthPx - (quality === 'high' ? 45 : 30),
    heightPx - (quality === 'high' ? 30 : 20)
  );

  return offscreen.toDataURL('image/png');
}
