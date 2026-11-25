'use strict';
// ---------- Estado ----------
const KEY = 'fittrack.v1';
const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
let S = load();
function load() {
  try { return Object.assign(Gam.DEFAULTS(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch { return Gam.DEFAULTS(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Não foi possível salvar os dados'); } }

// ---------- Utilidades ----------
const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => ymd(new Date());
const GCOL = { Peito: '#ff6b3d', Costas: '#4da3ff', Pernas: '#3ddc97', Glúteos: '#ff7ac8', Ombros: '#ffc547', Bíceps: '#a78bfa', Tríceps: '#22d3ee', Abdômen: '#f87171', Cardio: '#94a3b8' };
const gcol = g => GCOL[g] || '#8d95a5';
const gtile = g => `<div class="gtile" style="background:${gcol(g)}26;color:${gcol(g)}">${esc(g[0])}</div>`;
const fmtDate = s => s.split('-').reverse().slice(0, 2).join('/');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const allEx = () => [...EXERCISES, ...S.custom];
const exById = id => allEx().find(e => e.id === id);
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2500); }
function openSheet(html) { $('#sheet').innerHTML = html; $('#modal').hidden = false; $('#sheet').scrollTop = 0; }
function closeSheet() { $('#modal').hidden = true; stopRest(); Anim3D.stop(); if (tab === 'inicio') mountHome(); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeSheet(); });

// ---------- Navegação ----------
let tab = 'inicio', filterG = 'Todos', query = '', evoEx = '';
const TITLES = { inicio: 'Início', treinos: 'Meus treinos', exercicios: 'Exercícios', evolucao: 'Evolução', perfil: 'Perfil', lembretes: 'Lembretes' };
function go(t) {
  tab = t; $('#title').textContent = TITLES[t]; $('#topAction').innerHTML = '';
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === (t === 'lembretes' ? 'perfil' : t)));
  ({ inicio: viewInicio, treinos: viewTreinos, exercicios: viewExercicios, evolucao: viewEvolucao, perfil: Gam.viewPerfil, lembretes: viewLembretes })[t]();
  window.scrollTo(0, 0);
}

// ---------- Início ----------
function nextRoutine() {
  if (!S.routines.length) return null;
  const last = [...S.logs].reverse().find(l => l.r);
  const i = last ? S.routines.findIndex(r => r.id === last.r) : -1;
  return S.routines[(i + 1) % S.routines.length];
}
function viewInicio() {
  const now = new Date(), h = now.getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const dateTxt = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const dow = (now.getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i));
  const trained = new Set(S.logs.map(l => l.date));
  const wk = week.filter(d => trained.has(ymd(d))).length;
  const mk = ymd(now).slice(0, 7), mo = [...trained].filter(d => d.startsWith(mk)).length;
  const doneToday = trained.has(today());
  const nx = nextRoutine();
  const bodyS = [...S.body].filter(b => b.kg).sort((a, b) => a.date.localeCompare(b.date));
  const lastW = bodyS[bodyS.length - 1], prevW = bodyS[bodyS.length - 2];
  const diff = lastW && prevW ? +(lastW.kg - prevW.kg).toFixed(1) : null;

  const animIds = nx ? nx.items.map(it => it.ex).filter(id => Anim3D.has(id)) : [];
  homeEx = nx ? (animIds.includes(homeEx) ? homeEx : animIds[0] || '') : 'agachamento';
  const stage = homeEx ? `<div class="stage"><canvas id="homeAnim"></canvas><div class="animlbl" id="homeLbl"></div></div>` : '';

  const nextCard = nx ? `
    <div class="card next">
      <div class="lbl">${doneToday ? 'Treino de hoje concluído ✓ · Próximo' : 'Próximo treino'}</div>
      <h2>${esc(nx.name)}</h2>
      ${stage}
      <ul>${nx.items.slice(0, 6).map(it => { const e = exById(it.ex); return e ? `<li class="${Anim3D.has(e.id) ? 'pick' : ''} ${e.id === homeEx ? 'on' : ''}" data-ex="${e.id}" ${Anim3D.has(e.id) ? `onclick="homePick('${e.id}')"` : ''}>${esc(e.n)}<span>${it.sets}×${esc(it.reps)}</span></li>` : ''; }).join('')}
      ${nx.items.length > 6 ? `<li><span>+ ${nx.items.length - 6} exercício(s)</span></li>` : ''}</ul>
      ${animIds.length ? '<div class="mut" style="margin:-6px 0 12px;font-size:12px">Toque num exercício para ver a animação · arraste o boneco para girar</div>' : ''}
      <button class="btn full" onclick="startWorkout('${nx.id}')" ${nx.items.length ? '' : 'disabled'}>▶ Iniciar treino</button>
    </div>` : `
    <div class="card next">
      <div class="lbl">Vamos começar</div>
      <h2>Monte seu primeiro treino</h2>
      ${stage}
      <ol class="steps-intro">
        <li>Escolha seu objetivo e receba um programa pronto</li>
        <li>Inicie e registre séries e cargas</li>
        <li>Acompanhe sua evolução aqui</li>
      </ol>
      <button class="btn full" style="margin-top:16px" onclick="Prog.open()">🎯 Montar programa pelo meu objetivo</button>
      <div class="row" style="margin-top:10px"><button class="btn sec grow" onclick="sampleRoutine()">Usar modelo ABC</button><button class="btn sec grow" onclick="editRoutine()">Criar do zero</button></div>
    </div>`;

  $('#view').innerHTML = `
    <div class="home">
      <div class="full hello"><div class="mut">${esc(dateTxt)}</div><h2>${hello}! Vamos treinar?</h2></div>
      <div class="full week">${week.map((d, i) => `<div class="wd ${trained.has(ymd(d)) ? 'done' : ''} ${i === dow ? 'today' : ''}">${'SEGTERQUAQUISEXSÁBDOM'.match(/.{3}/g)[i]}<b>${d.getDate()}</b><i></i></div>`).join('')}</div>
      <div class="full">${Gam.rings()}</div>
      <div>${nextCard}</div>
      <div>
        ${Gam.homeCards()}
        <div class="card">
          <div class="row sb"><h3>Peso corporal</h3><button class="btn sec sm" onclick="newBody()">+ Registrar</button></div>
          ${lastW ? `<div class="bigtime" style="margin-top:8px">${lastW.kg} kg</div>
            <div class="mut">${diff === null ? 'Primeiro registro' : (diff > 0 ? '+' : '') + diff + ' kg desde o registro anterior'} · ${fmtDate(lastW.date)}</div>`
            : '<div class="mut" style="margin-top:8px">Registre seu peso para acompanhar a mudança do corpo.</div>'}
          ${Gam.bmiBlock()}
        </div>
        <div class="card">
          <div class="row sb"><h3>Lembretes</h3><button class="btn sec sm" onclick="go('lembretes')">Gerenciar</button></div>
          <div class="mut" style="margin-top:6px">${S.reminders.length ? S.reminders.length + ' lembrete(s) ativo(s). Próximo: ' + esc([...S.reminders].sort((a, b) => a.time.localeCompare(b.time))[0].time) : 'Crie um lembrete para não perder o treino.'}</div>
        </div>
      </div>
    </div>`;
  mountHome();
}
let homeEx = '';
function mountHome() { const c = $('#homeAnim'); if (c && homeEx && Anim3D.has(homeEx)) Anim3D.mount(c, homeEx, $('#homeLbl')); }
function homePick(id) {
  homeEx = id;
  document.querySelectorAll('.next li.pick').forEach(li => li.classList.toggle('on', li.dataset.ex === id));
  mountHome();
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(b.dataset.tab); });

