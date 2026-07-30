# 🏡 Sims Architect - 2D Floor Plan & 3D Architectural CAD Studio

O **Sims Architect** é uma aplicação web interativa de arquitetura e design desenvolvida com **React 19, TypeScript, Vite, Tailwind CSS v4, Zustand e Three.js**. A ferramenta combina uma interface inspirada na franquia *The Sims* e em softwares de arquitetura profissional (CAD/BIM), permitindo desenhar plantas baixas métricas em 2D e visualizar maquetes eletrônicas em 3D em tempo real.

---

## 🛠️ Tecnologias Utilizadas
- **Core Frontend**: React 19, TypeScript, Vite
- **Gerenciamento de Estado**: Zustand (`useSimsStore.ts`)
- **Renderização 2D**: HTML5 Canvas API com escalonamento High-DPI (`useCanvasRenderer.ts`)
- **Renderização 3D**: Three.js WebGL com sombras PCFShadowMap, iluminação direcional solar e materiais físicos (`Viewport3D.tsx`)
- **Otimização de Memória**: Descarte estrito de geometrias, materiais e texturas WebGL GPU no desmonte de maquetes 3D e renderização exclusiva por modo
- **Algoritmos de IA & CAD**: Reconhecimento automático de áreas/cômodos via **Flood Fill 2D (BFS)** em malha de $0,1\text{m}$ e atração magnética de vértices (`roomDetectionUtils.ts`)
- **Estilização & UI**: Vanilla CSS + Tailwind CSS v4 com estéticas dark mode futuristas e glassmorphism
- **Ícones**: Lucide React

---

## 🚀 Funcionalidades Implementadas

### 1. ⚙️ Configurações de Terreno & Lote (Modo `settings`)
- **Dimensões Customizáveis do Lote**: Sliders em tempo real para ajustar Largura (5m a 60m) e Comprimento (5m a 60m) com badge de área total em $m^2$.
- **Presets Rápidos de Lote Sims**: Lote Padrão ($15\text{m} \times 30\text{m}$), Urbano ($10\text{m} \times 20\text{m}$), Chalé ($20\text{m} \times 20\text{m}$), Mansão ($25\text{m} \times 40\text{m}$).
- **Temas de Terreno & Personalização**: *Grama*, *Blueprint*, *Dark Slate*, *Concreto Urbano*, cores customizadas e texturas.
- **⚙️ Modal de Configuração de Atalhos de Teclado (Sem Conflitos)**: Bloqueio automático de teclas duplicadas e redefinição personalizada.

### 2. 🧱 Modo Construção 2D (`build`) & Sistema de Paredes Avançado
- **Ferramenta Dedicada "Mão (Selecionar)" `[M]`**:
  - Isolamento estrito de funções: na ferramenta de **Paredes `[V]`**, o clique no terreno **apenas desenha novas paredes**.
  - A seleção, o movimento por arrasto $(\Delta x, \Delta y)$ e a edição de paredes no Painel Inspetor ocorrem exclusivamente ao ativar a ferramenta **Mão `[M]`**.
- **Construção de Paredes por Arrasto a partir de 0,1m (10cm)**: Resolução de precisão de **0,1m** sem seleção automática da nova parede para permitir desenho contínuo.
- **Edição Numérica Direta do Comprimento Exato**: Digitação do comprimento em metros no inspetor de paredes.
- **Esquadrias (Portas & Janelas Customizáveis)**: Posicionamento técnico com porta de correr (`door_sliding`) e porta pivotante.

### 3. 🛋️ Modo Compra / Mobiliário (`buy`) & Atalhos Numéricos
- **Atalhos Rápidos de Categorias (`1` a `6`)**: Quarto, Sala, Cozinha, Banheiro, Exterior, Customizados.
- **Móvel Genérico Customizado & Rotação Numérica**: Rotação de $0^\circ$ a $360^\circ$ ou tecla **R**.

### 4. 🏷️ Menu "Marcação" (Zonas, Áreas, Varinha Mágica e Régua)
- **🎯 Snap de 0,1m em Qualquer Quadrante & Atração Magnética de Paredes**:
  - Resolução sub-métrica de $0,1\text{m}$ em qualquer posição do terreno para alinhamento fino de áreas e cotas de régua.
  - Atraimento magnético automático para cantos e vértices de paredes existentes ($\le 0,18\text{m}$).
- **🪄 Varinha Mágica (Auto-Detecção Automática de Ambientes em 1 Clique)**:
  - 🧱 **Baseado em Paredes (Cômodo Fechado)**: Algoritmo Flood Fill 2D que reconhece o perímetro exato do cômodo limitado por paredes ao clicar no seu interior.
  - 🎨 **Baseado em Pisos Conectados**: Reconhece a mancha inteira de ladrilhos contíguos aplicados ao clicar sobre um piso.

### 5. ⚡ Otimização Extrema de Memória & Alternância 2D / 3D com Tela de Carregamento
- **Gerenciamento Inteligente da DOM & GPU**: Apenas a visão ativa (Planta 2D ou Maquete 3D) permanece montada no DOM com descarte estrito de memória WebGL.
- **Tela de Transição e Loading**: Feedback visual com animação enquanto a memória WebGL é purgada e reorganizada.

### 6. ⌨️ Hierarquia da Tecla ESC em 2 Passos
- **1º Clique no ESC**: Cancela o rascunho em andamento, esquadria pendente, móvel suspenso ou elemento selecionado, **mantendo a ferramenta atual ativa**.
- **2º Clique no ESC**: Se não houver ação em andamento nem item selecionado, alterna a ferramenta ativa para a **Mão / Seleção (`select` / `hand`)**.

---

## ⌨️ Tabela de Atalhos de Teclado Padrão (100% Sem Conflitos)

| Ação | Tecla Padrão | Categoria |
| :--- | :---: | :--- |
| **Aumentar Zoom** | `Z` | Navegação / Câmera |
| **Diminuir Zoom** | `C` | Navegação / Câmera |
| **Resetar Zoom (100%)** | `X` | Navegação / Câmera |
| **Girar Câmera Anti-Horário** | `Q` | Navegação / Câmera |
| **Girar Câmera Horário** | `E` | Navegação / Câmera |
| **Alternar Grid Métrico** | `G` | Navegação / Câmera |
| **Mão (Selecionar / Mover)** | `M` | Modo Construção |
| **Construir Parede** | `V` | Modo Construção |
| **Pintar Parede** | `T` | Modo Construção |
| **Aplicação de Pisos** | `L` | Modo Construção |
| **Portas & Janelas** | `J` | Modo Construção |
| **Marreta / Borracha** | `H` / `Delete` | Modo Construção |
| **Rotacionar Móvel (+45°)** | `R` | Modo Compra |
| **Compra: Categorias** | `1` a `6` | Modo Compra |
| **Concluir Polígono / Medida** | `Enter` | Geral |
| **Cancelar Ação (1º) / Ir para Mão (2º)** | `Esc` | Geral |

---

## 💻 Como Rodar o Projeto Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/delanodesign/sims-architect.git
cd sims-architect

# 2. Instalar as dependências
npm install

# 3. Iniciar o servidor de desenvolvimento Vite
npm run dev

# 4. Compilar para produção (TypeScript + Vite)
npm run build
```
