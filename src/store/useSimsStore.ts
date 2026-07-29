import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppMode,
  ViewMode3D,
  TerrainTheme,
  BuildTool,
  AnnotationTool,
  WallViewMode,
  FloorTextureId,
  TerrainConfig,
  ViewState,
  GridSettings,
  CursorPosition,
  Wall,
  FloorTile,
  DoorWindow,
  DoorWindowCatalogItem,
  FurnitureItem,
  FurnitureCatalogItem,
  FurnitureCategory,
  CustomTextureItem,
  ShortcutAction,
  AnnotationLineStyle,
  ZoneAnnotation,
  Point2D,
} from '../types/sims';

export const PRESET_LOTS = [
  { name: 'Lote Padrão Sims', width: 15, length: 30, description: '15m x 30m (450m²)' },
  { name: 'Lote Urbano / Estreito', width: 10, length: 20, description: '10m x 20m (200m²)' },
  { name: 'Quadrado / Chalé', width: 20, length: 20, description: '20m x 20m (400m²)' },
  { name: 'Mansão / Lote Grande', width: 25, length: 40, description: '25m x 40m (1000m²)' },
];

export const DEFAULT_KEYBINDINGS: Record<ShortcutAction, string> = {
  zoomIn: 'KeyZ',
  zoomOut: 'KeyC',
  zoomReset: 'KeyX',
  rotateCCW: 'KeyQ',
  rotateCW: 'KeyE',
  rotateItem: 'KeyR',
  hammer: 'KeyH',
  toggleGrid: 'KeyG',
};

export const CATALOG_FURNITURE: FurnitureCatalogItem[] = [
  // QUARTO
  { catalogId: 'bed_double', name: 'Cama de Casal King', category: 'bedroom', width: 2.0, depth: 2.0, height: 0.5, color: '#3B82F6', primitiveShape: 'box',
    textureUrl: '/textures/fabric_blue.svg' },
  { catalogId: 'bed_single', name: 'Cama Solteiro', category: 'bedroom', width: 1.0, depth: 2.0, height: 0.5, color: '#60A5FA', primitiveShape: 'box',
    textureUrl: '/textures/fabric_blue.svg' },
  { catalogId: 'wardrobe', name: 'Guarda-Roupa 3 Portas', category: 'bedroom', width: 1.8, depth: 0.6, height: 2.1, color: '#475569', primitiveShape: 'box',
    textureUrl: '/textures/wood_dark.svg' },
  { catalogId: 'nightstand', name: 'Criado-Mudo', category: 'bedroom', width: 0.5, depth: 0.4, height: 0.5, color: '#64748B', primitiveShape: 'box',
    textureUrl: '/textures/wood.svg' },

  // SALA
  { catalogId: 'sofa_3seater', name: 'Sofá 3 Lugares Premium', category: 'living', width: 2.5, depth: 1.0, height: 0.8, color: '#8B5CF6', primitiveShape: 'box',
    textureUrl: '/textures/fabric_purple.svg' },
  { catalogId: 'armchair', name: 'Poltrona de Leitura', category: 'living', width: 1.0, depth: 0.9, height: 0.8, color: '#A855F7', primitiveShape: 'box',
    textureUrl: '/textures/fabric_purple.svg' },
  { catalogId: 'coffee_table', name: 'Mesa de Centro', category: 'living', width: 1.2, depth: 0.6, height: 0.4, color: '#D97706', primitiveShape: 'box',
    textureUrl: '/textures/wood.svg' },
  { catalogId: 'tv_unit', name: 'Rack com TV 65"', category: 'living', width: 2.0, depth: 0.5, height: 1.2, color: '#1E293B', primitiveShape: 'box',
    textureUrl: '/textures/wood_dark.svg' },

  // COZINHA
  { catalogId: 'fridge_side', name: 'Geladeira Inox Double Door', category: 'kitchen', width: 0.8, depth: 0.8, height: 1.9, color: '#94A3B8', primitiveShape: 'box',
    textureUrl: '/textures/metal_inox.svg' },
  { catalogId: 'dining_table', name: 'Mesa de Jantar 6 Lugares', category: 'kitchen', width: 2.0, depth: 1.0, height: 0.8, color: '#B45309', primitiveShape: 'box',
    textureUrl: '/textures/wood.svg' },
  { catalogId: 'chair', name: 'Cadeira de Jantar', category: 'kitchen', width: 0.5, depth: 0.5, height: 0.9, color: '#D97706', primitiveShape: 'box',
    textureUrl: '/textures/wood.svg' },
  { catalogId: 'kitchen_counter', name: 'Balcão de Cozinha com Pia', category: 'kitchen', width: 1.5, depth: 0.6, height: 0.9, color: '#0284C7', primitiveShape: 'box',
    textureUrl: '/textures/marble.svg' },

  // BANHEIRO
  { catalogId: 'toilet', name: 'Vaso Sanitário', category: 'bathroom', width: 0.5, depth: 0.7, height: 0.8, color: '#F8FAFC', primitiveShape: 'box',
    textureUrl: '/textures/marble.svg' },
  { catalogId: 'vanity_sink', name: 'Pia com Gabinete', category: 'bathroom', width: 0.8, depth: 0.5, height: 0.85, color: '#0EA5E9', primitiveShape: 'box',
    textureUrl: '/textures/marble.svg' },
  { catalogId: 'shower_box', name: 'Box com Chuveiro', category: 'bathroom', width: 1.0, depth: 1.0, height: 2.1, color: '#38BDF8', primitiveShape: 'box',
    textureUrl: '/textures/tile_blue.svg' },

  // DECORAÇÃO / EXTERIOR
  { catalogId: 'potted_plant', name: 'Planta de Vasado / Árvore', category: 'outdoor', width: 1.0, depth: 1.0, height: 1.5, color: '#15803D', primitiveShape: 'cylinder',
    textureUrl: '/textures/foliage.svg' },
  { catalogId: 'floor_lamp', name: 'Luminária de Chão', category: 'outdoor', width: 0.4, depth: 0.4, height: 1.6, color: '#F59E0B', primitiveShape: 'cylinder',
    textureUrl: '/textures/metal_inox.svg' },
];

