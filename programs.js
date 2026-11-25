'use strict';
// Programas por objetivo. As prescrições (séries, repetições, descanso, volume semanal, cardio)
// seguem recomendações de ACSM/OMS e meta-análises (ver SRC). As cargas iniciais são ESTIMATIVAS
// conservadoras baseadas no peso corporal (heurística própria, não vem dos estudos).

// ---------- exercícios extras (só texto; sem animação 3D) ----------
EXERCISES.push(
  { id: 'terra', n: 'Levantamento terra', g: 'Pernas', m: 'Glúteos, posteriores de coxa, lombar, costas', eq: 'Barra',
    steps: ['Pés na largura do quadril, barra sobre o meio dos pés.', 'Flexione quadril e joelhos e segure a barra na largura dos ombros, costas retas e peito aberto.', 'Empurre o chão com as pernas, mantendo a barra rente ao corpo, até ficar em pé com os glúteos contraídos.', 'Desça empurrando o quadril para trás e depois flexionando os joelhos, sem arredondar as costas.'],
    tips: ['Comece leve e peça para alguém conferir sua postura.', 'A barra deve deslizar encostada nas pernas.'], mistakes: ['Arredondar a lombar.', 'Puxar com os braços em vez de empurrar o chão.'] },
  { id: 'supino-halteres', n: 'Supino com halteres', g: 'Peito', m: 'Peitoral, tríceps, ombros', eq: 'Halteres e banco',
    steps: ['Deite no banco com os pés firmes no chão e um haltere em cada mão, na altura do peito.', 'Una as escápulas e empurre os halteres para cima até quase estender os cotovelos.', 'Desça devagar até sentir o peito alongar, cotovelos a ~45–70° do tronco.'],
    tips: ['Os halteres permitem uma amplitude maior que a barra.'], mistakes: ['Abrir demais os cotovelos.', 'Bater um haltere no outro no topo.'] },
  { id: 'flexao-joelhos', n: 'Flexão com joelhos apoiados', g: 'Peito', m: 'Peitoral, tríceps, core', eq: 'Peso do corpo',
    steps: ['Apoie as mãos um pouco mais abertas que os ombros e os joelhos no chão (use um colchonete).', 'Mantenha uma linha reta dos joelhos à cabeça, abdômen contraído.', 'Desça o peito até quase tocar o chão e empurre de volta.'],
    tips: ['É a progressão ideal para chegar à flexão completa.'], mistakes: ['Quadril empinado ou caído.'] },
  { id: 'remada-unilateral', n: 'Remada unilateral (serrote)', g: 'Costas', m: 'Dorsais, romboides, bíceps', eq: 'Halter / mochila',
    steps: ['Apoie uma mão e o joelho do mesmo lado num banco (ou cadeira firme), costas retas.', 'Com o outro braço estendido segurando o peso, puxe o cotovelo em direção ao quadril.', 'Contraia as costas por 1 segundo e desça devagar até esticar o braço.'],
    tips: ['Em casa, use uma mochila com livros ou uma garrafa de água cheia.'], mistakes: ['Girar o tronco para subir o peso.'] },
  { id: 'crucifixo-inverso', n: 'Crucifixo inverso', g: 'Ombros', m: 'Deltoide posterior, romboides', eq: 'Halteres / máquina',
    steps: ['Incline o tronco à frente com as costas retas e os halteres pendurados.', 'Abra os braços para os lados, cotovelos levemente flexionados, até a altura dos ombros.', 'Desça devagar, sem balançar o corpo.'],
    tips: ['Use carga leve; o músculo é pequeno.'], mistakes: ['Usar o impulso do tronco.'] },
  { id: 'rosca-martelo', n: 'Rosca martelo', g: 'Bíceps', m: 'Bíceps, braquiorradial', eq: 'Halteres',
    steps: ['Em pé, halteres ao lado do corpo com as palmas voltadas uma para a outra.', 'Flexione os cotovelos até os halteres chegarem perto dos ombros, mantendo a pegada neutra.', 'Desça devagar.'],
    tips: ['Cotovelos colados ao tronco.'], mistakes: ['Balançar o corpo.'] },
  { id: 'mergulho-banco', n: 'Mergulho no banco', g: 'Tríceps', m: 'Tríceps, peitoral inferior, ombros', eq: 'Banco / cadeira',
    steps: ['Apoie as mãos na borda de um banco atrás do corpo, pernas à frente.', 'Flexione os cotovelos descendo o quadril, mantendo o corpo perto do banco, até ~90°.', 'Empurre para cima até estender os cotovelos.'],
    tips: ['Dobre os joelhos para facilitar.'], mistakes: ['Ombros subindo em direção às orelhas.', 'Descer além de 90° se sentir incômodo no ombro.'] },
  { id: 'goblet', n: 'Agachamento goblet', g: 'Pernas', m: 'Quadríceps, glúteos, core', eq: 'Halter / kettlebell',
    steps: ['Segure um halter junto ao peito, pés um pouco além da largura dos ombros.', 'Agache mantendo o tronco ereto e os cotovelos passando entre os joelhos.', 'Suba empurrando o chão.'],
    tips: ['Ótimo para aprender o agachamento com segurança.'], mistakes: ['Joelhos caindo para dentro.', 'Calcanhares saindo do chão.'] },
  { id: 'bulgaro', n: 'Agachamento búlgaro', g: 'Pernas', m: 'Quadríceps, glúteos', eq: 'Banco + halteres / peso do corpo',
    steps: ['Apoie o peito do pé de trás num banco, um passo largo à frente com a outra perna.', 'Desça flexionando o joelho da frente até a coxa ficar paralela ao chão.', 'Empurre o pé da frente no chão para subir.'],
    tips: ['Passo mais longo e tronco levemente inclinado exigem mais dos glúteos.'], mistakes: ['Passo curto demais, com o joelho passando muito da ponta do pé.'] },
  { id: 'ponte-gluteo', n: 'Ponte de glúteos', g: 'Glúteos', m: 'Glúteos, posteriores de coxa', eq: 'Peso do corpo',
    steps: ['Deitado de costas, joelhos flexionados e pés no chão na largura do quadril.', 'Empurre os calcanhares e eleve o quadril até alinhar joelhos, quadril e ombros.', 'Contraia os glúteos por 1–2 segundos e desça controlando.'],
    tips: ['Para dificultar, faça com uma perna só ou com peso sobre o quadril.'], mistakes: ['Arquear demais a lombar no topo.'] },
  { id: 'abducao', n: 'Abdução de quadril', g: 'Glúteos', m: 'Glúteo médio e mínimo', eq: 'Máquina / elástico',
    steps: ['Sente na cadeira abdutora com as costas apoiadas e os joelhos juntos.', 'Abra as pernas contra a resistência sem tirar o quadril do assento.', 'Volte devagar, sem deixar o peso bater.'],
    tips: ['Em casa, use um elástico acima dos joelhos.'], mistakes: ['Usar impulso para abrir as pernas.'] },
  { id: 'elevacao-pernas', n: 'Elevação de pernas', g: 'Abdômen', m: 'Abdômen inferior, flexores do quadril', eq: 'Peso do corpo',
    steps: ['Deite de costas com a lombar colada ao chão e as pernas estendidas.', 'Eleve as pernas até 90°.', 'Desça devagar sem encostar os calcanhares no chão.'],
    tips: ['Dobre levemente os joelhos para facilitar.'], mistakes: ['Deixar a lombar arquear.'] },
  { id: 'bicicleta', n: 'Cardio: bicicleta', g: 'Cardio', m: 'Sistema cardiovascular, pernas', eq: 'Bicicleta ergométrica',
    steps: ['Ajuste o banco para o joelho ficar quase estendido na parte baixa da pedalada.', 'Aqueça 3–5 minutos em ritmo leve.', 'Mantenha ritmo moderado: você consegue falar frases curtas, mas não cantar.', 'Finalize com 3 minutos desacelerando.'],
    tips: ['Costas retas e ombros relaxados.'], mistakes: ['Banco baixo demais, sobrecarregando os joelhos.'] },
  { id: 'caminhada', n: 'Cardio: caminhada rápida', g: 'Cardio', m: 'Sistema cardiovascular', eq: 'Ao ar livre / esteira',
    steps: ['Comece com 3–5 minutos em ritmo leve.', 'Aumente para um passo firme: respiração acelerada, mas ainda dá para conversar.', 'Mantenha postura ereta, passos naturais e braços soltos.', 'Termine desacelerando por 3 minutos.'],
    tips: ['Se ficar fácil, aumente a velocidade ou procure subidas.'], mistakes: ['Passos longos demais, que sobrecarregam as canelas.'] },
  { id: 'polichinelo', n: 'Cardio: polichinelo', g: 'Cardio', m: 'Corpo todo', eq: 'Peso do corpo',
    steps: ['Em pé, pés juntos e braços ao lado do corpo.', 'Salte abrindo as pernas e levando os braços acima da cabeça.', 'Volte à posição inicial e repita em ritmo constante.'],
    tips: ['Versão de baixo impacto: dê um passo largo para cada lado, sem saltar.'], mistakes: ['Aterrissar com os joelhos travados.'] }
);

