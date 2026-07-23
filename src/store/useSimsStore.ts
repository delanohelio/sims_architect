import { create } from 'zustand';
import type { 
  AppMode, 
  ViewMode3D,
  TerrainConfig, 
  ViewState, 
  GridSettings, 
  CursorPosition,
  Wall,
  FloorTile,
  DoorWindow,
  FurnitureItem,
  TerrainTheme,
  BuildTool,
  WallViewMode,
  FloorTextureId,
  CustomTextureItem
} from '../types/sims';

interface CatalogEsquadria {
  type: 'door' | 'window';
  catalogId: string;
  name: string;
  width: number;
  height?: number;
  isCustom?: boolean;
}

export interface PendingDoorPlacement {
  step: 'position' | 'hinge' | 'swing';
  wallId: string;
  offsetRatio: number;
  catalogId: string;
  name: string;
  type: 'door' | 'window';
  width: number;
  height: number;
  frameColor?: string;
  flipSwing?: boolean;
  flipSide?: boolean;
}

interface SimsStore {
  // Terreno
  terrain: TerrainConfig;
  setTerrainSize: (width: number, length: number) => void;
  setTerrainTheme: (theme: TerrainTheme) => void;
  setCellSizePixels: (pixels: number) => void;
  setCustomTerrain: (color?: string, textureUrl?: string) => void;

  // Câmera & Viewport
  viewState: ViewState;
  viewMode: ViewMode3D;
  setViewMode: (mode: ViewMode3D) => void;