export interface PendingFurniturePlacement {
  catalogItem: FurnitureCatalogItem;
  rotation: number;
  movingItemId?: string;
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
  { catalogId: 'door_sliding', name: 'Porta de Correr (Sem Dobradiça)', type: 'door', width: 1.8, height: 2.1, isSliding: true },
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
  
  // ATALHOS CUSTOMIZÁVEIS
  keybindings: Record<ShortcutAction, string>;
  setKeybinding: (action: ShortcutAction, key: string) => void;
  resetKeybindings: () => void;

  // NOVO MENU: MARCAÇÕES / ZONAS E TEXTOS LIVRES
  annotations: ZoneAnnotation[];
  activeAnnotationTool: AnnotationTool;
  selectedAnnotationId: string | null;
  customAnnotationColor: string;
  customAnnotationLineStyle: AnnotationLineStyle;
  customTextContent: string;
  customTextFontSize: number;
  setActiveAnnotationTool: (tool: AnnotationTool) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setCustomAnnotationColor: (color: string) => void;
  setCustomAnnotationLineStyle: (style: AnnotationLineStyle) => void;
  setCustomTextContent: (text: string) => void;
  setCustomTextFontSize: (size: number) => void;
  addAnnotation: (annotation: Omit<ZoneAnnotation, 'id'>) => void;
  updateAnnotation: (id: string, partial: Partial<ZoneAnnotation>) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  setAnnotationLabelPosition: (id: string, position: Point2D) => void;
  setWallLabelOffset: (wallId: string, offset: Point2D) => void;

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

  // METADADOS DO PROJETO (FASE 4)
  projectName: string;
  projectDescription: string;

  // CATÁLOGOS CUSTOMIZADOS PERSISTIDOS
  savedCustomFurniture: FurnitureCatalogItem[];

