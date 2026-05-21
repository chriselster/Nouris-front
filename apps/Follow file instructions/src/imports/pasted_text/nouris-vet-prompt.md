# Nouris — Design Prompt para LLM de UI (Vet Dashboard Web)

> Cole este prompt em ferramentas como **v0.dev**, **Lovable**, **Bolt.new**, **Galileo AI** ou diretamente no **Claude / GPT-4o** para gerar os componentes e telas do portal veterinário.

---

## CONTEXTO DO PRODUTO

Você é um Designer UI/UX Sênior especializado em **dashboards clínicos web** (React / Tailwind / Shadcn UI).

Crie as telas do **Nouris Vet Portal** — um painel web que veterinários usam para:
- Gerenciar a lista de pacientes (pets)
- **Cadastrar novos animais** e vincular ao tutor
- Acompanhar histórico de peso e saúde
- Montar planos de dieta com cálculo reativo de macros
- Avaliar fotos de fezes enviadas pelos tutores (escala 1-7)
- Receber alertas clínicos automáticos

O tom visual é: **profissional, clínico sem ser frio, denso em informação sem ser poluído**. Referências: Linear, Vercel Dashboard, Notion — mas com identidade própria do Nouris.

---

## DESIGN TOKENS

```
Tipografia:       Inter (Google Fonts) — weights 400, 500, 600, 700
Cor primária:     #16A34A  (green-600 Tailwind)
Cor secundária:   #DCFCE7  (green-100 — surfaces de destaque)
Cor de alerta:    #DC2626  (red-600)
Cor de aviso:     #D97706  (amber-600)
Cor de sucesso:   #059669  (emerald-600)
Background:       #FFFFFF (light) / #09090B (dark — zinc-950)
Surface cards:    #FAFAFA (light) / #18181B (dark — zinc-900)
Border:           #E4E4E7 (light) / #27272A (dark — zinc-800)
Muted text:       #71717A (zinc-500)
Border radius:    8px cards, 6px inputs/botões, 12px modais
Sombras:          shadow-sm apenas (1px border preferível a sombra pesada)
Sistema:          Shadcn UI (New York style) + Tailwind CSS v3
Plataforma:       Web desktop-first (min-width: 1024px), responsivo até tablet
Layout:           Master-Detail fixo (sidebar 288px + main flex-1)
```

---

## ESTRUTURA DE NAVEGAÇÃO (Web)

```
App Shell (h-screen, overflow-hidden)
├── Sidebar (w-72, border-r, sticky)
│   ├── Logo + nome "Nouris Vet"
│   ├── Input de busca por nome do pet
│   ├── ScrollArea → lista de PatientCards
│   └── [Rodapé] Avatar do veterinário logado + botão Sair
│
└── Main Panel (flex-1, overflow-auto)
    ├── [Estado vazio] → instrução para selecionar um paciente
    └── [Pet selecionado] → PatientProfile
        ├── AlertBanner (condicional — peso flagged)
        ├── Header do pet (nome, espécie, raça, peso atual)
        ├── Tabs: Timeline | Gráficos | Dieta | Triagem de Fezes
        └── FAB / Botão fixo "Nova Consulta / Editar Dieta"
```

---

## TELAS A GERAR

### 1. TELA DE LOGIN
- Layout centralizado, card com logo Nouris
- Campo e-mail + senha
- Botão "Entrar" (verde primário, full-width)
- Link "Esqueci a senha"
- Sem cadastro público (acesso apenas por convite)

---

### 2. DASHBOARD PRINCIPAL — Estado Vazio
- Sidebar completa à esquerda com 3-4 PatientCards fictícios
- Main panel com ilustração minimalista de pata + mensagem:
  _"Selecione um paciente para ver o histórico clínico"_
- Botão de ação "Cadastrar novo animal" visível no topo direito da sidebar

---

### 3. DASHBOARD PRINCIPAL — Pet Selecionado
Mostra o layout Master-Detail completo com o perfil de um pet (ex: "Bolinha, Golden Retriever, 28 kg").

**Sidebar:**
- PatientCard destacado (bg-accent) para o selecionado
- Os outros cards com status badge colorido (Ativo/Pendente/Inativo)

**Main Panel — aba "Timeline":**
- Lista cronológica de registros de peso com linha do tempo visual
- Cada item: data, peso em kg, badge "Alerta" se flagged
- Filtro de período (últimos 30d / 90d / 1 ano)

**Main Panel — aba "Gráficos":**
- Gráfico de linha (Recharts) com evolução de peso
- Área sombreada abaixo da linha
- Marcadores vermelhos nos pontos com alerta
- Tooltip customizado ao hover

**Main Panel — aba "Dieta":**
- MacrosDisplay: 4 cards (Calorias, Proteína, Gordura, Carboidratos) com valores grandes
- Barra de progresso horizontal para cada macro (% do total)
- Lista de ingredientes com quantidade e contribuição calórica
- Botão "Editar Plano" → abre Sheet lateral (Calculadora de Dieta)

**Main Panel — aba "Triagem de Fezes":**
- Grid 3 colunas de cards com foto (ou placeholder)
- Escala Bristol 1-7 como botões inline em cada card
- Badge "Avaliado" (verde) / "Pendente" (âmbar) por card
- Data e hora do envio pelo tutor

---

