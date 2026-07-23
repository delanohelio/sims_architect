import { create } from 'zustand';
import type {
  AppMode,
  ViewMode3D,
  TerrainTheme,
  BuildTool,
  WallViewMode,
  FloorTextureId,
  TerrainConfig,
  ViewState,
  GridSettings,
  CursorPosition,
  Wall,
  FloorTile,
  DoorWindow,
  FurnitureItem,
  FurnitureCatalogItem,
  FurnitureCategory,
  CustomTextureItem,
} from '../types/sims';

export const PRESET_LOTS = [
  { name: 'Lote Padrão Sims', width: 15, length: 30, description: '15m x 30m (450m²)' },
  { name: 'Lote Urbano / Estreito', width: 10, length: 20, description: '10m x 20m (200m²)' },
  { name: 'Quadrado / Chalé', width: 20, length: 20, description: '20m x 20m (400m²)' },
  { name: 'Mansão / Lote Grande', width: 25, length: 40, description: '25m x 40m (1000m²)' },
];

export const CATALOG_FURNITURE: FurnitureCatalogItem[] = [
  // QUARTO
  { catalogId: 'bed_double', name: 'Cama de Casal King', category: 'bedroom', width: 2.0, depth: 2.0, height: 0.5, color: '#3B82F6', primitiveShape: 'box' },
  { catalogId: 'bed_single', name: 'Cama Solteiro', category: 'bedroom', width: 1.0, depth: 2.0, height: 0.5, color: '#60A5FA', primitiveShape: 'box' },
  { catalogId: 'wardrobe', name: 'Guarda-Roupa 3 Portas', category: 'bedroom', width: 1.8, depth: 0.6, height: 2.1, color: '#475569', primitiveShape: 'box' },
  { catalogId: 'nightstand', name: 'Criado-Mudo', category: 'bedroom', width: 0.5, depth: 0.4, height: 0.5, color: '#64748B', primitiveShape: 'box' },

  // SALA
  { catalogId: 'sofa_3seater', name: 'Sofá 3 Lugares Premium', category: 'living', width: 2.5, depth: 1.0, height: 0.8, color: '#8B5CF6', primitiveShape: 'box' },
  { catalogId: 'armchair', name: 'Poltrona de Leitura', category: 'living', width: 1.0, depth: 0.9, height: 0.8, color: '#A855F7', primitiveShape: 'box' },
  { catalogId: 'coffee_table', name: 'Mesa de Centro', category: 'living', width: 1.2, depth: 0.6, height: 0.4, color: '#D97706', primitiveShape: 'box' },
  { catalogId: 'tv_unit', name: 'Rack com TV 65"', category: 'living', width: 2.0, depth: 0.5, height: 1.2, color: '#1E293B', primitiveShape: 'box' },

  // COZINHA
  { catalogId: 'fridge_side', name: 'Geladeira Inox Double Door', category: 'kitchen', width: 0.8, depth: 0.8, height: 1.9, color: '#94A3B8', primitiveShape: 'box' },
  { catalogId: 'dining_table', name: 'Mesa de Jantar 6 Lugares', category: 'kitchen', width: 2.0, depth: 1.0, height: 0.8, color: '#B45309', primitiveShape: 'box' },
  { catalogId: 'chair', name: 'Cadeira de Jantar', category: 'kitchen', width: 0.5, depth: 0.5, height: 0.9, color: '#D97706', primitiveShape: 'box' },
  { catalogId: 'kitchen_counter', name: 'Balcão de Cozinha com Pia', category: 'kitchen', width: 1.5, depth: 0.6, height: 0.9, color: '#0284C7', primitiveShape: 'box' },

  // BANHEIRO
  { catalogId: 'toilet', name: 'Vaso Sanitário', category: 'bathroom', width: 0.5, depth: 0.7, height: 0.8, color: '#F8FAFC', primitiveShape: 'box' },
  { catalogId: 'vanity_sink', name: 'Pia com Gabinete', category: 'bathroom', width: 0.8, depth: 0.5, height: 0.85, color: '#0EA5E9', primitiveShape: 'box' },
  { catalogId: 'shower_box', name: 'Box com Chuveiro', category: 'bathroom', width: 1.0, depth: 1.0, height: 2.1, color: '#38BDF8', primitiveShape: 'box' },

  // DECORAÇÃO / EXTERIOR
  { catalogId: 'potted_plant', name: 'Planta de Vasado / Árvore', category: 'outdoor', width: 1.0, depth: 1.0, height: 1.5, color: '#15803D', primitiveShape: 'cylinder' },
  { catalogId: 'floor_lamp', name: 'Luminária de Chão', category: 'outdoor', width: 0.4, depth: 0.4, height: 1.6, color: '#F59E0B', primitiveShape: 'cylinder' },
];