  // ESTRUTURAS ARQUITETÔNICAS DO LOTE
  walls: Wall[];
  floors: Record<string, FloorTile>;
  doorsWindows: DoorWindow[];
  items: FurnitureItem[];

  // ACTIONS
  setMode: (mode: AppMode) => void;
  setViewMode: (mode: ViewMode3D) => void;
  setActiveBuildTool: (tool: BuildTool) => void;
  setWallViewMode: (mode: WallViewMode) => void;
  setIsSetupModalOpen: (open: boolean) => void;

  setProjectName: (name: string) => void;
  setProjectDescription: (desc: string) => void;

  addCustomTexture: (name: string, url: string) => void;
  removeCustomTexture: (id: string) => void;

  addCustomCatalogItem: (item: Omit<FurnitureCatalogItem, 'isCustom'>) => void;
  removeCustomCatalogItem: (catalogId: string) => void;

  setSelectedWallColor: (color: string) => void;
  setSelectedWallTexture: (url?: string) => void;

  setSelectedFloorTexture: (textureId: FloorTextureId, color?: string, customUrl?: string) => void;
  setSelectedFloorColor: (color?: string) => void;
  setSelectedFloorCustomTexture: (url?: string) => void;

  setSelectedDoorWindow: (item: DoorWindowCatalogItem) => void;
  setCustomDoorType: (type: 'door' | 'window') => void;
  setCustomDoorWidth: (width: number) => void;
  setCustomDoorHeight: (height: number) => void;
  setCustomDoorFrameColor: (color: string) => void;
  setPendingDoor: (pending: PendingDoorPlacement | null) => void;
  cancelPendingDoor: () => void;
  toggleDoorFlip: (dwId?: string) => void;

  setSelectedBuyCategory: (category: FurnitureCategory) => void;
  setPendingFurnitureItem: (pending: PendingFurniturePlacement | null) => void;
  rotatePendingFurnitureItem: () => void;
  setPendingFurnitureRotation: (rotation: number) => void;
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
  setTerrainCustomAppearance: (color?: string, secondaryColor?: string, textureUrl?: string) => void;
  setCustomTerrain: (color?: string, secondaryColor?: string, textureUrl?: string) => void;
  
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

  loadProjectState: (data: any) => void;
  resetProject: () => void;
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
  panX: 0,
  panY: 0,
  rotation: 0,
};

const DEFAULT_GRIDSETTINGS: GridSettings = {
  showGrid: true,
  showSubgrid: false,
  showMeters: true,
  snapToGrid: true,
};

