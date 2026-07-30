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

## 🚀 Funcionalidades Implementadas

### 1. ⚙️ Configurações de Terreno & Lote (Modo `settings`)
- **Dimensões Customizáveis do Lote**: Sliders em tempo real para ajustar Largura (5m a 60m) e Comprimento (5m a 60m) com badge de área total em $m^2$.
- **Presets Rápidos de Lote Sims**: Lote Padrão ($15\text{m} \times 30\text{m}$), Urbano ($10\text{m} \times 20\text{m}$), Chalé ($20\text{m} \times 20\text{m}$), Mansão ($25\text{m} \times 40\text{m}$).
- **Temas de Terreno & Personalização**: *Grama*, *Blueprint*, *Dark Slate*, *Concreto Urbano*, cores customizadas e texturas.
- **⚙️ Modal de Configuração de Atalhos de Teclado (Com Bloqueio de Duplicadas)**:
  - **Edição Completa**: Modal interativo que permite configurar **todos os atalhos** do sistema.
  - **Zero Conflito**: Bloqueia automaticamente qualquer tentativa de atribuir a mesma tecla a duas funções diferentes, exibindo alertas de prevenção de duplicidade.

### 2. 🧱 Modo Construção 2D (`build`) & Sistema de Paredes Avançado
- **Ferramenta Dedicada "Mão (Selecionar)" `[M]`**:
  - Isolamento estrito de funções: na ferramenta de **Paredes `[V]`**, o clique no terreno **apenas desenha novas paredes**.
  - A seleção, o movimento por arrasto $(\Delta x, \Delta y)$ e a edição de paredes no Painel Inspetor ocorrem exclusivamente ao ativar a ferramenta **Mão `[M]`**.
- **Construção de Paredes por Arrasto a partir de 0,1m (10cm)**:
  - Resolução de precisão de **0,1m** para desenhar paredes curtas ou extensas com badge de cota métrica flutuante em tempo real.
- **Edição Numérica Direta do Comprimento Exato**:
  - Painel **Inspetor de Parede Selecionada** para digitação direta do comprimento em metros (ex: `0.10m`, `2.50m`, `4.80m`, `12.00m`) e espessura ($0,05\text{m} \dots 0,80\text{m}$).
- **Esquadrias (Portas & Janelas Customizáveis)**:
  - **Fluxo Interativo de Inserção da Porta em 3 Passos** (Posicionamento, Dobradiça, Giro de Abertura).
  - **Porta de Correr sem Dobradiça (`door_sliding`)**: Instalação em 1 clique com desenho técnico de 2 painéis e setas `↔`.
- **Aplicação de Pisos & Pintura Dual-Face**:
  - Catálogo de texturas (Madeira, Mármore, Azulejo, Slate, Grama, Terra, Cor Sólida, Textura Customizada).
  - Pintura independente das duas faces da parede (Lado A e Lado B).

### 3. 🛋️ Modo Compra / Mobiliário (`buy`) & Atalhos Numéricos
- **Atalhos Rápidos de Categorias (`1` a `6`)**:
  - `1`: Quarto | `2`: Sala | `3`: Cozinha | `4`: Banheiro | `5`: Exterior | `6`: Customizados.
- **Móvel Genérico Customizado & Rotação Numérica**:
  - Configuração de Nome, Categoria, Largura, Profundidade, Altura, Formato (Caixa/Cilindro) e Aparência.
  - Digitação direta do ângulo de rotação de $0^\circ$ a $360^\circ$ ou rotação por tecla (**R**).

### 4. 🏷️ Menu "Marcação" (Zonas, Áreas, Régua/Cotas e Textos Livres)
- **📏 Ferramenta Régua / Cota de Medida (`ruler`)**:
  - Medição métrica entre 2 pontos clicando e puxando o cursor com cota ao vivo (ex: `4.50m`).
  - Suporte a **Enter** (fixar cota), **Esc** (cancelar) e estilos de linha (Pontilhada, Contínua, Invisível).
- **Rascunho Poligonal de Zonas ao Vivo**: Pré-visualização ao vivo de vértices ($P_1, P_2, P_3\dots$) e linhas guia com cálculo automático de área em $m^2$.
- **Inclusão de Textos Livres**: Rótulos de texto customizados com escolha de cor e tamanho de fonte.
- **Mão de Reposicionamento**: Arraste interativo de rótulos de áreas ($m^2$), cotas de régua e textos livres.

### 5. 📄 Exportação HD (PNG/PDF) & Prancha Técnica
- **Fidelidade Total de Cores & Texturas**: Renderização offscreen 4K/HD perfeita.
- **Auto-Fit Maximizados**: Terrenos verticais orientados a $90^\circ$ na prancha horizontal (até **95% da página A4**).
- **Seleção do Estilo do Fundo**: Escolha entre **Fundo Tema do Terreno** ou **Fundo Branco Limpo**.

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
| **Compra: Quarto** | `1` | Modo Compra |
| **Compra: Sala** | `2` | Modo Compra |
| **Compra: Cozinha** | `3` | Modo Compra |
| **Compra: Banheiro** | `4` | Modo Compra |
| **Compra: Exterior** | `5` | Modo Compra |
| **Compra: Customizado** | `6` | Modo Compra |
| **Concluir Rascunho / Régua** | `Enter` | Geral |
| **Cancelar Rascunho / Régua** | `Esc` | Geral |

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
