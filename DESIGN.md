---
name: Estoque 065
description: Controle de expedição operacional e gestão física de câmara fria.
colors:
  primary: "#0E7C9C"
  neutral-bg: "#EEF3F4"
  surface: "#FFFFFF"
  ink-primary: "#12262C"
  ink-secondary: "#5B7078"
  brand-success: "#1F8A5B"
  brand-error: "#C93A42"
  brand-warning: "#B97A0F"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  glacial: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.glacial}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "rgba(14, 124, 156, 0.9)"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.glacial}"
    padding: "20px"
---

# Design System: Estoque 065

## 1. Overview

**Creative North Star: "Glacial Operacional"**

O sistema de design do Estoque 065 é projetado expressamente para fins industriais e operacionais. Ele resolve a interface sob condições severas de uso prático: operadores de fábrica no celular (com luvas, mãos úmidas ou sob reflexo direto de luz) e gerentes em desktops monitorando planilhas e relatórios densos. O sistema prioriza legibilidade de altíssimo contraste, áreas de toque amplas e feedback imediato de sucesso sobre qualquer micro-interação.

Rejeitamos interfaces web genéricas espremidas na tela mobile, cores pastéis desbotadas e elementos clicáveis minúsculos. A interface deve ser direta, limpa e transmitir robustez e confiança técnica.

**Key Characteristics:**
- Foco em usabilidade móvel com keypad virtual otimizado para dedos.
- Cores frias de alto contraste inspiradas em gelo, aço e expedição.
- Feedback de confirmação tátil/visual imediato (comprovante estilo romaneio e toasts).
- Densidade visual equilibrada (limpa no mobile e bem aproveitada no desktop).

## 2. Colors

A paleta de cores inspira-se no ambiente de refrigeração e aço escovado, contrastando um azul glacial profundo com tons escuros funcionais de alta visibilidade.