export const useSimsStore = create<SimsState>()(
  persist(
    (set, get) => ({
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

      // ATALHOS CUSTOMIZÁVEIS
      keybindings: DEFAULT_KEYBINDINGS,
      setKeybinding: (action, key) =>
        set((state) => ({
          keybindings: { ...state.keybindings, [action]: key },
        })),
      resetKeybindings: () => set({ keybindings: DEFAULT_KEYBINDINGS }),

      // MARCAÇÕES DE ÁREA / ZONAS E TEXTOS LIVRES
      annotations: [],
      activeAnnotationTool: 'draw',
      selectedAnnotationId: null,
      customAnnotationColor: '#10B981',
      customAnnotationLineStyle: 'solid',
      customTextContent: 'Anotação / Cômodo',
      customTextFontSize: 14,

      setActiveAnnotationTool: (tool) => set({ activeAnnotationTool: tool }),
      setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
      setCustomAnnotationColor: (color) => set({ customAnnotationColor: color }),
      setCustomAnnotationLineStyle: (style) => set({ customAnnotationLineStyle: style }),
      setCustomTextContent: (text) => set({ customTextContent: text }),
      setCustomTextFontSize: (size) => set({ customTextFontSize: size }),

      addAnnotation: (annotationData) =>
        set((state) => {
          const id = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          return {
            annotations: [...state.annotations, { ...annotationData, id }],
            selectedAnnotationId: id,
          };
        }),

      updateAnnotation: (id, partial) =>
        set((state) => ({
          annotations: state.annotations.map((ann) => (ann.id === id ? { ...ann, ...partial } : ann)),
        })),

      removeAnnotation: (id) =>
        set((state) => ({
          annotations: state.annotations.filter((ann) => ann.id !== id),
          selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
        })),

      clearAnnotations: () => set({ annotations: [], selectedAnnotationId: null }),

      setAnnotationLabelPosition: (id, position) =>
        set((state) => ({
          annotations: state.annotations.map((ann) =>
            ann.id === id ? { ...ann, labelPosition: position } : ann
          ),
        })),

      setWallLabelOffset: (wallId, offset) =>
        set((state) => ({
          walls: state.walls.map((w) => (w.id === wallId ? { ...w, labelOffset: offset } : w)),
        })),

      projectName: 'Meu Projeto Sims',
      projectDescription: 'Planta baixa arquitetônica criada no Sims Architect 2D/3D Planner.',

      customTextures: [
        { id: 'tex_grass', name: 'Grama Natural', url: '/textures/grass.svg' },
        { id: 'tex_wood', name: 'Madeira Clara', url: '/textures/wood.svg' },
        { id: 'tex_wood_dark', name: 'Madeira Escura', url: '/textures/wood_dark.svg' },
        { id: 'tex_brick', name: 'Tijolo Vermelho', url: '/textures/brick_red.svg' },
        { id: 'tex_marble', name: 'Mármore Polido', url: '/textures/marble.svg' },
        { id: 'tex_metal_inox', name: 'Aço Inox Escovado', url: '/textures/metal_inox.svg' },
        { id: 'tex_fabric_blue', name: 'Tecido Azul', url: '/textures/fabric_blue.svg' },
        { id: 'tex_fabric_purple', name: 'Tecido Roxo', url: '/textures/fabric_purple.svg' },
        { id: 'tex_tile_blue', name: 'Azulejo Hidráulico', url: '/textures/tile_blue.svg' },
      ],

      selectedWallColor: '#E2E8F0',
      selectedWallTexture: undefined,

      selectedFloorTexture: 'wood',
      selectedFloorColor: undefined,
      selectedFloorCustomTexture: undefined,

      selectedDoorWindow: CATALOG_DOORS_WINDOWS[0],
      customDoorWidth: 1.0,
      customDoorHeight: 2.1,
      customDoorFrameColor: '#F59E0B',
      pendingDoor: null,

      selectedBuyCategory: 'bedroom',
      pendingFurnitureItem: null,
      customFurnitureName: 'Móvel Customizado',
      customFurnitureWidth: 1.5,
      customFurnitureDepth: 1.0,
      customFurnitureHeight: 1.0,
      customFurnitureColor: '#8B5CF6',
      customFurnitureTextureUrl: undefined,
      customFurnitureCategory: 'living',
      customFurnitureShape: 'box',

      savedCustomFurniture: [],

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
        set({ viewMode });
      },

      setActiveBuildTool: (tool) => {
        get().cancelPendingDoor();
        set({ activeBuildTool: tool });
      },

      setWallViewMode: (mode) => set({ wallViewMode: mode }),
      setIsSetupModalOpen: (open) => set({ isSetupModalOpen: open }),

      setProjectName: (name) => set({ projectName: name }),
      setProjectDescription: (desc) => set({ projectDescription: desc }),

      addCustomTexture: (name, url) =>
        set((state) => ({
          customTextures: [
            ...state.customTextures,
            { id: `tex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name, url },
          ],
        })),

      removeCustomTexture: (id) =>
        set((state) => ({
          customTextures: state.customTextures.filter((t) => t.id !== id),
        })),

      addCustomCatalogItem: (itemData) =>
        set((state) => {
          const newCatalogItem: FurnitureCatalogItem = {
            ...itemData,
            catalogId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            isCustom: true,
          };
          return {
            savedCustomFurniture: [...state.savedCustomFurniture, newCatalogItem],
          };
        }),

      removeCustomCatalogItem: (catalogId) =>
        set((state) => ({
          savedCustomFurniture: state.savedCustomFurniture.filter((i) => i.catalogId !== catalogId),
        })),

      setSelectedWallColor: (color) => set({ selectedWallColor: color }),
      setSelectedWallTexture: (url) => set({ selectedWallTexture: url }),

      setSelectedFloorTexture: (textureId, color, customUrl) =>
        set((state) => ({
          selectedFloorTexture: textureId,
          selectedFloorColor: color !== undefined ? color : (textureId === 'custom' ? state.selectedFloorColor : undefined),
          selectedFloorCustomTexture: customUrl,
        })),

      setSelectedFloorColor: (color) => set({ selectedFloorColor: color }),
      setSelectedFloorCustomTexture: (url) => set({ selectedFloorCustomTexture: url }),

      setSelectedDoorWindow: (item) => {
        get().cancelPendingDoor();
        set({ selectedDoorWindow: item });
      },

      setCustomDoorType: (type) =>
        set((state) => ({
          selectedDoorWindow: {
            ...state.selectedDoorWindow,
            type,
            name: type === 'door' ? 'Porta Customizada' : 'Janela Customizada',
          },
        })),

      setCustomDoorWidth: (width) => set({ customDoorWidth: width }),
      setCustomDoorHeight: (height) => set({ customDoorHeight: height }),
      setCustomDoorFrameColor: (color) => set({ customDoorFrameColor: color }),
      setPendingDoor: (pending) => set({ pendingDoor: pending }),
      cancelPendingDoor: () => set({ pendingDoor: null }),
      toggleDoorFlip: () => {},

      setSelectedBuyCategory: (category) => set({ selectedBuyCategory: category }),

      setPendingFurnitureItem: (pending) => set({ pendingFurnitureItem: pending }),

      rotatePendingFurnitureItem: () => {
        const pending = get().pendingFurnitureItem;
        if (!pending) return;
        const nextRot = (pending.rotation + 45) % 360;
        set({ pendingFurnitureItem: { ...pending, rotation: nextRot } });
      },

      setPendingFurnitureRotation: (rotation) => {
        const pending = get().pendingFurnitureItem;
        if (!pending) return;
        const normalized = Math.round(((rotation % 360) + 360) % 360);
        set({ pendingFurnitureItem: { ...pending, rotation: normalized } });
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

      setTerrainSize: (width, length) =>
        set((state) => ({
          terrain: { ...state.terrain, width: Number(width), length: Number(length || state.terrain.length) },
        })),

      setTerrainTheme: (theme) =>
        set((state) => ({
          terrain: { ...state.terrain, theme },
        })),

      setTerrainCustomAppearance: (color, secondaryColor, textureUrl) =>
        set((state) => ({
          terrain: { ...state.terrain, customColor: color, customSecondaryColor: secondaryColor, customTextureUrl: textureUrl },
        })),

      setCustomTerrain: (color, secondaryColor, textureUrl) =>
        set((state) => ({
          terrain: { ...state.terrain, customColor: color, customSecondaryColor: secondaryColor, customTextureUrl: textureUrl },
        })),

      setZoom: (newZoom, focalX, focalY) =>
        set((state) => {
          const zoomClamped = Math.max(0.2, Math.min(4.0, newZoom));
          if (focalX !== undefined && focalY !== undefined) {
            const factor = zoomClamped / state.viewState.zoom;
            const newPanX = focalX - (focalX - state.viewState.panX) * factor;
            const newPanY = focalY - (focalY - state.viewState.panY) * factor;
            return {
              viewState: { ...state.viewState, zoom: zoomClamped, panX: newPanX, panY: newPanY },
            };
          }
          return {
            viewState: { ...state.viewState, zoom: zoomClamped },
          };
        }),

      pan: (deltaX, deltaY) =>
        set((state) => ({
          viewState: { ...state.viewState, panX: state.viewState.panX + deltaX, panY: state.viewState.panY + deltaY },
        })),

      rotate: (angleDelta) =>
        set((state) => ({
          viewState: { ...state.viewState, rotation: (state.viewState.rotation + angleDelta + 360) % 360 },
        })),

      rotateClockwise: () =>
        set((state) => ({
          viewState: { ...state.viewState, rotation: (state.viewState.rotation + 45) % 360 },
        })),

      rotateCounterClockwise: () =>
        set((state) => ({
          viewState: { ...state.viewState, rotation: (state.viewState.rotation - 45 + 360) % 360 },
        })),

      resetRotation: () =>
        set((state) => ({
          viewState: { ...state.viewState, rotation: 0 },
        })),

      zoomIn: () => get().setZoom(get().viewState.zoom * 1.2),
      zoomOut: () => get().setZoom(get().viewState.zoom / 1.2),
      resetZoom: () => set({ viewState: DEFAULT_VIEWSTATE }),
      centerView: () => set({ viewState: DEFAULT_VIEWSTATE }),
      centerTerrainInViewport: (vpWidth = 1200, vpHeight = 800) => {
        const { terrain } = get();
        const cellSize = terrain.cellSizePixels || 40;
        const terrainW = terrain.width * cellSize;
        const terrainH = terrain.length * cellSize;
        const targetZoom = Math.min((vpWidth - 100) / terrainW, (vpHeight - 100) / terrainH, 2.0);
        const panX = (vpWidth - terrainW * targetZoom) / 2;
        const panY = (vpHeight - terrainH * targetZoom) / 2;
        set({
          viewState: { zoom: targetZoom, panX, panY, rotation: 0 },
        });
      },

      setGridSettings: (settings) =>
        set((state) => ({
          gridSettings: { ...state.gridSettings, ...settings },
        })),

      toggleGrid: () => set((state) => ({ gridSettings: { ...state.gridSettings, showGrid: !state.gridSettings.showGrid } })),
      toggleSubgrid: () => set((state) => ({ gridSettings: { ...state.gridSettings, showSubgrid: !state.gridSettings.showSubgrid } })),
      toggleMeters: () => set((state) => ({ gridSettings: { ...state.gridSettings, showMeters: !state.gridSettings.showMeters } })),
      toggleSnapToGrid: () => set((state) => ({ gridSettings: { ...state.gridSettings, snapToGrid: !state.gridSettings.snapToGrid } })),

      setCursorPos: (pos) => set({ cursorPos: pos }),

      addWall: (wallData) =>
        set((state) => {
          const newWall: Wall = {
            ...wallData,
            id: `wall_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          };
          return { walls: [...state.walls, newWall] };
        }),

      paintWall: (wallId, color, textureUrl, side) =>
        set((state) => ({
          walls: state.walls.map((w) => {
            if (w.id !== wallId) return w;
            if (side === 'sideA') return { ...w, colorSideA: color, textureUrlSideA: textureUrl };
            if (side === 'sideB') return { ...w, colorSideB: color, textureUrlSideB: textureUrl };
            return { ...w, colorSideA: color, textureUrlSideA: textureUrl, colorSideB: color, textureUrlSideB: textureUrl };
          }),
        })),

      removeWall: (id) =>
        set((state) => ({
          walls: state.walls.filter((w) => w.id !== id),
          doorsWindows: state.doorsWindows.filter((dw) => dw.wallId !== id),
        })),

      clearWalls: () => set({ walls: [], doorsWindows: [] }),

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
          const newDw: DoorWindow = {
            ...dwData,
            id: `dw_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          };
          return { doorsWindows: [...state.doorsWindows, newDw] };
        }),

      removeDoorWindow: (id) =>
        set((state) => ({
          doorsWindows: state.doorsWindows.filter((dw) => dw.id !== id),
        })),

      addItem: (itemData) =>
        set((state) => {
          const newItem: FurnitureItem = {
            ...itemData,
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
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

      loadProjectState: (data) => {
        if (!data) return;
        set({
          projectName: data.projectName || 'Meu Projeto Sims',
          projectDescription: data.projectDescription || '',
          terrain: data.terrain || DEFAULT_TERRAIN,
          walls: data.walls || [],
          floors: data.floors || {},
          doorsWindows: data.doorsWindows || [],
          items: data.items || [],
          keybindings: data.keybindings || DEFAULT_KEYBINDINGS,
          annotations: data.annotations || data.zoneAnnotations || [],
          customTextures: data.customTextures || [
            { id: 'tex_grass', name: 'Grama Natural', url: '/textures/grass.svg' },
            { id: 'tex_wood', name: 'Madeira Clara', url: '/textures/wood.svg' },
            { id: 'tex_wood_dark', name: 'Madeira Escura', url: '/textures/wood_dark.svg' },
            { id: 'tex_brick', name: 'Tijolo Vermelho', url: '/textures/brick_red.svg' },
            { id: 'tex_marble', name: 'Mármore Polido', url: '/textures/marble.svg' },
            { id: 'tex_metal_inox', name: 'Aço Inox Escovado', url: '/textures/metal_inox.svg' },
            { id: 'tex_fabric_blue', name: 'Tecido Azul', url: '/textures/fabric_blue.svg' },
            { id: 'tex_fabric_purple', name: 'Tecido Roxo', url: '/textures/fabric_purple.svg' },
            { id: 'tex_tile_blue', name: 'Azulejo Hidráulico', url: '/textures/tile_blue.svg' },
          ],
          savedCustomFurniture: data.savedCustomFurniture || [],
          viewState: DEFAULT_VIEWSTATE,
          viewMode: '2d',
          activeMode: 'settings',
          activeBuildTool: 'wall',
        });
      },

      resetProject: () =>
        set({
          projectName: 'Meu Projeto Sims',
          projectDescription: 'Planta baixa arquitetônica criada no Sims Architect 2D/3D Planner.',
          terrain: DEFAULT_TERRAIN,
          walls: [],
          floors: {},
          doorsWindows: [],
          items: [],
          annotations: [],
          selectedAnnotationId: null,
          customTextures: [
            { id: 'tex_grass', name: 'Grama Natural', url: '/textures/grass.svg' },
            { id: 'tex_wood', name: 'Madeira Clara', url: '/textures/wood.svg' },
            { id: 'tex_wood_dark', name: 'Madeira Escura', url: '/textures/wood_dark.svg' },
            { id: 'tex_brick', name: 'Tijolo Vermelho', url: '/textures/brick_red.svg' },
            { id: 'tex_marble', name: 'Mármore Polido', url: '/textures/marble.svg' },
            { id: 'tex_metal_inox', name: 'Aço Inox Escovado', url: '/textures/metal_inox.svg' },
            { id: 'tex_fabric_blue', name: 'Tecido Azul', url: '/textures/fabric_blue.svg' },
            { id: 'tex_fabric_purple', name: 'Tecido Roxo', url: '/textures/fabric_purple.svg' },
            { id: 'tex_tile_blue', name: 'Azulejo Hidráulico', url: '/textures/tile_blue.svg' },
          ],
          savedCustomFurniture: [],
          viewState: DEFAULT_VIEWSTATE,
          viewMode: '2d',
          activeMode: 'settings',
          activeBuildTool: 'wall',
        }),

      exportJSON: () => {
        const { projectName, projectDescription, terrain, walls, floors, doorsWindows, items, customTextures, savedCustomFurniture, keybindings, annotations } = get();
        return JSON.stringify(
          {
            appName: 'Sims Architect',
            version: '2.5',
            exportedAt: new Date().toISOString(),
            projectName,
            projectDescription,
            terrain,
            walls,
            floors,
            doorsWindows,
            items,
            annotations,
            keybindings,
            customTextures,
            savedCustomFurniture,
          },
          null,
          2
        );
      },

      importJSON: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (data && (data.terrain || Array.isArray(data.walls))) {
            get().loadProjectState(data);
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'sims-architect-storage',
      partialize: (state) => ({
        projectName: state.projectName,
        projectDescription: state.projectDescription,
        terrain: state.terrain,
        walls: state.walls,
        floors: state.floors,
        doorsWindows: state.doorsWindows,
        items: state.items,
        annotations: state.annotations,
        keybindings: state.keybindings,
        customTextures: state.customTextures,
        savedCustomFurniture: state.savedCustomFurniture,
      }),
    }
  )
);
