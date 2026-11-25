# FitTrack – app de treino

App de academia para acompanhar a evolução do corpo: exercícios com animação 3D, treinos por objetivo,
séries e cargas, evolução, missões e conquistas, IMC e lembretes.

Feito com HTML, CSS e JavaScript puros, sem dependências. Funciona offline (PWA) e guarda os dados só no
navegador do usuário (`localStorage`), sem servidor e sem conta.

## Como usar

- Abra `index.html` no navegador, **ou**
- publique a pasta em qualquer hospedagem estática (GitHub Pages, Netlify etc.) e use "Adicionar à tela inicial" no celular.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `index.html`, `styles.css` | Estrutura e visual |
| `app.js` | Telas principais (início, treinos, exercícios, evolução, lembretes) |
| `gamify.js` | XP, nível, missões, conquistas, mapa muscular, IMC e backup |
| `programs.js` | Programas por objetivo (séries, repetições, descanso, cargas) |
| `anim3d.js` | Motor do boneco 3D e as poses de cada exercício |
| `exercises.js` | Biblioteca de exercícios com passo a passo |
| `sw.js`, `manifest.json`, `icon.svg` | Offline e instalação no celular |

## Aviso

Os programas seguem recomendações gerais (ACSM, OMS e meta-análises) e não substituem a orientação de um
profissional de saúde ou de educação física. As cargas iniciais são estimativas conservadoras.