export interface PendingFurniturePlacement {
  catalogItem: FurnitureCatalogItem;
  rotation: number; // 0, 90, 180, 270
  movingItemId?: string;
}

export interface DoorWindowCatalogItem {
  catalogId: string;
  name: string;
  type: 'door' | 'window';
  width: number;
  height?: number;
  isCustom?: boolean;
}

export interface PendingDoorPlacement {
  step: 'hinge' | 'swing';
  wallId: string;
  offsetRatio: number;
  catalogId: string;
  name: string;
  type: 'door' | 'window';
  width: number;
  height?: number;
  frameColor?: string;
  flipSwing: boolean;
  flipSide: boolean;
}

export const CATALOG_DOORS_WINDOWS: DoorWindowCatalogItem[] = [
  { catalogId: 'door_single', name: 'Porta Simples Padrão', type: 'door', width: 0.9, height: 2.1 },
  { catalogId: 'door_double', name: 'Porta Dupla Social', type: 'door', width: 1.6, height: 2.1 },
  { catalogId: 'window_standard', name: 'Janela Padrão 2 Folhas', type: 'window', width: 1.2, height: 1.2 },
  { catalogId: 'window_large', name: 'Janela Panorâmica', type: 'window', width: 2.2, height: 1.4 },
  { catalogId: 'custom_opening', name: 'Esquadria Genérica Customizada', type: 'door', width: 1.0, height: 2.1, isCustom: true },
];

interface SimsState {
  activeMode: AppMode;
  viewMode: ViewMode3D;
  terrain: TerrainConfig;
  viewState: ViewState;
  gridSettings: GridSettings;
  cursorPos: CursorPosition;
  activeBuildTool: BuildTool;
  wallViewMode: WallViewMode;
  isSetupModalOpen: boolean;
  
  customTextures: CustomTextureItem[];

  selectedWallColor: string;
  selectedWallTexture?: string;

  selectedFloorTexture: FloorTextureId;
  selectedFloorColor?: string;
  selectedFloorCustomTexture?: string;

  selectedDoorWindow: DoorWindowCatalogItem;
  customDoorWidth: number;
  customDoorHeight: number;
  customDoorFrameColor: string;
  pendingDoor: PendingDoorPlacement | null;

  // FASE 3: MODO COMPRA
  selectedBuyCategory: FurnitureCategory;
  pendingFurnitureItem: PendingFurniturePlacement | null;
  customFurnitureName: string;
  customFurnitureWidth: number;
  customFurnitureDepth: number;
  customFurnitureHeight: number;
  customFurnitureColor: string;
  customFurnitureTextureUrl?: string;
  customFurnitureCategory: FurnitureCategory;
  customFurnitureShape: 'box' | 'cylinder';

  walls: Wall[];
  floors: Record<string, FloorTile>;
  doorsWindows: DoorWindow[];
  items: FurnitureItem[];

  setMode: (mode: AppMode) => void;
  setViewMode: (viewMode: ViewMode3D) => void;
  setWallViewMode: (mode: WallViewMode) => void;
  setActiveBuildTool: (tool: BuildTool) => void;
  setSetupModalOpen: (open: boolean) => void;
  
  addCustomTexture: (name: string, url: string) => void;
  removeCustomTexture: (id: string) => void;

  setSelectedWallColor: (color: string) => void;
  setSelectedWallTexture: (url?: string) => void;

  setSelectedFloorTexture: (textureId: FloorTextureId, color?: string, customUrl?: string) => void;
  setSelectedFloorColor: (color?: string) => void;
  setSelectedFloorCustomTexture: (url?: string) => void;

  setSelectedDoorWindow: (item: DoorWindowCatalogItem) => void;
  setCustomDoorWidth: (width: number) => void;
  setCustomDoorHeight: (height: number) => void;
  setCustomDoorFrameColor: (color: string) => void;
  setPendingDoor: (pending: PendingDoorPlacement | null) => void;
  cancelPendingDoor: () => void;
  toggleDoorFlip: (dwId?: string) => void;