// ---------- Treinos ----------
function lastLog(exId) { for (let i = S.logs.length - 1; i >= 0; i--) if (S.logs[i].ex === exId) return S.logs[i]; return null; }

function viewTreinos() {
  $('#topAction').innerHTML = '<div class="row"><button class="btn sec sm" onclick="Prog.open()">🎯 Por objetivo</button><button class="btn sm" onclick="editRoutine()">+ Novo</button></div>';
  const v = $('#view');
  if (!S.routines.length) {
    v.innerHTML = `<div class="empty">Você ainda não tem treinos.<br><br>
      <button class="btn" onclick="Prog.open()">🎯 Montar programa pelo meu objetivo</button><br><br>
      <button class="btn sec" onclick="editRoutine()">Criar do zero</button><br><br>
      <button class="btn sec" onclick="sampleRoutine()">Usar modelo ABC pronto</button></div>`;
    return;
  }
  v.innerHTML = `<div class="grid">${S.routines.map(r => {
    const groups = [...new Set(r.items.map(it => exById(it.ex)?.g).filter(Boolean))];
    return `
    <div class="card rcard">
      <div class="row sb"><h3>${esc(r.name)}</h3><button class="btn sec sm" onclick="editRoutine('${r.id}')">Editar</button></div>
      <div style="margin-top:6px">${groups.map(g => `<span class="tag" style="color:${gcol(g)}">${esc(g)}</span>`).join('')}</div>
      <ul>${r.items.map(it => { const e = exById(it.ex); return e ? `<li>${esc(e.n)}<span>${it.sets}×${esc(it.reps)}${it.kg ? ' · ' + it.kg + ' kg' : ''}</span></li>` : ''; }).join('') || '<li class="mut">Sem exercícios</li>'}</ul>
      <button class="btn full" onclick="startWorkout('${r.id}')" ${r.items.length ? '' : 'disabled'}>▶ Iniciar treino</button>
    </div>`; }).join('')}</div>`;
}

