import { useEffect, useRef } from 'react';
import { useSimsStore } from '../store/useSimsStore';
import type { TerrainTheme, FloorTextureId, Wall, FurnitureItem } from '../types/sims';

interface ThemeStyles {
  bg: string;
  terrainFill: string;
  terrainPatternSecondary?: string;
  borderColor: string;
  gridLine: string;
  gridMajorLine: string;
  subgridLine: string;
  meterText: string;
  originColor: string;
  hoverCellFill: string;
  hoverCellBorder: string;
}

const THEME_PRESETS: Record<TerrainTheme, ThemeStyles> = {
  grass: {
    bg: '#0F172A',
    terrainFill: '#15803D',
    terrainPatternSecondary: '#166534',
    borderColor: '#4ADE80',
    gridLine: 'rgba(255, 255, 255, 0.22)',
    gridMajorLine: 'rgba(255, 255, 255, 0.55)',
    subgridLine: 'rgba(255, 255, 255, 0.08)',
    meterText: '#F8FAFC',
    originColor: '#FACC15',
    hoverCellFill: 'rgba(250, 204, 21, 0.35)',
    hoverCellBorder: '#FACC15',
  },
  dark: {
    bg: '#030712',
    terrainFill: '#0F172A',
    borderColor: '#06B6D4',
    gridLine: 'rgba(6, 182, 212, 0.18)',
    gridMajorLine: 'rgba(6, 182, 212, 0.45)',
    subgridLine: 'rgba(6, 182, 212, 0.07)',
    meterText: '#38BDF8',
    originColor: '#22C55E',
    hoverCellFill: 'rgba(6, 182, 212, 0.25)',
    hoverCellBorder: '#38BDF8',
  },
  blueprint: {
    bg: '#071A2E',
    terrainFill: '#0D3663',
    borderColor: '#60A5FA',
    gridLine: 'rgba(255, 255, 255, 0.25)',
    gridMajorLine: 'rgba(255, 255, 255, 0.65)',
    subgridLine: 'rgba(255, 255, 255, 0.1)',
    meterText: '#93C5FD',
    originColor: '#F43F5E',
    hoverCellFill: 'rgba(147, 197, 253, 0.3)',
    hoverCellBorder: '#93C5FD',
  },
  concrete: {
    bg: '#1E293B',
    terrainFill: '#E2E8F0',
    borderColor: '#475569',
    gridLine: 'rgba(71, 85, 105, 0.25)',
    gridMajorLine: 'rgba(15, 23, 42, 0.6)',
    subgridLine: 'rgba(71, 85, 105, 0.1)',
    meterText: '#0F172A',
    originColor: '#EF4444',
    hoverCellFill: 'rgba(59, 130, 246, 0.25)',
    hoverCellBorder: '#2563EB',
  },
};

const FLOOR_COLORS: Record<FloorTextureId, { fill: string; border: string; accent?: string }> = {
  wood: { fill: '#78350F', border: '#451A03', accent: '#92400E' },
  marble: { fill: '#F1F5F9', border: '#CBD5E1', accent: '#94A3B8' },
  tile: { fill: '#475569', border: '#334155', accent: '#64748B' },
  slate: { fill: '#0F172A', border: '#06B6D4', accent: '#1E293B' },
  grass: { fill: '#047857', border: '#065F46', accent: '#10B981' },
  dirt: { fill: '#451A03', border: '#292524', accent: '#78350F' },
  custom: { fill: '#0EA5E9', border: '#0284C7', accent: '#38BDF8' },
};

