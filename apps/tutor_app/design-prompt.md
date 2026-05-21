# Nouris — Design Prompt para LLM de UI

> Cole este prompt em ferramentas como **v0.dev**, **Galileo AI**, **Lovable**, **Claude** ou **GPT-4o** para gerar as telas do app.

---

## CONTEXTO DO PRODUTO

Você é um designer UI/UX sênior especializado em apps de saúde mobile (Flutter / Material Design 3).
Crie as telas do **Nouris**, um app mobile para **tutores de pets** acompanharem a nutrição e saúde dos seus animais, prescrita por um veterinário.

O tom é: **acolhedor, clínico sem ser frio, moderno, confiável**. Pense em algo entre o Calm e o MyFitnessPal, mas para pets.

---

## DESIGN TOKENS

```
Tipografia:      Poppins (Google Fonts)
Cor primária:    #2E7D32  (verde-esmeralda)
Cor secundária:  #66BB6A  (verde-claro)
Cor de erro:     #D32F2F  (vermelho)
Cor de aviso:    #F9A825  (âmbar)
Surface (light): #FFFFFF / #F5F5F5
Surface (dark):  #121212 / #1E1E1E
Border radius:   12px (cards, inputs, botões)
Sombras:         suaves, elevation 1-2 apenas
Sistema:         Material Design 3 (Material You)
Plataforma:      iOS + Android (mobile apenas)
Safe areas:      respeitar notch e home indicator
```

---

## ESTRUTURA DE NAVEGAÇÃO

```
App Shell
├── BottomAppBar (3 abas + FAB central)
│   ├── [1] Início      — ícone: home_outlined
│   ├── [FAB] +         — ícone: add  (verde, elevado, centralizado)
│   ├── [2] Pets        — ícone: pets_outlined
│   └── [3] Perfil      — ícone: person_outline
│
└── Rotas fora do shell
    ├── /login          — tela de login
    ├── /onboarding/pet — wizard de cadastro do pet (3 passos)
    └── /link-qr        — scanner de QR Code
```

---

## TELAS A GERAR

### 1. LOGIN

**Rota:** `/login`
**Descrição:** Primeira tela que o usuário vê. Sem formulário de e-mail/senha — apenas login social.

**Layout:**
- Fundo branco com uma ilustração vetorial suave de um cachorro e gato juntos (estilo flat, traços arredondados, paleta verde)
- Logo "Nouris" em Poppins Bold, 32px, cor primária
- Subtítulo: *"Nutrição e monitoramento para seu pet"*, Poppins Regular, 14px, cinza
- Espaço generoso (48px) até os botões
- **Botão "Entrar com Google"**: FilledButton com ícone do Google, cor primária, largura total, 48px altura, border radius 12px
- **Botão "Entrar com Apple"**: FilledButton.tonal, ícone Apple, mesmas dimensões
- Espaçamento de 12px entre botões
- Rodapé discreto: *"Ao entrar, você concorda com nossos Termos de Uso"*, 11px, cinza-claro

---

### 2. ONBOARDING — CADASTRO DO PET (3 passos)

**Rota:** `/onboarding/pet`
**Descrição:** Wizard exibido quando o tutor faz login pela primeira vez e não tem pets.

**Header:** progress indicator linear (3 steps) com cor primária. Step atual em destaque.

#### Passo 1 — Identidade
- Campo: Nome do pet (input filled, placeholder "ex: Bob")
- Seleção de espécie: 2 cards lado a lado com ícone + label ("Cão" 🐕 / "Gato" 🐈). Card selecionado com borda primária e fundo verde-claro suave.
- CTA: "Próximo →" (FilledButton, largura total)

#### Passo 2 — Detalhes
- Campo: Raça (input com autocomplete)
- Campo: Data de nascimento (date picker material)
- Seleção de sexo: chips "Macho" / "Fêmea"
- Toggle: "Castrado(a)" (switch material)
- CTA: "Próximo →" + "← Voltar" (tonal)

#### Passo 3 — Foto (opcional)
- Círculo grande centralizado (140px) com ícone de câmera e texto "Adicionar foto"
- Ao selecionar, mostra preview circular com botão de reedição
- Texto: *"Você pode pular por agora"*
- CTA: "Concluir" (FilledButton)

---

### 3. HOME — LAUNCHBOARD

**Rota:** `/home`
**Descrição:** Dashboard principal. Deve passar a sensação de "tudo sob controle".

**Layout (scroll vertical):**

1. **Header** (sem AppBar): saudação dinâmica
   - Avatar do pet ativo (círculo 40px) à esquerda
   - *"Olá, [nome do tutor]!"* em Poppins SemiBold 18px
   - Ícone de sino (notificação) à direita
   - Subtexto: *"[nome do pet] está sendo monitorado"*

