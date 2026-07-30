import { useState, useEffect } from 'react';
import { useSimsStore } from '../store/useSimsStore';
import type { Point2D } from '../types/sims';

/**
 * Calcula o centroide de um polígono de vértices
 */
export function calculatePolygonCentroid(points: Point2D[]): Point2D {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  points.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
  });
  return {
    x: Number((sumX / points.length).toFixed(2)),
    y: Number((sumY / points.length).toFixed(2)),
  };
}

/**
 * Calcula a área de um polígono em metros quadrados usando a Shoelace Formula
 */
export function calculatePolygonArea(points: Point2D[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

import { detectRoomFromWalls, detectZoneFromFloors } from '../utils/roomDetectionUtils';

export function useAnnotationInteractions() {
  const {
    activeMode,
    activeAnnotationTool,
    magicZoneMode,
    terrain,
    floors,
    cursorPos,
    customAnnotationColor,
    customAnnotationLineStyle,
    customTextContent,
    customTextFontSize,
    annotations,
    walls,
    addAnnotation,
    setAnnotationLabelPosition,
    setWallLabelOffset,
    setSelectedAnnotationId,
    setActiveAnnotationTool,
  } = useSimsStore();

  const [draftPoints, setDraftPoints] = useState<Point2D[]>([]);
  const [draggingTarget, setDraggingTarget] = useState<{
    type: 'annotation_label' | 'wall_label';
    id: string;
  } | null>(null);

  // TECLAS ESC E ENTER PARA GERENCIAR O RASCUNHO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (activeMode !== 'annotation') return;

      if (e.key === 'Escape') {
        let hasCanceled = false;

        if (draftPoints.length > 0) {
          setDraftPoints([]);
          hasCanceled = true;
        }

        const currentSelectedAnno = useSimsStore.getState().selectedAnnotationId;
        if (currentSelectedAnno) {
          setSelectedAnnotationId(null);
          hasCanceled = true;
        }

        if (!hasCanceled) {
          if (activeAnnotationTool !== 'hand') {
            setActiveAnnotationTool('hand');
          }
        }
      } else if (e.key === 'Enter') {
        completeDraftManually();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, draftPoints, customAnnotationLineStyle, customAnnotationColor]);

  const findWallVertexSnap = (x: number, y: number): Point2D | null => {
    for (const w of walls) {
      if (Math.hypot(x - w.x1, y - w.y1) <= 0.18) return { x: w.x1, y: w.y1 };
      if (Math.hypot(x - w.x2, y - w.y2) <= 0.18) return { x: w.x2, y: w.y2 };
    }
    return null;
  };

  const handlePointerDown = () => {
    if (activeMode !== 'annotation') return;

    if (activeAnnotationTool === 'draw') {
      if (cursorPos.x === null || cursorPos.y === null || !cursorPos.isInsideTerrain) return;

      const wallSnap = findWallVertexSnap(cursorPos.x, cursorPos.y);
      const snapX = wallSnap ? wallSnap.x : Number((Math.round(cursorPos.x / 0.1) * 0.1).toFixed(2));
      const snapY = wallSnap ? wallSnap.y : Number((Math.round(cursorPos.y / 0.1) * 0.1).toFixed(2));
      const newPoint: Point2D = { x: snapX, y: snapY };

      // Se clicar perto do primeiro ponto (distância < 0.15m) e houver pelo menos 3 pontos, fecha o polígono
      if (draftPoints.length >= 3) {
        const first = draftPoints[0];
        if (Math.hypot(snapX - first.x, snapY - first.y) < 0.15) {
          const centroid = calculatePolygonCentroid(draftPoints);
          addAnnotation({
            type: 'zone',
            name: `Zona ${annotations.length + 1}`,
            lineStyle: customAnnotationLineStyle,
            color: customAnnotationColor,
            points: [...draftPoints],
            labelPosition: centroid,
          });
          setDraftPoints([]);
          return;
        }
      }

      // Validação de Medida Mínima de 0.1m (10cm) para cada segmento de linha da zona
      // Usa 0.09 como margem de tolerância de arredondamento
      if (draftPoints.length > 0) {
        const last = draftPoints[draftPoints.length - 1];
        const distToLast = Math.hypot(snapX - last.x, snapY - last.y);
        if (distToLast < 0.09) {
          return; // Ignora se o comprimento da linha for menor que 0.1m (10cm)
        }
      }

      setDraftPoints((prev) => [...prev, newPoint]);
    } else if (activeAnnotationTool === 'magic_zone') {
      if (cursorPos.x === null || cursorPos.y === null || !cursorPos.isInsideTerrain) return;

      const seedX = cursorPos.x;
      const seedY = cursorPos.y;

      if (magicZoneMode === 'walls') {
        const result = detectRoomFromWalls(seedX, seedY, walls, terrain);
        if (result && result.points.length >= 3) {
          addAnnotation({
            type: 'zone',
            name: `Zona ${annotations.length + 1}`,
            lineStyle: customAnnotationLineStyle,
            color: customAnnotationColor,
            points: result.points,
            labelPosition: result.centroid,
          });
        } else if (result?.error === 'unclosed') {
          alert('⚠️ O ambiente não está totalmente fechado por paredes!');
        } else if (result?.error === 'on_wall') {
          alert('⚠️ Clique no interior do cômodo, não sobre a parede!');
        }
      } else if (magicZoneMode === 'floors') {
        const result = detectZoneFromFloors(seedX, seedY, floors);
        if (result && result.points.length >= 3) {
          addAnnotation({
            type: 'zone',
            name: `Zona ${annotations.length + 1}`,
            lineStyle: customAnnotationLineStyle,
            color: customAnnotationColor,
            points: result.points,
            labelPosition: result.centroid,
          });
        } else if (result?.error === 'no_floor') {
          alert('⚠️ Nenhum piso encontrado neste ponto do terreno!');
        }
      }
    } else if (activeAnnotationTool === 'ruler') {
      if (cursorPos.x === null || cursorPos.y === null || !cursorPos.isInsideTerrain) return;

      const wallSnap = findWallVertexSnap(cursorPos.x, cursorPos.y);
      const rulerSnapX = wallSnap ? wallSnap.x : Number((Math.round(cursorPos.x / 0.1) * 0.1).toFixed(2));
      const rulerSnapY = wallSnap ? wallSnap.y : Number((Math.round(cursorPos.y / 0.1) * 0.1).toFixed(2));

      if (draftPoints.length === 0) {
        setDraftPoints([{ x: rulerSnapX, y: rulerSnapY }]);
      } else {
        const p1 = draftPoints[0];
        const p2 = { x: rulerSnapX, y: rulerSnapY };
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        if (dist >= 0.1) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          addAnnotation({
            type: 'ruler',
            name: `Medida (${dist.toFixed(2)}m)`,
            lineStyle: customAnnotationLineStyle,
            color: customAnnotationColor,
            points: [p1, p2],
            labelPosition: { x: Number(midX.toFixed(2)), y: Number(midY.toFixed(2)) },
          });
        }
        setDraftPoints([]);
      }
    } else if (activeAnnotationTool === 'text') {
      const px = cursorPos.x;
      const py = cursorPos.y;
      if (px === null || py === null || !cursorPos.isInsideTerrain) return;

      // Adiciona um texto livre no ponto indicado
      addAnnotation({
        type: 'text',
        name: customTextContent || 'Anotação',
        text: customTextContent || 'Anotação',
        lineStyle: 'solid',
        color: customAnnotationColor,
        fontSize: customTextFontSize || 14,
        points: [{ x: Number(px.toFixed(2)), y: Number(py.toFixed(2)) }],
        labelPosition: { x: Number(px.toFixed(2)), y: Number(py.toFixed(2)) },
      });
    } else if (activeAnnotationTool === 'hand') {
      if (cursorPos.x === null || cursorPos.y === null) return;
      const mx = cursorPos.x;
      const my = cursorPos.y;

      // 1. Verifica clique em Rótulo de Marcação ou Texto Livre
      for (const ann of annotations) {
        const labelPos = ann.labelPosition || (ann.points.length > 0 ? (ann.type === 'text' ? ann.points[0] : calculatePolygonCentroid(ann.points)) : { x: 0, y: 0 });
        if (Math.hypot(mx - labelPos.x, my - labelPos.y) < 1.2) {
          setDraggingTarget({ type: 'annotation_label', id: ann.id });
          setSelectedAnnotationId(ann.id);
          return;
        }
      }

      // 2. Verifica clique em Texto/Cota de Medida de Parede
      for (const wall of walls) {
        const midX = (wall.x1 + wall.x2) / 2 + (wall.labelOffset?.x || 0);
        const midY = (wall.y1 + wall.y2) / 2 + (wall.labelOffset?.y || 0);
        if (Math.hypot(mx - midX, my - midY) < 1.0) {
          setDraggingTarget({ type: 'wall_label', id: wall.id });
          return;
        }
      }
    }
  };

  const handlePointerMove = () => {
    if (activeMode !== 'annotation' || !draggingTarget || cursorPos.x === null || cursorPos.y === null) {
      return;
    }

    const mx = cursorPos.x;
    const my = cursorPos.y;

    if (draggingTarget.type === 'annotation_label') {
      setAnnotationLabelPosition(draggingTarget.id, {
        x: Number(mx.toFixed(2)),
        y: Number(my.toFixed(2)),
      });
    } else if (draggingTarget.type === 'wall_label') {
      const wall = walls.find((w) => w.id === draggingTarget.id);
      if (wall) {
        const origMidX = (wall.x1 + wall.x2) / 2;
        const origMidY = (wall.y1 + wall.y2) / 2;
        setWallLabelOffset(wall.id, {
          x: Number((mx - origMidX).toFixed(2)),
          y: Number((my - origMidY).toFixed(2)),
        });
      }
    }
  };

  const handlePointerUp = () => {
    if (draggingTarget) {
      setDraggingTarget(null);
    }
  };

  const cancelDraft = () => {
    setDraftPoints([]);
  };

  const completeDraftManually = () => {
    if (activeAnnotationTool === 'ruler' && draftPoints.length === 1 && cursorPos.x !== null && cursorPos.y !== null) {
      const p1 = draftPoints[0];
      const px = cursorPos.snapVertexX ?? cursorPos.x;
      const py = cursorPos.snapVertexY ?? cursorPos.y;
      const p2 = { x: Number(px.toFixed(2)), y: Number(py.toFixed(2)) };
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (dist >= 0.1) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        addAnnotation({
          type: 'ruler',
          name: `Medida (${dist.toFixed(2)}m)`,
          lineStyle: customAnnotationLineStyle,
          color: customAnnotationColor,
          points: [p1, p2],
          labelPosition: { x: Number(midX.toFixed(2)), y: Number(midY.toFixed(2)) },
        });
      }
      setDraftPoints([]);
      return;
    }

    if (draftPoints.length >= 3) {
      const centroid = calculatePolygonCentroid(draftPoints);
      addAnnotation({
        type: 'zone',
        name: `Zona ${annotations.length + 1}`,
        lineStyle: customAnnotationLineStyle,
        color: customAnnotationColor,
        points: [...draftPoints],
        labelPosition: centroid,
      });
      setDraftPoints([]);
    }
  };

  return {
    draftPoints,
    draggingTarget,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cancelDraft,
    completeDraftManually,
  };
}
