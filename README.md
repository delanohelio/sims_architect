# 🏡 Sims Architect - 2D Floor Plan & 3D Architectural CAD Studio

O **Sims Architect** é uma aplicação web interativa de arquitetura e design desenvolvida com **React 19, TypeScript, Vite, Tailwind CSS v4, Zustand e Three.js**. A ferramenta combina uma interface inspirada na franquia *The Sims* e em softwares de arquitetura profissional (CAD/BIM), permitindo desenhar plantas baixas métricas em 2D e visualizar maquetes eletrônicas em 3D em tempo real.

---

## 🛠️ Tecnologias Utilizadas
- **Core Frontend**: React 19, TypeScript, Vite
- **Gerenciamento de Estado**: Zustand (`useSimsStore.ts`)
- **Renderização 2D**: HTML5 Canvas API com escalonamento High-DPI (`useCanvasRenderer.ts`)
- **Renderização 3D**: Three.js WebGL com sombras PCFShadowMap, iluminação direcional solar e materiais físicos (`Viewport3D.tsx`)
- **Estilização & UI**: Vanilla CSS + Tailwind CSS v4 com estéticas dark mode futuristas e glassmorphism
- **Ícones**: Lucide React

---

## 🚀 Funcionalidades Implementadas (FASE 1, FASE 2 & FASE 2.5)

### 1. ⚙️ Configurações de Terreno & Lote (Modo `settings`)
- **Dimensões Customizáveis do Lote**: Sliders em tempo real para ajustar Largura (5m a 60m) e Comprimento (5m a 60m) com badge de área total em $m^2$.
- **Presets Rápidos de Lote Sims**:
  - *Lote Padrão Sims* ($15\text{m} \times 30\text{m}$)
  - *Lote Urbano / Estreito* ($10\text{m} \times 20\text{m}$)
  - *Quadrado / Chalé* ($20\text{m} \times 20\text{m}$)
  - *Mansão / Lote Grande* ($25\text{m} \times 40\text{m}$)
- **Temas de Terreno**: *Grama Sims*, *Blueprint Azul*, *Dark Slate*, *Concreto Urbano*.
- **Grade Métrica & Snap**: Grid 1m, Subgrid 0.5m, Rótulos de Distância Métricos e Imantação (Snap to Grid).
- **Proteção de Interação**: No Modo Configurações, nenhuma ferramenta de construção altera a planta. O clique esquerdo realiza exclusivamente **Pan (Movimento de Câmera)**.

### 2. 🧱 Modo Construção 2D (`build`)
- **Construção de Paredes Ortogonais & Diagonais**:
  - Ponto inicial e final imantados nas interseções do grid métrico.
  - Badge de distância métrica flutuante em tempo real (ex: `4.5m`).
- **Esquadrias (Portas & Janelas Customizáveis)**:
  - **Fluxo Interativo de Inserção da Porta em 3 Passos**:
    1. *Posicionamento*: Encaixe do vão na parede.
    2. *Dobradiça*: Escolha da ponta do pivot (hotspots ciano).
    3. *Giro de Abertura*: Zona sombreada translúcida do arco de giro (dentro/fora e esquerda/direita).
  - Janelas com vidro temperado translúcido azulado e reflexo.
  - **Esquadria Genérica Customizada**: Sliders de largura ($0.5\text{m} \dots 4.0\text{m}$), altura ($0.8\text{m} \dots 3.5\text{m}$) e cor da moldura.
- **Aplicação de Pisos**:
  - Catálogo de texturas (Madeira, Mármore, Azulejo, Slate, Grama, Terra).
  - Pintura de células unitárias ou drag/arraste retangular em lote.
- **Ferramenta Marreta (Borracha)**:
  - Apaga paredes, esquadrias e pisos com highlight vermelho de alvo.

### 3. 🎨 Sistema Global de Cores & Texturas Personalizadas
- **Seletor Único de Aparência (Cor Sólida vs Textura de Imagem)**:
  - Escolha clara entre aplicar cor sólida (Hex/Paleta) ou textura de imagem.
- **Biblioteca Global de Texturas Compartilhada**:
  - Upload de arquivos de imagem (`.png`, `.jpg`, `.webp`) ou inserção via **Link URL de imagem pública**.
  - A galeria fica salva no estado global (`customTextures`) e disponível em **Paredes**, **Pisos** e no **Terreno**.
- **Remoção em Cascata com Fallback Padrão**:
  - Ao excluir uma textura da galeria, todos os elementos afetados revertem automaticamente para suas cores padrão (`#E2E8F0` em paredes, `#78350F` em pisos, `#15803D` em terreno).
- **Renderização Pura 100% sem Tonalização**:
  - Texturas de imagem são renderizadas sobre base neutra `#FFFFFF` no 2D e 3D, mantendo 100% da fidelidade das cores originais.

