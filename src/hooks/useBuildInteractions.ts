import { useState, useEffect } from 'react';
import { useSimsStore } from '../store/useSimsStore';
import type { Wall, DoorWindow, FurnitureItem } from '../types/sims';

interface HoveredTarget {
  type: 'wall' | 'floor' | 'door_window' | 'furniture';
  id?: string;
  x?: number;
  y?: number;
  wall?: Wall;
  doorWindow?: DoorWindow;
  furniture?: FurnitureItem;
}

interface HoveredWallTarget {
  wall: Wall;
  offsetRatio: number;
  pointOnWall: { x: number; y: number };
}

export function useBuildInteractions() {
  const {
    activeMode,
    activeBuildTool,
    terrain,
    selectedFloorTexture,
    selectedFloorColor,
    selectedFloorCustomTexture,
    selectedWallColor,
    selectedWallTexture,
    selectedDoorWindow,
    customDoorWidth,
    customDoorHeight,
    customDoorFrameColor,
    cursorPos,
    walls,
    floors,
    doorsWindows,
    items,
    pendingDoor,
    pendingFurnitureItem,
    addWall,
    paintWall,
    removeWall,
    paintFloorRect,
    eraseFloorRect,
    removeFloorTile,
    setPendingDoor,
    cancelPendingDoor,
    addDoorWindow,
    removeDoorWindow,
    setPendingFurnitureItem,
    rotatePendingFurnitureItem,
    cancelPendingFurnitureItem,
    addItem,
    updateItemPosition,
    removeItem,
  } = useSimsStore();

  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [wallStartVertex, setWallStartVertex] = useState<{ x: number; y: number } | null>(null);

  const [isSelectingFloor, setIsSelectingFloor] = useState(false);
  const [floorStartCell, setFloorStartCell] = useState<{ x: number; y: number } | null>(null);

  const [isErasing, setIsErasing] = useState(false);
  const [eraseStartCell, setEraseStartCell] = useState<{ x: number; y: number } | null>(null);

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        setIsSpacePressed(true);
      }

      if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
        rotatePendingFurnitureItem();
      }

      if (e.code === 'Escape') {
        cancelPendingDoor();
        cancelPendingFurnitureItem();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [rotatePendingFurnitureItem, cancelPendingDoor, cancelPendingFurnitureItem]);

  // CÁLCULO DE BOUNDING BOX E VALIDAÇÃO DE COLISÃO PARA MÓVEIS
  const getEffectiveFurnitureBounds = (
    centerX: number,
    centerY: number,
    width: number,
    depth: number,
    rotation: number
  ) => {
    const isRotated = rotation === 90 || rotation === 270;
    const eW = isRotated ? depth : width;
    const eD = isRotated ? width : depth;

    return {
      minX: centerX - eW / 2,
      maxX: centerX + eW / 2,
      minY: centerY - eD / 2,
      maxY: centerY + eD / 2,
      width: eW,
      depth: eD,
    };
  };

  const isFurniturePositionValid = (
    centerX: number,
    centerY: number,
    width: number,
    depth: number,
    rotation: number,
    ignoreItemId?: string
  ): boolean => {
    const bounds = getEffectiveFurnitureBounds(centerX, centerY, width, depth, rotation);

    // 1. Limites do Terreno
    if (bounds.minX < 0 || bounds.maxX > terrain.width || bounds.minY < 0 || bounds.maxY > terrain.length) {
      return false;
    }

    // 2. Colisão com Paredes
    for (const wall of walls) {
      if (lineSegmentIntersectsRect(wall.x1, wall.y1, wall.x2, wall.y2, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY)) {
        return false;
      }
    }

    // 3. Colisão com outros Móveis
    for (const item of items) {
      if (ignoreItemId && item.id === ignoreItemId) continue;

      const otherBounds = getEffectiveFurnitureBounds(item.x, item.y, item.width, item.depth, item.rotation);

      if (
        bounds.minX < otherBounds.maxX &&
        bounds.maxX > otherBounds.minX &&
        bounds.minY < otherBounds.maxY &&
        bounds.maxY > otherBounds.minY
      ) {
        return false;
      }
    }

    return true;
  };

  const getHoveredTarget = (): HoveredTarget | null => {
    if (cursorPos.x === null || cursorPos.y === null || !cursorPos.isInsideTerrain) {
      return null;
    }

    const mx = cursorPos.x;
    const my = cursorPos.y;

    // Detecta Móveis no Modo Compra ou Borracha
    for (const item of items) {
      const bounds = getEffectiveFurnitureBounds(item.x, item.y, item.width, item.depth, item.rotation);
      if (mx >= bounds.minX && mx <= bounds.maxX && my >= bounds.minY && my <= bounds.maxY) {
        return { type: 'furniture', id: item.id, furniture: item };
      }
    }

    // Detecta Esquadrias
    for (const dw of doorsWindows) {
      const wall = walls.find((w) => w.id === dw.wallId);
      if (wall) {
        const dwPxX = wall.x1 + (wall.x2 - wall.x1) * dw.offsetRatio;
        const dwPxY = wall.y1 + (wall.y2 - wall.y1) * dw.offsetRatio;
        if (Math.hypot(mx - dwPxX, my - dwPxY) < 0.8) {
          return { type: 'door_window', id: dw.id, doorWindow: dw };
        }
      }
    }

    // Detecta Paredes
    let closestWall: Wall | null = null;
    let minDistance = 0.4;

    for (const wall of walls) {
      const dist = pointToSegmentDistance(mx, my, wall.x1, wall.y1, wall.x2, wall.y2);
      if (dist < minDistance) {
        minDistance = dist;
        closestWall = wall;
      }
    }

    if (closestWall) {
      return { type: 'wall', id: closestWall.id, wall: closestWall };
    }

    // Detecta Pisos
    if (cursorPos.gridX !== null && cursorPos.gridY !== null) {
      const key = `${cursorPos.gridX},${cursorPos.gridY}`;
      if (floors[key]) {
        return { type: 'floor', x: cursorPos.gridX, y: cursorPos.gridY };
      }
    }

    return null;
  };

  const getHoveredWallTarget = (): HoveredWallTarget | null => {
    if (cursorPos.x === null || cursorPos.y === null || !cursorPos.isInsideTerrain) {
      return null;
    }

    const mx = cursorPos.x;
    const my = cursorPos.y;

    let closestWall: Wall | null = null;
    let minDistance = 0.5;
    let bestOffsetRatio = 0.5;
    let bestPoint = { x: mx, y: my };

    for (const wall of walls) {
      const proj = projectPointOntoSegment(mx, my, wall.x1, wall.y1, wall.x2, wall.y2);
      if (proj.distance < minDistance) {
        minDistance = proj.distance;
        closestWall = wall;
        bestOffsetRatio = proj.offsetRatio;
        bestPoint = { x: proj.x, y: proj.y };
      }
    }

    if (closestWall) {
      return { wall: closestWall, offsetRatio: bestOffsetRatio, pointOnWall: bestPoint };
    }

    return null;
  };

  // HANDLER DE CLIQUE
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    // INTERAÇÃO NO MODO COMPRA (`activeMode === 'buy'`)
    if (activeMode === 'buy') {
      if (pendingFurnitureItem) {
        if (cursorPos.x !== null && cursorPos.y !== null) {
          const snapStep = 0.1; // Snap leve de 0.1m
          const candX = Number((Math.round(cursorPos.x / snapStep) * snapStep).toFixed(2));
          const candY = Number((Math.round(cursorPos.y / snapStep) * snapStep).toFixed(2));

          const isValid = isFurniturePositionValid(
            candX,
            candY,
            pendingFurnitureItem.catalogItem.width,
            pendingFurnitureItem.catalogItem.depth,
            pendingFurnitureItem.rotation,
            pendingFurnitureItem.movingItemId
          );

          if (isValid) {
            if (pendingFurnitureItem.movingItemId) {
              updateItemPosition(
                pendingFurnitureItem.movingItemId,
                candX,
                candY,
                pendingFurnitureItem.rotation
              );
              cancelPendingFurnitureItem();
            } else {
              addItem({
                catalogId: pendingFurnitureItem.catalogItem.catalogId,
                name: pendingFurnitureItem.catalogItem.name,
                category: pendingFurnitureItem.catalogItem.category,
                width: pendingFurnitureItem.catalogItem.width,
                depth: pendingFurnitureItem.catalogItem.depth,
                height: pendingFurnitureItem.catalogItem.height,
                x: candX,
                y: candY,
                rotation: pendingFurnitureItem.rotation,
                color: pendingFurnitureItem.catalogItem.color,
                textureUrl: pendingFurnitureItem.catalogItem.textureUrl,
                primitiveShape: pendingFurnitureItem.catalogItem.primitiveShape,
              });
            }
          }
        }
      } else {
        // Clicar em um móvel existente para SELECIONAR E MOVER!
        const target = getHoveredTarget();
        if (target && target.type === 'furniture' && target.furniture) {
          const furn = target.furniture;
          setPendingFurnitureItem({
            catalogItem: {
              catalogId: furn.catalogId,
              name: furn.name,
              category: furn.category,
              width: furn.width,
              depth: furn.depth,
              height: furn.height,
              color: furn.color,
              textureUrl: furn.textureUrl,
              primitiveShape: furn.primitiveShape,
            },
            rotation: furn.rotation,
            movingItemId: furn.id,
          });
        }
      }
      return;
    }

    if (activeMode !== 'build') return;

    // 1. FERRAMENTA DE CONSTRUÇÃO DE PAREDES
    if (activeBuildTool === 'wall') {
      if (cursorPos.snapVertexX !== null && cursorPos.snapVertexY !== null) {
        setIsDrawingWall(true);
        setWallStartVertex({ x: cursorPos.snapVertexX, y: cursorPos.snapVertexY });
      }
    }

    // 2. FERRAMENTA DE PINTURA DE PAREDES
    else if (activeBuildTool === 'wall_paint') {
      const hoveredWallTarget = getHoveredWallTarget();
      if (hoveredWallTarget && cursorPos.x !== null && cursorPos.y !== null) {
        const wall = hoveredWallTarget.wall;
        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const len = Math.hypot(dx, dy);

        if (len > 0) {
          const nx = -dy / len;
          const ny = dx / len;

          const l2 = dx * dx + dy * dy;
          let t = ((cursorPos.x - wall.x1) * dx + (cursorPos.y - wall.y1) * dy) / l2;
          t = Math.max(0, Math.min(1, t));
          const projX = wall.x1 + t * dx;
          const projY = wall.y1 + t * dy;
          const distToCenter = Math.hypot(cursorPos.x - projX, cursorPos.y - projY);

          let side: 'sideA' | 'sideB' | undefined = undefined;

          if (distToCenter >= 0.12) {
            const dotNormal = (cursorPos.x - projX) * nx + (cursorPos.y - projY) * ny;
            side = dotNormal > 0 ? 'sideA' : 'sideB';
          }

          paintWall(wall.id, selectedWallColor, selectedWallTexture, side);
        }
      }
    }

    // 3. FERRAMENTA DE APLICAÇÃO DE PISOS
    else if (activeBuildTool === 'floor') {
      if (cursorPos.gridX !== null && cursorPos.gridY !== null) {
        setIsSelectingFloor(true);
        setFloorStartCell({ x: cursorPos.gridX, y: cursorPos.gridY });
      }
    }

    // 4. FERRAMENTA DE PORTAS E JANELAS (3 PASSOS)
    else if (activeBuildTool === 'door_window') {
      if (pendingDoor) {
        if (pendingDoor.step === 'hinge') {
          const wall = walls.find((w) => w.id === pendingDoor.wallId);
          if (wall && cursorPos.x !== null && cursorPos.y !== null) {
            const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
            const dwPxX = wall.x1 + (wall.x2 - wall.x1) * pendingDoor.offsetRatio;
            const dwPxY = wall.y1 + (wall.y2 - wall.y1) * pendingDoor.offsetRatio;
            const dwPxWidth = pendingDoor.width;

            const ux = Math.cos(angle);
            const uy = Math.sin(angle);
            const halfW = dwPxWidth / 2;

            const ptAx = dwPxX - ux * halfW;
            const ptAy = dwPxY - uy * halfW;
            const ptBx = dwPxX + ux * halfW;
            const ptBy = dwPxY + uy * halfW;

            const distA = Math.hypot(cursorPos.x - ptAx, cursorPos.y - ptAy);
            const distB = Math.hypot(cursorPos.x - ptBx, cursorPos.y - ptBy);

            const chosenFlipSwing = distB < distA;

            setPendingDoor({
              ...pendingDoor,
              step: 'swing',
              flipSwing: chosenFlipSwing,
            });
          }
        } else if (pendingDoor.step === 'swing') {
          const wall = walls.find((w) => w.id === pendingDoor.wallId);
          if (wall && cursorPos.x !== null && cursorPos.y !== null) {
            const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
            const dwPxX = wall.x1 + (wall.x2 - wall.x1) * pendingDoor.offsetRatio;
            const dwPxY = wall.y1 + (wall.y2 - wall.y1) * pendingDoor.offsetRatio;

            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const dot = (cursorPos.x - dwPxX) * perpX + (cursorPos.y - dwPxY) * perpY;

            const finalFlipSide = dot > 0;

            addDoorWindow({
              type: 'door',
              catalogId: pendingDoor.catalogId,
              name: pendingDoor.name,
              wallId: pendingDoor.wallId,
              offsetRatio: pendingDoor.offsetRatio,
              width: pendingDoor.width,
              height: pendingDoor.height,
              frameColor: pendingDoor.frameColor,
              flipSide: finalFlipSide,
              flipSwing: pendingDoor.flipSwing,
            });

            setPendingDoor(null);
          }
        }
      } else {
        const hoveredWallTarget = getHoveredWallTarget();
        if (hoveredWallTarget) {
          const item = selectedDoorWindow;
          const isDoor = item.type === 'door';

          const dwWidth = item.isCustom ? customDoorWidth : item.width;
          const dwHeight = item.isCustom ? customDoorHeight : (item.height || (isDoor ? 2.1 : 1.2));
          const dwColor = customDoorFrameColor;

          if (isDoor) {
            setPendingDoor({
              step: 'hinge',
              wallId: hoveredWallTarget.wall.id,
              offsetRatio: hoveredWallTarget.offsetRatio,
              catalogId: item.catalogId,
              name: item.name,
              type: 'door',
              width: dwWidth,
              height: dwHeight,
              frameColor: dwColor,
              flipSwing: false,
              flipSide: false,
            });
          } else {
            addDoorWindow({
              type: 'window',
              catalogId: item.catalogId,
              name: item.name,
              wallId: hoveredWallTarget.wall.id,
              offsetRatio: hoveredWallTarget.offsetRatio,
              width: dwWidth,
              height: dwHeight,
              frameColor: dwColor,
            });
          }
        }
      }
    }

    // 5. FERRAMENTA DE REMOÇÃO (MARRETA)
    else if (activeBuildTool === 'eraser') {
      const target = getHoveredTarget();
      if (target) {
        if (target.type === 'furniture' && target.id) {
          removeItem(target.id);
        } else if (target.type === 'door_window' && target.id) {
          removeDoorWindow(target.id);
        } else if (target.type === 'wall' && target.id) {
          removeWall(target.id);
        } else if (target.type === 'floor' && target.x !== undefined && target.y !== undefined) {
          setIsErasing(true);
          setEraseStartCell({ x: target.x, y: target.y });
          removeFloorTile(target.x, target.y);
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (activeMode !== 'build') {
      setIsDrawingWall(false);
      setWallStartVertex(null);
      setIsSelectingFloor(false);
      setFloorStartCell(null);
      setIsErasing(false);
      setEraseStartCell(null);
      return;
    }

    if (isDrawingWall && wallStartVertex && cursorPos.snapVertexX !== null && cursorPos.snapVertexY !== null) {
      if (wallStartVertex.x !== cursorPos.snapVertexX || wallStartVertex.y !== cursorPos.snapVertexY) {
        addWall({
          x1: wallStartVertex.x,
          y1: wallStartVertex.y,
          x2: cursorPos.snapVertexX,
          y2: cursorPos.snapVertexY,
          colorSideA: selectedWallColor,
          textureUrlSideA: selectedWallTexture,
          colorSideB: selectedWallColor,
          textureUrlSideB: selectedWallTexture,
        });
      }
    }
    setIsDrawingWall(false);
    setWallStartVertex(null);

    if (isSelectingFloor && floorStartCell && cursorPos.gridX !== null && cursorPos.gridY !== null) {
      paintFloorRect(
        floorStartCell.x,
        floorStartCell.y,
        cursorPos.gridX,
        cursorPos.gridY,
        selectedFloorTexture,
        selectedFloorColor,
        selectedFloorCustomTexture
      );
    }
    setIsSelectingFloor(false);
    setFloorStartCell(null);

    if (isErasing && eraseStartCell && cursorPos.gridX !== null && cursorPos.gridY !== null) {
      eraseFloorRect(eraseStartCell.x, eraseStartCell.y, cursorPos.gridX, cursorPos.gridY);
    }
    setIsErasing(false);
    setEraseStartCell(null);
  };

  // CANDIDATO A POSICIONAMENTO DE MÓVEL
  const candSnapStep = 0.1;
  const candX = cursorPos.x !== null ? Number((Math.round(cursorPos.x / candSnapStep) * candSnapStep).toFixed(2)) : null;
  const candY = cursorPos.y !== null ? Number((Math.round(cursorPos.y / candSnapStep) * candSnapStep).toFixed(2)) : null;

  const isPendingFurnitureValid =
    pendingFurnitureItem && candX !== null && candY !== null
      ? isFurniturePositionValid(
          candX,
          candY,
          pendingFurnitureItem.catalogItem.width,
          pendingFurnitureItem.catalogItem.depth,
          pendingFurnitureItem.rotation,
          pendingFurnitureItem.movingItemId
        )
      : false;

  return {
    handlePointerMove: () => {},
    handlePointerDown,
    handlePointerUp,
    isSpacePressed,
    draftWall:
      activeMode === 'build' && isDrawingWall && wallStartVertex && cursorPos.snapVertexX !== null && cursorPos.snapVertexY !== null
        ? {
            x1: wallStartVertex.x,
            y1: wallStartVertex.y,
            x2: cursorPos.snapVertexX,
            y2: cursorPos.snapVertexY,
          }
        : null,
    draftFloorRect:
      activeMode === 'build' && isSelectingFloor && floorStartCell && cursorPos.gridX !== null && cursorPos.gridY !== null
        ? {
            x1: floorStartCell.x,
            y1: floorStartCell.y,
            x2: cursorPos.gridX,
            y2: cursorPos.gridY,
          }
        : null,
    hoveredTarget: getHoveredTarget(),
    hoveredWallTarget: activeMode === 'build' ? getHoveredWallTarget() : null,
    pendingFurniturePreview:
      pendingFurnitureItem && candX !== null && candY !== null
        ? {
            x: candX,
            y: candY,
            width: pendingFurnitureItem.catalogItem.width,
            depth: pendingFurnitureItem.catalogItem.depth,
            height: pendingFurnitureItem.catalogItem.height,
            rotation: pendingFurnitureItem.rotation,
            color: pendingFurnitureItem.catalogItem.color,
            textureUrl: pendingFurnitureItem.catalogItem.textureUrl,
            primitiveShape: pendingFurnitureItem.catalogItem.primitiveShape,
            isValid: isPendingFurnitureValid,
          }
        : null,
  };
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);

  return Math.hypot(px - projX, py - projY);
}

function projectPointOntoSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) {
    return { distance: Math.hypot(px - x1, py - y1), offsetRatio: 0.5, x: x1, y: y1 };
  }

  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  const clampedT = Math.max(0.1, Math.min(0.9, t));

  const projX = x1 + clampedT * (x2 - x1);
  const projY = y1 + clampedT * (y2 - y1);

  return {
    distance: Math.hypot(px - projX, py - projY),
    offsetRatio: clampedT,
    x: projX,
    y: projY,
  };
}

// AUXILIAR DE INTERSEÇÃO ENTRE SEGMENTO DE LINHA E RETÂNGULO
function lineSegmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): boolean {
  if ((x1 < minX && x2 < minX) || (x1 > maxX && x2 > maxX) || (y1 < minY && y2 < minY) || (y1 > maxY && y2 > maxY)) {
    return false;
  }

  if (pointInRect(x1, y1, minX, minY, maxX, maxY) || pointInRect(x2, y2, minX, minY, maxX, maxY)) {
    return true;
  }

  return (
    segmentsIntersect(x1, y1, x2, y2, minX, minY, maxX, minY) ||
    segmentsIntersect(x1, y1, x2, y2, maxX, minY, maxX, maxY) ||
    segmentsIntersect(x1, y1, x2, y2, maxX, maxY, minX, maxY) ||
    segmentsIntersect(x1, y1, x2, y2, minX, maxY, minX, minY)
  );
}

function pointInRect(x: number, y: number, minX: number, minY: number, maxX: number, maxY: number): boolean {
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

function segmentsIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean {
  const ccw = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
    return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
  };
  return (
    ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) &&
    ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4)
  );
}
