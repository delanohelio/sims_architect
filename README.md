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
- **Catálogo de Móveis por Categoria & Itens Customizados**:
  - Abas temáticas: 🛏️ **Quarto**, 🛋️ **Sala**, 🍳 **Cozinha**, 🚿 **Banheiro**, 🌿 **Exterior/Decoração**, 📦 **Customizado**.
  - **Ajuste de UI sem Scroll Horizontal**: Todo o card do móvel é um botão clicável responsivo, destacando a seleção sem exigir botões extras nem barras de rolagem.
- **Móvel Genérico Customizado & Salvamento no Catálogo**:
  - Configuração de **Nome Customizado**, Categoria Específica, Sliders de **Largura ($W$)**, **Profundidade ($D$)** e **Altura ($H$)** ($0.3\text{m} \dots 5.0\text{m}$), **Formato 3D (Caixa / Cilindro)** e **Aparência (Cor ou Textura)**.
  - **Salvar no Catálogo**: Permite registrar o móvel customizado no catálogo local (com persistência no `localStorage`).
  - **Exibição Multicategoria com Badge Especial**: O móvel customizado salvo aparece tanto na aba **"Customizado"** quanto na aba da sua **categoria escolhida (ex: Sala, Quarto)**, com borda roxa brilhante e badge `★ Custom` em destaque.
- **Correção da Seleção de Cor Sólida para Pintura de Pisos (`useSimsStore.ts` & `BuildSidebar.tsx`)**:
  - **Causa Raiz Identificada**: A action `setSelectedFloorTexture(textureId, color, customUrl)` ao ser chamada sem o 2º parâmetro (`color`) sobrescrevia a cor selecionada com `undefined`, resetando a cor da ferramenta de piso.
  - **Resolução**: A action `setSelectedFloorTexture` foi corrigida na store para preservar a cor do estado quando não for explicitamente passada como `undefined`. Além disso, a chamada em `BuildSidebar.tsx` passa explicitamente a cor desejada `setSelectedFloorTexture('custom', color, undefined)`, garantindo que a cor sólida selecionada seja mantida ativa.
  - **Feedback Visual de Cor Ativa**: Adicionado um card com amostra da cor ativa e o código Hexadecimal na lista de opções do catálogo de pisos quando uma cor sólida está pronta para pintar.
- **Seleção Clara de Cor Sólida, Textura ou Modelo de Catálogo nos Pisos**:
  - Organizada a barra de ferramentas de pisos em subseções distintas: **Cor Sólida** (qualquer Hexadecimal com paleta rápida), **Textura de Imagem** (Upload ou Link URL com galeria de texturas) e **Modelos Predefinidos do Catálogo** (Madeira Parquet, Mármore, Cerâmica, Slate, Grama, Terra).
- **Seletor de Tipo para Esquadrias Genéricas (Porta vs Janela)**:
  - Adicionado o seletor `[ 🚪 Porta ]` vs `[ 🪟 Janela ]` nas opções personalizadas da Esquadria Genérica em ([BuildSidebar.tsx](file:///Users/delano/dev/sims-architect/src/components/layout/BuildSidebar.tsx)).
  - Ao alternar para **Porta**, aciona o posicionamento em 3 passos (Hinge/Swing) com giro de maçaneta; ao alternar para **Janela**, fixa diretamente o painel de vidro na parede.
- **Aparência do Terreno em 3 Abas Mutuamente Exclusivas**:
  - Organizado o painel em ([SettingsSidebar.tsx](file:///Users/delano/dev/sims-architect/src/components/layout/SettingsSidebar.tsx)) em 3 abas claras:
    1. **Temas**: Presets rápidos de temas (Grama Sims, Blueprint Azul, Dark Slate, Concreto Urbano).
    2. **2 Cores (Xadrez)**: Seleção independente de **Cor Primária** e **Cor Secundária** com presets de xadrez.
    3. **Textura**: Aplicação de texturas de imagem enviadas ou em galeria.
- **Navegação Orbital 3D Completa por Teclado**:
  - **WASD / Setas**: Pan/Strafe horizontal no terreno 3D.
  - **Q / E**: Rotação orbital horizontal da câmera (esquerda / direita).
  - **F / V**: Rotação orbital vertical da câmera (**F = Inclinar para Cima / olhar para baixo**, **V = Inclinar para Baixo / olhar para o horizonte**).
  - **Z / C**: Zoom In / Zoom Out (Dolly).
  - **X**: Reseta enquadramento inicial 3D.
- **Layout Limpo & Sem Extrapolação (`ColorTexturePicker.tsx`)**:
  - Interface responsiva com seletores de cores sólidas e miniaturas de textura com `onError` fallback para caber perfeitamente no menu lateral sem overflow.
- **Ghosting, Snap Suave & Rotação Tecla 'R' (Passos de 45°)**:
  - Fantasma translúcido do móvel segue o cursor do mouse.
  - Imantação suave a cada $0.1\text{m}$ ($10\text{cm}$) no plano.
  - Tecla **R**: Rotaciona o móvel em $+45^\circ$ (permite alinhamento ortogonal e em diagonal $45^\circ, 135^\circ, 225^\circ, 315^\circ$), recalculando o Bounding Box $AABB$ tridimensional.
- **Validação de Colisão Bidirecional AABB em Tempo Real**:
  - Fantasma **Vermelho** se colidir com paredes ou outros móveis (posição proibida para o móvel).
  - **Bloqueio de Paredes sobre Móveis**: Tentar construir uma parede em cima de qualquer móvel de compra posicionado exibe o rascunho de parede em **Vermelho** com badge `Bloqueado` e impede a construção.
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
