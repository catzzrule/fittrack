'use strict';
// Gamificação (XP, nível, missões, conquistas, sequência), sugestão de carga, mapa muscular e backup.
// Tudo é calculado a partir do histórico (S.logs); só os resgates de missões ficam guardados em S.claimed.
const Gam = (() => {
  const MAIN = ['Peito', 'Costas', 'Pernas', 'Ombros'];
  const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
  const weekStart = d => ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
  const fmt = n => String(+n.toFixed(1)).replace('.', ',');

  // ---------- estatísticas ----------
  function stats() {
    const logs = [...S.logs].sort((a, b) => a.date.localeCompare(b.date));
    const best = {}, days = new Set(), groups = new Set(), perWeek = {};
    let prCount = 0, sets = 0, volume = 0, maxKg = 0;
    for (const l of logs) {
      const g = exById(l.ex)?.g, wk = weekStart(parseD(l.date));
      const w = perWeek[wk] || (perWeek[wk] = { days: new Set(), sets: 0, prs: 0, gs: {} });
      days.add(l.date); w.days.add(l.date);
      const top = Math.max(0, ...l.sets.map(s => s.kg));
      if ((best[l.ex] || 0) > 0 && top > best[l.ex]) { prCount++; w.prs++; }
      best[l.ex] = Math.max(best[l.ex] || 0, top);
      sets += l.sets.length; w.sets += l.sets.length; maxKg = Math.max(maxKg, top);
      volume += l.sets.reduce((s, x) => s + x.reps * x.kg, 0);
      if (g) { groups.add(g); w.gs[g] = (w.gs[g] || 0) + l.sets.length; }
    }
    const goal = S.goal || 3, cur = weekStart(new Date());
    let run = 0, bestStreak = 0;
    const keys = Object.keys(perWeek).sort();
    if (keys.length) for (let w = keys[0]; w <= cur; w = addDays(w, 7)) {
      if ((perWeek[w]?.days.size || 0) >= goal) { run++; bestStreak = Math.max(bestStreak, run); } else if (w !== cur) run = 0;
    }
    return { days, totalDays: days.size, sets, volume, prCount, maxKg, groups, perWeek, streak: run, bestStreak };
  }

  // ---------- conquistas ----------
  const ACH = [
    { id: 'first', ico: '👟', n: 'Primeiro passo', d: 'Conclua seu primeiro treino', xp: 50, p: s => [s.totalDays, 1] },
    { id: 'd5', ico: '💪', n: 'Pegando o ritmo', d: 'Treine em 5 dias diferentes', xp: 80, p: s => [s.totalDays, 5] },
    { id: 'd15', ico: '🔥', n: 'Hábito criado', d: 'Treine em 15 dias', xp: 150, p: s => [s.totalDays, 15] },
    { id: 'd50', ico: '🏅', n: 'Rato de academia', d: 'Treine em 50 dias', xp: 300, p: s => [s.totalDays, 50] },
    { id: 'd100', ico: '👑', n: 'Lenda', d: 'Treine em 100 dias', xp: 600, p: s => [s.totalDays, 100] },
    { id: 'st2', ico: '📅', n: 'Duas seguidas', d: 'Bata a meta semanal 2 semanas seguidas', xp: 100, p: s => [s.bestStreak, 2] },
    { id: 'st4', ico: '🚀', n: 'Mês de ferro', d: 'Bata a meta 4 semanas seguidas', xp: 250, p: s => [s.bestStreak, 4] },
    { id: 'pr1', ico: '🏆', n: 'Novo recorde', d: 'Bata seu primeiro recorde de carga', xp: 80, p: s => [s.prCount, 1] },
    { id: 'pr10', ico: '🥇', n: 'Quebra-recordes', d: 'Bata 10 recordes de carga', xp: 250, p: s => [s.prCount, 10] },
    { id: 'k100', ico: '🏋️', n: 'Clube dos 100', d: 'Levante 100 kg em uma série', xp: 200, p: s => [s.maxKg, 100] },
    { id: 'v10', ico: '🧱', n: '10 toneladas', d: 'Some 10.000 kg de volume total', xp: 150, p: s => [s.volume, 10000] },
    { id: 'v100', ico: '🏗️', n: '100 toneladas', d: 'Some 100.000 kg de volume total', xp: 500, p: s => [s.volume, 100000] },
    { id: 'var', ico: '🎯', n: 'Corpo completo', d: 'Treine peito, costas, pernas e ombros', xp: 120, p: s => [MAIN.filter(g => s.groups.has(g)).length, 4] },
    { id: 'body', ico: '⚖️', n: 'De olho no corpo', d: 'Registre peso ou medidas 3 vezes', xp: 60, p: () => [S.body.length, 3] }
  ];
  const isOn = (a, s) => { const [c, m] = a.p(s); return c >= m; };

  // ---------- XP e nível ----------
  function xpOf(s) {
    const claimed = Object.values(S.claimed || {}).reduce((a, b) => a + (+b || 0), 0);
    return s.totalDays * 100 + s.sets * 10 + s.prCount * 50 + ACH.filter(a => isOn(a, s)).reduce((a, b) => a + b.xp, 0) + claimed;
  }
  function level(s) {
    const xp = xpOf(s), n = Math.max(1, Math.floor((1 + Math.sqrt(1 + 4 * xp / 125)) / 2));
    const lo = 125 * n * (n - 1), hi = 125 * (n + 1) * n;
    const title = n < 3 ? 'Iniciante' : n < 6 ? 'Focado' : n < 10 ? 'Avançado' : 'Elite';
    return { xp, n, lo, hi, pct: Math.round((xp - lo) / (hi - lo) * 100), title };
  }
  const snap = (s = stats()) => ({ xp: xpOf(s), level: level(s).n, ach: ACH.filter(a => isOn(a, s)).map(a => a.id) });

  // ---------- missões semanais ----------
  function missions(s) {
    const ws = weekStart(new Date()), w = s.perWeek[ws] || { days: new Set(), sets: 0, prs: 0, gs: {} };
    const goal = S.goal || 3, gl = ['Pernas', 'Costas', 'Peito', 'Ombros', 'Glúteos'];
    const g = gl[Math.floor(parseD(ws).getTime() / 604800000) % gl.length];
    return [
      { id: 'days', n: `Treine ${goal} dias nesta semana`, cur: w.days.size, max: goal, xp: 150 },
      { id: 'sets', n: 'Complete 30 séries', cur: w.sets, max: 30, xp: 100 },
      { id: 'pr', n: 'Bata 1 recorde de carga', cur: w.prs, max: 1, xp: 120 },
      { id: 'grp', n: `Faça 10 séries de ${g.toLowerCase()}`, cur: w.gs[g] || 0, max: 10, xp: 100 },
      { id: 'body', n: 'Registre seu peso ou medidas', cur: S.body.some(b => b.date >= ws) ? 1 : 0, max: 1, xp: 40 }
    ].map(m => ({ ...m, key: `${ws}:${m.id}`, done: m.cur >= m.max, claimed: (S.claimed || {})[`${ws}:${m.id}`] !== undefined }));
  }
  function claim(key, xp) {
    S.claimed = S.claimed || {}; S.claimed[key] = xp; save();
    toast(`+${xp} XP resgatados!`); if (tab === 'perfil') viewPerfil(); else if (tab === 'inicio') viewInicio();
  }

  // ---------- sugestão de carga ----------
  function suggest(it, prev) {
    const e = exById(it.ex); if (!prev || !e) return {};
    const nums = (String(it.reps).match(/\d+/g) || []).map(Number); if (!nums.length) return {};
    const lo = nums[0], hi = nums[nums.length - 1], kg = Math.max(0, ...prev.sets.map(s => s.kg));
    if (!kg) return {};
    if (prev.sets.length >= it.sets && prev.sets.every(s => s.reps >= hi)) {
      const nk = kg + (['Pernas', 'Glúteos'].includes(e.g) ? 5 : 2.5);
      return { kg: nk, lo, up: true, text: `↑ Sugestão: ${fmt(nk)} kg — você fechou ${prev.sets.length}×${hi} com ${fmt(kg)} kg` };
    }
    if (prev.sets.filter(s => s.reps < lo).length > prev.sets.length / 2)
      return { text: `Última vez: ${fmt(kg)} kg com poucas repetições. Mantenha ou reduza um pouco a carga.` };
    return { text: `Repita ${fmt(kg)} kg e tente +1 repetição por série até chegar a ${hi}.` };
  }

  // ---------- mapa muscular ----------
  function weekSets() {
    const from = addDays(today(), -6), c = {};
    S.logs.filter(l => l.date >= from).forEach(l => { const g = exById(l.ex)?.g; if (g) c[g] = (c[g] || 0) + l.sets.length; });
    return c;
  }
  function muscleMap(c) {
    const f = g => { const n = c[g] || 0; return n === 0 ? '#252a35' : n < 6 ? '#8a3f29' : n < 12 ? '#d2552f' : n < 20 ? '#ff6b3d' : '#ffb13d'; };
    const N = '#252a35', st = 'stroke="#0d0f14" stroke-width="2"';
    const E = (cx, cy, rx, ry, fill, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${st}${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
    const Rr = (x, y, w, h, r, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${st}/>`;
    const body = cx => E(cx, 26, 20, 22, N) + Rr(cx - 8, 44, 16, 16, 4, N) + Rr(cx - 30, 172, 60, 20, 9, N)
      + E(cx - 70, 176, 9, 27, N, 6) + E(cx + 70, 176, 9, 27, N, -6) + E(cx - 74, 212, 8, 10, N) + E(cx + 74, 212, 8, 10, N);
    const fc = 105, bc = 315;
    const front = body(fc) + E(fc - 48, 76, 18, 14, f('Ombros')) + E(fc + 48, 76, 18, 14, f('Ombros'))
      + Rr(fc - 38, 66, 36, 40, 14, f('Peito')) + Rr(fc + 2, 66, 36, 40, 14, f('Peito')) + Rr(fc - 24, 110, 48, 62, 14, f('Abdômen'))
      + E(fc - 62, 118, 11, 28, f('Bíceps'), 8) + E(fc + 62, 118, 11, 28, f('Bíceps'), -8)
      + E(fc - 19, 236, 19, 46, f('Pernas')) + E(fc + 19, 236, 19, 46, f('Pernas')) + E(fc - 19, 312, 12, 32, f('Pernas')) + E(fc + 19, 312, 12, 32, f('Pernas'));
    const back = body(bc) + E(bc - 48, 76, 18, 14, f('Ombros')) + E(bc + 48, 76, 18, 14, f('Ombros'))
      + `<polygon points="${bc - 36},68 ${bc + 36},68 ${bc + 40},120 ${bc + 22},152 ${bc - 22},152 ${bc - 40},120" fill="${f('Costas')}" stroke="${f('Costas')}" stroke-width="6" stroke-linejoin="round"/>`
      + E(bc - 62, 118, 11, 28, f('Tríceps'), 8) + E(bc + 62, 118, 11, 28, f('Tríceps'), -8)
      + E(bc - 17, 186, 18, 18, f('Glúteos')) + E(bc + 17, 186, 18, 18, f('Glúteos'))
      + E(bc - 19, 250, 18, 36, f('Pernas')) + E(bc + 19, 250, 18, 36, f('Pernas')) + E(bc - 19, 312, 12, 32, f('Pernas')) + E(bc + 19, 312, 12, 32, f('Pernas'));
    return `<svg viewBox="0 0 420 372" class="mmap" role="img" aria-label="Mapa muscular dos últimos 7 dias">${front}${back}
      <text x="${fc}" y="364" text-anchor="middle" fill="#8d95a5" font-size="13">Frente</text><text x="${bc}" y="364" text-anchor="middle" fill="#8d95a5" font-size="13">Costas</text></svg>`;
  }

  // ---------- telas ----------
  const bar = p => `<div class="bar"><i style="width:${Math.min(100, p)}%"></i></div>`;
  function homeCards() {
    const s = stats(), lv = level(s), ms = missions(s), ready = ms.filter(m => m.done && !m.claimed).length, done = ms.filter(m => m.done).length;
    const days = S.lastBackup ? Math.floor((Date.now() - parseD(S.lastBackup)) / 864e5) : 999;
    const nag = S.logs.length >= 3 && days > 14 ? `
      <div class="card" style="border-color:#5a4a1d">
        <h3>💾 Faça um backup</h3>
        <div class="mut" style="margin:4px 0 10px">${S.lastBackup ? `Seu último backup foi há ${days} dias.` : 'Você ainda não fez backup.'} Seus dados ficam só neste navegador.</div>
        <button class="btn sm" onclick="Gam.exportData()">Exportar agora</button></div>` : '';
    return `${nag}${missionCard(s, ms)}`;
  }

  // ---------- anéis de progresso e missão em destaque (tela Início) ----------
  function ring(p, color, big, small, label) {
    const C = (2 * Math.PI * 34).toFixed(1);
    return `<div class="ring" onclick="go('perfil')"><div class="rwrap"><svg viewBox="0 0 80 80"><circle class="rt" cx="40" cy="40" r="34"/>
      <circle class="rg" cx="40" cy="40" r="34" style="--c:${C};--p:${Math.min(1, Math.max(0, p)).toFixed(3)};stroke:${color}"/></svg>
      <div class="rc"><b>${big}</b><span>${small}</span></div></div><em>${label}</em></div>`;
  }
  function rings() {
    const s = stats(), lv = level(s), ms = missions(s), goal = S.goal || 3, done = ms.filter(m => m.done).length;
    const wk = (s.perWeek[weekStart(new Date())] || { days: new Set() }).days.size;
    return `<div class="rings">${ring(wk / goal, 'var(--acc)', `${wk}/${goal}`, 'dias', 'Meta da semana')}
      ${ring(lv.pct / 100, '#ffc547', lv.n, lv.title, `Nível · ${lv.xp} XP`)}
      ${ring(done / ms.length, 'var(--ok)', `${done}/${ms.length}`, 'feitas', 'Missões')}</div>`;
  }
  function missionCard(s, ms) {
    const ready = ms.find(m => m.done && !m.claimed);
    const m = ready || ms.filter(x => !x.done).sort((a, b) => b.cur / b.max - a.cur / a.max)[0];
    if (!m) return `<div class="card mission done"><h3>🎉 Missões da semana completas!</h3><div class="mut" style="margin-top:4px">Você resgatou tudo. As novas chegam na segunda-feira.</div></div>`;
    return `<div class="card mission ${ready ? 'done' : ''}">
      <div class="lbl">${ready ? 'Missão cumprida!' : 'Missão em destaque'}</div>
      <b>${esc(m.n)}</b>${bar(m.cur / m.max * 100)}
      <div class="row sb"><span class="mut">${Math.min(m.cur, m.max)}/${m.max} · 🔥 ${s.streak} sem. seguida(s)</span>
        ${ready ? `<button class="btn ok sm" onclick="Gam.claim('${m.key}',${m.xp})">Resgatar +${m.xp} XP</button>` : `<span class="tag">+${m.xp} XP</span>`}</div>
    </div>`;
  }

  function viewPerfil() {
    $('#topAction').innerHTML = '<button class="btn sec sm" onclick="go(\'lembretes\')">⏰ Lembretes</button>';
    const s = stats(), lv = level(s), ms = missions(s), mc = weekSets();
    const missingG = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Abdômen'].filter(g => !mc[g]);
    $('#view').innerHTML = `
      <div class="home">
        <div>
          <div class="card lvl">
            <div class="row"><div class="lvlbadge">${lv.n}</div><div class="grow"><h3 style="font-size:20px">${lv.title}</h3><div class="mut">${lv.xp} XP · faltam ${lv.hi - lv.xp} para o nível ${lv.n + 1}</div></div></div>
            ${bar(lv.pct)}
            <div class="row sb" style="margin-top:14px">
              <div><b style="font-size:22px">🔥 ${s.streak}</b> <span class="mut">semana(s) seguida(s)</span><div class="mut">Melhor: ${s.bestStreak}</div></div>
              <div style="width:130px"><label style="margin:0 0 4px">Meta semanal</label>
                <select onchange="Gam.setGoal(this.value)">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option value="${n}" ${n === (S.goal || 3) ? 'selected' : ''}>${n} dia${n > 1 ? 's' : ''}</option>`).join('')}</select></div>
            </div>
          </div>
          ${Prog.profileCard()}
          <div class="sec-title">Missões da semana</div>
          ${ms.map(m => `<div class="card mrow ${m.done ? 'done' : ''}">
            <div class="grow"><b>${esc(m.n)}</b>${bar(m.cur / m.max * 100)}<span class="mut">${Math.min(m.cur, m.max)}/${m.max}</span></div>
            ${m.claimed ? '<span class="tag" style="color:var(--ok)">✓ resgatada</span>'
              : m.done ? `<button class="btn ok sm" onclick="Gam.claim('${m.key}',${m.xp})">Resgatar +${m.xp} XP</button>`
              : `<span class="tag">+${m.xp} XP</span>`}</div>`).join('')}
          <div class="mut">As missões renovam toda segunda-feira.</div>
        </div>
        <div>
          <div class="sec-title">Mapa muscular · últimos 7 dias</div>
          <div class="card">${muscleMap(mc)}
            <div class="legend"><span><i style="background:#252a35"></i>Nenhum</span><span><i style="background:#8a3f29"></i>Leve</span><span><i style="background:#d2552f"></i>Médio</span><span><i style="background:#ff6b3d"></i>Forte</span><span><i style="background:#ffb13d"></i>Intenso</span></div>
            <div class="mut" style="margin-top:10px">${Object.entries(mc).map(([g, n]) => `${g}: ${n} série(s)`).join(' · ') || 'Nenhum treino nos últimos 7 dias.'}</div>
            ${s.totalDays ? `<div class="box ${missingG.length ? 'err' : 'tip'}" style="margin-top:10px">${missingG.length ? `Sem treino há 7 dias: <b>${missingG.join(', ')}</b>. Que tal incluir no próximo treino?` : 'Ótimo! Todos os grupos principais foram treinados esta semana.'}</div>` : ''}
          </div>
        </div>
        <div class="full">
          <div class="sec-title">Conquistas · ${ACH.filter(a => isOn(a, s)).length}/${ACH.length}</div>
          <div class="achgrid">${ACH.map(a => { const on = isOn(a, s), [c, m] = a.p(s); return `
            <div class="ach ${on ? 'on' : ''}"><div class="aico">${a.ico}</div><b>${esc(a.n)}</b><span>${esc(a.d)}</span>
              ${on ? `<em>+${a.xp} XP</em>` : `<em>${Math.min(Math.floor(c), m).toLocaleString('pt-BR')}/${m.toLocaleString('pt-BR')}</em>`}</div>`; }).join('')}</div>
        </div>
        <div class="full">
          <div class="sec-title">Dados e backup</div>
          <div class="card">
            <div class="mut" style="margin-bottom:10px">Seus dados ficam apenas neste navegador. Se você limpar o histórico ou trocar de aparelho, eles somem — exporte um backup de vez em quando.${S.lastBackup ? ` Último backup: ${fmtDate(S.lastBackup)}.` : ''}</div>
            <div class="row" style="flex-wrap:wrap">
              <button class="btn" onclick="Gam.exportData()">⬇ Exportar backup</button>
              <button class="btn sec" onclick="$('#impFile').click()">⬆ Importar backup</button>
              <button class="btn del" onclick="Gam.resetAll()">Apagar tudo</button>
              <input id="impFile" type="file" accept=".json,application/json" hidden onchange="Gam.importFile(this)">
            </div>
          </div>
        </div>
      </div>`;
  }

  // ---------- IMC ----------
  const BMI = [
    [18.5, 'Abaixo do peso', '#4da3ff', 'Seu peso está abaixo da faixa considerada saudável.'],
    [25, 'Peso normal', '#3ddc97', 'Você está na faixa considerada saudável.'],
    [30, 'Sobrepeso', '#ffc547', 'Seu peso está um pouco acima da faixa considerada saudável.'],
    [35, 'Obesidade grau I', '#ff9a3d', 'Seu IMC está acima da faixa saudável.'],
    [40, 'Obesidade grau II', '#ff6b3d', 'Seu IMC está bem acima da faixa saudável.'],
    [99, 'Obesidade grau III', '#ff5470', 'Seu IMC está muito acima da faixa saudável.']
  ];
  function bmiBlock() {
    const w = [...S.body].filter(b => b.kg).sort((a, b) => a.date.localeCompare(b.date)).pop();
    const set = `<button class="btn sec sm" onclick="Gam.askHeight()">${S.height ? 'Alterar altura' : 'Informar altura'}</button>`;
    if (!S.height || !w) return `<div class="bmi"><div class="row sb"><b>IMC</b>${set}</div>
      <div class="mut" style="margin-top:6px">${!S.height ? 'Informe sua altura' : 'Registre seu peso'}${!S.height && !w ? ' e registre seu peso' : ''} para calcular o IMC.</div></div>`;
    const m = S.height / 100, v = w.kg / (m * m), c = BMI.find(x => v < x[0]);
    const pos = Math.min(100, Math.max(0, (v - 15) / 25 * 100)), p = x => (x - 15) / 25 * 100;
    const lo = 18.5 * m * m, hi = 24.9 * m * m;
    const diff = w.kg > hi ? `${fmt(w.kg - hi)} kg acima do limite da faixa saudável` : w.kg < lo ? `${fmt(lo - w.kg)} kg abaixo do limite da faixa saudável` : 'dentro da faixa saudável';
    return `<div class="bmi">
      <div class="row sb"><b>IMC</b>${set}</div>
      <div class="row" style="margin-top:6px;align-items:baseline"><span class="bigtime">${fmt(v)}</span><span class="tag" style="background:${c[2]}26;color:${c[2]};font-size:13px">${c[1]}</span></div>
      <div class="bmibar" style="background:linear-gradient(90deg,#4da3ff 0 ${p(18.5)}%,#3ddc97 ${p(18.5)}% ${p(25)}%,#ffc547 ${p(25)}% ${p(30)}%,#ff9a3d ${p(30)}% ${p(35)}%,#ff5470 ${p(35)}% 100%)"><i style="left:${pos}%"></i></div>
      <div class="bmiscale"><span>15</span><span>18,5</span><span>25</span><span>30</span><span>35</span><span>40</span></div>
      <div style="margin-top:8px;font-size:14px">${c[3]}</div>
      <div class="mut" style="margin-top:4px">Faixa saudável para ${S.height} cm: ${fmt(lo)}–${fmt(hi)} kg (${diff}).</div>
      <div class="mut" style="margin-top:6px;font-size:12px">O IMC não separa músculo de gordura: quem treina pode ter IMC alto sem excesso de gordura. Use junto com as medidas de cintura e, em caso de dúvida, procure um profissional de saúde. Vale para adultos.</div>
    </div>`;
  }
  function askHeight() {
    openSheet(`<h2>Sua altura</h2><div class="mut">Usada apenas para calcular o IMC. Fica só neste aparelho.</div>
      <label>Altura (cm)</label><input id="hIn" inputmode="numeric" placeholder="Ex.: 170" value="${S.height || ''}">
      <div class="row" style="margin-top:16px"><div class="grow"></div><button class="btn sec" onclick="closeSheet()">Cancelar</button><button class="btn" onclick="Gam.saveHeight()">Salvar</button></div>`);
  }
  function saveHeight() {
    let h = num($('#hIn').value); if (h > 0 && h < 3) h *= 100;
    if (h < 100 || h > 250) return toast('Informe uma altura entre 100 e 250 cm');
    S.height = Math.round(h); save(); closeSheet(); go(tab);
  }

  function setGoal(v) { S.goal = Math.min(7, Math.max(1, +v || 3)); save(); viewPerfil(); }

  // ---------- resumo ao terminar um treino ----------
  function summary(before, info) {
    const s = stats(), a = snap(s), gained = a.xp - before.xp, up = a.level > before.level;
    const novas = ACH.filter(x => a.ach.includes(x.id) && !before.ach.includes(x.id));
    const ready = missions(s).filter(m => m.done && !m.claimed).length;
    openSheet(`
      <div style="text-align:center">
        <div style="font-size:54px">${up ? '🎉' : '💪'}</div>
        <h2>Treino concluído!</h2>
        <div class="bigtime" style="color:var(--acc)">+${gained} XP</div>
        <div class="mut">${info.sets} série(s) registrada(s)</div>
      </div>
      ${up ? `<div class="box tip" style="text-align:center"><b>⬆ Subiu para o nível ${a.level}!</b> · ${level(s).title}</div>` : ''}
      ${info.prs.length ? `<div class="box tip"><b>🏆 Recorde(s) batido(s)</b><ul>${info.prs.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
      ${novas.length ? `<div class="box tip"><b>🎖 Nova(s) conquista(s)</b><ul>${novas.map(x => `<li>${x.ico} ${esc(x.n)} (+${x.xp} XP)</li>`).join('')}</ul></div>` : ''}
      ${ready ? `<div class="box err" style="background:#2a2410;border-color:#5a4a1d"><b>${ready} missão(ões) pronta(s) para resgatar!</b></div>` : ''}
      <div class="row" style="margin-top:16px"><button class="btn sec grow" onclick="closeSheet()">Fechar</button>
        <button class="btn grow" onclick="closeSheet();go('perfil')">${ready ? 'Resgatar missões' : 'Ver perfil'}</button></div>`);
  }

  // ---------- backup ----------
  const DEFAULTS = () => ({ routines: [], logs: [], body: [], reminders: [], custom: [], claimed: {}, goal: 3, lastBackup: '', height: 0, profile: null, onboarded: false });
  function exportData() {
    S.lastBackup = today(); save();
    const blob = new Blob([JSON.stringify({ app: 'fittrack', v: 1, exported: new Date().toISOString(), data: S }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `fittrack-backup-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup salvo na pasta de downloads'); if (tab === 'perfil') viewPerfil(); else if (tab === 'inicio') viewInicio();
  }
  function importFile(input) {
    const f = input.files[0]; input.value = ''; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result), d = j.data || j;
        if (!d || !Array.isArray(d.logs) || !Array.isArray(d.routines)) throw 0;
        if (!confirm(`Importar este backup?\n${d.routines.length} treino(s), ${d.logs.length} registro(s).\nIsso SUBSTITUI os dados atuais deste aparelho.`)) return;
        const n = Object.assign(DEFAULTS(), d);
        ['routines', 'logs', 'body', 'reminders', 'custom'].forEach(k => { if (!Array.isArray(n[k])) n[k] = []; });
        if (typeof n.claimed !== 'object' || !n.claimed) n.claimed = {};
        const safe = x => x && typeof x.id === 'string' && /^[\w-]+$/.test(x.id);
        n.custom = n.custom.filter(safe); n.routines = n.routines.filter(safe); n.body = n.body.filter(safe); n.reminders = n.reminders.filter(safe);
        S = n; save(); toast('Backup importado!'); go('perfil');
      } catch { toast('Arquivo de backup inválido'); }
    };
    r.onerror = () => toast('Não foi possível ler o arquivo');
    r.readAsText(f);
  }
  function resetAll() {
    if (!confirm('Apagar TODOS os dados (treinos, histórico, medidas, lembretes)? Isso não pode ser desfeito.')) return;
    if (!confirm('Tem certeza? Recomendamos exportar um backup antes.')) return;
    S = DEFAULTS(); save(); toast('Dados apagados'); go('inicio');
  }

  return { rings, bmiBlock, askHeight, saveHeight, stats, snap, level, missions, claim, suggest, homeCards, viewPerfil, setGoal, summary, exportData, importFile, resetAll, DEFAULTS };
})();
