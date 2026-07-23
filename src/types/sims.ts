export type AppMode = 'settings' | 'build' | 'buy' | 'export';

export type ViewMode3D = '2d' | '3d';

export type TerrainTheme = 'grass' | 'blueprint' | 'dark' | 'concrete';

export type BuildTool = 'select' | 'wall' | 'floor' | 'door_window' | 'wall_paint' | 'eraser';

export type WallViewMode = 'full' | 'half' | 'low';

export type FloorTextureId = 'grass' | 'wood' | 'marble' | 'tile' | 'dirt' | 'slate' | 'custom';

export type FurnitureCategory = 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'outdoor' | 'decor' | 'custom';

export interface CustomTextureItem {
  id: string;
  name: string;
  url: string; // DataURL ou URL pública da imagem
}

export interface TerrainConfig {
  width: number;       // Largura em metros (ex: 15)
  length: number;      // Comprimento em metros (ex: 30)
  cellSizePixels: number; // Pixels por metro na escala 1.0 (padrão: 40px/m)
  theme: TerrainTheme;
  customColor?: string;
  customSecondaryColor?: string;
  customTextureUrl?: string;
}

export interface ViewState {
  zoom: number;     // Escala atual (ex: 0.25 a 3.5)
  panX: number;     // Offset X em pixels
  panY: number;     // Offset Y em pixels
  rotation: number; // Rotação da câmera em graus (0, 90, 180, 270...)
}

export interface GridSettings {
  showGrid: boolean;      // Linhas do grid 1m x 1m
  showSubgrid: boolean;   // Subgrid 0.5m x 0.5m
  showMeters: boolean;    // Rótulos numéricos métricos
  snapToGrid: boolean;    // Snap para 1m ou 0.5m
}

export interface CursorPosition {
  x: number | null;     // Posição contínua em metros
  y: number | null;
  gridX: number | null; // Quadrante X (0 até width-1)
  gridY: number | null; // Quadrante Y (0 até length-1)
  snapVertexX: number | null; // Vértice X imantado (0, 1, 2...)
  snapVertexY: number | null; // Vértice Y imantado (0, 1, 2...)
  isInsideTerrain: boolean;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  x1: number; // Vértice inicial em metros
  y1: number;
  x2: number; // Vértice final em metros
  y2: number;
  thickness?: number; // Padrão: 0.2m
  color?: string;       // Fallback
  textureUrl?: string;  // Fallback
  colorSideA?: string;      // Cor da Face A (Interno / Frente)
  textureUrlSideA?: string; // Textura da Face A
  colorSideB?: string;      // Cor da Face B (Externo / Verso)
  textureUrlSideB?: string; // Textura da Face B
}

export interface FloorTile {
  id: string;
  x: number; // Quadrante X (0 até width-1)
  y: number; // Quadrante Y (0 até length-1)
  textureId: FloorTextureId;
  color?: string;
  customTextureUrl?: string;
}

export interface DoorWindow {
  id: string;
  type: 'door' | 'window';
  catalogId: string;
  name: string;
  wallId: string;
  offsetRatio: number; // Posição relativa ao longo da parede (0.0 a 1.0)
  width: number;       // Largura da esquadria em metros (ex: 1.0m, 2.0m)
  height?: number;     // Altura da esquadria em metros
  flipSide?: boolean;  // Inverte o lado de abertura (dentro/fora)
  flipSwing?: boolean; // Inverte o giro da dobradiça (esquerda/direita)
  frameColor?: string; // Cor personalizada da moldura
}

export interface FurnitureCatalogItem {
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  width: number;  // em metros
  depth: number;  // em metros (comprimento no chão)
  height: number; // em metros
  color: string;
  textureUrl?: string;
  primitiveShape?: 'box' | 'cylinder';
  isCustom?: boolean;
}

export interface FurnitureItem {
  id: string;
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  width: number;
  depth: number;
  height: number;
  x: number; // posição X central em metros
  y: number; // posição Y central em metros
  rotation: number; // 0, 90, 180, 270 graus
  color: string;
  textureUrl?: string;
  primitiveShape?: 'box' | 'cylinder';
}
