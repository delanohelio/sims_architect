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
- **Presets Rápidos de Lote Sims**:
  - *Lote Padrão Sims* ($15\text{m} \times 30\text{m}$)
  - *Lote Urbano / Estreito* ($10\text{m} \times 20\text{m}$)
  - *Quadrado / Chalé* ($20\text{m} \times 20\text{m}$)
  - *Mansão / Lote Grande* ($25\text{m} \times 40\text{m}$)
- **Temas de Terreno**: *Grama Sims*, *Blueprint Azul*, *Dark Slate*, *Concreto Urbano*.
- **Grade Métrica & Snap**: Grid 1m, Subgrid 0.5m, Rótulos de Distância Métricos e Imantação (Snap to Grid).
- **Personalização de Atalhos de Teclado**: Painel em Configurações para re-vincular teclas para Zoom, Rotação de Câmera, Rotacionar Móvel, Marreta e Grid.

### 2. 🧱 Modo Construção 2D (`build`) & Sistema de Paredes Avançado
- **Construção de Paredes por Arrasto a partir de 0,1m (10cm)**:
  - Resolução de precisão de **0,1m** para desenhar paredes curtas ou extensas com badge de cota métrica flutuante em tempo real.
- **Arrasto e Reposicionamento Livre de Paredes**:
  - Permite clicar sobre qualquer parede com a ferramenta de seleção/mão e arrastá-la livremente pelo terreno $(\Delta x, \Delta y)$.
  - **Restrição de Limites & Colisão**: Trava os deslocamentos nas bordas do terreno e evita colisão com móveis.
- **Edição Numérica Direta do Comprimento Exato**:
  - Painel **Inspetor de Parede Selecionada** que permite digitar o comprimento exato em metros (ex: `0.10m`, `2.50m`, `4.80m`, `12.00m`) e ajustar espessura ($0,05\text{m} \dots 0,80\text{m}$).
- **Esquadrias (Portas & Janelas Customizáveis)**:
  - **Fluxo Interativo de Inserção da Porta em 3 Passos** (Posicionamento, Dobradiça, Giro de Abertura).
  - **Porta de Correr sem Dobradiça (`door_sliding`)**: Instalação em 1 clique com desenho técnico de 2 painéis e setas `↔`.
  - Janelas com vidro temperado translúcido e reflexo.
  - **Esquadria Genérica Customizada**: Sliders de largura ($0.5\text{m} \dots 4.0\text{m}$), altura e cor.
- **Aplicação de Pisos & Pintura Dual-Face**:
  - Catálogo de texturas (Madeira, Mármore, Azulejo, Slate, Grama, Terra, Cor Sólida, Textura Customizada).
  - Pintura independente das duas faces da parede (Lado A e Lado B).

### 3. 🎨 Sistema Global de Cores & Texturas Personalizadas
- **Biblioteca Global de Texturas Compartilhada**: Upload de imagens ou Links URL salvos no estado global para reuso em Paredes, Pisos, Terreno e Móveis.
- **Renderização Pura 100% sem Tonalização**: Fidelidade total de cores em 2D e 3D.

### 4. 🛋️ Modo Compra / Mobiliário (`buy`)
- **Catálogo Multicategoria & Itens Customizados**: Abas temáticas (Quarto, Sala, Cozinha, Banheiro, Exterior, Customizado).
- **Móvel Genérico Customizado & Rotação Numérica**:
  - Configuração de Nome, Categoria, Largura, Profundidade, Altura, Formato (Caixa/Cilindro) e Aparência.
  - Digitação direta do ângulo de rotação de $0^\circ$ a $360^\circ$ ou rotação rápida por tecla (**R**).

### 5. 🏷️ Menu "Marcação" (Zonas, Áreas e Textos Livres)
- **Rascunho Poligonal de Zonas ao Vivo**: Pré-visualização ao vivo de vértices ($P_1, P_2, P_3\dots$) e linhas guia com cálculo automático de área em $m^2$. Suporte a **Enter** (concluir) e **Esc** (cancelar).
- **Inclusão de Textos Livres**: Ferramenta de rótulos de texto customizados (ex: *"Entrada Principal"*, *"Área Gourmet"*) com cor e tamanho de fonte.
- **Mão de Reposicionamento**: Arraste interativo de rótulos de áreas ($m^2$), textos livres e cotas de paredes.

### 6. 📄 Exportação HD (PNG/PDF) & Prancha Técnica
- **Fidelidade Total de Cores & Texturas**: Renderização offscreen 4K/HD perfeita.
- **Auto-Fit Maximizados**: Terrenos verticais/compridos são automaticamente rotacionados em $90^\circ$ para preencher até **95% da página A4**, eliminando margens brancas.
- **Seleção do Estilo do Fundo**: Escolha entre **Fundo Tema do Terreno** (Grama, Blueprint, Dark, Concreto) ou **Fundo Branco Limpo** para impressão.
- **PDF Multi-Páginas**: Página 1 com Prancha Arquitetônica HD e Páginas 2+ com Relatório Quantitativo de Materiais & Estruturas.

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

---

## 🤖 Guia para IAs Geradoras de Plantas Baixas

O projeto conta com um manual detalhado de instruções para ser entregue a LLMs (ChatGPT, Claude) em [docs/AI_MANUAL.md](file:///Users/delano/dev/sims-architect/docs/AI_MANUAL.md), permitindo que a IA atue como uma **IA Arquiteta** e gere arquivos JSON válidos prontos para importação no Sims Architect.