### Primary
- **Azul Glacial** (#0E7C9C): A cor de marca e elemento principal de ação no sistema. Usada para botões primários, links ativos e marcação de status importantes.

### Neutral
- **Fundo Glacial** (#EEF3F4): Cor de fundo principal da aplicação. Um cinza-azulado muito claro e frio que evita o brilho excessivo do branco total no celular.
- **Superfície Branca** (#FFFFFF): Usada para fundos de cards e modais, criando uma divisão visual sutil contra o fundo glacial.
- **Tinta Primária** (#12262C): Azul escuro quase negro. Usada para títulos e textos principais para garantir contraste máximo de leitura.
- **Tinta Secundária** (#5B7078): Cinza intermediário. Usada para descrições secundárias e ícones decorativos.

### Feedback
- **Verde Sucesso** (#1F8A5B): Indica finalização de transações corretas, confirmações e balanço de estoque positivo.
- **Vermelho Erro** (#C93A42): Usado para avisos de saldo insuficiente, exclusões e alertas críticos.
- **Amarelo Alerta** (#B97A0F): Usado para transações pendentes de retorno.

**The Contrast Rule.** Todo text principal ou botão de ação deve manter contraste superior a 4.5:1 contra a sua cor de superfície de fundo. Cores pastéis fracas são expressamente proibidas para rótulos de leitura.

**The Chamber Product Constraint Rule.** Sempre que uma câmara fria for selecionada em qualquer parte do sistema (módulo de lançamento, inventário ou filtros), as seleções de produtos devem ser restritas exclusivamente aos itens cadastrados para aquela câmara específica, evitando erros de entrada de dados e poluição visual.

## 3. Typography

**Display Font:** Inter, system-ui, -apple-system, sans-serif
**Body Font:** Inter, system-ui, -apple-system, sans-serif
**Label/Mono Font:** IBM Plex Mono, ui-monospace, SFMono-Regular, monospace

**Character:** Uma única família de alta legibilidade (Inter) para interfaces limpas e rápidas, combinada com uma fonte monoespaçada com suporte a alinhamento tabular para dados numéricos de estoque, placas e horários.

### Hierarchy
- **Display** (Extra Bold (800), clamp(2rem, 5vw, 3rem), 1.2): Usado para grandes títulos da central de cadastros e cabeçalhos de páginas administrativas.
- **Headline** (Bold (700), 18px, 1.3): Usado para títulos de seções e modais.
- **Title** (Semi Bold (600), 15px, 1.4): Usado para títulos de cards de produtos e cabeçalhos de tabelas.
- **Body** (Regular (400), 14px, 1.5): Usado para todos os textos descritivos e informativos.
- **Label** (Medium (500), 11px, 1.4, uppercase com tracking de 0.05em): Usado em fontes monoespaçadas para códigos de câmara, saldos numéricos e placas de veículos.

**The Tabular Numbers Rule.** Todas as quantidades numéricas de estoque, pesos, placas de veículos e horários devem utilizar a classe `.tabular-nums` com a fonte monoespaçada para garantir perfeito alinhamento de colunas em tabelas de auditoria.

## 4. Elevation

O sistema baseia-se em uma filosofia predominantemente plana para fundos e painéis de dados, desenhando profundidade através de bordas finas semi-transparentes de tom escuro.

### Shadow Vocabulary
- **Sombra Glacial** (`0 2px 8px rgba(18, 38, 44, 0.04)`): Sombra sutil de apoio em cards e cabeçalhos fixos para separá-los do plano de fundo.
- **Sombra Ativa** (`0 12px 24px -6px rgba(18, 38, 44, 0.06), 0 8px 12px -4px rgba(18, 38, 44, 0.04)`): Usada exclusivamente no estado hover de elementos interativos (cards clicáveis de categorias ou produtos).

**The Flat-By-Default Rule.** Cards e superfícies permanecem planos sob repouso, utilizando bordas de 1px (#5B7078 em opacidade 12% a 15%) para demarcação. Sombras e transições de elevação ocorrem apenas como resposta a hover do cursor ou clique físico do operador.

## 5. Components

### Buttons
- **Shape:** Cantos suavizados em raio de 10px (radius-glacial).
- **Primary:** Fundo Azul Glacial (#0E7C9C) com texto Branco (#FFFFFF) e preenchimento vertical de 14px para facilitar o toque no mobile.
- **Hover / Focus:** Transição de opacidade sutil (0.9 no hover) e redução de escala para 98% ao pressionar no celular.

### Cards / Containers
- **Corner Style:** 10px (radius-glacial).
- **Background:** Superfície Branca (#FFFFFF).
- **Border:** Borda fina de 1px sólida (`rgba(91, 112, 120, 0.15)`).

### Inputs / Fields
- **Style:** Fundo cinza suave (#EEF3F4) com borda fina de 1px.
- **Focus:** Borda passa a ser Azul Glacial (#0E7C9C) com anel de foco discreto.
- **Error:** Borda passa a ser Vermelho Erro (#C93A42) com fundo vermelho muito claro (#FCE8E6).

### Navigation
- **Sidebar Admin:** Barra fixa no desktop utilizando sticky com altura inteira da tela (`sticky top-0 h-screen`), com itens ativos em azul e fundo em tom escuro de `#12262C`.
- **Header Mobile:** Barra fixa superior de alta legibilidade mostrando a câmara ativa do colaborador em fonte monoespaçada e botão físico de voltar.

### Toast de Sucesso
- **Style:** Banner flutuante no topo do painel do colaborador com fundo verde suave (#E6F4EA), borda verde (#A3E2C9) e texto em verde escuro.
- **Duração:** Exibido de forma reativa por 4 segundos após lançamentos bem-sucedidos e sumindo suavemente com animação fade-in.

### Progress Bar de Estoque Físico
- **Style:** Linhas horizontais de progresso dentro de cada câmara no dashboard para mostrar a ocupação relativa de cada tipo de gelo, utilizando cores de status de forma sutil.

## 6. Do's and Don'ts

### Do:
- **Do** Manter botões de ação com altura mínima de 48px em todas as telas acessadas por celulares para facilitar o clique dos operadores.
- **Do** Utilizar números monoespaçados (`.tabular-nums`) para todo dado numérico de estoque ou de pesagem.
- **Do** Garantir contraste de no mínimo 4.5:1 nas cores de texto contra o fundo do card ou tela.
- **Do** Filtrar as listas de seleção de produtos assim que a câmara de destino for selecionada.

### Don't:
- **Don't** Utilizar bordas laterais coloridas maiores que 1px (side-stripes) como detalhes decorativos em alertas ou cards.
- **Don't** Utilizar gradientes de texto ou efeitos de glassmorphism em massa fora das marcações específicas pré-definidas.
- **Don't** Espremer tabelas densas do desktop no celular dos operadores (use listas ou wizards passo a passo).
- **Don't** Utilizar cantos arredondados excessivamente grandes (acima de 12px) em cards ou contêineres principais.
