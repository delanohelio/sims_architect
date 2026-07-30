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
- **Painel de Atalhos de Teclado Personalizados**: Permite re-vincular qualquer tecla para as ferramentas de Construção, categorias do Modo Compra, Zoom, Rotação e Marreta.

### 2. 🧱 Modo Construção 2D (`build`) & Sistema de Paredes Avançado
- **Ferramenta Dedicada "Mão (Selecionar)" `[S]`**:
  - Isolamento estrito de funções: na ferramenta de **Paredes `[W]`**, o clique no terreno **apenas desenha novas paredes**.
  - A seleção, o movimento por arrasto $(\Delta x, \Delta y)$ e a edição de paredes no Painel Inspetor ocorrem exclusivamente ao ativar a ferramenta **Mão `[S]`**.
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
  - Permite medir distâncias métricas entre dois pontos clicando e puxando o cursor com pré-visualização ao vivo da distância (ex: `4.50m`).
  - Tecla **Enter**: Salva e fixa a cota na tela.
  - Tecla **Esc**: Cancela e descarta a medida.
  - Estilos de linha customizáveis: **Pontilhada** (`dashed`), **Contínua** (`solid`) ou **Invisível** (`invisible`).
- **Rascunho Poligonal de Zonas ao Vivo**: Pré-visualização ao vivo de vértices ($P_1, P_2, P_3\dots$) e linhas guia com cálculo automático de área em $m^2$. Suporte a **Enter** (concluir) e **Esc** (cancelar).
- **Inclusão de Textos Livres**: Rótulos de texto customizados com escolha de cor e tamanho de fonte.
- **Mão de Reposicionamento**: Arraste interativo de rótulos de áreas ($m^2$), cotas de régua e textos livres.

### 5. 📄 Exportação HD (PNG/PDF) & Prancha Técnica
- **Fidelidade Total de Cores & Texturas**: Renderização offscreen 4K/HD perfeita.
- **Auto-Fit Maximizados**: Terrenos verticais orientados a $90^\circ$ na prancha horizontal (até **95% da página A4**).
- **Seleção do Estilo do Fundo**: Escolha entre **Fundo Tema do Terreno** ou **Fundo Branco Limpo**.

---

## ⌨️ Tabela de Atalhos de Teclado Padrão

| Ação | Tecla Padrão | Descrição |
| :--- | :---: | :--- |
| **Mão (Selecionar & Mover)** | `S` | Ativa a ferramenta Mão para selecionar/arrastar paredes |
| **Construir Parede** | `W` | Ativa o modo de desenho de paredes |
| **Pintar Parede** | `P` | Ativa a pintura dual-face de paredes |
| **Aplicação de Pisos** | `F` | Ativa a ferramenta de aplicação de pisos |
| **Portas & Janelas** | `D` | Ativa o catálogo de esquadrias |
| **Marreta / Borracha** | `H` / `Delete` | Ativa a ferramenta de remoção |
| **Compra: Quarto** | `1` | Seleciona a aba de móveis do Quarto |
| **Compra: Sala** | `2` | Seleciona a aba de móveis da Sala |
| **Compra: Cozinha** | `3` | Seleciona a aba de móveis da Cozinha |
| **Compra: Banheiro** | `4` | Seleciona a aba de móveis do Banheiro |
| **Compra: Exterior** | `5` | Seleciona a aba de decoração exterior |
| **Compra: Customizado** | `6` | Seleciona os móveis customizados salvos |
| **Rotacionar Móvel** | `R` | Rotaciona o móvel em +45° |
| **Alternar Grid** | `G` | Liga/Desliga a exibição do grid métrico |
| **Concluir Rascunho / Régua** | `Enter` | Conclui a zona ou fixa a régua de cota |
| **Cancelar Rascunho / Régua** | `Esc` | Descarta o rascunho de zona ou régua em andamento |

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
