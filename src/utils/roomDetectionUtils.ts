import type { Wall, FloorTile, TerrainConfig, Point2D } from '../types/sims';

interface DetectionResult {
  points: Point2D[];
  centroid: Point2D;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS: Geometria 2D
// ─────────────────────────────────────────────────────────────────────────────

/** Ponto de interseção entre dois segmentos de reta (retorna null se não se cruzam). */
function segmentIntersection(
  ax1: number, ay1: number, ax2: number, ay2: number,
  bx1: number, by1: number, bx2: number, by2: number,
): Point2D | null {
  const dax = ax2 - ax1;
  const day = ay2 - ay1;
  const dbx = bx2 - bx1;
  const dby = by2 - by1;
  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < 1e-10) return null; // paralelos ou colineares
  const t = ((bx1 - ax1) * dby - (by1 - ay1) * dbx) / denom;
  const u = ((bx1 - ax1) * day - (by1 - ay1) * dax) / denom;
  if (t < -0.01 || t > 1.01 || u < -0.01 || u > 1.01) return null;
  return {
    x: Number((ax1 + t * dax).toFixed(3)),
    y: Number((ay1 + t * day).toFixed(3)),
  };
}

/** Interseção entre duas retas infinitas definidas por segmentos. */
function lineIntersection(
  ax1: number, ay1: number, ax2: number, ay2: number,
  bx1: number, by1: number, bx2: number, by2: number,
): Point2D | null {
  const dax = ax2 - ax1;
  const day = ay2 - ay1;
  const dbx = bx2 - bx1;
  const dby = by2 - by1;
  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((bx1 - ax1) * dby - (by1 - ay1) * dbx) / denom;
  return {
    x: Number((ax1 + t * dax).toFixed(3)),
    y: Number((ay1 + t * day).toFixed(3)),
  };
}