2. **Streak Calendar** (card com borda suave):
   - Título: "Consistência da semana"
   - 7 círculos representando os últimos 7 dias (Seg–Dom)
   - Círculo **preenchido** (verde primário) = dieta marcada ✓
   - Círculo **vazio** (cinza-claro) = não marcado
   - Círculo de **hoje** com borda destacada
   - Contador: *"5 dias seguidos 🔥"* em âmbar/laranja

3. **Card de Resumo do Pet**:
   - Foto do pet (circular, 56px) + nome + raça
   - Grid 2x2 com métricas rápidas:
     - Peso atual: *"4,2 kg"*
     - Último registro: *"Há 2 dias"*
     - BCS (Body Condition Score): *"3/9"*
     - Dieta ativa: *"Dieta Mista"*

4. **Próxima Tarefa** (card verde-claro com ícone):
   - Ícone: check_circle_outline
   - *"Marcar dieta de hoje"*
   - Botão inline: "Marcar agora" (tonal pequeno)

5. **Alerta de Sincronização** (se offline):
   - Banner âmbar no topo: *"⚠️ 2 registros aguardando sincronização"*
   - Ícone de nuvem com seta

---

### 4. PETS — LISTA DE PETS

**Rota:** `/pets`
**Descrição:** Lista de todos os pets do tutor.

**Layout:**
- AppBar: *"Meus Pets"* + botão "+" (adicionar novo pet)
- Lista de cards (um por pet):
  - Foto circular 56px à esquerda
  - Nome do pet (SemiBold 16px)
  - Espécie + raça (Regular 13px, cinza)
  - Chip de status: "Vinculado ao Dr. Silva" (verde-claro) OU "Sem veterinário" (cinza)
  - Seta chevron_right
- Card de "Adicionar pet" no final: tracejado com ícone "+" e texto "Cadastrar novo pet"

**Ao tocar em um pet → tela de Dashboard do Pet:**
- Tabs: Resumo / Dieta / Histórico
- Tab Resumo: gráfico de peso (linha, últimos 30 dias) + últimas fotos de fezes (grid 2 colunas)
- Tab Dieta: lista de ingredientes do snapshot JSONB com calorias e macros
- Tab Histórico: timeline vertical de eventos (pesagem, fezes, dieta)

---

### 5. FAB — BOTTOMSHEET DE REGISTRO RÁPIDO

**Trigger:** Botão "+" centralizado no BottomAppBar
**Componente:** ModalBottomSheet com drag handle no topo

**Conteúdo:**
- Título: *"O que deseja registrar?"* (Poppins Medium 16px)
- 3 ListTiles com ícone colorido à esquerda:
  1. 🟢 `monitor_weight_outlined` — **Registrar peso**  
     Subtexto: *"Último: 4,2 kg • Há 2 dias"*
  2. 📷 `camera_alt_outlined` — **Foto de fezes**  
     Subtexto: *"0/2 registros hoje"*
  3. ✅ `check_circle_outline` — **Marcar dieta do dia**  
     Subtexto: *"Não marcada ainda hoje"*

---

### 6. REGISTRO DE PESO

**Rota:** `/pet/:petId/logs/weight/add`
**Descrição:** Formulário de registro de peso com validação em tempo real.

**Layout:**
- AppBar: *"Registrar Peso"* + botão fechar (X)
- Campo de peso grande e centralizado:
  - Input gigante (48px font size) com unidade "kg" à direita
  - Teclado numérico decimal abre automaticamente
- **Estado normal:** borda cinza-claro
- **Estado de aviso (variação > 5%):**
  - Campo fica com borda **vermelha** + fundo vermelho-claro suave
  - Texto abaixo: *"⚠️ Variação alta em relação ao último registro (4,2 kg)"*
  - Texto em vermelho, Poppins Regular 12px
- Histórico recente: últimas 3 pesagens em chips (ex: "4,2 kg • 18/05")
- CTA: "Confirmar Registro" (FilledButton, desabilitado se campo vazio)

**AlertDialog de confirmação (variação > 5%):**
- Ícone: warning_amber_rounded em âmbar
- Título: *"Variação de peso alta"*
- Corpo: *"A variação foi maior que 5%. Mantenha os dados atualizados para análise do seu veterinário."*
- Botões: "Revisar" (tonal) | "Confirmar mesmo assim" (FilledButton)

---

### 7. REGISTRO DE FEZES

**Rota:** `/pet/:petId/logs/feces/add`
**Descrição:** Captura de foto de fezes com informações adicionais.