function sampleRoutine() {
  const mk = (name, list) => ({ id: uid(), name, items: list.map(([ex, sets, reps, kg]) => ({ ex, sets, reps, kg })) });
  S.routines.push(
    mk('Treino A – Peito e tríceps', [['supino-reto', 4, '8-10', 0], ['supino-inclinado', 3, '10', 0], ['crucifixo', 3, '12', 0], ['triceps-corda', 3, '12', 0], ['triceps-testa', 3, '10', 0]]),
    mk('Treino B – Costas e bíceps', [['puxada-frente', 4, '10', 0], ['remada-baixa', 3, '10', 0], ['remada-curvada', 3, '10', 0], ['rosca-direta', 3, '10', 0]]),
    mk('Treino C – Pernas e ombros', [['agachamento', 4, '8-10', 0], ['leg-press', 3, '12', 0], ['stiff', 3, '10', 0], ['panturrilha', 4, '15', 0], ['desenvolvimento', 3, '10', 0], ['elevacao-lateral', 3, '12', 0]]));
  save(); go('treinos'); toast('Modelo ABC criado – ajuste as cargas!');
}

let draft = null;
function editRoutine(id) {
  const r = S.routines.find(x => x.id === id);
  draft = r ? JSON.parse(JSON.stringify(r)) : { id: uid(), name: '', items: [], isNew: true };
  renderEditor();
}
function renderEditor() {
  const opts = allEx().map(e => `<option value="${e.id}">${esc(e.g)} – ${esc(e.n)}</option>`).join('');
  openSheet(`
    <h2>${draft.isNew ? 'Novo treino' : 'Editar treino'}</h2>
    <label>Nome do treino</label>
    <input id="rName" value="${esc(draft.name)}" placeholder="Ex.: Treino A – Peito" oninput="draft.name=this.value">
    <label>Exercícios</label>
    ${draft.items.map((it, i) => `
      <div class="card" style="background:var(--card2)">
        <div class="row sb"><b>${esc(exById(it.ex)?.n || '?')}</b><button class="btn del sm" onclick="draft.items.splice(${i},1);renderEditor()">Remover</button></div>
        <div class="row">
          <div class="grow"><label>Séries</label><input inputmode="numeric" value="${it.sets}" oninput="draft.items[${i}].sets=Math.max(1,parseInt(this.value)||1)"></div>
          <div class="grow"><label>Reps</label><input value="${esc(it.reps)}" oninput="draft.items[${i}].reps=this.value"></div>
          <div class="grow"><label>Carga (kg)</label><input inputmode="decimal" value="${it.kg || ''}" oninput="draft.items[${i}].kg=num(this.value)"></div>
        </div>
      </div>`).join('')}
    <div class="row"><select id="addEx">${opts}</select><button class="btn sec" onclick="draft.items.push({ex:$('#addEx').value,sets:3,reps:'10',kg:0});renderEditor()">+ Add</button></div>
    <div class="row" style="margin-top:16px">
      ${draft.isNew ? '' : `<button class="btn del" onclick="deleteRoutine('${draft.id}')">Excluir</button>`}
      <div class="grow"></div><button class="btn sec" onclick="closeSheet()">Cancelar</button><button class="btn" onclick="saveRoutine()">Salvar</button>
    </div>`);
}
function saveRoutine() {
  if (!draft.name.trim()) return toast('Dê um nome ao treino');
  const { isNew, ...r } = draft; r.name = r.name.trim();
  const i = S.routines.findIndex(x => x.id === r.id);
  if (i >= 0) S.routines[i] = r; else S.routines.push(r);
  save(); closeSheet(); go('treinos');
}
function deleteRoutine(id) {
  if (!confirm('Excluir este treino? O histórico de cargas é mantido.')) return;
  S.routines = S.routines.filter(r => r.id !== id); save(); closeSheet(); go('treinos');
}