### 4. ALERT BANNER (componente)
- Aparece no topo do Main Panel quando há alerta
- Fundo vermelho suave (`bg-red-50 border-red-200`)
- Ícone `AlertTriangle` + texto descritivo + botão "Ver detalhes"
- Fechável com X

---

### 5. CADASTRO DE NOVO ANIMAL (Sheet / Drawer lateral)
Abre como Sheet pela direita (w-[480px]) ao clicar em "Cadastrar animal".

**Seção 1 — Dados do animal:**
- Nome do pet* (Input)
- Espécie* (Select: Cão / Gato / Outro)
- Raça (Input com autocomplete)
- Data de nascimento (DatePicker)
- Peso atual em kg (Input numérico)
- Foto do pet (Upload com preview circular)
- Status (Select: Ativo / Inativo / Pendente)

**Seção 2 — Tutor responsável:**
- Buscar tutor existente (Input com dropdown de resultados)
- OU link "Convidar novo tutor por e-mail"

**Seção 3 — Observações clínicas iniciais:**
- Textarea livre
- Checkbox "Iniciar plano de dieta agora"

**Rodapé do Sheet:**
- Botão "Cancelar" (outline) + Botão "Cadastrar" (primário)

---

### 6. CALCULADORA DE DIETA (Sheet / Drawer lateral)
Abre como Sheet pela direita (w-[560px]) ao editar a dieta.

- Lista dinâmica de ingredientes com campos: nome, quantidade (g), calorias/100g
- Botão "+ Adicionar ingrediente"
- MacrosDisplay em tempo real (atualiza a cada keystroke)
- Gráfico de pizza (donut) com proporção proteína/gordura/carbs
- Campo de observações/instruções para o tutor
- Rodapé: "Salvar como rascunho" (ghost) | "Ativar plano" (primário)

---

### 7. TRIAGEM GLOBAL DE FEZES (View dedicada)
Acessível por ícone na sidebar ou tab especial.

- Header com contador: "X avaliações pendentes"
- Filtro por pet / por data
- Grid dos cards de fezes (mesmo componente do item 3, tab Triagem)
- Ao avaliar (clicar 1-7): card some com animação fade-out, contador decrementa
- Estado vazio: ícone de check verde + "Todas as avaliações em dia!"

---

### 8. PATIENT CARD (componente reutilizável)
```
┌─────────────────────────────────────┐
│ [Avatar 36px]  Bolinha              │
│               Golden Retriever · Cão │
│                              [Ativo] │
└─────────────────────────────────────┘
```
- Hover: `bg-accent` suave
- Selecionado: `bg-accent` persistente + borda esquerda verde 2px
- Badge de status: verde (Ativo), âmbar (Pendente), zinc (Inativo)

---

## REGRAS DE INTERAÇÃO

| Ação | Comportamento |
|---|---|
| Selecionar pet na sidebar | Main panel atualiza sem reload (SPA) |
| Navegar entre tabs | Sem perda de estado, sem spinner se dados em cache |
| Submeter score de fezes | Card desaparece com `animate-out fade-out` (150ms) |
| Abrir Sheet | Slide-in da direita com overlay (300ms ease) |
| Peso com alerta | AlertBanner aparece automaticamente no topo |
| Hover em PatientCard | Cursor pointer + background transition 150ms |
| Formulário inválido | Campos com `border-red-500` + mensagem inline abaixo |

---

## HIERARQUIA DE TAMANHOS (escala Tailwind)

```
Título de página (nome do pet):  text-2xl font-bold
Subtítulo / meta do pet:         text-sm text-muted-foreground
Valor de macro (ex: 320 kcal):   text-3xl font-bold
Label de macro (ex: Calorias):   text-xs text-muted-foreground uppercase
Texto de corpo:                  text-sm
Texto secundário:                text-xs text-muted-foreground
```

---

## DADOS FICTÍCIOS PARA MOCKUP

```
Veterinário:  Dra. Ana Costa  |  ana@nourisvet.com
Pets:
  • Bolinha  — Golden Retriever, 28 kg, Ativo  — alerta de peso
  • Luna     — Siamês, 3.8 kg, Ativo
  • Rex      — Pastor Alemão, 35 kg, Pendente
  • Mel      — Labrador, 22 kg, Inativo
  • Pipoca   — Poodle, 4.2 kg, Ativo

Dieta ativa do Bolinha:
  Ingredientes: Frango cozido 150g, Arroz branco 100g, Cenoura 50g, Óleo de coco 10g
  Macros: 412 kcal | Proteína 48g | Gordura 12g | Carboidratos 38g

Fotos de fezes pendentes: 3 (Luna × 1, Bolinha × 2)
```

---

## PROMPT FINAL PARA O MODELO

> "Aja como um Designer UI/UX Sênior e Desenvolvedor Front-end.
>
> Crie os componentes React em TypeScript usando **Tailwind CSS**, **Shadcn UI (New York)** e **Lucide Icons** conforme a especificação acima.
>
> Comece pela **Tela 5 — Cadastro de Novo Animal** (Sheet lateral) e pela **Tela 2 — Dashboard com estado vazio** mostrando o botão de cadastro.
>
> Use os dados fictícios fornecidos para popular os mocks. Todos os componentes devem ser tipados, usar `cn()` para merge de classes, e respeitar os tokens de design (cores, raio, tipografia) definidos acima.
>
> O sheet de cadastro deve ter validação de campos obrigatórios com feedback visual inline.
> O componente PatientCard deve aceitar prop `isSelected` para controlar o estado visual ativo."
