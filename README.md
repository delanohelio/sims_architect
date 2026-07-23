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

## 🚀 Funcionalidades Implementadas (FASE 1, FASE 2, FASE 2.5 & FASE 3)

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
  - Apaga paredes, esquadrias, pisos e móveis colocados com highlight vermelho de alvo.

### 3. 🎨 Sistema Global de Cores & Texturas Personalizadas
- **Seletor Único de Aparência (Cor Sólida vs Textura de Imagem)**:
  - Escolha clara entre aplicar cor sólida (Hex/Paleta) ou textura de imagem.
- **Biblioteca Global de Texturas Compartilhada**:
  - Upload de arquivos de imagem (`.png`, `.jpg`, `.webp`) ou inserção via **Link URL de imagem pública**.
  - A galeria fica salva no estado global (`customTextures`) e disponível em **Paredes**, **Pisos**, **Terreno** e **Móveis**.
- **Remoção em Cascata com Fallback Padrão**:
  - Ao excluir uma textura da galeria, todos os elementos afetados revertem automaticamente para suas cores padrão.
- **Renderização Pura 100% sem Tonalização**:
  - Texturas de imagem são renderizadas sobre base neutra `#FFFFFF` no 2D e 3D, mantendo 100% da fidelidade das cores originais.

### 4. 🖌️ Pintura de Parede Dual-Face com Sombreamento Direto
- **Pintura Independente das 2 Faces da Parede (Lado A e Lado B)**:
  - Permite definir cores ou texturas totalmente diferentes no interior e no exterior de cada parede.
- **Sombreamento de Destaque Visual Alinhado**:
  - Ao passar o mouse sobre a parede com a ferramenta **Pintar Parede**:
    - 🟡 **Sombra Central (Estendida além dos dois lados)**: Clique para **Pintar Ambos os Lados**.
    - 🔵 **Sombra no Lado A (Estendida para fora no Lado A)**: Clique para **Pintar Apenas o Lado A**.
    - 🟣 **Sombra no Lado B (Estendida para fora no Lado B)**: Clique para **Pintar Apenas o Lado B**.

### 5. 🛋️ FASE 3: Modo Compra / Mobiliário (`buy`)
- **Catálogo de Móveis por Categoria**:
  - Abas temáticas: 🛏️ **Quarto**, 🛋️ **Sala**, 🍳 **Cozinha**, 🚿 **Banheiro**, 🌿 **Exterior/Decoração**, 📦 **Customizado**.
- **Móvel Genérico Customizado**:
  - Configuração de **Nome Customizado**, Sliders de **Largura ($W$)**, **Profundidade ($D$)** e **Altura ($H$)** ($0.3\text{m} \dots 5.0\text{m}$), **Formato Geométrico 3D (Caixa / Cilindro)** e **Cor ou Textura de Imagem da Galeria Global**.
- **Ghosting, Snap Suave & Rotação Tecla 'R'**:
  - Fantasma translúcido do móvel segue o cursor do mouse.
  - Imantação suave a cada $0.1\text{m}$ ($10\text{cm}$) no plano.
  - Tecla **R**: Rotaciona o móvel em $+90^\circ$, recalculando o Bounding Box $AABB$.
- **Validação de Colisão AABB em Tempo Real**:
  - Fantasma **Vermelho** se colidir com paredes ou outros móveis (posição proibida).
  - Fantasma **Ciano/Verde** quando o espaço está livre para inserção.
- **Mover e Re-rotacionar Móveis Existentes**:
  - Clicar sobre qualquer móvel posicionado na planta permite selecionar e sair movendo ele pela casa, podendo rotacionar com a tecla **R** e refixar no local desejado.
- **Renderização 2D (Top-Down Arquitetônico)**:
  - Ícones 2D minimalistas específicos (travesseiros na cama, almofadas no sofá, divisória da geladeira, vegetação circular).
- **Renderização 3D (Three.js WebGL Primitivas)**:
  - Modelos 3D tridimensionais com rotação em radianos, elevação apoiada sobre o piso, texturas de imagem e iluminação solar.

### 6. 🧊 Maquete Eletrônica 3D Exclusiva para Inspeção
- **Tridimensionalidade em Tempo Real**: Renderizada via Three.js WebGL com sombras PCFShadowMap, sol direcional e luz ambiente.
- **Controle de Visibilidade e Altura das Paredes**:
  - *Paredes Altas ($2.8\text{m}$)*
  - *Meia Parede ($1.4\text{m}$)* (com transparência $75\%$)
  - *Baixar Paredes / Apenas Base ($0.2\text{m}$)*
- **Sidebar de Inspeção 3D & Métricas do Projeto**:
  - Exibe resumo em tempo real do lote: $m^2$ de piso pintado, metros lineares de parede construída, total de portas, janelas e móveis colocados.

### 7. 🎮 Navegação por Teclado e Câmera
- **W / A / S / D**: Pan 2D e Strafe 3D.
- **Z / C / X**: Zoom In, Zoom Out, Reset.
- **Q / E**: Rotação de Câmera.
- **R**: Rotação do Móvel em $90^\circ$ no Modo Compra.
- **Esc**: Cancelar seleção de móvel ou esquadria.
- **Espaço / Clique Meio**: Pan com mouse em qualquer modo.

---

## 🗃️ Estrutura do Estado Global (`useSimsStore.ts`)

```ts
interface SimsState {
  terrain: TerrainConfig;
  viewState: ViewState;
  viewMode: '2d' | '3d';
  activeMode: 'settings' | 'build' | 'buy' | 'export';
  activeBuildTool: BuildTool;
  wallViewMode: WallViewMode;
  
  customTextures: CustomTextureItem[];
  selectedBuyCategory: FurnitureCategory;
  pendingFurnitureItem: PendingFurniturePlacement | null;
  
  walls: Wall[];
  floors: Record<string, FloorTile>;
  doorsWindows: DoorWindow[];
  items: FurnitureItem[];

  // Métodos do Zustand para manipulação de paredes, pisos, esquadrias e móveis...
}
```