  setZoom: (zoom: number, focalX?: number, focalY?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  resetRotation: () => void;
  setRotation: (angle: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  setPan: (panX: number, panY: number) => void;
  centerTerrainInViewport: (viewportWidth: number, viewportHeight: number) => void;

  // Modos de Aplicação & Construção
  activeMode: AppMode;
  setMode: (mode: AppMode) => void;

  activeBuildTool: BuildTool;
  setActiveBuildTool: (tool: BuildTool) => void;

  wallViewMode: WallViewMode;
  setWallViewMode: (mode: WallViewMode) => void;

  // Biblioteca Global de Texturas Personalizadas
  customTextures: CustomTextureItem[];
  addCustomTexture: (name: string, url: string) => CustomTextureItem;
  removeCustomTexture: (id: string) => void;

  // Seleções de Tintas e Texturas
  selectedWallColor: string;
  setSelectedWallColor: (color: string) => void;
  selectedWallTexture?: string;
  setSelectedWallTexture: (url?: string) => void;

  selectedFloorTexture: FloorTextureId;
  setSelectedFloorTexture: (textureId: FloorTextureId) => void;
  selectedFloorColor?: string;
  setSelectedFloorColor: (color?: string) => void;
  selectedFloorCustomTexture?: string;
  setSelectedFloorCustomTexture: (url?: string) => void;

  selectedDoorWindow: CatalogEsquadria;
  setSelectedDoorWindow: (item: CatalogEsquadria) => void;

  // Esquadria Genérica Customizada
  customDoorWidth: number;
  setCustomDoorWidth: (width: number) => void;
  customDoorHeight: number;
  setCustomDoorHeight: (height: number) => void;
  customDoorFrameColor: string;
  setCustomDoorFrameColor: (color: string) => void;

  // Inserção em 3 Passos da Porta
  pendingDoor: PendingDoorPlacement | null;
  setPendingDoor: (pending: PendingDoorPlacement | null) => void;
  cancelPendingDoor: () => void;

  // Grid
  gridSettings: GridSettings;
  toggleGrid: () => void;
  toggleSubgrid: () => void;
  toggleMeters: () => void;
  toggleSnapToGrid: () => void;

  // Cursor
  cursorPos: CursorPosition;
  setCursorPos: (pos: CursorPosition) => void;

  // Coleções (Paredes, Pisos, Portas/Janelas)
  walls: Wall[];
  addWall: (wall: Omit<Wall, 'id'>) => void;
  paintWall: (wallId: string, color?: string, textureUrl?: string, side?: 'sideA' | 'sideB') => void;
  removeWall: (wallId: string) => void;
  clearWalls: () => void;

  floors: Record<string, FloorTile>;
  addFloorTile: (x: number, y: number, textureId: FloorTextureId, color?: string, customTextureUrl?: string) => void;
  removeFloorTile: (x: number, y: number) => void;
  paintFloorRect: (x1: number, y1: number, x2: number, y2: number, textureId: FloorTextureId, color?: string, customTextureUrl?: string) => void;
  eraseFloorRect: (x1: number, y1: number, x2: number, y2: number) => void;
  clearFloors: () => void;

  doorsWindows: DoorWindow[];
  addDoorWindow: (item: Omit<DoorWindow, 'id'>) => void;
  toggleDoorFlip: (id: string) => void;
  removeDoorWindow: (id: string) => void;

  // Objetos
  items: FurnitureItem[];
  addItem: (item: FurnitureItem) => void;

  // Setup Modal
  isSetupModalOpen: boolean;
  setSetupModalOpen: (open: boolean) => void;
}

export const PRESET_LOTS = [
  { name: 'Lote Padrão Sims', width: 15, length: 30, description: 'Excelente para casas familiares de 1 a 2 andares com quintal.' },
  { name: 'Lote Urbano / Estreito', width: 10, length: 20, description: 'Ideal para geminados, sobrados compactos e vilas.' },
  { name: 'Quadrado / Chalé', width: 20, length: 20, description: 'Formato simétrico versátil para plantas centrais.' },
  { name: 'Mansão / Lote Grande', width: 25, length: 40, description: 'Espaço abundante para jardins, piscinas e grandes construções.' },
];

export const CATALOG_DOORS_WINDOWS: CatalogEsquadria[] = [
  { type: 'door', catalogId: 'door_generic_custom', name: 'Porta Genérica Personalizada', width: 1.0, height: 2.1, isCustom: true },
  { type: 'window', catalogId: 'window_generic_custom', name: 'Janela Genérica Personalizada', width: 1.2, height: 1.2, isCustom: true },
  { type: 'door', catalogId: 'door_wood_simple', name: 'Porta Simples de Madeira', width: 1.0, height: 2.1 },
  { type: 'door', catalogId: 'door_glass_double', name: 'Porta Dupla de Vidro', width: 2.0, height: 2.1 },
  { type: 'door', catalogId: 'door_sliding_metal', name: 'Porta de Correr Metal', width: 1.5, height: 2.1 },
  { type: 'window', catalogId: 'window_standard', name: 'Janela Padrão 1m', width: 1.0, height: 1.2 },
  { type: 'window', catalogId: 'window_panoramic', name: 'Janela Panorâmica 2m', width: 2.0, height: 1.5 },
  { type: 'window', catalogId: 'window_small', name: 'Janela Basculante 0.8m', width: 0.8, height: 0.6 },
];

export const useSimsStore = create<SimsStore>((set, get) => ({
  terrain: {
    width: 15,
    length: 30,
    cellSizePixels: 40,
    theme: 'grass',
  },

  setTerrainSize: (width, length) => {
    const validWidth = Math.max(5, Math.min(100, Math.round(width)));
    const validLength = Math.max(5, Math.min(100, Math.round(length)));
    
    set((state) => ({
      terrain: {
        ...state.terrain,
        width: validWidth,
        length: validLength,
      },
    }));
  },

  setTerrainTheme: (theme) =>
    set((state) => ({
      terrain: { ...state.terrain, theme },
    })),

  setCellSizePixels: (pixels) =>
    set((state) => ({
      terrain: { ...state.terrain, cellSizePixels: Math.max(20, Math.min(80, pixels)) },
    })),

  setCustomTerrain: (color, textureUrl) =>
    set((state) => ({
      terrain: {
        ...state.terrain,
        customColor: color,
        customTextureUrl: textureUrl,
      },
    })),

  viewState: {
    zoom: 1.0,
    panX: 0,
    panY: 0,
    rotation: 0,
  },

  viewMode: '2d',
  setViewMode: (mode) => {
    set({ viewMode: mode });
    if (mode === '3d') {
      get().cancelPendingDoor();
    }
  },

  setZoom: (newZoom, focalX, focalY) => {
    const clampedZoom = Math.max(0.2, Math.min(3.5, Number(newZoom.toFixed(2))));
    const { viewState } = get();

    if (focalX !== undefined && focalY !== undefined) {
      const zoomFactor = clampedZoom / viewState.zoom;
      const newPanX = focalX - (focalX - viewState.panX) * zoomFactor;
      const newPanY = focalY - (focalY - viewState.panY) * zoomFactor;

      set({
        viewState: {
          ...viewState,
          zoom: clampedZoom,
          panX: newPanX,
          panY: newPanY,
        },
      });
    } else {
      set((state) => ({
        viewState: {
          ...state.viewState,
          zoom: clampedZoom,
        },
      }));
    }
  },

  zoomIn: () => {
    const { viewState } = get();
    get().setZoom(viewState.zoom + 0.15);
  },

  zoomOut: () => {
    const { viewState } = get();
    get().setZoom(viewState.zoom - 0.15);
  },

  resetZoom: () => {
    set((state) => ({
      viewState: {
        ...state.viewState,
        zoom: 1.0,
      },
    }));
  },

  rotateClockwise: () =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        rotation: (state.viewState.rotation + 90) % 360,
      },
    })),