/** Distância de um ponto a um segmento de reta. */
function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Verifica se um ponto está dentro de um polígono (ray casting). */
function pointInPolygon(px: number, py: number, polygon: Point2D[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Área com sinal (Shoelace). Positivo = anti-horário. */
function signedArea(pts: Point2D[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return a / 2;
}

/** Calcula centroide de um polígono. */
function polygonCentroid(pts: Point2D[]): Point2D {
  if (!pts || pts.length === 0) return { x: 0, y: 0 };
  let sx = 0, sy = 0;
  pts.forEach(p => { sx += p.x; sy += p.y; });
  return {
    x: Number((sx / pts.length).toFixed(2)),
    y: Number((sy / pts.length).toFixed(2)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// detectRoomFromWalls — Detecção por interseção de paredes que formam polígono
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detecta um ambiente fechado por paredes a partir de um ponto clicado.
 *
 * Abordagem: constrói um grafo de interseções entre paredes (estendendo-as se
 * necessário para encontrar cruzamentos), depois usa ray-casting angular (similar
 * a "percorrer a fronteira mais interna") para extrair o polígono mínimo que
 * contém o ponto clicado.
 */
export function detectRoomFromWalls(
  seedX: number,
  seedY: number,
  walls: Wall[],
  terrain: TerrainConfig
): DetectionResult | null {
  if (walls.length < 3) {
    return { points: [], centroid: { x: seedX, y: seedY }, error: 'unclosed' };
  }

  // Verificar se o ponto está sobre uma parede
  for (const w of walls) {
    if (pointToSegmentDist(seedX, seedY, w.x1, w.y1, w.x2, w.y2) < 0.15) {
      return { points: [], centroid: { x: seedX, y: seedY }, error: 'on_wall' };
    }
  }

  // Limites do terreno como 4 paredes virtuais (borda do lote)
  const bW = terrain.width;
  const bL = terrain.length;
  const borderSegments: { x1: number; y1: number; x2: number; y2: number }[] = [
    { x1: 0,  y1: 0,  x2: bW, y2: 0 },   // Norte
    { x1: bW, y1: 0,  x2: bW, y2: bL },   // Leste
    { x1: bW, y1: bL, x2: 0,  y2: bL },   // Sul
    { x1: 0,  y1: bL, x2: 0,  y2: 0 },    // Oeste
  ];

  // Todos os segmentos (paredes reais + borda do terreno)
  const allSegments = [
    ...walls.map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 })),
    ...borderSegments,
  ];
  const N = allSegments.length;

  // 1. Construir grafo de adjacência baseado em interseções de segmentos
  // Cada nó é um ponto de interseção ou endpoint de parede.
  // Cada aresta é um trecho de segmento entre dois nós consecutivos.

  // Para cada segmento, encontrar todos os pontos nele (endpoints + interseções) e ordená-los
  type SegNode = { x: number; y: number; t: number };
  const segNodes: SegNode[][] = allSegments.map(() => []);

  // Adicionar endpoints
  for (let i = 0; i < N; i++) {
    const s = allSegments[i];
    segNodes[i].push({ x: s.x1, y: s.y1, t: 0 });
    segNodes[i].push({ x: s.x2, y: s.y2, t: 1 });
  }

  // Encontrar interseções entre todos os pares de segmentos
  for (let i = 0; i < N; i++) {
    const si = allSegments[i];
    for (let j = i + 1; j < N; j++) {
      const sj = allSegments[j];
      const pt = segmentIntersection(si.x1, si.y1, si.x2, si.y2, sj.x1, sj.y1, sj.x2, sj.y2);
      if (pt) {
        // Calcular parâmetro t no segmento i
        const dxi = si.x2 - si.x1;
        const dyi = si.y2 - si.y1;
        const li = Math.hypot(dxi, dyi);
        const ti = li > 1e-10 ? ((pt.x - si.x1) * dxi + (pt.y - si.y1) * dyi) / (li * li) : 0;

        const dxj = sj.x2 - sj.x1;
        const dyj = sj.y2 - sj.y1;
        const lj = Math.hypot(dxj, dyj);
        const tj = lj > 1e-10 ? ((pt.x - sj.x1) * dxj + (pt.y - sj.y1) * dyj) / (lj * lj) : 0;

        segNodes[i].push({ x: pt.x, y: pt.y, t: ti });
        segNodes[j].push({ x: pt.x, y: pt.y, t: tj });
      }
    }
  }

  // Também encontrar interseções entre paredes estendidas e outras paredes
  // (para paredes que não se tocam fisicamente mas cujas extensões formariam um canto)
  const wallCount = walls.length;
  for (let i = 0; i < wallCount; i++) {
    for (let j = i + 1; j < wallCount; j++) {
      const wi = allSegments[i];
      const wj = allSegments[j];
      // Já foi tratado em segmentIntersection acima se tocam diretamente
      // Agora, tentar extensão se endpoints estão próximos (tolerância de 0.5m)
      const endpointPairs = [
        { px: wi.x1, py: wi.y1, qx: wj.x1, qy: wj.y1 },
        { px: wi.x1, py: wi.y1, qx: wj.x2, qy: wj.y2 },
        { px: wi.x2, py: wi.y2, qx: wj.x1, qy: wj.y1 },
        { px: wi.x2, py: wi.y2, qx: wj.x2, qy: wj.y2 },
      ];
      for (const { px, py, qx, qy } of endpointPairs) {
        const dist = Math.hypot(px - qx, py - qy);
        if (dist > 0.01 && dist < 0.5) {
          // Estes endpoints estão perto mas não conectados — criar uma conexão virtual
          const midX = Number(((px + qx) / 2).toFixed(3));
          const midY = Number(((py + qy) / 2).toFixed(3));
          // Adicionar este ponto médio a ambos os segmentos
          const dxi = wi.x2 - wi.x1;
          const dyi = wi.y2 - wi.y1;
          const li = Math.hypot(dxi, dyi);
          const ti = li > 1e-10 ? ((midX - wi.x1) * dxi + (midY - wi.y1) * dyi) / (li * li) : 0;

          const dxj = wj.x2 - wj.x1;
          const dyj = wj.y2 - wj.y1;
          const lj = Math.hypot(dxj, dyj);
          const tj = lj > 1e-10 ? ((midX - wj.x1) * dxj + (midY - wj.y1) * dyj) / (lj * lj) : 0;

          segNodes[i].push({ x: midX, y: midY, t: ti });
          segNodes[j].push({ x: midX, y: midY, t: tj });
        }
      }

      // Verificar interseção de linhas infinitas entre paredes (extensão)
      const linePt = lineIntersection(wi.x1, wi.y1, wi.x2, wi.y2, wj.x1, wj.y1, wj.x2, wj.y2);
      if (linePt) {
        // Verificar se o ponto de interseção está próximo dos endpoints de ambas as paredes
        const distToWi = Math.min(
          Math.hypot(linePt.x - wi.x1, linePt.y - wi.y1),
          Math.hypot(linePt.x - wi.x2, linePt.y - wi.y2),
        );
        const distToWj = Math.min(
          Math.hypot(linePt.x - wj.x1, linePt.y - wj.y1),
          Math.hypot(linePt.x - wj.x2, linePt.y - wj.y2),
        );
        // Se ambas as paredes têm um endpoint próximo da interseção (extensão curta)
        if (distToWi < 1.0 && distToWj < 1.0) {
          const dxi = wi.x2 - wi.x1;
          const dyi = wi.y2 - wi.y1;
          const li = Math.hypot(dxi, dyi);
          const ti = li > 1e-10 ? ((linePt.x - wi.x1) * dxi + (linePt.y - wi.y1) * dyi) / (li * li) : 0;

          const dxj = wj.x2 - wj.x1;
          const dyj = wj.y2 - wj.y1;
          const lj = Math.hypot(dxj, dyj);
          const tj = lj > 1e-10 ? ((linePt.x - wj.x1) * dxj + (linePt.y - wj.y1) * dyj) / (lj * lj) : 0;

          segNodes[i].push({ x: linePt.x, y: linePt.y, t: ti });
          segNodes[j].push({ x: linePt.x, y: linePt.y, t: tj });
        }
      }
    }
  }

  // Ordenar nós por parâmetro t e deduplicar
  const ptKey = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;

  for (let i = 0; i < N; i++) {
    segNodes[i].sort((a, b) => a.t - b.t);
    // Deduplicar
    const deduped: SegNode[] = [];
    for (const n of segNodes[i]) {
      if (deduped.length === 0 || ptKey(n.x, n.y) !== ptKey(deduped[deduped.length - 1].x, deduped[deduped.length - 1].y)) {
        deduped.push(n);
      }
    }
    segNodes[i] = deduped;
  }

  // 2. Construir grafo de arestas (DCEL simplificado)
  // Cada aresta direcionada: de um nó para o seguinte ao longo de um segmento
  interface HalfEdge {
    from: string;  // ptKey
    to: string;    // ptKey
    fromPt: Point2D;
    toPt: Point2D;
    angle: number; // ângulo de saída a partir de 'from'
    segIdx: number;
  }

  const halfEdges: HalfEdge[] = [];
  const adjacency = new Map<string, HalfEdge[]>(); // de cada nó, arestas de saída

  for (let i = 0; i < N; i++) {
    const nodes = segNodes[i];
    for (let k = 0; k < nodes.length - 1; k++) {
      const a = nodes[k];
      const b = nodes[k + 1];
      const ka = ptKey(a.x, a.y);
      const kb = ptKey(b.x, b.y);
      if (ka === kb) continue;

      const angleAB = Math.atan2(b.y - a.y, b.x - a.x);
      const angleBA = Math.atan2(a.y - b.y, a.x - b.x);

      const edgeAB: HalfEdge = { from: ka, to: kb, fromPt: { x: a.x, y: a.y }, toPt: { x: b.x, y: b.y }, angle: angleAB, segIdx: i };
      const edgeBA: HalfEdge = { from: kb, to: ka, fromPt: { x: b.x, y: b.y }, toPt: { x: a.x, y: a.y }, angle: angleBA, segIdx: i };

      halfEdges.push(edgeAB, edgeBA);

      if (!adjacency.has(ka)) adjacency.set(ka, []);
      adjacency.get(ka)!.push(edgeAB);

      if (!adjacency.has(kb)) adjacency.set(kb, []);
      adjacency.get(kb)!.push(edgeBA);
    }
  }

  if (halfEdges.length === 0) {
    return { points: [], centroid: { x: seedX, y: seedY }, error: 'unclosed' };
  }

  // Ordenar arestas de saída de cada nó pelo ângulo
  adjacency.forEach(edges => {
    edges.sort((a, b) => a.angle - b.angle);
  });

  // 3. Encontrar todos os polígonos mínimos (faces) percorrendo a fronteira
  //    Para cada half-edge, seguir sempre a "próxima aresta mais à direita" (sentido horário mínimo)
  const usedEdges = new Set<string>();
  const edgeId = (e: HalfEdge) => `${e.from}->${e.to}`;

  function findNextEdge(currentEdge: HalfEdge): HalfEdge | null {
    const arrivedFrom = currentEdge.to;
    const outEdges = adjacency.get(arrivedFrom);
    if (!outEdges || outEdges.length === 0) return null;

    // Direção de chegada (oposta à aresta percorrida)
    const arrivalAngle = Math.atan2(
      currentEdge.fromPt.y - currentEdge.toPt.y,
      currentEdge.fromPt.x - currentEdge.toPt.x,
    );

    // Encontrar a próxima aresta no sentido horário (menor ângulo positivo)
    let bestEdge: HalfEdge | null = null;
    let bestDelta = Infinity;

    for (const e of outEdges) {
      if (e.to === currentEdge.from && e.segIdx === currentEdge.segIdx) continue; // evitar voltar pelo mesmo segmento
      let delta = e.angle - arrivalAngle;
      // Normalizar para (0, 2π]
      while (delta <= 1e-9) delta += Math.PI * 2;
      while (delta > Math.PI * 2 + 1e-9) delta -= Math.PI * 2;
      if (delta < bestDelta) {
        bestDelta = delta;
        bestEdge = e;
      }
    }
    return bestEdge;
  }

  const allFaces: Point2D[][] = [];

  for (const startEdge of halfEdges) {
    const startId = edgeId(startEdge);
    if (usedEdges.has(startId)) continue;

    const facePoints: Point2D[] = [];
    const faceEdgeIds: string[] = [];
    let current: HalfEdge | null = startEdge;
    let steps = 0;
    const maxSteps = halfEdges.length;

    while (current && steps < maxSteps) {
      const eid = edgeId(current);
      if (faceEdgeIds.includes(eid) && eid === startId) break; // fechou o ciclo
      if (faceEdgeIds.includes(eid)) break; // loop inesperado

      facePoints.push(current.fromPt);
      faceEdgeIds.push(eid);
      current = findNextEdge(current);
      steps++;
    }

    if (facePoints.length >= 3) {
      // Marcar arestas como usadas
      faceEdgeIds.forEach(eid => usedEdges.add(eid));

      // Verificar se é face interna (sentido horário = área negativa)
      const area = signedArea(facePoints);
      // Aceitar faces com área negativa (horário no sistema de coordenadas y-crescente)
      // ou positiva, depende do sistema — coletar todas
      if (Math.abs(area) > 0.01) {
        allFaces.push(facePoints);
      }
    }
  }

  // 4. Encontrar a face que contém o ponto clicado
  let bestFace: Point2D[] | null = null;
  let bestArea = Infinity;

  for (const face of allFaces) {
    if (pointInPolygon(seedX, seedY, face)) {
      const area = Math.abs(signedArea(face));
      // Escolher a face com menor área que contém o ponto (mais interna)
      if (area < bestArea) {
        bestArea = area;
        bestFace = face;
      }
    }
  }

  if (!bestFace) {
    return { points: [], centroid: { x: seedX, y: seedY }, error: 'unclosed' };
  }

  // Arredondar e simplificar
  const rounded = bestFace.map(p => ({
    x: Number(p.x.toFixed(2)),
    y: Number(p.y.toFixed(2)),
  }));

  // Remover vértices colineares
  const simplified = simplifyPolygonVertices(rounded);
  if (simplified.length < 3) {
    return { points: [], centroid: { x: seedX, y: seedY }, error: 'unclosed' };
  }

  const centroid = polygonCentroid(simplified);
  return { points: simplified, centroid };
}

// ─────────────────────────────────────────────────────────────────────────────
// detectZoneFromFloors — Detecção por pisos contíguos de MESMO tipo e cor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detecta polígono a partir de ladrilhos de pisos contíguos com mesmo textureId e cor.
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

  // Identificador do tipo de piso (textureId + color + customTextureUrl)
  const floorTypeKey = (f: FloorTile) =>
    `${f.textureId}|${f.color ?? ''}|${f.customTextureUrl ?? ''}`;
  const seedType = floorTypeKey(seedFloor);

  // BFS para encontrar todos os pisos contíguos de MESMO tipo
  const visited = new Set<string>();
  const queue = [seedKey];
  visited.add(seedKey);

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
      if (!visited.has(nKey) && floors[nKey] && floorTypeKey(floors[nKey]) === seedType) {
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

  const centroid = polygonCentroid(simplified);
  return { points: simplified, centroid };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários de Perímetro
// ─────────────────────────────────────────────────────────────────────────────

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
