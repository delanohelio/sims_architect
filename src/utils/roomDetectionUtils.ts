import type { Wall, FloorTile, TerrainConfig, Point2D } from '../types/sims';

interface DetectionResult {
  points: Point2D[];
  centroid: Point2D;
  error?: string;
}

/**
 * Detecta um cômodo fechado por paredes a partir de um ponto inicial (seedX, seedY) usando Flood Fill 2D (BFS).
 */
export function detectRoomFromWalls(
  seedX: number,
  seedY: number,
  walls: Wall[],
  terrain: TerrainConfig
): DetectionResult | null {
  const step = 0.2; // Resolução de 20cm por célula no grid de busca
  const cols = Math.round(terrain.width / step);
  const rows = Math.round(terrain.length / step);

  if (seedX < 0 || seedX > terrain.width || seedY < 0 || seedY > terrain.length) {
    return null;
  }

  const startGX = Math.floor(seedX / step);
  const startGY = Math.floor(seedY / step);

  if (startGX < 0 || startGX >= cols || startGY < 0 || startGY >= rows) {
    return null;
  }

  // 1. Matriz de Colisão com Paredes
  const grid = new Uint8Array(cols * rows); // 0 = Livre, 1 = Parede

  const lineIntersectsCell = (
    x1: number, y1: number, x2: number, y2: number,
    minX: number, minY: number, maxX: number, maxY: number
  ) => {
    // Checagem rápida de caixa delimitadora (Bounding Box)
    if (Math.max(x1, x2) < minX || Math.min(x1, x2) > maxX || Math.max(y1, y2) < minY || Math.min(y1, y2) > maxY) {
      return false;
    }
    // Intersecção segmento com retângulo
    const distToSegment = pointToSegmentDistSq(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      x1, y1, x2, y2
    );
    return distToSegment < (step * 0.45) ** 2;
  };

  const pointToSegmentDistSq = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return (px - projX) ** 2 + (py - projY) ** 2;
  };

  // Marca paredes no grid
  for (let r = 0; r < rows; r++) {
    const cellY1 = r * step;
    const cellY2 = (r + 1) * step;
    for (let c = 0; c < cols; c++) {
      const cellX1 = c * step;
      const cellX2 = (c + 1) * step;

      for (const w of walls) {
        if (lineIntersectsCell(w.x1, w.y1, w.x2, w.y2, cellX1, cellY1, cellX2, cellY2)) {
          grid[r * cols + c] = 1;
          break;
        }
      }
    }
  }

  // Se o ponto clicado cair diretamente sobre uma parede
  if (grid[startGY * cols + startGX] === 1) {
    return { points: [], centroid: { x: seedX, y: seedY }, error: 'on_wall' };
  }

  // 2. Flood Fill (BFS) a partir da célula inicial
  const visited = new Uint8Array(cols * rows);
  const queue: number[] = [startGY * cols + startGX];
  visited[startGY * cols + startGX] = 1;

  const floodedCells: { gx: number; gy: number }[] = [];
  let escapedToBoundary = false;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const gx = curr % cols;
    const gy = Math.floor(curr / cols);
    floodedCells.push({ gx, gy });

    // Checa se encostou na borda externa do terreno
    if (gx === 0 || gx === cols - 1 || gy === 0 || gy === rows - 1) {
      escapedToBoundary = true;
    }

    const neighbors = [
      [gx + 1, gy],
      [gx - 1, gy],
      [gx, gy + 1],
      [gx, gy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        const idx = ny * cols + nx;
        if (!visited[idx] && grid[idx] === 0) {
          visited[idx] = 1;
          queue.push(idx);
        }
      }
    }
  }

  if (escapedToBoundary) {
    return { points: [], centroid: { x: seedX, y: seedY }, error: 'unclosed' };
  }

  if (floodedCells.length < 4) {
    return null;
  }

  // 3. Extração do Contorno Externo (Perímetro)
  const cellSet = new Set<string>();
  floodedCells.forEach(({ gx, gy }) => cellSet.add(`${gx},${gy}`));

  // Identifica arestas do perímetro
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

  floodedCells.forEach(({ gx, gy }) => {
    const x1 = gx * step;
    const y1 = gy * step;
    const x2 = (gx + 1) * step;
    const y2 = (gy + 1) * step;

    // Aresta Norte
    if (!cellSet.has(`${gx},${gy - 1}`)) edges.push({ x1, y1, x2, y2: y1 });
    // Aresta Leste
    if (!cellSet.has(`${gx + 1},${gy}`)) edges.push({ x1: x2, y1, x2, y2 });
    // Aresta Sul
    if (!cellSet.has(`${gx},${gy + 1}`)) edges.push({ x1: x2, y1: y2, x2: x1, y2 });
    // Aresta Oeste
    if (!cellSet.has(`${gx - 1},${gy}`)) edges.push({ x1, y1: y2, x2: x1, y2: y1 });
  });

  if (edges.length === 0) return null;

  // 4. Encadeamento de Arestas em um Polígono Ordenado
  const points = traceBoundaryPolygon(edges);
  const simplifiedPoints = simplifyPolygonVertices(points);

  if (simplifiedPoints.length < 3) return null;

  // Calcula Centróide
  let sumX = 0;
  let sumY = 0;
  simplifiedPoints.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
  });
  const centroid = {
    x: Number((sumX / simplifiedPoints.length).toFixed(2)),
    y: Number((sumY / simplifiedPoints.length).toFixed(2)),
  };

  return { points: simplifiedPoints, centroid };
}

