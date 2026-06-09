# Operação Ktisis - Sobrevivência Lunar

Projeto acadêmico desenvolvido para a **Global Solution 2026 da FIAP**. A proposta da Operação Ktisis é transformar conceitos de sustentabilidade, exploração espacial e gestão de recursos em uma experiência interativa: o jogador assume o comando de uma base lunar e precisa mantê-la funcionando por 10 semanas.

Durante a missão, cada decisão importa. O jogador responde desafios técnicos, coleta recursos operacionais, constrói módulos sustentáveis e acompanha o impacto das escolhas nos recursos vitais da base.

## Pitch

Assista ao pitch do projeto:

[https://youtu.be/LyQNm26bJTY](https://youtu.be/LyQNm26bJTY)

## Sobre o projeto

A Operação Ktisis simula um cenário de sobrevivência lunar em que energia, água, oxigênio e alimentos precisam permanecer acima de zero até o fim da décima semana.

O jogo conecta conteúdos de ciência, tecnologia e sustentabilidade com decisões práticas. Ao responder perguntas corretamente, o jogador recebe mais recursos para construir ou melhorar módulos da base. Ao final de cada semana, a simulação calcula produção, consumo e risco da missão.

## Funcionalidades

- Site responsivo com navegação entre Home, Impactos, Como Jogar e Simulação.
- Pitch em vídeo incorporado na página inicial.
- Quiz educativo com 3 perguntas por semana.
- Sistema de recursos operacionais: Minerais Lunares, Componentes Eletrônicos e Biomassa.
- Sistema de recursos vitais: Energia, Água, Oxigênio e Alimentos.
- Construção e upgrade de módulos estratégicos.
- Persistência de progresso com `localStorage`.
- Confirmação para reiniciar missão quando já existe uma partida em andamento.
- Visualização da evolução da base durante o jogo.
- Tela final com resultado e histórico da missão.

## Ciclo do jogo

1. O jogador inicia a missão no briefing.
2. A cada semana, responde 3 perguntas educativas.
3. As respostas geram recursos operacionais.
4. O jogador escolhe construir, melhorar módulos ou guardar recursos.
5. A base calcula produção e consumo semanal.
6. A missão continua enquanto todos os recursos vitais estiverem acima de zero.
7. O objetivo é sobreviver até a semana 10.

## Módulos da base

| Módulo              | Função                                        |
| ------------------- | --------------------------------------------- |
| Painel Solar        | Aumenta a produção semanal de energia.        |
| Reciclador de Água  | Produz água e consome energia para operar.    |
| Gerador de Oxigênio | Produz oxigênio e consome energia.            |
| Estufa Hidropônica  | Produz alimentos e depende de água e energia. |

## ODS relacionadas

O projeto trabalha sustentabilidade a partir de decisões de jogo e se relaciona principalmente com:

- **ODS 4: Educação de Qualidade** - aprendizado por perguntas e tomada de decisão.
- **ODS 6: Água Potável e Saneamento** - reuso e reciclagem da água.
- **ODS 7: Energia Limpa e Acessível** - uso de painéis solares e gestão energética.
- **ODS 9: Inovação e Infraestrutura** - construção de uma base funcional em ambiente extremo.
- **ODS 12: Consumo e Produção Responsáveis** - uso consciente de recursos limitados.

## Tecnologias utilizadas

- **HTML5**
- **CSS3**
- **JavaScript**
- **Bootstrap 5**
- **Bootstrap Icons**
- **Three.js**
- **localStorage**

## Estrutura do projeto

```text
.
├── index.html
├── src
│   ├── assets
│   │   └── imgs
│   ├── css
│   │   ├── global-style.css
│   │   ├── home.css
│   │   ├── impactos.css
│   │   ├── comoJogar.css
│   │   ├── jogo.css
│   │   └── game
│   ├── js
│   │   ├── script.js
│   │   └── lunar_game
│   └── pages
│       ├── impactos.html
│       ├── comoJogar.html
│       ├── jogo.html
│       └── game-pages
│           ├── briefing.html
│           └── quiz.html
└── README.md
```

## Páginas principais

- `index.html`: página inicial, apresentação do projeto e pitch.
- `src/pages/impactos.html`: impactos, ODS e relação com sustentabilidade.
- `src/pages/comoJogar.html`: regras, recursos e ciclo do jogo.
- `src/pages/game-pages/briefing.html`: introdução da missão.
- `src/pages/game-pages/quiz.html`: experiência principal do jogo.

## Como executar

Este projeto é estático, então não precisa instalar dependências.

### Opção 1: acessar o projeto em deploy

Acesse o deploy do projeto pelo link:

[https://global-solution-gs-1.vercel.app/](https://global-solution-gs-1.vercel.app/)

### Opção 2: abrir com Live Server (recomendado)

Para uma melhor experiência, recomenda-se abrir o projeto primeiro com a extensão Live Server do VS Code. Assim, as páginas são carregadas por uma URL HTTP, o que melhora a navegação entre telas e evita bloqueios do navegador em recursos incorporados, como o pitch em vídeo.

Exemplo de URL:

```text
http://127.0.0.1:5500/index.html
```

### Opção 3: abrir diretamente pelo arquivo

Como alternativa, abra o arquivo `index.html` diretamente no navegador:

```text
index.html
```

### _-Observação sobre o pitch vídeo_

O pitch está incorporado na página inicial por iframe do YouTube quando o projeto é aberto por uma URL HTTP, como no Live Server.

Ao abrir o projeto diretamente por `file://`, alguns navegadores podem bloquear a configuração do player incorporado do YouTube. Por isso, nessa situação a página mostra um fallback visual com link para abrir o vídeo diretamente no YouTube.

## Equipe

### Equipe 1ESOB - FIAP 2026

- Estevão Nunes Gabriel - RM571413
- Guilherme Silva Costa - RM573826
- Matheus Leite Carneiro - RM568733
- Pedro Corvino Gamba - RM573756
- Pietro Gonçalves Ponciano - RM570521