// ---------- Sessão de treino ----------
let sess = null, restT = null;
function startWorkout(id) {
  const r = S.routines.find(x => x.id === id);
  sess = { rid: r.id, name: r.name, data: r.items.map(it => {
    const prev = lastLog(it.ex), sg = Gam.suggest(it, prev);
    return { ex: it.ex, reps: it.reps, rest: it.rest, hint: sg.text || it.note, up: sg.up, sets: Array.from({ length: it.sets }, (_, i) => ({
      reps: sg.up ? sg.lo : prev?.sets[i]?.reps ?? (parseInt(it.reps) || ''), kg: sg.kg ?? prev?.sets[i]?.kg ?? (it.kg || ''), done: false })) };
  }) };
  renderSession();
}
function renderSession() {
  openSheet(`
    <h2>${esc(sess.name)}</h2>
    <div class="mut">Marque ✓ cada série concluída. As cargas da última vez já vêm preenchidas.</div>
    <div class="prog"><i id="prog"></i></div>
    <div class="mut" id="progTxt"></div>
    <div id="rest" class="box tip rest" hidden></div>
    ${sess.data.map((d, i) => { const e = exById(d.ex); return `
      <div class="card" style="margin-top:12px">
        <div class="row sb"><div class="row">${gtile(e.g)}<div><h3>${esc(e.n)}</h3><div class="mut">Meta: ${d.sets.length}×${esc(d.reps)}</div></div></div><button class="btn sec sm" onclick="showEx('${e.id}',true)">Como fazer</button></div>
        ${d.hint ? `<div class="hint ${d.up ? 'up' : ''}">${esc(d.hint)}</div>` : ''}
        <div class="sethead" style="margin-top:12px"><span>Série</span><span>Reps</span><span>Carga (kg)</span><span>OK</span></div>
        ${d.sets.map((s, j) => `
          <div class="setrow ${s.done ? 'done' : ''}" id="sr-${i}-${j}">
            <span class="n">${j + 1}</span>
            <input inputmode="numeric" placeholder="reps" value="${s.reps}" oninput="sess.data[${i}].sets[${j}].reps=this.value">
            <input inputmode="decimal" placeholder="kg" value="${s.kg}" oninput="sess.data[${i}].sets[${j}].kg=this.value">
            <button onclick="toggleSet(${i},${j})">✓</button>
          </div>`).join('')}
      </div>`; }).join('')}
    <div class="row" style="margin-top:16px"><button class="btn sec" onclick="closeSheet()">Sair</button><div class="grow"></div><button class="btn ok" onclick="finishWorkout()">Finalizar treino</button></div>`);
  updateProg();
}
function updateProg() {
  const all = sess.data.flatMap(d => d.sets), done = all.filter(s => s.done).length;
  $('#prog').style.width = (all.length ? done / all.length * 100 : 0) + '%';
  $('#progTxt').textContent = `${done} de ${all.length} séries concluídas`;
}
function toggleSet(i, j) {
  const s = sess.data[i].sets[j]; s.done = !s.done;
  $(`#sr-${i}-${j}`).classList.toggle('done', s.done);
  updateProg();
  if (s.done) startRest(sess.data[i].rest || 60);
}
function startRest(sec) {
  stopRest(); const box = $('#rest'); if (!box) return;
  let left = sec; box.hidden = false;
  const tick = () => { box.textContent = `⏱ Descanso: ${left}s`; if (left-- <= 0) { stopRest(); toast('Descanso acabou – próxima série!'); try { navigator.vibrate?.(300); } catch {} } };
  tick(); restT = setInterval(tick, 1000);
}
function stopRest() { clearInterval(restT); restT = null; const b = $('#rest'); if (b) b.hidden = true; }
function finishWorkout() {
  const date = today(), before = Gam.snap(), prNames = []; let n = 0, prs = 0, nSets = 0;
  sess.data.forEach(d => {
    const sets = d.sets.filter(s => s.done && num(s.reps) > 0).map(s => ({ reps: num(s.reps), kg: num(s.kg) }));
    if (!sets.length) return;
    const best = Math.max(...sets.map(s => s.kg)), prevBest = Math.max(0, ...S.logs.filter(l => l.ex === d.ex).flatMap(l => l.sets.map(s => s.kg)));
    if (best > prevBest && prevBest > 0) { prs++; prNames.push(exById(d.ex).n); }
    S.logs.push({ id: uid(), date, ex: d.ex, sets, r: sess.rid }); n++; nSets += sets.length;
  });
  if (!n) return toast('Nenhuma série marcada como concluída');
  save(); closeSheet(); sess = null; go('inicio');
  Gam.summary(before, { sets: nSets, prs: prNames });
}