export function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  previews?: {
    draftWall?: { x1: number; y1: number; x2: number; y2: number } | null;
    draftFloorRect?: { x1: number; y1: number; x2: number; y2: number } | null;
    hoveredTarget?: { type: string; id?: string; x?: number; y?: number; wall?: Wall; furniture?: FurnitureItem } | null;
    hoveredWallTarget?: { wall: Wall; offsetRatio: number; pointOnWall: { x: number; y: number } } | null;
    pendingFurniturePreview?: {
      x: number;
      y: number;
      width: number;
      depth: number;
      height: number;
      rotation: number;
      color: string;
      textureUrl?: string;
      primitiveShape?: 'box' | 'cylinder';
      isValid: boolean;
    } | null;
  }
) {
  const { 
    terrain, 
    viewState, 
    gridSettings, 
    cursorPos, 
    walls, 
    floors, 
    doorsWindows, 
    items,
    activeMode,
    activeBuildTool,
    selectedDoorWindow,
    pendingDoor 
  } = useSimsStore();

  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const getLoadedImage = (url?: string) => {
    if (!url) return null;
    let img = imageCacheRef.current.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      imageCacheRef.current.set(url, img);
    }
    return img.complete ? img : null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const theme = THEME_PRESETS[terrain.theme] || THEME_PRESETS.grass;

      // 1. Limpa o fundo
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      // 2. Aplica Câmera Pan/Zoom/Rotation
      ctx.save();
      ctx.translate(viewState.panX, viewState.panY);
      ctx.scale(viewState.zoom, viewState.zoom);

      const cellSize = terrain.cellSizePixels;
      const terrainWidthPx = terrain.width * cellSize;
      const terrainLengthPx = terrain.length * cellSize;

      const centerX = terrainWidthPx / 2;
      const centerY = terrainLengthPx / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate((viewState.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      // 3. Terreno Base
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 24 / viewState.zoom;
      ctx.shadowOffsetX = 8 / viewState.zoom;
      ctx.shadowOffsetY = 12 / viewState.zoom;

      const terrainImg = getLoadedImage(terrain.customTextureUrl);
      if (terrainImg) {
        const pattern = ctx.createPattern(terrainImg, 'repeat');
        ctx.fillStyle = pattern || terrain.customColor || theme.terrainFill;
      } else {
        ctx.fillStyle = terrain.customColor || theme.terrainFill;
      }

      ctx.fillRect(0, 0, terrainWidthPx, terrainLengthPx);
      ctx.restore();

      if (terrain.theme === 'grass' && theme.terrainPatternSecondary && !terrain.customColor && !terrain.customTextureUrl) {
        ctx.fillStyle = theme.terrainPatternSecondary;
        for (let x = 0; x < terrain.width; x++) {
          for (let y = 0; y < terrain.length; y++) {
            if ((x + y) % 2 === 1) {
              ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
          }
        }
      }

      // 4. CAMADA DE PISOS PINTADOS (`floors`)
      Object.values(floors).forEach((floor) => {
        const floorStyle = FLOOR_COLORS[floor.textureId] || FLOOR_COLORS.wood;
        const px = floor.x * cellSize;
        const py = floor.y * cellSize;

        const floorImg = getLoadedImage(floor.customTextureUrl);
        if (floorImg) {
          const pattern = ctx.createPattern(floorImg, 'repeat');
          ctx.fillStyle = pattern || floor.color || floorStyle.fill;
        } else {
          ctx.fillStyle = floor.color || floorStyle.fill;
        }

        ctx.fillRect(px, py, cellSize, cellSize);

        ctx.strokeStyle = floorStyle.border;
        ctx.lineWidth = 1 / viewState.zoom;
        ctx.strokeRect(px, py, cellSize, cellSize);
      });

      // Preview de Seleção de Piso (Retângulo de Arraste)
      if (previews?.draftFloorRect) {
        const r = previews.draftFloorRect;
        const minX = Math.min(r.x1, r.x2) * cellSize;
        const maxX = (Math.max(r.x1, r.x2) + 1) * cellSize;
        const minY = Math.min(r.y1, r.y2) * cellSize;
        const maxY = (Math.max(r.y1, r.y2) + 1) * cellSize;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2 / viewState.zoom;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      }

      // 5. GRID MÉTRICO (1m x 1m e 5m)
      if (gridSettings.showGrid) {
        ctx.strokeStyle = theme.gridLine;
        ctx.lineWidth = 1 / viewState.zoom;
        ctx.beginPath();

        for (let x = 0; x <= terrain.width; x++) {
          if (x % 5 !== 0) {
            const posX = x * cellSize;
            ctx.moveTo(posX, 0);
            ctx.lineTo(posX, terrainLengthPx);
          }
        }
        for (let y = 0; y <= terrain.length; y++) {
          if (y % 5 !== 0) {
            const posY = y * cellSize;
            ctx.moveTo(0, posY);
            ctx.lineTo(terrainWidthPx, posY);
          }
        }
        ctx.stroke();

        ctx.strokeStyle = theme.gridMajorLine;
        ctx.lineWidth = 2 / viewState.zoom;
        ctx.beginPath();
        for (let x = 0; x <= terrain.width; x += 5) {
          const posX = x * cellSize;
          ctx.moveTo(posX, 0);
          ctx.lineTo(posX, terrainLengthPx);
        }
        for (let y = 0; y <= terrain.length; y += 5) {
          const posY = y * cellSize;
          ctx.moveTo(0, posY);
          ctx.lineTo(terrainWidthPx, posY);
        }
        ctx.stroke();
      }

      // 6. CAMADA DE PAREDES DUAL-FACE NO 2D (LADO A & LADO B)
      walls.forEach((wall) => {
        const x1 = wall.x1 * cellSize;
        const y1 = wall.y1 * cellSize;
        const x2 = wall.x2 * cellSize;
        const y2 = wall.y2 * cellSize;

        const len = Math.hypot(x2 - x1, y2 - y1);
        if (len === 0) return;

        const halfWidth = 6 / viewState.zoom;

        const nx = -(y2 - y1) / len;
        const ny = (x2 - x1) / len;

        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.lineCap = 'square';

        // LADO A (+nx, +ny)
        const imgA = getLoadedImage(wall.textureUrlSideA || wall.textureUrl);
        if (imgA) {
          ctx.strokeStyle = ctx.createPattern(imgA, 'repeat') || wall.colorSideA || wall.color || '#E2E8F0';
        } else {
          ctx.strokeStyle = wall.colorSideA || wall.color || '#E2E8F0';
        }
        ctx.lineWidth = halfWidth;
        ctx.beginPath();
        ctx.moveTo(x1 + nx * (halfWidth / 2), y1 + ny * (halfWidth / 2));
        ctx.lineTo(x2 + nx * (halfWidth / 2), y2 + ny * (halfWidth / 2));
        ctx.stroke();

        // LADO B (-nx, -ny)
        const imgB = getLoadedImage(wall.textureUrlSideB || wall.textureUrl);
        if (imgB) {
          ctx.strokeStyle = ctx.createPattern(imgB, 'repeat') || wall.colorSideB || wall.color || '#CBD5E1';
        } else {
          ctx.strokeStyle = wall.colorSideB || wall.color || '#CBD5E1';
        }
        ctx.lineWidth = halfWidth;
        ctx.beginPath();
        ctx.moveTo(x1 - nx * (halfWidth / 2), y1 - ny * (halfWidth / 2));
        ctx.lineTo(x2 - nx * (halfWidth / 2), y2 - ny * (halfWidth / 2));
        ctx.stroke();

        // Borda Técnica de Contorno
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1 / viewState.zoom;
        ctx.beginPath();
        ctx.moveTo(x1 + nx * halfWidth, y1 + ny * halfWidth);
        ctx.lineTo(x2 + nx * halfWidth, y2 + ny * halfWidth);
        ctx.moveTo(x1 - nx * halfWidth, y1 - ny * halfWidth);
        ctx.lineTo(x2 - nx * halfWidth, y2 - ny * halfWidth);
        ctx.stroke();

        ctx.restore();
      });

      // Renderiza Portas e Janelas sobre as Paredes
      doorsWindows.forEach((dw) => {
        const wall = walls.find((w) => w.id === dw.wallId);
        if (!wall) return;

        const x1 = wall.x1 * cellSize;
        const y1 = wall.y1 * cellSize;
        const x2 = wall.x2 * cellSize;
        const y2 = wall.y2 * cellSize;

        const wallLen = Math.hypot(x2 - x1, y2 - y1);
        if (wallLen === 0) return;

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const dwPxX = x1 + (x2 - x1) * dw.offsetRatio;
        const dwPxY = y1 + (y2 - y1) * dw.offsetRatio;
        const dwPxWidth = dw.width * cellSize;

        ctx.save();
        ctx.translate(dwPxX, dwPxY);
        ctx.rotate(angle);

        ctx.clearRect(-dwPxWidth / 2, -8 / viewState.zoom, dwPxWidth, 16 / viewState.zoom);
        ctx.fillStyle = terrain.customColor || theme.terrainFill;
        ctx.fillRect(-dwPxWidth / 2, -6 / viewState.zoom, dwPxWidth, 12 / viewState.zoom);

        if (dw.type === 'door') {
          ctx.strokeStyle = dw.frameColor || '#F59E0B';
          ctx.lineWidth = 3 / viewState.zoom;

          const flipY = dw.flipSide ? 1 : -1;
          const hingeX = dw.flipSwing ? dwPxWidth / 2 : -dwPxWidth / 2;
          const doorTipX = dw.flipSwing ? -dwPxWidth / 2 : dwPxWidth / 2;

          ctx.beginPath();
          ctx.moveTo(hingeX, 0);
          ctx.lineTo(doorTipX, dwPxWidth * flipY);
          ctx.stroke();

          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          ctx.arc((hingeX + doorTipX) / 2, dwPxWidth * flipY * 0.5, 3 / viewState.zoom, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 1.5 / viewState.zoom;
          ctx.setLineDash([3 / viewState.zoom, 3 / viewState.zoom]);
          ctx.beginPath();
          ctx.arc(hingeX, 0, dwPxWidth, dw.flipSide ? 0 : -Math.PI / 2, dw.flipSide ? Math.PI / 2 : 0);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.fillRect(-dwPxWidth / 2, -4 / viewState.zoom, dwPxWidth, 8 / viewState.zoom);
          ctx.strokeStyle = dw.frameColor || '#38BDF8';
          ctx.lineWidth = 2 / viewState.zoom;
          ctx.strokeRect(-dwPxWidth / 2, -4 / viewState.zoom, dwPxWidth, 8 / viewState.zoom);

          ctx.beginPath();
          ctx.moveTo(0, -4 / viewState.zoom);
          ctx.lineTo(0, 4 / viewState.zoom);
          ctx.stroke();
        }

        ctx.restore();
      });

      // 7. RENDERIZAÇÃO DOS MÓVEIS 2D COLOCADOS (`items`)
      items.forEach((item) => {
        const isHovered = previews?.hoveredTarget?.type === 'furniture' && previews.hoveredTarget.id === item.id;
        renderFurniture2D(ctx, item, cellSize, viewState.zoom, getLoadedImage, false, isHovered);
      });

      // 8. FANTASMA DE PREVIEW DE POSICIONAMENTO DE MÓVEL
      if (previews?.pendingFurniturePreview) {
        const p = previews.pendingFurniturePreview;
        renderFurniture2D(
          ctx,
          {
            id: 'preview',
            catalogId: 'preview',
            name: 'Preview',
            category: 'bedroom',
            width: p.width,
            depth: p.depth,
            height: p.height,
            x: p.x,
            y: p.y,
            rotation: p.rotation,
            color: p.color,
            textureUrl: p.textureUrl,
            primitiveShape: p.primitiveShape,
          },
          cellSize,
          viewState.zoom,
          getLoadedImage,
          true,
          false,
          p.isValid
        );
      }

      // 9. SOMBREAMENTO EXTENSIVO DE ALCANCE DA FERRAMENTA PINTAR PAREDE (`wall_paint`)
      if (activeBuildTool === 'wall_paint' && previews?.hoveredWallTarget && cursorPos.x !== null && cursorPos.y !== null) {
        const { wall } = previews.hoveredWallTarget;
        const x1 = wall.x1 * cellSize;
        const y1 = wall.y1 * cellSize;
        const x2 = wall.x2 * cellSize;
        const y2 = wall.y2 * cellSize;

        const len = Math.hypot(x2 - x1, y2 - y1);
        if (len > 0) {
          const nx = -(y2 - y1) / len;
          const ny = (x2 - x1) / len;

          const l2 = (wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2;
          let t = ((cursorPos.x - wall.x1) * (wall.x2 - wall.x1) + (cursorPos.y - wall.y1) * (wall.y2 - wall.y1)) / l2;
          t = Math.max(0, Math.min(1, t));
          const projX = wall.x1 + t * (wall.x2 - wall.x1);
          const projY = wall.y1 + t * (wall.y2 - wall.y1);
          const distToCenter = Math.hypot(cursorPos.x - projX, cursorPos.y - projY);

          ctx.save();
          ctx.lineCap = 'round';

          const auraDistance = 24 / viewState.zoom;

          if (distToCenter < 0.12) {
            // SOMBRA AMBOS OS LADOS
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 2 / viewState.zoom;

            ctx.beginPath();
            ctx.moveTo(x1 + nx * auraDistance, y1 + ny * auraDistance);
            ctx.lineTo(x2 + nx * auraDistance, y2 + ny * auraDistance);
            ctx.lineTo(x2 - nx * auraDistance, y2 - ny * auraDistance);
            ctx.lineTo(x1 - nx * auraDistance, y1 - ny * auraDistance);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            const dotNormal = (cursorPos.x - projX) * nx + (cursorPos.y - projY) * ny;
            const isSideA = dotNormal > 0;

            if (isSideA) {
              ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
              ctx.strokeStyle = '#38BDF8';
              ctx.lineWidth = 2 / viewState.zoom;

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.lineTo(x2 + nx * auraDistance, y2 + ny * auraDistance);
              ctx.lineTo(x1 + nx * auraDistance, y1 + ny * auraDistance);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
              ctx.strokeStyle = '#C084FC';
              ctx.lineWidth = 2 / viewState.zoom;

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.lineTo(x2 - nx * auraDistance, y2 - ny * auraDistance);
              ctx.lineTo(x1 - nx * auraDistance, y1 - ny * auraDistance);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          }

          ctx.restore();
        }
      }

      // OVERLAY DOS PASSO DE COLOCAÇÃO DA PORTA
      if (pendingDoor) {
        const wall = walls.find((w) => w.id === pendingDoor.wallId);
        if (wall) {
          const x1 = wall.x1 * cellSize;
          const y1 = wall.y1 * cellSize;
          const x2 = wall.x2 * cellSize;
          const y2 = wall.y2 * cellSize;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const dwPxX = x1 + (x2 - x1) * pendingDoor.offsetRatio;
          const dwPxY = y1 + (y2 - y1) * pendingDoor.offsetRatio;
          const dwPxWidth = pendingDoor.width * cellSize;

          const ux = Math.cos(angle);
          const uy = Math.sin(angle);
          const halfW = dwPxWidth / 2;

          const ptAx = dwPxX - ux * halfW;
          const ptAy = dwPxY - uy * halfW;
          const ptBx = dwPxX + ux * halfW;
          const ptBy = dwPxY + uy * halfW;

          ctx.save();

          if (pendingDoor.step === 'hinge') {
            const activeHingeA = !pendingDoor.flipSwing;
            const activeHingeB = pendingDoor.flipSwing;

            ctx.fillStyle = activeHingeA ? '#06B6D4' : 'rgba(6, 182, 212, 0.4)';
            ctx.beginPath();
            ctx.arc(ptAx, ptAy, (activeHingeA ? 9 : 6) / viewState.zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2 / viewState.zoom;
            ctx.stroke();

            ctx.fillStyle = activeHingeB ? '#06B6D4' : 'rgba(6, 182, 212, 0.4)';
            ctx.beginPath();
            ctx.arc(ptBx, ptBy, (activeHingeB ? 9 : 6) / viewState.zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2 / viewState.zoom;
            ctx.stroke();

            ctx.fillStyle = '#F8FAFC';
            ctx.font = `bold ${Math.max(10, 12 / viewState.zoom)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('Passo 2: Escolha o Ponto da Dobradiça', dwPxX, dwPxY - 16 / viewState.zoom);
          } else if (pendingDoor.step === 'swing') {
            ctx.translate(dwPxX, dwPxY);
            ctx.rotate(angle);

            const hingeX = pendingDoor.flipSwing ? dwPxWidth / 2 : -dwPxWidth / 2;

            const startAngle1 = pendingDoor.flipSwing ? Math.PI : -Math.PI / 2;
            const endAngle1 = pendingDoor.flipSwing ? (3 * Math.PI) / 2 : 0;

            const startAngle2 = pendingDoor.flipSwing ? Math.PI / 2 : 0;
            const endAngle2 = pendingDoor.flipSwing ? Math.PI : Math.PI / 2;

            ctx.fillStyle = !pendingDoor.flipSide ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(hingeX, 0);
            ctx.arc(hingeX, 0, dwPxWidth, startAngle1, endAngle1);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = !pendingDoor.flipSide ? '#F59E0B' : '#94A3B8';
            ctx.lineWidth = 2 / viewState.zoom;
            ctx.stroke();

            ctx.fillStyle = pendingDoor.flipSide ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(hingeX, 0);
            ctx.arc(hingeX, 0, dwPxWidth, startAngle2, endAngle2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = pendingDoor.flipSide ? '#F59E0B' : '#94A3B8';
            ctx.lineWidth = 2 / viewState.zoom;
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // PREVIEW DE DESENHO DE PAREDE
      if (previews?.draftWall) {
        const { x1, y1, x2, y2 } = previews.draftWall;
        const px1 = x1 * cellSize;
        const py1 = y1 * cellSize;
        const px2 = x2 * cellSize;
        const py2 = y2 * cellSize;

        const meterLen = Math.hypot(x2 - x1, y2 - y1);

        if (meterLen > 0) {
          ctx.save();
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 8 / viewState.zoom;
          ctx.setLineDash([8 / viewState.zoom, 6 / viewState.zoom]);
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();
          ctx.restore();

          const midPxX = (px1 + px2) / 2;
          const midPxY = (py1 + py2) / 2;
          const labelText = `${meterLen.toFixed(1)}m`;

          ctx.save();
          ctx.font = `bold ${Math.max(12, 14 / viewState.zoom)}px Inter, sans-serif`;
          const textMetrics = ctx.measureText(labelText);
          const paddingX = 8 / viewState.zoom;
          const paddingY = 4 / viewState.zoom;
          const bgW = textMetrics.width + paddingX * 2;
          const bgH = 18 / viewState.zoom + paddingY * 2;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2 / viewState.zoom;
          ctx.beginPath();
          ctx.roundRect(midPxX - bgW / 2, midPxY - bgH / 2 - 12 / viewState.zoom, bgW, bgH, 6 / viewState.zoom);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FBBF24';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, midPxX, midPxY - 12 / viewState.zoom);
          ctx.restore();
        }
      }

      // Preview de Esquadria na Parede Mais Próxima (Passo 1)
      if (activeBuildTool === 'door_window' && !pendingDoor && previews?.hoveredWallTarget) {
        const { wall, offsetRatio } = previews.hoveredWallTarget;
        const x1 = wall.x1 * cellSize;
        const y1 = wall.y1 * cellSize;
        const x2 = wall.x2 * cellSize;
        const y2 = wall.y2 * cellSize;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const dwPxX = x1 + (x2 - x1) * offsetRatio;
        const dwPxY = y1 + (y2 - y1) * offsetRatio;
        const dwPxWidth = selectedDoorWindow.width * cellSize;

        ctx.save();
        ctx.translate(dwPxX, dwPxY);
        ctx.rotate(angle);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3 / viewState.zoom;
        ctx.setLineDash([4 / viewState.zoom, 4 / viewState.zoom]);
        ctx.strokeRect(-dwPxWidth / 2, -6 / viewState.zoom, dwPxWidth, 12 / viewState.zoom);
        ctx.restore();
      }

      // Highlight de Alvo para Ferramenta Marreta
      if (activeBuildTool === 'eraser' && previews?.hoveredTarget) {
        const ht = previews.hoveredTarget;
        ctx.save();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 4 / viewState.zoom;

        if (ht.type === 'wall' && ht.wall) {
          ctx.beginPath();
          ctx.moveTo(ht.wall.x1 * cellSize, ht.wall.y1 * cellSize);
          ctx.lineTo(ht.wall.x2 * cellSize, ht.wall.y2 * cellSize);
          ctx.stroke();
        } else if (ht.type === 'floor' && ht.x !== undefined && ht.y !== undefined) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fillRect(ht.x * cellSize, ht.y * cellSize, cellSize, cellSize);
          ctx.strokeRect(ht.x * cellSize, ht.y * cellSize, cellSize, cellSize);
        } else if (ht.type === 'furniture' && ht.furniture) {
          const furn = ht.furniture;
          const pxX = furn.x * cellSize;
          const pxY = furn.y * cellSize;
          const pxW = furn.width * cellSize;
          const pxD = furn.depth * cellSize;

          ctx.translate(pxX, pxY);
          ctx.rotate((furn.rotation * Math.PI) / 180);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fillRect(-pxW / 2, -pxD / 2, pxW, pxD);
          ctx.strokeRect(-pxW / 2, -pxD / 2, pxW, pxD);
        }
        ctx.restore();
      }

      // Borda Externa do Terreno & Origem
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 3 / viewState.zoom;
      ctx.strokeRect(0, 0, terrainWidthPx, terrainLengthPx);

      if (gridSettings.showMeters) {
        ctx.fillStyle = theme.meterText;
        ctx.font = `600 ${Math.max(10, Math.min(14, 12 / viewState.zoom))}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (let x = 0; x <= terrain.width; x += 5) {
          ctx.fillText(`${x}m`, x * cellSize, -6 / viewState.zoom);
        }
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = 0; y <= terrain.length; y += 5) {
          ctx.fillText(`${y}m`, -8 / viewState.zoom, y * cellSize);
        }
      }

      ctx.fillStyle = theme.originColor;
      ctx.beginPath();
      ctx.arc(0, 0, 5 / viewState.zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [canvasRef, terrain, viewState, gridSettings, cursorPos, walls, floors, doorsWindows, items, activeMode, activeBuildTool, selectedDoorWindow, pendingDoor, previews]);
}

// DESENHO ARQUITETÔNICO TOP-DOWN DOS MÓVEIS EM 2D
function renderFurniture2D(
  ctx: CanvasRenderingContext2D,
  item: FurnitureItem,
  cellSize: number,
  zoom: number,
  getLoadedImage: (url?: string) => HTMLImageElement | null,
  isPreview = false,
  isHovered = false,
  isValid = true
) {
  const pxX = item.x * cellSize;
  const pxY = item.y * cellSize;
  const pxW = item.width * cellSize;
  const pxD = item.depth * cellSize;

  ctx.save();
  ctx.translate(pxX, pxY);
  ctx.rotate((item.rotation * Math.PI) / 180);

  if (isPreview) {
    ctx.fillStyle = isValid ? 'rgba(6, 182, 212, 0.45)' : 'rgba(239, 68, 68, 0.45)';
    ctx.strokeStyle = isValid ? '#38BDF8' : '#EF4444';
    ctx.lineWidth = 2 / zoom;

    if (item.primitiveShape === 'cylinder') {
      ctx.beginPath();
      ctx.ellipse(0, 0, pxW / 2, pxD / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(-pxW / 2, -pxD / 2, pxW, pxD);
      ctx.strokeRect(-pxW / 2, -pxD / 2, pxW, pxD);
    }
  } else {
    // DESENHO OFICIAL DO MÓVEL POSICIONADO
    const img = getLoadedImage(item.textureUrl);
    if (img) {
      const pattern = ctx.createPattern(img, 'repeat');
      ctx.fillStyle = pattern || item.color || '#3B82F6';
    } else {
      ctx.fillStyle = item.color || '#3B82F6';
    }

    ctx.strokeStyle = isHovered ? '#FACC15' : '#0F172A';
    ctx.lineWidth = (isHovered ? 3 : 1.5) / zoom;

    if (item.primitiveShape === 'cylinder') {
      ctx.beginPath();
      ctx.ellipse(0, 0, pxW / 2, pxD / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Detalhe de copa vegetal se for árvore/planta
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.ellipse(0, 0, pxW * 0.35, pxD * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-pxW / 2, -pxD / 2, pxW, pxD);
      ctx.strokeRect(-pxW / 2, -pxD / 2, pxW, pxD);

      // DETALHES ARQUITETÔNICOS ESPECÍFICOS TOP-DOWN
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1 / zoom;

      if (item.category === 'bedroom' || item.catalogId.includes('bed')) {
        // Cama: Travesseiros na cabeceira superior
        const pillowW = pxW * 0.38;
        const pillowD = pxD * 0.22;
        ctx.fillRect(-pxW * 0.4, -pxD / 2 + 4 / zoom, pillowW, pillowD);
        ctx.fillRect(pxW * 0.4 - pillowW, -pxD / 2 + 4 / zoom, pillowW, pillowD);
        ctx.strokeRect(-pxW * 0.4, -pxD / 2 + 4 / zoom, pillowW, pillowD);
        ctx.strokeRect(pxW * 0.4 - pillowW, -pxD / 2 + 4 / zoom, pillowW, pillowD);
      } else if (item.category === 'living' || item.catalogId.includes('sofa')) {
        // Sofá: Encosto traseiro
        ctx.fillRect(-pxW / 2, -pxD / 2, pxW, pxD * 0.25);
        ctx.strokeRect(-pxW / 2, -pxD / 2, pxW, pxD * 0.25);
      } else if (item.category === 'kitchen' || item.catalogId.includes('fridge')) {
        // Geladeira: Divisória de porta
        ctx.beginPath();
        ctx.moveTo(-pxW / 2, 0);
        ctx.lineTo(pxW / 2, 0);
        ctx.stroke();
      }
    }

    // Rótulo do Móvel em Zoom Aproximado
    if (zoom >= 0.8) {
      ctx.fillStyle = '#F8FAFC';
      ctx.font = `bold ${Math.max(9, Math.min(12, 11 / zoom))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, 0, 0);
    }
  }

  ctx.restore();
}
