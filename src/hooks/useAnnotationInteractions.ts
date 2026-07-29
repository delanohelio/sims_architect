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

export function useAnnotationInteractions() {
  const {
    activeMode,
    activeAnnotationTool,
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
        setDraftPoints([]);
      } else if (e.key === 'Enter') {
        completeDraftManually();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, draftPoints, customAnnotationLineStyle, customAnnotationColor]);

  const handlePointerDown = () => {
    if (activeMode !== 'annotation') return;

    if (activeAnnotationTool === 'draw') {
      const snapX = cursorPos.snapVertexX ?? cursorPos.x;
      const snapY = cursorPos.snapVertexY ?? cursorPos.y;

      if (snapX === null || snapY === null || !cursorPos.isInsideTerrain) return;

      const newPoint: Point2D = { x: snapX, y: snapY };

      // Se clicar perto do primeiro ponto (distância < 0.6m) e houver pelo menos 3 pontos, fecha o polígono
      if (draftPoints.length >= 3) {
        const first = draftPoints[0];
        if (Math.hypot(snapX - first.x, snapY - first.y) < 0.6) {
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

      setDraftPoints((prev) => [...prev, newPoint]);
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