const Prog = (() => {
  const GOALS = {
    massa: { ico: '💪', n: 'Ganhar massa muscular', d: 'Hipertrofia: séries moderadas a pesadas, 2× por semana por músculo.' },
    emagrecer: { ico: '🔥', n: 'Emagrecer / perder gordura', d: 'Musculação para preservar músculo + cardio moderado regular.' },
    definicao: { ico: '✨', n: 'Definição (perder gordura e tonificar)', d: 'Treino de força para músculo + cardio. "Tonificar" = mais músculo e menos gordura.' },
    forca: { ico: '🏋️', n: 'Ganhar força', d: 'Exercícios básicos com cargas altas e poucas repetições.' },
    gluteos: { ico: '🍑', n: 'Foco em glúteos e pernas', d: 'Mais volume para glúteos e pernas, mantendo a parte superior.' },
    saude: { ico: '❤️', n: 'Saúde e condicionamento', d: 'Seguindo a OMS: força 2+ dias e cardio moderado semanal.' }
  };

  // role: main (básico pesado) | comp (composto) | iso (isolador) | core (abdômen)
  const SC = {
    massa: { main: { sets: 4, reps: '6-10', rest: 150 }, comp: { sets: 3, reps: '8-12', rest: 120 }, iso: { sets: 3, reps: '10-15', rest: 75 }, core: { sets: 3, reps: '12-20', rest: 60 }, note: 'Pare com ~2 repetições sobrando (RIR 2).' },
    forca: { main: { sets: 5, reps: '5', rest: 180 }, comp: { sets: 3, reps: '6-8', rest: 120 }, iso: { sets: 2, reps: '8-12', rest: 75 }, core: { sets: 3, reps: '12-20', rest: 60 }, note: 'Carga pesada (cerca de 80–85% do máximo). Descanse bem entre as séries.' },
    emagrecer: { main: { sets: 3, reps: '10-12', rest: 75 }, comp: { sets: 3, reps: '10-12', rest: 60 }, iso: { sets: 3, reps: '12-15', rest: 45 }, core: { sets: 3, reps: '15-20', rest: 45 }, note: 'Esforço moderado a alto, ~2 repetições sobrando.' },
    definicao: { main: { sets: 4, reps: '8-10', rest: 120 }, comp: { sets: 3, reps: '10-12', rest: 90 }, iso: { sets: 3, reps: '12-15', rest: 60 }, core: { sets: 3, reps: '15-20', rest: 45 }, note: 'Pare com ~2 repetições sobrando (RIR 2).' },
    gluteos: { main: { sets: 4, reps: '8-12', rest: 120 }, comp: { sets: 3, reps: '10-12', rest: 90 }, iso: { sets: 3, reps: '12-20', rest: 60 }, core: { sets: 3, reps: '12-20', rest: 60 }, note: 'Pare com ~2 repetições sobrando (RIR 2); contraia bem os glúteos.' },
    saude: { main: { sets: 2, reps: '10-12', rest: 90 }, comp: { sets: 2, reps: '10-15', rest: 75 }, iso: { sets: 2, reps: '12-15', rest: 60 }, core: { sets: 2, reps: '15-20', rest: 45 }, note: 'Esforço moderado; foque na técnica.' }
  };

  const CARDIO = { // [iniciante, intermediário] = [sessões, minutos]
    emagrecer: [[5, 30], [4, 50]], definicao: [[3, 35], [4, 40]], saude: [[5, 30], [5, 40]]
  };

  // Fração do peso corporal para a carga inicial de um iniciante (barra = carga total; halteres = por mão).
  const LF = { 'supino-reto': .35, 'supino-inclinado': .12, 'supino-halteres': .14, crucifixo: .06, 'puxada-frente': .4, 'remada-curvada': .3, 'remada-baixa': .35,
    agachamento: .4, 'leg-press': .8, afundo: .1, stiff: .3, terra: .5, 'cadeira-extensora': .3, 'mesa-flexora': .2, panturrilha: .4, 'hip-thrust': .4,
    desenvolvimento: .1, 'elevacao-lateral': .035, 'rosca-direta': .15, 'rosca-martelo': .06, 'triceps-corda': .2, 'triceps-testa': .12,
    goblet: .15, bulgaro: .08, abducao: .25, 'remada-unilateral': .12, 'crucifixo-inverso': .03 };

  const T = (n, it) => ({ n, it });
  const GYM = {
    full: [
      T('Corpo inteiro A', [['agachamento', 'main'], ['supino-reto', 'main'], ['remada-curvada', 'comp'], ['desenvolvimento', 'comp'], ['rosca-direta', 'iso'], ['prancha', 'core']]),
      T('Corpo inteiro B', [['stiff', 'main'], ['supino-inclinado', 'comp'], ['puxada-frente', 'comp'], ['afundo', 'comp'], ['triceps-corda', 'iso'], ['abdominal', 'core']]),
      T('Corpo inteiro C', [['leg-press', 'main'], ['supino-halteres', 'comp'], ['remada-unilateral', 'comp'], ['elevacao-lateral', 'iso'], ['rosca-martelo', 'iso'], ['panturrilha', 'iso']])],
    ul: [
      T('Superior A', [['supino-reto', 'main'], ['remada-curvada', 'main'], ['desenvolvimento', 'comp'], ['puxada-frente', 'comp'], ['rosca-direta', 'iso'], ['triceps-corda', 'iso']]),
      T('Inferior A', [['agachamento', 'main'], ['stiff', 'comp'], ['leg-press', 'comp'], ['mesa-flexora', 'iso'], ['panturrilha', 'iso'], ['prancha', 'core']]),
      T('Superior B', [['supino-inclinado', 'main'], ['remada-baixa', 'main'], ['puxada-frente', 'comp'], ['elevacao-lateral', 'iso'], ['rosca-martelo', 'iso'], ['triceps-testa', 'iso']]),
      T('Inferior B', [['leg-press', 'main'], ['hip-thrust', 'comp'], ['afundo', 'comp'], ['cadeira-extensora', 'iso'], ['panturrilha', 'iso'], ['abdominal', 'core']])]
  };
  const GLUTE = {
    full: [
      T('Corpo inteiro A (glúteos)', [['hip-thrust', 'main'], ['agachamento', 'comp'], ['puxada-frente', 'comp'], ['supino-halteres', 'comp'], ['abducao', 'iso'], ['prancha', 'core']]),
      T('Corpo inteiro B (glúteos)', [['stiff', 'main'], ['bulgaro', 'comp'], ['remada-baixa', 'comp'], ['desenvolvimento', 'comp'], ['panturrilha', 'iso'], ['abdominal', 'core']]),
      T('Corpo inteiro C (glúteos)', [['leg-press', 'main'], ['hip-thrust', 'comp'], ['remada-unilateral', 'comp'], ['elevacao-lateral', 'iso'], ['abducao', 'iso'], ['elevacao-pernas', 'core']])],
    ul: [
      T('Inferior A (glúteos)', [['hip-thrust', 'main'], ['agachamento', 'main'], ['stiff', 'comp'], ['abducao', 'iso'], ['panturrilha', 'iso'], ['prancha', 'core']]),
      T('Superior A', [['supino-halteres', 'comp'], ['puxada-frente', 'comp'], ['desenvolvimento', 'comp'], ['rosca-direta', 'iso'], ['triceps-corda', 'iso']]),
      T('Inferior B (glúteos)', [['leg-press', 'main'], ['bulgaro', 'comp'], ['mesa-flexora', 'iso'], ['abducao', 'iso'], ['ponte-gluteo', 'iso'], ['abdominal', 'core']]),
      T('Superior B', [['remada-baixa', 'comp'], ['supino-inclinado', 'comp'], ['elevacao-lateral', 'iso'], ['rosca-martelo', 'iso'], ['triceps-testa', 'iso']])]
  };
  const HOME = {
    full: [
      T('Corpo inteiro A (casa)', [['agachamento', 'main'], ['flexao', 'main'], ['remada-unilateral', 'comp'], ['ponte-gluteo', 'comp'], ['prancha', 'core']]),
      T('Corpo inteiro B (casa)', [['afundo', 'main'], ['flexao', 'comp'], ['mergulho-banco', 'comp'], ['remada-unilateral', 'comp'], ['abdominal', 'core']]),
      T('Corpo inteiro C (casa)', [['bulgaro', 'main'], ['flexao', 'comp'], ['remada-unilateral', 'comp'], ['hip-thrust', 'comp'], ['panturrilha', 'iso'], ['elevacao-pernas', 'core']])],
    ul: [
      T('Superior A (casa)', [['flexao', 'main'], ['remada-unilateral', 'main'], ['mergulho-banco', 'comp'], ['prancha', 'core']]),
      T('Inferior A (casa)', [['agachamento', 'main'], ['afundo', 'comp'], ['ponte-gluteo', 'comp'], ['panturrilha', 'iso'], ['abdominal', 'core']]),
      T('Superior B (casa)', [['flexao', 'comp'], ['remada-unilateral', 'comp'], ['mergulho-banco', 'iso'], ['elevacao-pernas', 'core']]),
      T('Inferior B (casa)', [['bulgaro', 'main'], ['hip-thrust', 'comp'], ['panturrilha', 'iso'], ['prancha', 'core']])]
  };

  const SRC = {
    acsm09: ['ACSM (2009) – Modelos de progressão no treino de força', 'https://pubmed.ncbi.nlm.nih.gov/19204579/'],
    acsm26: ['ACSM (2026) – Revisão guarda-chuva sobre treino de força', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823'],
    freq: ['Schoenfeld et al. (2016) – Frequência de treino e hipertrofia', 'https://pubmed.ncbi.nlm.nih.gov/27102172/'],
    vol: ['Revisão sistemática (2022) – Volume de treino e hipertrofia', 'https://pubmed.ncbi.nlm.nih.gov/35291645/'],
    volF: ['Schoenfeld et al. (2017) – Volume semanal e ganho de força', 'https://pubmed.ncbi.nlm.nih.gov/28755103/'],
    load: ['Schoenfeld et al. (2017) – Carga baixa vs. alta', 'https://pubmed.ncbi.nlm.nih.gov/28834797/'],
    loadN: ['Lopez et al. (2021) – Carga, hipertrofia e força (meta-análise)', 'https://pubmed.ncbi.nlm.nih.gov/33433148/'],
    wl: ['ACSM – Exercício para perda de peso', 'https://www.ideafit.com/acsm-on-weight-loss'],
    who: ['OMS (2020) – Diretrizes de atividade física', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/'],
    glute: ['Contreras et al. (2023) – Hip thrust vs. agachamento e glúteos', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10593473/'],
    novice: ['Stronger By Science – Treino de força para iniciantes', 'https://www.strongerbyscience.com/making-your-novice-strength-training-routine-more-effective/'],
    bw: ['NPR (2026) – Ganhar força sem pesos', 'https://www.npr.org/2026/01/14/nx-s1-5674895/building-strength-without-weights']
  };
  const TIPS = {
    massa: [['Meta de 10 a 20 séries por grupo muscular por semana: mais volume tende a render mais músculo, com retorno menor acima disso.', ['acsm26', 'vol']],
      ['Treinar cada músculo 2× por semana rendeu mais hipertrofia que 1× com o mesmo volume.', ['freq']],
      ['Cargas leves ou pesadas dão ganho muscular parecido quando as séries ficam perto da falha; a força cresce mais com cargas altas.', ['load', 'loadN']]],
    forca: [['Cargas altas (acima de ~60% do máximo; ~80–85% para 3–5 repetições) dão mais ganho de força.', ['load', 'loadN']],
      ['Mais séries semanais nos exercícios principais tendem a dar mais força (relação dose-resposta).', ['volF']],
      ['Para iniciantes, cerca de 3×5 nos básicos (agachamento, supino, remada, desenvolvimento) é uma base bem estabelecida.', ['novice']]],
    emagrecer: [['Só a musculação muda pouco o peso; ela serve para preservar/ganhar músculo enquanto você perde gordura.', ['wl']],
      ['Cardio moderado: 150 a 250 min por semana para emagrecer (200–300 ajuda a manter). Combine com um leve déficit calórico.', ['wl']],
      ['Musculação mínima de 2 dias por semana nos grandes grupos; aqui você faz mais que o mínimo.', ['wl', 'acsm09']]],
    definicao: [['"Definição" combina ganhar/manter músculo com perder gordura: treino de força com bom volume + cardio + déficit calórico leve e proteína.', ['wl', 'acsm26']]],
    saude: [['OMS: 150–300 min de atividade aeróbica moderada por semana e força para todos os grandes grupos em 2 ou mais dias.', ['who']]],
    gluteos: [['Hip thrust e agachamento geraram aumento de glúteo semelhante em 9 semanas, então o programa usa os dois.', ['glute']],
      ['Cada grupo é treinado de 2 a 3× por semana com 10+ séries semanais.', ['freq', 'acsm26']]],
    home: [['Em casa, sem carga extra, progrida aumentando repetições, desacelerando a descida e usando variações mais difíceis, sempre a ~2 repetições da falha.', ['bw', 'acsm26']]]
  };

  let W = null, PREV = null;
  const lastKg = () => { const b = [...S.body].filter(x => x.kg).sort((a, c) => a.date.localeCompare(c.date)).pop(); return b ? b.kg : ''; };
  const fmt = n => String(+n.toFixed(1)).replace('.', ',');
  const fmtRest = s => s < 120 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ' ' + (s % 60) + ' s' : ''}`;

  function estKg(ex, bw, ini, reps) {
    const lf = LF[ex]; if (!lf || !bw) return 0;
    const nums = (String(reps).match(/\d+/g) || [10]).map(Number), hi = nums[nums.length - 1];
    const kg = bw * lf * (ini ? 1 : 1.6) * (hi <= 6 ? 1.1 : hi >= 15 ? .8 : 1);
    return kg < 10 ? Math.max(2, Math.round(kg)) : Math.round(kg / 2.5) * 2.5;
  }

  function generate(o) {
    const ini = o.level === 'ini', home = o.place === 'home', goals = o.goals, forca = goals.includes('forca');
    const lift = goals.find(g => ['massa', 'forca', 'definicao', 'gluteos'].includes(g)) || goals[0];
    const other = goals.find(g => g !== lift && ['massa', 'definicao', 'gluteos'].includes(g));
    const lib = home ? HOME : goals.includes('gluteos') ? GLUTE : GYM;
    const tpl = o.days >= 4 ? lib.ul : lib.full.slice(0, o.days);
    const swap = ex => {
      if (ini && !forca && ex === 'agachamento' && !home) return 'goblet';
      if (ini && ex === 'flexao' && home) return 'flexao-joelhos';
      if (ini && ex === 'remada-curvada') return 'remada-unilateral';
      return ex;
    };
    const scheme = role => {
      let s = SC[lift];
      if (role === 'main' && forca) s = SC.forca;
      else if (lift === 'forca' && other && role !== 'main') s = SC[other];
      const r = { ...s[role] };
      if (ini) { if (r.sets > 3) r.sets = 3; if (role === 'iso' && r.sets > 2) r.sets = 2; }
      else if (['massa', 'definicao', 'gluteos'].includes(lift) && role === 'comp') r.sets = 4;
      r.note = s.note; return r;
    };
    const names = ['A', 'B', 'C', 'D'];
    const routines = tpl.map((t, i) => ({
      id: uid(), name: `Treino ${names[i]} – ${t.n}`,
      items: t.it.map(([ex0, role]) => {
        const ex = swap(ex0), sc = scheme(role), plank = ex === 'prancha';
        const reps = plank ? '30-45 s' : (ex === 'panturrilha' && home ? '15-20' : sc.reps);
        return { ex, sets: sc.sets, reps, kg: home ? 0 : estKg(ex, o.kg, ini, reps), rest: sc.rest, note: sc.note };
      })
    }));
    // cardio
    const cg = goals.find(g => CARDIO[g]);
    let cardio = null;
    if (cg) {
      const [n, min] = CARDIO[cg][ini ? 0 : 1], ex = home ? 'caminhada' : 'esteira';
      cardio = { n, min, total: n * min };
      routines.push({ id: uid(), name: `Cardio moderado (${min} min)`, items: [{ ex, sets: 1, reps: `${min} min`, kg: 0, rest: 60, note: 'Ritmo moderado: dá para falar frases curtas, mas não cantar.' }] });
    }
    // volume semanal por grupo
    const weekly = {};
    routines.forEach(r => r.items.forEach(it => { const g = exById(it.ex)?.g; if (g && g !== 'Cardio') weekly[g] = (weekly[g] || 0) + it.sets; }));
    const sched = { 2: 'Seg · Qui', 3: 'Seg · Qua · Sex', 4: 'Seg · Ter · Qui · Sex' }[Math.min(4, o.days)];
    const tips = [['Escolha uma carga com a qual você faça as repetições da meta deixando ~2 repetições sobrando. O app sugere aumentar quando você fechar todas as séries no topo da faixa.', []]];
    goals.forEach(g => (TIPS[g] || []).forEach(t => tips.push(t)));
    if (home) TIPS.home.forEach(t => tips.push(t));
    if (ini) tips.push(['Iniciantes começam com menos séries e evoluem rápido: foque em técnica e em treinar com regularidade.', ['acsm09']]);
    const used = new Set(); tips.forEach(t => t[1].forEach(k => used.add(k)));
    return { routines, cardio, weekly, sched, tips, src: [...used], lift };
  }

  // ---------- telas ----------
  const chip = (key, val, label, on) => `<button class="chip ${on ? 'on' : ''}" data-k="${key}" onclick="Prog.opt('${key}','${val}',this)">${label}</button>`;
  function open(first) {
    const p = S.profile || {};
    W = { goals: (p.goals || []).slice(), level: p.level || 'ini', days: p.days || 3, place: p.place || 'gym', kg: lastKg() };
    openSheet(`${first ? `<h2>Bem-vindo ao FitTrack! 👋</h2>
      <div class="mut">Para começar, conte qual é o seu objetivo. Eu monto treinos com séries, repetições, descanso e carga inicial para você.</div>`
      : `<h2>Montar programa por objetivo</h2>
      <div class="mut">Monto treinos com séries, repetições, descanso e carga inicial, baseados em recomendações do ACSM, da OMS e em meta-análises.</div>`}
      <div class="sec-title">1. Seu objetivo (até 2)</div>
      ${Object.entries(GOALS).map(([k, g]) => `<div class="goalcard ${W.goals.includes(k) ? 'on' : ''}" data-k="${k}" onclick="Prog.toggle('${k}')"><b>${g.ico} ${g.n}</b><span>${g.d}</span></div>`).join('')}
      <div class="sec-title">2. Experiência com musculação</div>
      <div class="row" style="flex-wrap:wrap">${chip('level', 'ini', 'Iniciante (até ~6 meses)', W.level === 'ini')}${chip('level', 'int', 'Intermediário', W.level === 'int')}</div>
      <div class="sec-title">3. Dias de musculação por semana</div>
      <div class="row">${[2, 3, 4].map(n => chip('days', n, n + ' dias', W.days === n)).join('')}</div>
      <div class="sec-title">4. Onde você treina</div>
      <div class="row">${chip('place', 'gym', 'Academia', W.place === 'gym')}${chip('place', 'home', 'Em casa', W.place === 'home')}</div>
      <div class="sec-title">5. Seu peso (para estimar as cargas)</div>
      <input inputmode="decimal" placeholder="kg" value="${W.kg}" oninput="Prog.setKg(this.value)">
      <div class="row" style="margin-top:18px"><button class="btn sec" onclick="${first ? 'Prog.skip()' : 'closeSheet()'}">${first ? 'Pular por enquanto' : 'Cancelar'}</button><div class="grow"></div><button class="btn" onclick="Prog.build()">Gerar programa</button></div>`);
  }
  function welcome() { S.onboarded = true; save(); open(true); }
  function skip() { S.onboarded = true; save(); closeSheet(); }
  function toggle(k) {
    const i = W.goals.indexOf(k);
    if (i >= 0) W.goals.splice(i, 1); else { W.goals.push(k); if (W.goals.length > 2) W.goals.shift(); }
    document.querySelectorAll('.goalcard').forEach(el => el.classList.toggle('on', W.goals.includes(el.dataset.k)));
  }
  function opt(key, val, btn) {
    W[key] = key === 'days' ? +val : val;
    document.querySelectorAll(`.chip[data-k="${key}"]`).forEach(c => c.classList.toggle('on', c === btn));
  }
  const setKg = v => { W.kg = num(v) || ''; };

  function build() {
    if (!W.goals.length) return toast('Escolha pelo menos um objetivo');
    PREV = { ...generate({ ...W, kg: +W.kg || 0 }), opts: { ...W } };
    const P = PREV, gl = W.goals.map(g => GOALS[g].n).join(' + ');
    openSheet(`<h2>Seu programa</h2>
      <div class="mut">${esc(gl)} · ${W.level === 'ini' ? 'Iniciante' : 'Intermediário'} · ${W.days} dias · ${W.place === 'home' ? 'Em casa' : 'Academia'}</div>
      <div class="box tip" style="margin-top:12px"><b>📅 Rotina semanal</b><br>Musculação: ${P.sched}${P.cardio ? `<br>Cardio: ${P.cardio.n}× por semana de ${P.cardio.min} min (≈ ${P.cardio.total} min/semana), em dias alternados ou após a musculação.${P.cardio.total < 150 ? ' Some caminhadas no dia a dia para chegar a 150 min por semana.' : ''}` : ''}</div>
      <div class="sec-title">Séries por semana por grupo</div>
      <div>${Object.entries(P.weekly).sort((a, b) => b[1] - a[1]).map(([g, n]) => `<span class="tag" style="color:${gcol(g)}">${esc(g)}: ${n}</span>`).join('')}</div>
      <div class="mut" style="margin-top:4px">Referência para hipertrofia: 10–20 séries por grupo por semana. "Pernas" soma quadríceps, posteriores e panturrilha.
        ${['massa', 'definicao', 'gluteos'].some(g => W.goals.includes(g)) && ['Peito', 'Costas', 'Ombros'].some(g => (P.weekly[g] || 0) < 10) ? (W.level === 'ini' ? ' Para quem está começando, menos que isso já funciona bem; aumente os dias de treino quando quiser mais volume.' : ' Alguns grupos ficaram abaixo de 10 séries: com 4 dias por semana o volume sobe.') : ''}</div>
      ${P.routines.map(r => `<div class="card rcard" style="margin-top:12px"><h3>${esc(r.name)}</h3>
        <ul>${r.items.map(it => { const e = exById(it.ex); return `<li>${esc(e.n)}<span>${it.sets}×${esc(it.reps)}${it.kg ? ' · ' + fmt(it.kg) + ' kg' : ''}${/min/.test(it.reps) ? '' : ' · desc. ' + fmtRest(it.rest)}</span></li>`; }).join('')}</ul></div>`).join('')}
      <div class="box err" style="background:#2a2410;border-color:#5a4a1d"><b>Sobre as cargas</b><br>${W.place === 'home' ? 'Em casa as cargas começam em 0 (peso do corpo): aumente repetições ou use mochila/halteres.' : (+W.kg ? 'As cargas iniciais são <b>estimativas conservadoras</b> pelo seu peso (barra = total; halteres = por mão). Elas não vêm dos estudos: ajuste na 1ª série até sentir ~2 repetições sobrando.' : 'Sem o peso corporal, as cargas ficam em 0: descubra a sua na 1ª série (deixe ~2 repetições sobrando).')}</div>
      <div class="sec-title">Por que esse programa</div>
      <ul class="why">${P.tips.map(t => `<li>${esc(t[0])}</li>`).join('')}</ul>
      <div class="sec-title">Fontes</div>
      <ul class="why src">${P.src.map(k => `<li><a href="${SRC[k][1]}" target="_blank" rel="noopener">${esc(SRC[k][0])}</a></li>`).join('')}</ul>
      <div class="mut">Programa geral, não individualizado: em caso de lesão, doença ou dúvidas, consulte um profissional de saúde ou de educação física.</div>
      <div class="row" style="margin-top:16px"><button class="btn sec" onclick="Prog.open()">← Ajustar</button><div class="grow"></div><button class="btn" onclick="Prog.save()">Salvar meus treinos</button></div>`);
  }

  function saveProgram() {
    const P = PREV; if (!P) return;
    const replace = S.routines.length ? confirm('Você já tem treinos salvos.\n\nOK = SUBSTITUIR pelos novos\nCancelar = ADICIONAR aos existentes') : false;
    if (replace) S.routines = [];
    S.routines.push(...P.routines);
    const o = P.opts;
    S.profile = { goals: o.goals, level: o.level, days: o.days, place: o.place, kg: +o.kg || 0 };
    if (+o.kg && +o.kg !== lastKg()) S.body.push({ id: uid(), date: today(), kg: +o.kg, waist: 0, chest: 0, arm: 0, thigh: 0 });
    save(); closeSheet(); go('treinos'); toast('Programa salvo! Bons treinos 💪');
  }

  function profileCard() {
    const p = S.profile;
    return `<div class="sec-title">Meu objetivo</div><div class="card">
      ${p && p.goals && p.goals.length ? `<div>${p.goals.map(g => GOALS[g] ? `<span class="tag" style="font-size:13px">${GOALS[g].ico} ${GOALS[g].n}</span>` : '').join('')}</div>
        <div class="mut" style="margin:6px 0 10px">${p.level === 'ini' ? 'Iniciante' : 'Intermediário'} · ${p.days} dias · ${p.place === 'home' ? 'Em casa' : 'Academia'}</div>`
        : '<div class="mut" style="margin-bottom:10px">Escolha seu objetivo e receba treinos com séries, repetições, descanso e carga inicial.</div>'}
      <button class="btn sm" onclick="Prog.open()">🎯 ${p && p.goals ? 'Refazer programa' : 'Montar programa por objetivo'}</button></div>`;
  }

  return { open, welcome, skip, toggle, opt, setKg, build, save: saveProgram, profileCard, generate, GOALS };
})();
