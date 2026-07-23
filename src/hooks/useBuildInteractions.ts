import { useState, useEffect } from 'react';
import { useSimsStore } from '../store/useSimsStore';
import type { Wall, DoorWindow } from '../types/sims';

interface HoveredTarget {
  type: 'wall' | 'floor' | 'door_window';
  id?: string;
  x?: number;
  y?: number;
  wall?: Wall;
  doorWindow?: DoorWindow;
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
    pendingDoor,
    addWall,
    paintWall,
    removeWall,
    paintFloorRect,
    eraseFloorRect,
    removeFloorTile,
    setPendingDoor,
    addDoorWindow,
    removeDoorWindow,
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
  }, []);

  const handlePointerMove = () => {
    // Atualização de cursor tratada via CanvasArea
  };

  const getHoveredTarget = (): HoveredTarget | null => {
    if (activeMode !== 'build') return null;
    if (cursorPos.x === null || cursorPos.y === null || !cursorPos.isInsideTerrain) {
      return null;
    }

    const mx = cursorPos.x;
    const my = cursorPos.y;

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

    if (cursorPos.gridX !== null && cursorPos.gridY !== null) {
      const key = `${cursorPos.gridX},${cursorPos.gridY}`;
      if (floors[key]) {
        return { type: 'floor', x: cursorPos.gridX, y: cursorPos.gridY };
      }
    }

    return null;
  };

  const getHoveredWallTarget = (): HoveredWallTarget | null => {
    if (activeMode !== 'build') return null;
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

  // HANDLER DE CLIQUE - APENAS EXECUTADO NO MODO 'build'
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (activeMode !== 'build') return;

    // 1. FERRAMENTA DE CONSTRUÇÃO DE PAREDES
    if (activeBuildTool === 'wall') {
      if (cursorPos.snapVertexX !== null && cursorPos.snapVertexY !== null) {
        setIsDrawingWall(true);
        setWallStartVertex({ x: cursorPos.snapVertexX, y: cursorPos.snapVertexY });
      }
    }

    // 2. FERRAMENTA DE PINTURA DE PAREDES (SOMBREAMENTO ALINHADO DIRETO COM O CURSOR DO MOUSE)
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
        if (target.type === 'door_window' && target.id) {
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

  return {
    handlePointerMove,
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
    hoveredTarget: activeMode === 'build' ? getHoveredTarget() : null,
    hoveredWallTarget: activeMode === 'build' ? getHoveredWallTarget() : null,
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