  rotateCounterClockwise: () =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        rotation: (state.viewState.rotation - 90 + 360) % 360,
      },
    })),

  resetRotation: () =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        rotation: 0,
      },
    })),

  setRotation: (angle) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        rotation: (angle % 360 + 360) % 360,
      },
    })),

  pan: (deltaX, deltaY) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        panX: state.viewState.panX + deltaX,
        panY: state.viewState.panY + deltaY,
      },
    })),

  setPan: (panX, panY) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        panX,
        panY,
      },
    })),

  centerTerrainInViewport: (viewportWidth, viewportHeight) => {
    const { terrain, viewState } = get();
    const terrainPixelWidth = terrain.width * terrain.cellSizePixels * viewState.zoom;
    const terrainPixelHeight = terrain.length * terrain.cellSizePixels * viewState.zoom;

    const panX = (viewportWidth - terrainPixelWidth) / 2;
    const panY = (viewportHeight - terrainPixelHeight) / 2;

    set({
      viewState: {
        ...viewState,
        panX,
        panY,
      },
    });
  },

  activeMode: 'settings',
  setMode: (mode) => {
    set({ activeMode: mode });
    if (mode === 'build') {
      set({ activeBuildTool: 'wall' });
    } else {
      get().cancelPendingDoor();
    }
  },

  activeBuildTool: 'wall',
  setActiveBuildTool: (tool) => {
    set({ activeBuildTool: tool });
    get().cancelPendingDoor();
  },

  wallViewMode: 'full',
  setWallViewMode: (mode) => set({ wallViewMode: mode }),

  customTextures: [],
  
  addCustomTexture: (name, url) => {
    const newTex: CustomTextureItem = {
      id: `tex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      url,
    };
    set((state) => ({ customTextures: [...state.customTextures, newTex] }));
    return newTex;
  },

  removeCustomTexture: (id) => {
    const { customTextures, selectedWallTexture, selectedFloorCustomTexture, terrain } = get();
    const targetTex = customTextures.find((t) => t.id === id);
    if (!targetTex) return;

    const targetUrl = targetTex.url;

    set((state) => {
      const updatedWalls = state.walls.map((w) => ({
        ...w,
        textureUrlSideA: w.textureUrlSideA === targetUrl ? undefined : w.textureUrlSideA,
        colorSideA: w.textureUrlSideA === targetUrl ? (w.colorSideA || '#E2E8F0') : w.colorSideA,
        textureUrlSideB: w.textureUrlSideB === targetUrl ? undefined : w.textureUrlSideB,
        colorSideB: w.textureUrlSideB === targetUrl ? (w.colorSideB || '#E2E8F0') : w.colorSideB,
      }));

      const updatedFloors = { ...state.floors };
      Object.keys(updatedFloors).forEach((key) => {
        if (updatedFloors[key].customTextureUrl === targetUrl) {
          updatedFloors[key] = {
            ...updatedFloors[key],
            customTextureUrl: undefined,
            textureId: 'wood',
            color: updatedFloors[key].color || '#78350F',
          };
        }
      });

      const updatedTerrain =
        terrain.customTextureUrl === targetUrl
          ? { ...state.terrain, customTextureUrl: undefined, customColor: state.terrain.customColor || '#15803D' }
          : state.terrain;

      return {
        customTextures: state.customTextures.filter((t) => t.id !== id),
        walls: updatedWalls,
        floors: updatedFloors,
        terrain: updatedTerrain,
        selectedWallTexture: selectedWallTexture === targetUrl ? undefined : selectedWallTexture,
        selectedFloorCustomTexture: selectedFloorCustomTexture === targetUrl ? undefined : selectedFloorCustomTexture,
      };
    });
  },

  selectedWallColor: '#E2E8F0',
  setSelectedWallColor: (color) => set({ selectedWallColor: color }),
  selectedWallTexture: undefined,
  setSelectedWallTexture: (url) => set({ selectedWallTexture: url }),

  selectedFloorTexture: 'wood',
  setSelectedFloorTexture: (textureId) => set({ selectedFloorTexture: textureId }),
  selectedFloorColor: undefined,
  setSelectedFloorColor: (color) => set({ selectedFloorColor: color }),
  selectedFloorCustomTexture: undefined,
  setSelectedFloorCustomTexture: (url) => set({ selectedFloorCustomTexture: url }),

  selectedDoorWindow: CATALOG_DOORS_WINDOWS[0],
  setSelectedDoorWindow: (item) => set({ selectedDoorWindow: item }),

  customDoorWidth: 1.0,
  setCustomDoorWidth: (width) => set({ customDoorWidth: Math.max(0.5, Math.min(4.0, Number(width.toFixed(1)))) }),
  customDoorHeight: 2.1,
  setCustomDoorHeight: (height) => set({ customDoorHeight: Math.max(0.8, Math.min(3.5, Number(height.toFixed(1)))) }),
  customDoorFrameColor: '#1E293B',
  setCustomDoorFrameColor: (color) => set({ customDoorFrameColor: color }),

  pendingDoor: null,
  setPendingDoor: (pending) => set({ pendingDoor: pending }),
  cancelPendingDoor: () => set({ pendingDoor: null }),

  gridSettings: {
    showGrid: true,
    showSubgrid: false,
    showMeters: true,
    snapToGrid: true,
  },

  toggleGrid: () =>
    set((state) => ({
      gridSettings: { ...state.gridSettings, showGrid: !state.gridSettings.showGrid },
    })),

  toggleSubgrid: () =>
    set((state) => ({
      gridSettings: { ...state.gridSettings, showSubgrid: !state.gridSettings.showSubgrid },
    })),

  toggleMeters: () =>
    set((state) => ({
      gridSettings: { ...state.gridSettings, showMeters: !state.gridSettings.showMeters },
    })),

  toggleSnapToGrid: () =>
    set((state) => ({
      gridSettings: { ...state.gridSettings, snapToGrid: !state.gridSettings.snapToGrid },
    })),

  cursorPos: {
    x: null,
    y: null,
    gridX: null,
    gridY: null,
    snapVertexX: null,
    snapVertexY: null,
    isInsideTerrain: false,
  },
  setCursorPos: (cursorPos) => set({ cursorPos }),

  walls: [],
  addWall: (wallData) => {
    const len = Math.hypot(wallData.x2 - wallData.x1, wallData.y2 - wallData.y1);
    if (len < 0.2) return;

    const { selectedWallColor, selectedWallTexture } = get();

    const newWall: Wall = {
      ...wallData,
      id: `wall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      thickness: wallData.thickness || 0.2,
      colorSideA: wallData.colorSideA || selectedWallColor,
      textureUrlSideA: wallData.textureUrlSideA || selectedWallTexture,
      colorSideB: wallData.colorSideB || selectedWallColor,
      textureUrlSideB: wallData.textureUrlSideB || selectedWallTexture,
    };
    set((state) => ({ walls: [...state.walls, newWall] }));
  },

  paintWall: (wallId, color, textureUrl, side) => {
    set((state) => ({
      walls: state.walls.map((w) => {
        if (w.id !== wallId) return w;

        if (side === 'sideA') {
          return {
            ...w,
            colorSideA: color !== undefined ? color : w.colorSideA,
            textureUrlSideA: textureUrl !== undefined ? textureUrl : undefined,
          };
        } else if (side === 'sideB') {
          return {
            ...w,
            colorSideB: color !== undefined ? color : w.colorSideB,
            textureUrlSideB: textureUrl !== undefined ? textureUrl : undefined,
          };
        } else {
          return {
            ...w,
            colorSideA: color !== undefined ? color : w.colorSideA,
            textureUrlSideA: textureUrl !== undefined ? textureUrl : undefined,
            colorSideB: color !== undefined ? color : w.colorSideB,
            textureUrlSideB: textureUrl !== undefined ? textureUrl : undefined,
          };
        }
      }),
    }));
  },

  removeWall: (wallId) =>
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== wallId),
      doorsWindows: state.doorsWindows.filter((dw) => dw.wallId !== wallId),
    })),

  clearWalls: () => set({ walls: [], doorsWindows: [] }),

  floors: {},
  addFloorTile: (x, y, textureId, color, customTextureUrl) => {
    const key = `${x},${y}`;
    set((state) => ({
      floors: {
        ...state.floors,
        [key]: { id: `floor_${key}`, x, y, textureId, color, customTextureUrl },
      },
    }));
  },

  removeFloorTile: (x, y) => {
    const key = `${x},${y}`;
    set((state) => {
      const nextFloors = { ...state.floors };
      delete nextFloors[key];
      return { floors: nextFloors };
    });
  },

  paintFloorRect: (x1, y1, x2, y2, textureId, color, customTextureUrl) => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const { selectedFloorColor, selectedFloorCustomTexture } = get();
    const finalColor = color || selectedFloorColor;
    const finalTexture = customTextureUrl || selectedFloorCustomTexture;

    set((state) => {
      const updatedFloors = { ...state.floors };
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          if (x >= 0 && x < state.terrain.width && y >= 0 && y < state.terrain.length) {
            const key = `${x},${y}`;
            updatedFloors[key] = {
              id: `floor_${key}`,
              x,
              y,
              textureId,
              color: finalColor,
              customTextureUrl: finalTexture,
            };
          }
        }
      }
      return { floors: updatedFloors };
    });
  },

  eraseFloorRect: (x1, y1, x2, y2) => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    set((state) => {
      const updatedFloors = { ...state.floors };
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${x},${y}`;
          delete updatedFloors[key];
        }
      }
      return { floors: updatedFloors };
    });
  },

  clearFloors: () => set({ floors: {} }),

  doorsWindows: [],
  addDoorWindow: (itemData) => {
    const newItem: DoorWindow = {
      ...itemData,
      id: `dw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      flipSide: itemData.flipSide || false,
      flipSwing: itemData.flipSwing || false,
    };
    set((state) => ({ doorsWindows: [...state.doorsWindows, newItem] }));
  },

  toggleDoorFlip: (id) =>
    set((state) => ({
      doorsWindows: state.doorsWindows.map((dw) =>
        dw.id === id ? { ...dw, flipSide: !dw.flipSide, flipSwing: !dw.flipSwing } : dw
      ),
    })),

  removeDoorWindow: (id) =>
    set((state) => ({
      doorsWindows: state.doorsWindows.filter((dw) => dw.id !== id),
    })),

  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),

  isSetupModalOpen: false,
  setSetupModalOpen: (open) => set({ isSetupModalOpen: open }),
}));