/**
 * Detecta polígono a partir de ladrilhos de pisos contíguos.
 */
export function detectZoneFromFloors(
  seedX: number,
  seedY: number,
  floors: Record<string, FloorTile>
): DetectionResult | null {
  const seedCellX = Math.floor(seedX);
  const seedCellY = Math.floor(seedY);
  const seedKey = `${seedCellX},${seedCellY}`;

  const seedFloor = floors[seedKey];
  if (!seedFloor) {
    return { points: [], centroid: { x: seedX, y: seedY }, error: 'no_floor' };
  }

  // BFS para encontrar todos os pisos contíguos de mesmo tipo
  const visited = new Set<string>();
  const queue = [`${seedCellX},${seedCellY}`];
  visited.add(`${seedCellX},${seedCellY}`);

  const floorCells: { x: number; y: number }[] = [];

  while (queue.length > 0) {
    const currKey = queue.shift()!;
    const [cx, cy] = currKey.split(',').map(Number);
    floorCells.push({ x: cx, y: cy });

    const neighbors = [
      `${cx + 1},${cy}`,
      `${cx - 1},${cy}`,
      `${cx},${cy + 1}`,
      `${cx},${cy - 1}`,
    ];

    for (const nKey of neighbors) {
      if (!visited.has(nKey) && floors[nKey]) {
        visited.add(nKey);
        queue.push(nKey);
      }
    }
  }

  // Extrai arestas do perímetro de 1m x 1m
  const cellSet = new Set(floorCells.map((c) => `${c.x},${c.y}`));
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

  floorCells.forEach(({ x, y }) => {
    const x1 = x;
    const y1 = y;
    const x2 = x + 1;
    const y2 = y + 1;

    if (!cellSet.has(`${x},${y - 1}`)) edges.push({ x1, y1, x2, y2: y1 });
    if (!cellSet.has(`${x + 1},${y}`)) edges.push({ x1: x2, y1, x2, y2 });
    if (!cellSet.has(`${x},${y + 1}`)) edges.push({ x1: x2, y1: y2, x2: x1, y2 });
    if (!cellSet.has(`${x - 1},${y}`)) edges.push({ x1, y1: y2, x2: x1, y2: y1 });
  });

  const points = traceBoundaryPolygon(edges);
  const simplified = simplifyPolygonVertices(points);

  if (simplified.length < 3) return null;

  let sumX = 0;
  let sumY = 0;
  simplified.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
  });
  const centroid = {
    x: Number((sumX / simplified.length).toFixed(2)),
    y: Number((sumY / simplified.length).toFixed(2)),
  };

  return { points: simplified, centroid };
}

/**
 * Converte um conjunto de arestas desordenadas em um polígono de vértices conectados.
 */
function traceBoundaryPolygon(edges: { x1: number; y1: number; x2: number; y2: number }[]): Point2D[] {
  if (edges.length === 0) return [];

  const points: Point2D[] = [];
  const edgeMap = new Map<string, Point2D>();

  edges.forEach((e) => {
    const startKey = `${e.x1.toFixed(2)},${e.y1.toFixed(2)}`;
    edgeMap.set(startKey, { x: Number(e.x2.toFixed(2)), y: Number(e.y2.toFixed(2)) });
  });

  const firstEdge = edges[0];
  let currX = Number(firstEdge.x1.toFixed(2));
  let currY = Number(firstEdge.y1.toFixed(2));
  const startKey = `${currX},${currY}`;

  for (let i = 0; i < edges.length + 1; i++) {
    points.push({ x: currX, y: currY });
    const key = `${currX.toFixed(2)},${currY.toFixed(2)}`;
    const nextPt = edgeMap.get(key);

    if (!nextPt) break;
    if (`${nextPt.x.toFixed(2)},${nextPt.y.toFixed(2)}` === startKey) {
      break;
    }
    currX = nextPt.x;
    currY = nextPt.y;
  }

  return points;
}

/**
 * Simplifica vértices colineares mantendo apenas os cantos/mudanças de direção.
 */
function simplifyPolygonVertices(pts: Point2D[]): Point2D[] {
  if (pts.length <= 3) return pts;

  const result: Point2D[] = [];

  for (let i = 0; i < pts.length; i++) {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    // Se a direção mudar (produto vetorial não-nulo), mantém o vértice de canto
    const crossProduct = Math.abs(dx1 * dy2 - dy1 * dx2);
    if (crossProduct > 0.001) {
      result.push(curr);
    }
  }

  return result;
}
