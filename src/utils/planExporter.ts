import type { TerrainConfig, Wall, FloorTile, DoorWindow, FurnitureItem } from '../types/sims';

interface ExportPlanParams {
  terrain: TerrainConfig;
  walls: Wall[];
  floors: Record<string, FloorTile>;
  doorsWindows: DoorWindow[];
  items: FurnitureItem[];
  projectName?: string;
  projectDescription?: string;
}

/**
  Renderiza e extrai o DataURL seguro da planta baixa com cotação completa de dimensões
  (Paredes, Esquadrias e Objetos), além do Nome e Descrição do Projeto.
 */
export function exportPlanToDataUrl(
  _domCanvas: HTMLCanvasElement | null,
  params: ExportPlanParams
): string {
  const { terrain, walls, floors, doorsWindows, items, projectName = 'Projeto Arquitetônico', projectDescription } = params;

  const widthPx = 2048;
  const heightPx = 1440;

  const offscreen = document.createElement('canvas');
  offscreen.width = widthPx;
  offscreen.height = heightPx;

  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível inicializar o contexto 2D de exportação.');
  }

  const cellSize = terrain.cellSizePixels || 40;
  const terrainWidthPx = terrain.width * cellSize;
  const terrainLengthPx = terrain.length * cellSize;

  // Fundo Dark Slate Elegante
  ctx.fillStyle = '#0B0F19';
  ctx.fillRect(0, 0, widthPx, heightPx);

  ctx.save();
  // Enquadra e centraliza o terreno no canvas de exportação com margem
  const scale = Math.min((widthPx - 140) / terrainWidthPx, (heightPx - 180) / terrainLengthPx);
  const panX = (widthPx - terrainWidthPx * scale) / 2;
  const panY = 90 + (heightPx - 180 - terrainLengthPx * scale) / 2;

  ctx.translate(panX, panY);
  ctx.scale(scale, scale);

  // A. Terreno Base (Grama / Tema)
  ctx.fillStyle = terrain.customColor || (terrain.theme === 'grass' ? '#15803D' : '#0F172A');
  ctx.fillRect(0, 0, terrainWidthPx, terrainLengthPx);

  if (terrain.customSecondaryColor || terrain.theme === 'grass') {
    ctx.fillStyle = terrain.customSecondaryColor || '#166534';
    for (let x = 0; x < terrain.width; x++) {
      for (let y = 0; y < terrain.length; y++) {
        if ((x + y) % 2 === 1) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  // B. Borda do Terreno
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2 / scale;
  ctx.strokeRect(0, 0, terrainWidthPx, terrainLengthPx);

  // C. Pisos Pintados
  Object.values(floors).forEach((floor) => {
    ctx.fillStyle = floor.color || '#78350F';
    ctx.fillRect(floor.x * cellSize, floor.y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(floor.x * cellSize, floor.y * cellSize, cellSize, cellSize);
  });

  // D. Paredes & Suas Dimensões (Metros Lineares)
  walls.forEach((wall) => {
    const x1 = wall.x1 * cellSize;
    const y1 = wall.y1 * cellSize;
    const x2 = wall.x2 * cellSize;
    const y2 = wall.y2 * cellSize;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = wall.colorSideA || '#1E293B';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Cota de Dimensão da Parede (Comprimento real em Metros)
    const wallLenMeters = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
    if (wallLenMeters > 0.3) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const textStr = `${wallLenMeters.toFixed(2)}m`;

      ctx.save();
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(textStr).width;

      // Badge de Cota de Parede
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textStr, midX, midY);
      ctx.restore();
    }
  });

  // E. Esquadrias (Portas e Janelas) & Suas Dimensões
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
      ctx.lineWidth = 1;
      ctx.strokeRect(-dwWidthPx / 2, -6, dwWidthPx, 12);
    } else {
      ctx.fillStyle = dw.type === 'door' ? '#F59E0B' : '#38BDF8';
      ctx.fillRect(-dwWidthPx / 2, -5, dwWidthPx, 10);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(-dwWidthPx / 2, -5, dwWidthPx, 10);
    }

    // Cota de Dimensão da Esquadria (Largura × Altura)
    const dimText = dw.height ? `${dw.width}m × ${dw.height}m` : `${dw.width}m`;
    ctx.font = 'bold 9px sans-serif';
    const dimWidth = ctx.measureText(dimText).width;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(-dimWidth / 2 - 3, -20, dimWidth + 6, 12);
    ctx.fillStyle = '#FACC15';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dimText, 0, -14);

    ctx.restore();
  });

  // F. Móveis Colocados & Suas Dimensões (Largura × Profundidade)
  items.forEach((item) => {
    const itemPxX = item.x * cellSize;
    const itemPxY = item.y * cellSize;
    const itemPxW = item.width * cellSize;
    const itemPxD = item.depth * cellSize;

    ctx.save();
    ctx.translate(itemPxX, itemPxY);
    ctx.rotate((item.rotation * Math.PI) / 180);

    // Corpo do Móvel
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

    // Nome e Cota de Dimensão do Objeto (Largura × Profundidade)
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

  ctx.restore();

  // HEADING TOP BAR DO BANNER PNG (Nome e Descrição do Projeto)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(0, 0, widthPx, 70);
  ctx.fillStyle = '#10B981';
  ctx.fillRect(0, 68, widthPx, 2);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(projectName, 30, 36);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText(
    projectDescription || `Planta baixa e maquete — Dimensões do Lote: ${terrain.width}m × ${terrain.length}m (${terrain.width * terrain.length} m²)`,
    30,
    56
  );

  // MARCA D'ÁGUA INFERIOR DIREITA
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Sims Architect — Desenho Técnico com Cotas Métricas', widthPx - 30, heightPx - 20);

  return offscreen.toDataURL('image/png');
}