  // FASE 3: MODO COMPRA ACTIONS
  setSelectedBuyCategory: (category: FurnitureCategory) => void;
  setPendingFurnitureItem: (pending: PendingFurniturePlacement | null) => void;
  rotatePendingFurnitureItem: () => void;
  cancelPendingFurnitureItem: () => void;
  setCustomFurnitureName: (name: string) => void;
  setCustomFurnitureWidth: (width: number) => void;
  setCustomFurnitureDepth: (depth: number) => void;
  setCustomFurnitureHeight: (height: number) => void;
  setCustomFurnitureColor: (color: string) => void;
  setCustomFurnitureTextureUrl: (url?: string) => void;
  setCustomFurnitureCategory: (category: FurnitureCategory) => void;
  setCustomFurnitureShape: (shape: 'box' | 'cylinder') => void;

  setTerrainSize: (width: number | any, length?: any) => void;
  setTerrainTheme: (theme: TerrainTheme) => void;
  setTerrainCustomAppearance: (color?: string, textureUrl?: string) => void;
  setCustomTerrain: (color?: string, textureUrl?: string) => void;
  
  setZoom: (newZoom: number, focalX?: number, focalY?: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  rotate: (angleDelta: number) => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  resetRotation: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  centerView: () => void;
  centerTerrainInViewport: (...args: any[]) => void;

  setGridSettings: (settings: Partial<GridSettings>) => void;
  toggleGrid: () => void;
  toggleSubgrid: () => void;
  toggleMeters: () => void;
  toggleSnapToGrid: () => void;
  setCursorPos: (pos: CursorPosition) => void;

  addWall: (wall: Omit<Wall, 'id'>) => void;
  paintWall: (wallId: string, color?: string, textureUrl?: string, side?: 'sideA' | 'sideB') => void;
  removeWall: (id: string) => void;
  clearWalls: () => void;

  paintFloorRect: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    textureId: FloorTextureId,
    color?: string,
    customTextureUrl?: string
  ) => void;
  eraseFloorRect: (x1: number, y1: number, x2: number, y2: number) => void;
  removeFloorTile: (x: number, y: number) => void;
  clearFloors: () => void;

  addDoorWindow: (dw: Omit<DoorWindow, 'id'>) => void;
  removeDoorWindow: (id: string) => void;

  addItem: (item: Omit<FurnitureItem, 'id'>) => void;
  updateItemPosition: (id: string, x: number, y: number, rotation: number) => void;
  removeItem: (id: string) => void;

  exportJSON: () => string;
  importJSON: (jsonString: string) => boolean;
}

const DEFAULT_TERRAIN: TerrainConfig = {
  width: 15,
  length: 30,
  cellSizePixels: 40,
  theme: 'grass',
};

const DEFAULT_VIEWSTATE: ViewState = {
  zoom: 1.0,
  panX: 200,
  panY: 80,
  rotation: 0,
};

const DEFAULT_GRIDSETTINGS: GridSettings = {
  showGrid: true,
  showSubgrid: true,
  showMeters: true,
  snapToGrid: true,
};