### 4. 🖌️ Pintura de Parede Dual-Face com Sombreamento Direto
- **Pintura Independente das 2 Faces da Parede (Lado A e Lado B)**:
  - Permite definir cores ou texturas totalmente diferentes no interior e no exterior de cada parede.
- **Sombreamento de Destaque Visual Alinhado**:
  - Ao passar o mouse sobre a parede com a ferramenta **Pintar Parede**:
    - 🟡 **Sombra Central (Estendida além dos dois lados)**: Clique para **Pintar Ambos os Lados**.
    - 🔵 **Sombra no Lado A (Estendida para fora no Lado A)**: Clique para **Pintar Apenas o Lado A (Interno)**.
    - 🟣 **Sombra no Lado B (Estendida para fora no Lado B)**: Clique para **Pintar Apenas o Lado B (Externo)**.
  - A sombra surge exatamente sob o cursor do mouse para indicar o lado com 100% de precisão.

### 5. 🧊 Maquete Eletrônica 3D Exclusiva para Inspeção
- **Tridimensionalidade em Tempo Real**: Renderizada via Three.js WebGL com sombras PCFShadowMap, sol direcional e luz ambiente.
- **Controle de Visibilidade e Altura das Paredes**:
  - *Paredes Altas ($2.8\text{m}$)*
  - *Meia Parede ($1.4\text{m}$)* (com transparência $75\%$)
  - *Baixar Paredes / Apenas Base ($0.2\text{m}$)*
- **Sidebar de Inspeção 3D & Métricas do Projeto**:
  - Exibe resumo em tempo real do lote: $m^2$ de piso pintado, metros lineares de parede construída, total de portas e janelas.

### 6. 🎮 Navegação por Teclado e Câmera
- **Navegação 2D & 3D**:
  - **W / A / S / D**: Movimento de Câmera (Pan em 2D e Strafe em 3D com A=Esquerda, D=Direita).
  - **Z**: Zoom In.
  - **C**: Zoom Out.
  - **X**: Resetar Zoom e Câmera.
  - **Q / E**: Rotação da Câmera ($90^\circ$ no 2D, rotação contínua no 3D).
  - **Espaço (Manter Pressionado) ou Clique do Meio**: Pan com o mouse em qualquer ferramenta.
- **Reset Automático ao Retornar ao 2D**:
  - Ao alternar de 3D para 2D, a rotação reseta para $0^\circ$ e o lote é centralizado automaticamente.
- **Cancelamento Automático de Fluxos**:
  - Alternar para o modo Configurações ou para a visão 3D cancela automaticamente qualquer fluxo de inserção pendente (como posicionamento de portas).

---

## 🗃️ Estrutura do Estado Global (`useSimsStore.ts`)

```ts
interface SimsStore {
  terrain: TerrainConfig;        // dimensões, tema, cor/textura customizada
  viewState: ViewState;          // zoom, panX, panY, rotation
  viewMode: '2d' | '3d';         // modo de exibição
  activeMode: 'settings' | 'build' | 'buy' | 'export'; // modo da aplicação
  activeBuildTool: BuildTool;    // 'wall' | 'floor' | 'door_window' | 'wall_paint' | 'eraser'
  wallViewMode: WallViewMode;    // 'full' | 'half' | 'low'
  
  customTextures: CustomTextureItem[]; // galeria global de texturas customizadas
  
  selectedWallColor: string;
  selectedWallTexture?: string;
  selectedFloorTexture: FloorTextureId;
  selectedFloorColor?: string;
  selectedFloorCustomTexture?: string;
  
  customDoorWidth: number;
  customDoorHeight: number;
  customDoorFrameColor: string;
  pendingDoor: PendingDoorPlacement | null;
  
  walls: Wall[];                 // x1, y1, x2, y2, colorSideA, textureUrlSideA, colorSideB, textureUrlSideB
  floors: Record<string, FloorTile>; // x, y, textureId, color, customTextureUrl
  doorsWindows: DoorWindow[];    // type, wallId, offsetRatio, width, height, flipSide, flipSwing, frameColor
  items: FurnitureItem[];        // catálogo de móveis para FASE 3 (Modo Compra)
}
```

---

## 🚦 Próximos Passos (FASE 3 - Modo Compra / Mobiliário)
- **Modo Compra (`activeMode === 'buy'`)**:
  - Catálogo de Mobiliário 2D/3D (Camas, Sofás, Mesas, Eletrodomésticos, Decoração).
  - Posicionamento com rotação em 90° (tecla R), imantação no piso e colisão.
  - Renderização 2D (ícones arquitetônicos em vista superior) e 3D (modelos/geometrias tridimensionais).