**Layout:**
- AppBar: *"Registrar Fezes"*
- Contador diário no topo: *"1/2 registros hoje"* (chip âmbar)
- Área de câmera/preview:
  - Se sem foto: retângulo arredondado (16:9) cinza-claro com ícone câmera + *"Tirar foto ou selecionar da galeria"*
  - Se com foto: preview da imagem comprimida com botão de retirar (X)
- Seleção de consistência: row de 4 chips (Bristol Scale simplificada): Dura / Normal / Pastosa / Líquida
- Campo opcional de observações (multiline, máx 200 chars)
- CTA: "Enviar Registro"
- Se limite diário atingido: banner vermelho *"Limite de 2 fotos por dia atingido"* + CTA desabilitado

---

### 8. DIETA — VISUALIZAÇÃO DO SNAPSHOT

**Rota:** `/pet/:petId/diet`
**Descrição:** Exibe a dieta prescrita pelo veterinário (read-only).

**Layout:**
- Header card verde com ícone 🥗:
  - *"Dieta Mista Prescrita"* (SemiBold)
  - *"Prescrita por Dr. Ana Costa • 15/05/2026"*
  - Badge: "Ativa"
- Seção "Ingredientes":
  - Lista de cards por ingrediente:
    - Nome do ingrediente (Bold)
    - Quantidade em gramas
    - Barra de progresso de macros (proteína / gordura / carboidrato) — mini chips coloridos
- Card de totais ao final:
  - Grid 2x2: Kcal total / Proteína / Gordura / Carboidrato
  - Valores em destaque (SemiBold verde)
- Seção "Checklist de hoje":
  - Checkbox grande: *"Segui a dieta hoje"*
  - Ao marcar: animação de confete suave + texto *"Ótimo! Registrado ✓"*

---

### 9. SCANNER DE QR CODE

**Rota:** `/link-qr`
**Descrição:** Câmera para escanear o QR Code gerado no dashboard do veterinário.

**Layout:**
- Fundo escuro (câmera ativa ocupa tela toda)
- Overlay com:
  - Quadrado de mira centralizado (viewfinder) com cantos arredondados e animação de pulso em verde
  - Texto acima: *"Aponte a câmera para o QR Code do seu veterinário"* (branco, sobre overlay escuro semi-transparente)
  - Texto abaixo: *"O código é exibido no painel web do veterinário"*
- **Estado de sucesso:**
  - Viewfinder fica verde com ícone ✓
  - Card de confirmação sobe do fundo: *"Veterinário encontrado: Dr. Ana Costa — Clínica Vida Animal"*
  - Botão "Confirmar vínculo" (FilledButton verde)
- **Estado de erro (403 — limite freemium):**
  - Card âmbar: *"Seu veterinário atingiu o limite de pacientes do plano gratuito. Peça a ele para atualizar o plano."*

---

### 10. PERFIL DO TUTOR

**Rota:** `/profile`
**Descrição:** Configurações do tutor.

**Layout:**
- Avatar grande centralizado (80px) com botão de edição
- Nome e e-mail do tutor
- Seções com ListTiles:
  - **Conta:** Editar perfil / Notificações / Privacidade
  - **Suporte:** Termos de Uso / Política de Privacidade / Contato
  - **Sessão:** "Sair" (vermelho) / "Excluir conta" (vermelho, com ícone aviso)
- Badge de versão do app no rodapé

---

## REGRAS DE ESTILO GLOBAIS

1. **Sem bordas duras** — usar elevation suave (Material 3 tonal surface)
2. **Cards:** `border-radius: 16px`, `padding: 16px`, fundo `surface` com leve sombra
3. **Ícones:** outlined por padrão; filled apenas quando o item está ativo/selecionado
4. **Estados vazios:** ilustração flat + texto descritivo + CTA (nunca uma lista vazia sem contexto)
5. **Loading:** Shimmer effect (skeleton) em lugar de spinners onde possível
6. **Cores de status:**
   - Verde (#2E7D32): sucesso, ativo, concluído
   - Âmbar (#F9A825): aviso, pendente, limite próximo
   - Vermelho (#D32F2F): erro, variação crítica, limite atingido
   - Cinza (#9E9E9E): inativo, sem dados
7. **Espaçamento:** múltiplos de 8px (8 / 16 / 24 / 32 / 48)
8. **Acessibilidade:** contraste mínimo WCAG AA; touch targets mínimos de 48x48px
9. **Dark mode:** todas as telas devem ter versão dark (surface → #1E1E1E, cards → #2C2C2C)

---

## FORMATO DE ENTREGA ESPERADO

Para cada tela, entregar:
- Layout em alta fidelidade (mockup ou código React/Flutter/HTML+CSS)
- Versão light + dark
- Estados: default / loading (shimmer) / empty state / error state
- Anotações de interação onde relevante

> **Ferramenta recomendada:** v0.dev (gera código React + Tailwind pronto) ou Figma AI