export const useSimsStore = create<SimsState>((set, get) => ({
  activeMode: 'settings',
  viewMode: '2d',
  terrain: DEFAULT_TERRAIN,
  viewState: DEFAULT_VIEWSTATE,
  gridSettings: DEFAULT_GRIDSETTINGS,
  cursorPos: {
    x: null,
    y: null,
    gridX: null,
    gridY: null,
    snapVertexX: null,
    snapVertexY: null,
    isInsideTerrain: false,
  },
  activeBuildTool: 'wall',
  wallViewMode: 'full',
  isSetupModalOpen: false,

  customTextures: [
    { id: 'tex_wood_warm', name: 'Madeira Nobre', url: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=400&q=80' },
    { id: 'tex_brick_red', name: 'Tijolo Aparente', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80' },
    { id: 'tex_marble_white', name: 'Mármore Carrara', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80' },
    { id: 'tex_tile_blue', name: 'Azulejo Hidráulico', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80' },
  ],

  selectedWallColor: '#E2E8F0',
  selectedWallTexture: undefined,

  selectedFloorTexture: 'wood',
  selectedFloorColor: '#78350F',
  selectedFloorCustomTexture: undefined,

  selectedDoorWindow: CATALOG_DOORS_WINDOWS[0],
  customDoorWidth: 1.0,
  customDoorHeight: 2.1,
  customDoorFrameColor: '#F59E0B',
  pendingDoor: null,

  // FASE 3 MODO COMPRA DEFAULT STATE
  selectedBuyCategory: 'bedroom',
  pendingFurnitureItem: null,
  customFurnitureName: 'Móvel Genérico Custom',
  customFurnitureWidth: 1.5,
  customFurnitureDepth: 0.8,
  customFurnitureHeight: 0.9,
  customFurnitureColor: '#3B82F6',
  customFurnitureTextureUrl: undefined,
  customFurnitureCategory: 'living',
  customFurnitureShape: 'box',

  walls: [],
  floors: {},
  doorsWindows: [],
  items: [],

  setMode: (mode) => {
    get().cancelPendingDoor();
    get().cancelPendingFurnitureItem();
    set({ activeMode: mode });
  },

  setViewMode: (viewMode) => {
    get().cancelPendingDoor();
    get().cancelPendingFurnitureItem();
    if (viewMode === '2d') {
      get().resetRotation();
      get().centerView();
    }
    set({ viewMode });
  },

  setWallViewMode: (wallViewMode) => set({ wallViewMode }),

  setActiveBuildTool: (tool) => {
    get().cancelPendingDoor();
    get().cancelPendingFurnitureItem();
    set({ activeBuildTool: tool });
  },

  setSetupModalOpen: (open) => set({ isSetupModalOpen: open }),

  addCustomTexture: (name, url) => {
    const newTex: CustomTextureItem = {
      id: `tex_${Date.now()}`,
      name: name.trim() || 'Textura Customizada',
      url,
    };
    set((state) => ({ customTextures: [...state.customTextures, newTex] }));
  },

  removeCustomTexture: (id) => {
    const targetTex = get().customTextures.find((t) => t.id === id);
    if (!targetTex) return;

    set((state) => {
      const updatedTextures = state.customTextures.filter((t) => t.id !== id);

      const updatedWalls = state.walls.map((w) => {
        let sideAUrl = w.textureUrlSideA;
        let sideBUrl = w.textureUrlSideB;
        let sideAColor = w.colorSideA;
        let sideBColor = w.colorSideB;

        if (sideAUrl === targetTex.url) {
          sideAUrl = undefined;
          if (!sideAColor) sideAColor = '#E2E8F0';
        }
        if (sideBUrl === targetTex.url) {
          sideBUrl = undefined;
          if (!sideBColor) sideBColor = '#CBD5E1';
        }

        return { ...w, textureUrlSideA: sideAUrl, textureUrlSideB: sideBUrl, colorSideA: sideAColor, colorSideB: sideBColor };
      });

      const updatedFloors: Record<string, FloorTile> = {};
      Object.entries(state.floors).forEach(([key, tile]) => {
        if (tile.customTextureUrl === targetTex.url) {
          updatedFloors[key] = { ...tile, customTextureUrl: undefined, color: tile.color || '#78350F' };
        } else {
          updatedFloors[key] = tile;
        }
      });

      let updatedTerrainUrl = state.terrain.customTextureUrl;
      if (updatedTerrainUrl === targetTex.url) {
        updatedTerrainUrl = undefined;
      }

      let selWallTex = state.selectedWallTexture;
      if (selWallTex === targetTex.url) selWallTex = undefined;

      let selFloorCustom = state.selectedFloorCustomTexture;
      if (selFloorCustom === targetTex.url) selFloorCustom = undefined;

      return {
        customTextures: updatedTextures,
        walls: updatedWalls,
        floors: updatedFloors,
        terrain: { ...state.terrain, customTextureUrl: updatedTerrainUrl },
        selectedWallTexture: selWallTex,
        selectedFloorCustomTexture: selFloorCustom,
      };
    });
  },

  setSelectedWallColor: (color) => set({ selectedWallColor: color }),
  setSelectedWallTexture: (url) => set({ selectedWallTexture: url }),

  setSelectedFloorTexture: (textureId, color, customUrl) =>
    set({
      selectedFloorTexture: textureId,
      selectedFloorColor: color,
      selectedFloorCustomTexture: customUrl,
    }),

  setSelectedFloorColor: (color) => set({ selectedFloorColor: color }),
  setSelectedFloorCustomTexture: (url) => set({ selectedFloorCustomTexture: url }),

  setSelectedDoorWindow: (item) => {
    get().cancelPendingDoor();
    set({ selectedDoorWindow: item });
  },

  setCustomDoorWidth: (width) => set({ customDoorWidth: width }),
  setCustomDoorHeight: (height) => set({ customDoorHeight: height }),
  setCustomDoorFrameColor: (color) => set({ customDoorFrameColor: color }),
  setPendingDoor: (pending) => set({ pendingDoor: pending }),
  cancelPendingDoor: () => set({ pendingDoor: null }),
  toggleDoorFlip: () => {},

  // FASE 3 MODO COMPRA ACTIONS
  setSelectedBuyCategory: (category) => set({ selectedBuyCategory: category }),

  setPendingFurnitureItem: (pending) => set({ pendingFurnitureItem: pending }),

  rotatePendingFurnitureItem: () => {
    const pending = get().pendingFurnitureItem;
    if (!pending) return;
    const nextRot = (pending.rotation + 90) % 360;
    set({ pendingFurnitureItem: { ...pending, rotation: nextRot } });
  },

  cancelPendingFurnitureItem: () => set({ pendingFurnitureItem: null }),

  setCustomFurnitureName: (name) => set({ customFurnitureName: name }),
  setCustomFurnitureWidth: (width) => set({ customFurnitureWidth: width }),
  setCustomFurnitureDepth: (depth) => set({ customFurnitureDepth: depth }),
  setCustomFurnitureHeight: (height) => set({ customFurnitureHeight: height }),
  setCustomFurnitureColor: (color) => set({ customFurnitureColor: color }),
  setCustomFurnitureTextureUrl: (url) => set({ customFurnitureTextureUrl: url }),
  setCustomFurnitureCategory: (category) => set({ customFurnitureCategory: category }),
  setCustomFurnitureShape: (shape) => set({ customFurnitureShape: shape }),

  setTerrainSize: (arg1, arg2) => {
    if (typeof arg1 === 'object' && arg1 !== null) {
      set((state) => ({
        terrain: { ...state.terrain, width: arg1.width, length: arg1.length },
      }));
    } else {
      const finalLength = arg2 !== undefined ? arg2 : get().terrain.length;
      set((state) => ({
        terrain: { ...state.terrain, width: Number(arg1), length: Number(finalLength) },
      }));
    }
    get().centerView();
  },

  setTerrainTheme: (theme) =>
    set((state) => ({
      terrain: { ...state.terrain, theme },
    })),

  setTerrainCustomAppearance: (color, textureUrl) =>
    set((state) => ({
      terrain: { ...state.terrain, customColor: color, customTextureUrl: textureUrl },
    })),

  setCustomTerrain: (color, textureUrl) => get().setTerrainCustomAppearance(color, textureUrl),

  setZoom: (newZoom, focalX, focalY) => {
    const clampedZoom = Math.max(0.25, Math.min(3.5, newZoom));
    const state = get();

    if (focalX !== undefined && focalY !== undefined) {
      const zoomRatio = clampedZoom / state.viewState.zoom;
      const newPanX = focalX - (focalX - state.viewState.panX) * zoomRatio;
      const newPanY = focalY - (focalY - state.viewState.panY) * zoomRatio;

      set({
        viewState: {
          ...state.viewState,
          zoom: Number(clampedZoom.toFixed(2)),
          panX: Math.round(newPanX),
          panY: Math.round(newPanY),
        },
      });
    } else {
      set({
        viewState: { ...state.viewState, zoom: Number(clampedZoom.toFixed(2)) },
      });
    }
  },

  pan: (deltaX, deltaY) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        panX: state.viewState.panX + deltaX,
        panY: state.viewState.panY + deltaY,
      },
    })),

  rotate: (angleDelta) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        rotation: (state.viewState.rotation + angleDelta + 360) % 360,
      },
    })),

  rotateClockwise: () => get().rotate(90),
  rotateCounterClockwise: () => get().rotate(-90),

  resetRotation: () =>
    set((state) => ({
      viewState: { ...state.viewState, rotation: 0 },
    })),

  zoomIn: () => get().setZoom(get().viewState.zoom + 0.15),
  zoomOut: () => get().setZoom(get().viewState.zoom - 0.15),
  resetZoom: () => get().setZoom(1.0),

  centerView: () => {
    const { terrain } = get();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const terrainWidthPx = terrain.width * terrain.cellSizePixels;
    const terrainLengthPx = terrain.length * terrain.cellSizePixels;

    const panX = Math.round((viewportWidth - terrainWidthPx) / 2);
    const panY = Math.round((viewportHeight - terrainLengthPx) / 2);

    set((state) => ({
      viewState: { ...state.viewState, panX, panY, zoom: 1.0, rotation: 0 },
    }));
  },

  centerTerrainInViewport: () => get().centerView(),

  setGridSettings: (settings) =>
    set((state) => ({
      gridSettings: { ...state.gridSettings, ...settings },
    })),

  toggleGrid: () => get().setGridSettings({ showGrid: !get().gridSettings.showGrid }),
  toggleSubgrid: () => get().setGridSettings({ showSubgrid: !get().gridSettings.showSubgrid }),
  toggleMeters: () => get().setGridSettings({ showMeters: !get().gridSettings.showMeters }),
  toggleSnapToGrid: () => get().setGridSettings({ snapToGrid: !get().gridSettings.snapToGrid }),

  setCursorPos: (pos) => set({ cursorPos: pos }),

  addWall: (newWallData) =>
    set((state) => {
      const newWall: Wall = {
        id: `wall_${Date.now()}`,
        thickness: 0.2,
        ...newWallData,
      };
      return { walls: [...state.walls, newWall] };
    }),

  paintWall: (wallId, color, textureUrl, side) =>
    set((state) => {
      const updatedWalls = state.walls.map((w) => {
        if (w.id !== wallId) return w;
        if (!side) {
          return { ...w, colorSideA: color, textureUrlSideA: textureUrl, colorSideB: color, textureUrlSideB: textureUrl };
        }
        if (side === 'sideA') {
          return { ...w, colorSideA: color, textureUrlSideA: textureUrl };
        } else {
          return { ...w, colorSideB: color, textureUrlSideB: textureUrl };
        }
      });
      return { walls: updatedWalls };
    }),

  removeWall: (id) =>
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== id),
      doorsWindows: state.doorsWindows.filter((dw) => dw.wallId !== id),
    })),

  clearWalls: () => set({ walls: [] }),

  paintFloorRect: (x1, y1, x2, y2, textureId, color, customTextureUrl) =>
    set((state) => {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      const newFloors = { ...state.floors };
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${x},${y}`;
          newFloors[key] = {
            id: `floor_${key}`,
            x,
            y,
            textureId,
            color,
            customTextureUrl,
          };
        }
      }
      return { floors: newFloors };
    }),

  eraseFloorRect: (x1, y1, x2, y2) =>
    set((state) => {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      const newFloors = { ...state.floors };
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          delete newFloors[`${x},${y}`];
        }
      }
      return { floors: newFloors };
    }),

  removeFloorTile: (x, y) =>
    set((state) => {
      const newFloors = { ...state.floors };
      delete newFloors[`${x},${y}`];
      return { floors: newFloors };
    }),

  clearFloors: () => set({ floors: {} }),

  addDoorWindow: (dwData) =>
    set((state) => {
      const newDW: DoorWindow = {
        id: `dw_${Date.now()}`,
        ...dwData,
      };
      return { doorsWindows: [...state.doorsWindows, newDW] };
    }),

  removeDoorWindow: (id) =>
    set((state) => ({
      doorsWindows: state.doorsWindows.filter((dw) => dw.id !== id),
    })),

  addItem: (itemData) =>
    set((state) => {
      const newItem: FurnitureItem = {
        id: `item_${Date.now()}`,
        ...itemData,
      };
      return { items: [...state.items, newItem] };
    }),

  updateItemPosition: (id, x, y, rotation) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === id ? { ...it, x, y, rotation } : it)),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((it) => it.id !== id),
    })),

  exportJSON: () => {
    const { terrain, walls, floors, doorsWindows, items, customTextures } = get();
    return JSON.stringify({ terrain, walls, floors, doorsWindows, items, customTextures }, null, 2);
  },

  importJSON: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.terrain && Array.isArray(data.walls) && data.floors) {
        set({
          terrain: data.terrain,
          walls: data.walls,
          floors: data.floors,
          doorsWindows: data.doorsWindows || [],
          items: data.items || [],
          customTextures: data.customTextures || [],
        });
        get().centerView();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