// ---------- Exercícios ----------
function viewExercicios() {
  $('#topAction').innerHTML = '<button class="btn sm" onclick="newCustom()">+ Meu</button>';
  const groups = ['Todos', ...new Set(allEx().map(e => e.g))];
  const list = allEx().filter(e => (filterG === 'Todos' || e.g === filterG) && e.n.toLowerCase().includes(query.toLowerCase()));
  $('#view').innerHTML = `
    <input placeholder="🔍 Buscar exercício" value="${esc(query)}" oninput="query=this.value;filterList()" style="margin-bottom:10px">
    <div class="chips">${groups.map(g => `<button class="chip ${g === filterG ? 'on' : ''}" onclick="filterG='${esc(g)}';viewExercicios()">${esc(g)}</button>`).join('')}</div>
    <div id="exList">${exCards(list)}</div>`;
}
function exCards(list) {
  return list.length ? `<div class="grid">${list.map(e => `
    <div class="card excard" onclick="showEx('${e.id}')">
      ${gtile(e.g)}
      <div><h3>${esc(e.n)}</h3><div class="mut">${esc(e.g)} · ${esc(e.eq || '')}</div></div>
      <span class="chev">›</span>
    </div>`).join('')}</div>` : '<div class="empty">Nenhum exercício encontrado</div>';
}
function filterList() {
  const list = allEx().filter(e => (filterG === 'Todos' || e.g === filterG) && e.n.toLowerCase().includes(query.toLowerCase()));
  $('#exList').innerHTML = exCards(list);
}
function showEx(id, fromSession) {
  const e = exById(id); if (!e) return;
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('como fazer ' + e.n + ' execução correta');
  const best = Math.max(0, ...S.logs.filter(l => l.ex === id).flatMap(l => l.sets.map(s => s.kg)));
  const back = fromSession ? 'renderSession()' : 'closeSheet()';
  openSheet(`
    <div class="row">${gtile(e.g)}<div><h2 style="margin:0">${esc(e.n)}</h2><div class="mut">${esc(e.g)} · ${esc(e.eq || '')}</div></div></div>
    ${Anim3D.has(e.id) ? `
      <canvas id="anim"></canvas>
      <div class="animlbl" id="animLbl"></div>
      <div class="animctl">
        <button class="chip" onclick="Anim3D.view(0)">Frente</button>
        <button class="chip" onclick="Anim3D.view(90)">Lado</button>
        <button class="chip" onclick="Anim3D.view(180)">Costas</button>
        <button class="chip" onclick="this.textContent=Anim3D.toggle()?'⏸ Pausar':'▶ Continuar'">⏸ Pausar</button>
        <button class="chip" onclick="this.classList.toggle('on');Anim3D.slow()">🐢 Lento</button>
      </div>
      <div class="mut" style="text-align:center">Arraste o boneco para girar</div>` : ''}
    <div class="mut" style="margin-top:10px">Músculos: ${esc(e.m || '—')}</div>
    ${best ? `<div class="pr" style="margin-top:6px">🏆 Seu recorde: ${best} kg</div>` : ''}
    ${e.steps ? `
      <h3 style="margin-top:16px">Passo a passo</h3>
      <ol class="steps">${e.steps.map(s => `<li><div>${esc(s)}</div></li>`).join('')}</ol>
      <div class="box tip"><b>✅ Dicas</b><ul>${e.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div class="box err"><b>⚠️ Erros comuns</b><ul>${e.mistakes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`
      : '<div class="box tip">Exercício personalizado – use o botão abaixo para ver vídeos de como executá-lo.</div>'}
    <div class="row" style="margin-top:14px">
      <a class="btn" href="${yt}" target="_blank" rel="noopener" style="text-decoration:none">▶ Ver vídeo</a>
      <div class="grow"></div>
      ${e.custom ? `<button class="btn del" onclick="delCustom('${e.id}')">Excluir</button>` : ''}
      <button class="btn sec" onclick="${back}">${fromSession ? 'Voltar ao treino' : 'Fechar'}</button>
    </div>
    <div class="mut" style="margin-top:12px">Em caso de dor ou dúvida, peça orientação a um profissional de educação física.</div>`);
  if (Anim3D.has(id)) Anim3D.mount($('#anim'), id, $('#animLbl'));
}
function newCustom() {
  const groups = [...new Set(allEx().map(e => e.g))];
  openSheet(`<h2>Novo exercício</h2>
    <label>Nome</label><input id="cName" placeholder="Ex.: Remada cavalinho">
    <label>Grupo muscular</label><select id="cGroup">${groups.map(g => `<option>${esc(g)}</option>`).join('')}</select>
    <div class="row" style="margin-top:16px"><div class="grow"></div><button class="btn sec" onclick="closeSheet()">Cancelar</button><button class="btn" onclick="saveCustom()">Salvar</button></div>`);
}
function saveCustom() {
  const n = $('#cName').value.trim(); if (!n) return toast('Digite o nome');
  S.custom.push({ id: 'c-' + uid(), n, g: $('#cGroup').value, m: '', eq: 'Personalizado', custom: true });
  save(); closeSheet(); viewExercicios();
}
function delCustom(id) { if (!confirm('Excluir este exercício?')) return; S.custom = S.custom.filter(e => e.id !== id); save(); closeSheet(); viewExercicios(); }

// ---------- Evolução ----------
function drawChart(canvas, pts, unit) {
  const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const c = canvas.getContext('2d'); c.scale(dpr, dpr); c.clearRect(0, 0, w, h);
  if (!pts.length) return;
  const pad = { l: 38, r: 14, t: 16, b: 24 };
  let min = Math.min(...pts.map(p => p.y)), max = Math.max(...pts.map(p => p.y));
  if (min === max) { min -= 1; max += 1; }
  const X = i => pad.l + (pts.length === 1 ? (w - pad.l - pad.r) / 2 : i * (w - pad.l - pad.r) / (pts.length - 1));
  const Y = v => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  c.font = '11px system-ui'; c.fillStyle = '#8b93a3'; c.strokeStyle = '#2b3040'; c.lineWidth = 1;
  for (let k = 0; k <= 3; k++) { const v = min + (max - min) * k / 3, y = Y(v); c.beginPath(); c.moveTo(pad.l, y); c.lineTo(w - pad.r, y); c.stroke(); c.fillText(v.toFixed(v % 1 ? 1 : 0), 4, y + 4); }
  c.strokeStyle = '#ff6b3d'; c.lineWidth = 2.5; c.beginPath();
  pts.forEach((p, i) => i ? c.lineTo(X(i), Y(p.y)) : c.moveTo(X(i), Y(p.y))); c.stroke();
  c.fillStyle = '#ff6b3d';
  pts.forEach((p, i) => { c.beginPath(); c.arc(X(i), Y(p.y), 3.5, 0, 7); c.fill(); });
  c.fillStyle = '#8b93a3';
  [0, pts.length - 1].filter((v, i, a) => a.indexOf(v) === i).forEach(i => c.fillText(fmtDate(pts[i].x), Math.min(X(i) - 12, w - 40), h - 6));
}

function viewEvolucao() {
  const logged = [...new Set(S.logs.map(l => l.ex))].filter(exById);
  if (!evoEx || !logged.includes(evoEx)) evoEx = logged[0] || '';
  const logs = S.logs.filter(l => l.ex === evoEx);
  const byDay = {}; logs.forEach(l => { byDay[l.date] = Math.max(byDay[l.date] || 0, ...l.sets.map(s => s.kg)); });
  const pts = Object.keys(byDay).sort().map(d => ({ x: d, y: byDay[d] }));
  const best = pts.length ? Math.max(...pts.map(p => p.y)) : 0;
  const body = [...S.body].sort((a, b) => a.date.localeCompare(b.date));
  $('#view').innerHTML = `<div class="evo">
    <div class="card">
      <h3>Carga por exercício</h3>
      ${logged.length ? `
        <select onchange="evoEx=this.value;viewEvolucao()" style="margin:8px 0">${logged.map(id => `<option value="${id}" ${id === evoEx ? 'selected' : ''}>${esc(exById(id).n)}</option>`).join('')}</select>
        <canvas id="cEx"></canvas>
        <div class="mut" style="margin-top:6px">🏆 Recorde: <b style="color:var(--txt)">${best} kg</b> · ${pts.length} treino(s) registrado(s)</div>`
        : '<div class="empty">Finalize um treino para ver sua evolução de cargas aqui.</div>'}
    </div>
    <div class="card">
      <div class="row sb"><h3>Medidas corporais</h3><button class="btn sm" onclick="newBody()">+ Registrar</button></div>
      ${body.length ? `<canvas id="cBody" style="margin-top:8px"></canvas>
        <div class="mut" style="margin:6px 0">Peso (kg) ao longo do tempo</div>
        ${body.slice().reverse().slice(0, 8).map(b => `<div class="row sb mut" style="padding:4px 0;border-top:1px solid #232733">
          <span>${fmtDate(b.date)}</span><span>${b.kg ? b.kg + ' kg' : ''} ${b.waist ? '· cintura ' + b.waist : ''} ${b.chest ? '· peito ' + b.chest : ''} ${b.arm ? '· braço ' + b.arm : ''} ${b.thigh ? '· coxa ' + b.thigh : ''}</span>
          <button class="btn del sm" onclick="delBody('${b.id}')">✕</button></div>`).join('')}`
        : '<div class="empty">Registre seu peso e medidas para acompanhar o corpo mudando.</div>'}
    </div></div>`;
  if (pts.length) drawChart($('#cEx'), pts);
  const wp = body.filter(b => b.kg).map(b => ({ x: b.date, y: b.kg }));
  if (wp.length && $('#cBody')) drawChart($('#cBody'), wp);
}
function newBody() {
  const f = (id, l) => `<div class="grow"><label>${l}</label><input id="${id}" inputmode="decimal"></div>`;
  openSheet(`<h2>Registrar medidas</h2>
    <label>Data</label><input id="bDate" type="date" value="${today()}">
    <div class="row">${f('bKg', 'Peso (kg)')}${f('bWaist', 'Cintura (cm)')}</div>
    <div class="row">${f('bChest', 'Peito (cm)')}${f('bArm', 'Braço (cm)')}${f('bThigh', 'Coxa (cm)')}</div>
    <div class="row" style="margin-top:16px"><div class="grow"></div><button class="btn sec" onclick="closeSheet()">Cancelar</button><button class="btn" onclick="saveBody()">Salvar</button></div>`);
}
function saveBody() {
  const b = { id: uid(), date: $('#bDate').value || today(), kg: num($('#bKg').value), waist: num($('#bWaist').value), chest: num($('#bChest').value), arm: num($('#bArm').value), thigh: num($('#bThigh').value) };
  if (!b.kg && !b.waist && !b.chest && !b.arm && !b.thigh) return toast('Preencha ao menos uma medida');
  S.body.push(b); save(); closeSheet(); viewEvolucao();
}
function delBody(id) { S.body = S.body.filter(b => b.id !== id); save(); viewEvolucao(); }

// ---------- Lembretes ----------
function viewLembretes() {
  $('#topAction').innerHTML = '<button class="btn sm" onclick="newReminder()">+ Novo</button>';
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  $('#view').innerHTML = `
    ${perm !== 'granted' ? `<div class="box tip">Ative as notificações para receber os avisos.
      <div style="margin-top:8px"><button class="btn sm" onclick="askPerm()">Ativar notificações</button></div></div>` : ''}
    ${S.reminders.map(r => `
      <div class="card"><div class="row sb"><div><div class="bigtime">${esc(r.time)}</div><h3>${esc(r.label)}</h3>
        <div class="mut">${r.days.length === 7 ? 'Todos os dias' : r.days.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')}</div></div>
        <button class="btn del sm" onclick="delReminder('${r.id}')">Excluir</button></div></div>`).join('') || '<div class="empty">Nenhum lembrete. Crie um para não perder o treino!</div>'}
    <div class="mut">Os avisos disparam enquanto o app estiver aberto ou instalado na tela inicial (navegadores não permitem alarmes com o app totalmente fechado sem um servidor).</div>`;
}
function askPerm() { Notification.requestPermission().then(viewLembretes); }
let rDays = [];
function newReminder() {
  rDays = [1, 2, 3, 4, 5];
  openSheet(`<h2>Novo lembrete</h2>
    <label>Mensagem</label><input id="rLabel" value="Hora de treinar! 💪">
    <label>Horário</label><input id="rTime" type="time" value="18:00">
    <label>Dias da semana</label>
    <div class="days" id="rDays">${DAYS.map((d, i) => `<button class="${rDays.includes(i) ? 'on' : ''}" onclick="toggleDay(${i},this)">${d}</button>`).join('')}</div>
    <div class="row" style="margin-top:16px"><div class="grow"></div><button class="btn sec" onclick="closeSheet()">Cancelar</button><button class="btn" onclick="saveReminder()">Salvar</button></div>`);
}
function toggleDay(i, el) { rDays = rDays.includes(i) ? rDays.filter(d => d !== i) : [...rDays, i]; el.classList.toggle('on'); }
function saveReminder() {
  if (!rDays.length) return toast('Escolha ao menos um dia');
  S.reminders.push({ id: uid(), label: $('#rLabel').value.trim() || 'Hora de treinar!', time: $('#rTime').value || '18:00', days: [...rDays].sort(), last: '' });
  save(); closeSheet();
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().then(viewLembretes); else viewLembretes();
}
function delReminder(id) { S.reminders = S.reminders.filter(r => r.id !== id); save(); viewLembretes(); }
function checkReminders() {
  const d = new Date(), hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, t = today();
  S.reminders.forEach(r => {
    if (r.time !== hm || !r.days.includes(d.getDay()) || r.last === t) return;
    r.last = t; save(); toast('⏰ ' + r.label);
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('FitTrack', { body: r.label, icon: 'icon.svg' }); } catch {}
    try { navigator.vibrate?.([200, 100, 200]); } catch {}
  });
}
setInterval(checkReminders, 20000); checkReminders();

// ---------- Início ----------
// ---------- atualização automática ----------
function showUpdate() {
  if ($('#updbar')) return;
  const b = document.createElement('div');
  b.id = 'updbar'; b.className = 'updbar';
  b.innerHTML = '<span>🔄 <b>Nova versão disponível</b></span><div class="row"><button class="btn sm" id="updGo">Atualizar</button><button class="btn sec sm" id="updLater">Depois</button></div>';
  document.body.appendChild(b);
  $('#updLater').onclick = () => b.remove();
  $('#updGo').onclick = () => {
    if (sess && !confirm('Há um treino em andamento. Atualizar agora perde as séries ainda não finalizadas.\n\nAtualizar mesmo assim?')) return;
    location.reload();
  };
}
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'UPDATED') showUpdate(); });
  const check = () => navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage({ type: 'CHECK' })).catch(() => {});
  navigator.serviceWorker.register('sw.js').then(check).catch(() => {});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); }); // ao voltar para o app
}
try { navigator.storage?.persist?.(); } catch {}
go('inicio');
// primeira abertura: pergunta o objetivo logo de cara (só para quem ainda não tem nada)
if (!S.onboarded && !S.profile && !S.routines.length && !S.logs.length) Prog.welcome();
