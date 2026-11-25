'use strict';
// Boneco 3D procedural (sem bibliotecas). Esqueleto com cinemática direta nas pernas,
// IK de 2 ossos nos braços, projeção em perspectiva e ordenação por profundidade em canvas 2D.
// Sistema de coordenadas: x = lateral, y = para cima, z = para frente do boneco.
// Ângulos de tronco/pernas são medidos no mundo, no plano lateral: 0 = para baixo (pernas) ou para cima (tronco),
// valores positivos giram para a frente (+z).
const Anim3D = (() => {
  const R = Math.PI / 180;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const nrm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const ease = t => t * t * (3 - 2 * t);

  const L = { th: .45, sk: .43, ft: .17, torso: .5, ua: .29, fa: .34, sw: .19, hw: .09, neck: .1, head: .115 };
  const COL = { torso: '#ff6b3d', R: '#ff8f66', L: '#dd5428', skin: '#ffd9c7', bar: '#d5d9e2', plate: '#2b303c', bench: [58, 66, 86], mat: '#2d5a8a', metal: '#7d8596' };

  const BASE = { tt: 0, hd: 0, th: 0, sk: 0, lab: 6, ft: 0, yw: 0, lh: [0, 0, 1], hp: [.08, -.6, .02], eh: [.4, -.5, -1] };

  function canon(p) {
    const o = { ...BASE, ...p };
    for (const k of ['th', 'sk', 'ft', 'yw', 'lh', 'la', 'hp', 'eh', 'ha']) {
      if (o[k] === undefined) continue;
      for (const s of ['R', 'L']) if (o[k + s] === undefined) o[k + s] = o[k];
    }
    return o;
  }

  // IK de 2 ossos. `hint` indica para onde o cotovelo/joelho aponta. Quando o membro fica quase esticado
  // na direção do hint, o hint sozinho é instável e o cotovelo "vira" de uma vez. Por isso a direção do
  // cotovelo (o "polo") é guardada em `st` e gira em direção ao alvo com velocidade limitada: sem saltos.
  function ik(S, T, hint, l1 = L.ua, l2 = L.fa, fb = [0, 0, -1], st = null, key = '') {
    const d = sub(T, S), dist = len(d), dir = nrm(d);
    const dd = Math.min((l1 + l2) * .999, Math.max(Math.abs(l1 - l2) + .02, dist));
    const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const perp = v => sub(v, mul(dir, dot(v, dir)));
    const pv = perp(hint), r = len(pv) / (len(hint) || 1);
    const last = st && st[key] ? perp(st[key]) : null;
    // só confia no hint se ele não for quase paralelo ao membro; senão usa a direção de reserva (fb)
    const fp = perp(fb);
    let tgt = r > .3 || len(fp) < 1e-6 ? nrm(pv) : nrm(fp);
    let p = tgt;
    if (last && len(last) > 1e-6) {
      const cur = nrm(last), ang = Math.acos(Math.max(-1, Math.min(1, dot(cur, tgt)))), step = 12 * R;
      if (ang > step) {
        let ax = cross(cur, tgt); ax = len(ax) < 1e-6 ? dir : nrm(ax);
        p = add(mul(cur, Math.cos(step)), mul(cross(ax, cur), Math.sin(step)));
      }
    }
    if (st) st[key] = p;
    return { el: add(add(S, mul(dir, a)), mul(p, h)), hand: add(S, mul(dir, dd)) };
  }

  function solve(p, ex) {
    const T = [0, Math.cos(p.tt * R), Math.sin(p.tt * R)];
    const hv = [0, Math.cos((p.tt + p.hd) * R), Math.sin((p.tt + p.hd) * R)];
    const J = { hip: [0, 0, 0], waist: mul(T, .24), chest: mul(T, L.torso - .04), neck: mul(T, L.torso) };
    J.head = add(J.neck, mul(hv, L.neck + L.head));
    for (const [n, s] of [['R', 1], ['L', -1]]) {
      const psi = s * p.lab * R, c = Math.cos(psi), sn = Math.sin(psi);
      const yw = (p['yw' + n] || 0) * s * R, cy = Math.cos(yw), sy = Math.sin(yw);
      const dir = a => { const y = -Math.cos(a * R), z = Math.sin(a * R), v = [-y * sn, y * c, z]; return [v[0] * cy + v[2] * sy, v[1], -v[0] * sy + v[2] * cy]; };
      const hip = [s * L.hw, 0, 0], kn = add(hip, mul(dir(p['th' + n]), L.th)), an = add(kn, mul(dir(p['sk' + n]), L.sk));
      const f = p['ft' + n] * R;
      J['hip' + n] = hip; J['kn' + n] = kn; J['an' + n] = an;
      J['to' + n] = add(an, [0, -Math.sin(f) * L.ft, Math.cos(f) * L.ft]);
      J['sh' + n] = add(J.chest, [s * L.sw, 0, 0]);
    }
    // apoio no chão / posição fixa (pernas com alvo "la" ficam de fora: são posicionadas depois)
    const g = ex.gr || 'feet';
    let dy = 0, dz = 0;
    if (g === 'feet') {
      const fs = ['R', 'L'].filter(n => !p['la' + n]), ys = [], zs = [];
      fs.forEach(n => { ys.push(J['an' + n][1], J['to' + n][1]); zs.push(J['an' + n][2]); });
      dy = .04 - Math.min(...ys);
      dz = -(ex.za === 'R' ? J.anR[2] : ex.za === 'L' ? J.anL[2] : zs.reduce((a, b) => a + b, 0) / zs.length);
    } else if (g === 'knees') {
      dy = .06 - Math.min(J.knR[1], J.knL[1]); dz = -(J.knR[2] + J.knL[2]) / 2;
    } else if (g.hip) { dy = g.hip[0]; dz = g.hip[1]; }
    else if (g.hang !== undefined) {
      const hy = (J.shR[1] + p.hpR[1] + J.shL[1] + p.hpL[1]) / 2, hz = (J.shR[2] + p.hpR[2] + J.shL[2] + p.hpL[2]) / 2;
      dy = g.hang - hy; dz = -hz;
    }
    for (const k in J) J[k] = add(J[k], [0, dy, dz]);
    for (const [n, s] of [['R', 1], ['L', -1]]) {
      const la = p['la' + n]; if (!la) continue;
      const r = ik(J['hip' + n], [s * la[0], la[1], la[2]], [s * p['lh' + n][0], p['lh' + n][1], p['lh' + n][2]], L.th, L.sk, [0, 0, 1], ex._pole, 'l' + n), f = p['ft' + n] * R;
      J['kn' + n] = r.el; J['an' + n] = r.hand; J['to' + n] = add(r.hand, [0, -Math.sin(f) * L.ft, Math.cos(f) * L.ft]);
    }
    for (const [n, s] of [['R', 1], ['L', -1]]) {
      const S = J['sh' + n];
      const tgt = p.ha ? [s * p['ha' + n][0], p['ha' + n][1], p['ha' + n][2]] : add(S, [s * p['hp' + n][0], p['hp' + n][1], p['hp' + n][2]]);
      const hint = [s * p['eh' + n][0], p['eh' + n][1], p['eh' + n][2]];
      const r = ik(S, tgt, hint, L.ua, L.fa, [s * .5, 0, -1], ex._pole, 'a' + n);
      J['el' + n] = r.el; J['hd' + n] = r.hand;
      J['wr' + n] = sub(r.hand, mul(nrm(sub(r.hand, r.el)), .08));
    }
    J.mh = mul(add(J.hdR, J.hdL), .5);
    return J;
  }

  // ---------- primitivas ----------
  const cap = (P, a, b, r, c) => P.push({ k: 'cap', a, b, r, c });
  const sph = (P, p, r, c) => P.push({ k: 'sph', p, r, c });
  const poly = (P, pts, c, o = {}) => P.push({ k: 'poly', pts, c, ...o });
  const rgb = (c, f) => `rgb(${c.map(v => Math.min(255, Math.round(v * f))).join(',')})`;
  function box(P, x0, x1, y0, y1, z0, z1, c) {
    const v = (x, y, z) => [x, y, z];
    const F = [[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], 1.15], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], .95],
      [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], .8], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], .75],
      [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], .7], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], .5]];
    F.forEach(f => poly(P, f.slice(0, 4), rgb(c, f[4])));
  }
  function disc(P, c, n, r, col, o = {}) {
    n = nrm(n);
    const a = nrm(cross(n, Math.abs(n[1]) < .9 ? [0, 1, 0] : [1, 0, 0])), b = cross(n, a), pts = [];
    for (let i = 0; i < 16; i++) { const t = i / 16 * 2 * Math.PI; pts.push(add(c, add(mul(a, Math.cos(t) * r), mul(b, Math.sin(t) * r)))); }
    poly(P, pts, col, { dc: c, ...o });
  }

  function scene(ex, J, J0) {
    const P = [];
    // sombra
    const sc = [];
    for (let i = 0; i < 20; i++) { const t = i / 20 * 2 * Math.PI; sc.push([J.hip[0] + Math.cos(t) * .55, 0, J.hip[2] + Math.sin(t) * .55]); }
    poly(P, sc, 'rgba(0,0,0,.28)', { bg: 1 });
    // corpo
    cap(P, J.hip, J.waist, .105, COL.torso); cap(P, J.waist, J.chest, .12, COL.torso);
    cap(P, J.hipL, J.hipR, .07, COL.torso); cap(P, J.shL, J.shR, .05, COL.torso);
    sph(P, J.head, L.head, COL.skin);
    for (const n of ['R', 'L']) {
      const c = COL[n];
      cap(P, J['hip' + n], J['kn' + n], .075, c); cap(P, J['kn' + n], J['an' + n], .058, c); cap(P, J['an' + n], J['to' + n], .042, c);
      cap(P, J['sh' + n], J['el' + n], .047, c); cap(P, J['el' + n], J['wr' + n], .04, c); sph(P, J['hd' + n], .05, COL.skin);
    }
    // acessórios
    for (const pr of ex.props || []) {
      const t = typeof pr === 'string' ? pr : pr.t;
      const hm = J.mh, hx = Math.max(Math.abs(J.hdR[0] - hm[0]), .1);
      if (t === 'bench') {
        const top = J0.hip[1] - .11, z0 = J0.head[2] - .18, z1 = J0.hip[2] + .4;
        box(P, -.16, .16, top - .09, top, Math.min(z0, z1), Math.max(z0, z1), COL.bench);
        for (const x of [-.12, .12]) for (const z of [Math.min(z0, z1) + .06, Math.max(z0, z1) - .06]) box(P, x - .02, x + .02, 0, top - .09, z - .02, z + .02, [70, 76, 94]);
      } else if (t === 'bench2') {
        const top = J0.chest[1] - .13, zc = J0.chest[2];
        box(P, -.3, .3, 0, top, zc - .22, zc + .12, COL.bench);
      } else if (t === 'seat') {
        const tt = ex.F[0].tt * R, T = [0, Math.cos(tt), Math.sin(tt)], N = [0, -Math.sin(tt), Math.cos(tt)], h = J0.hip;
        const b0 = sub(h, mul(N, .13));
        poly(P, [add(add(b0, mul(T, -.14)), [-.18, 0, 0]), add(add(b0, mul(T, -.14)), [.18, 0, 0]), add(add(b0, mul(T, .72)), [.18, 0, 0]), add(add(b0, mul(T, .72)), [-.18, 0, 0])], rgb(COL.bench, .95));
        box(P, -.18, .18, h[1] - .2, h[1] - .11, h[2] - .1, h[2] + .36, COL.bench);
        box(P, -.03, .03, 0, h[1] - .2, h[2] - .03, h[2] + .03, [70, 76, 94]);
      } else if (t === 'mat') {
        poly(P, [[-.4, .004, J0.head[2] - .3], [.4, .004, J0.head[2] - .3], [.4, .004, J0.hip[2] + 1.0], [-.4, .004, J0.hip[2] + 1.0]], COL.mat, { bg: 1 });
      } else if (t === 'barbell') {
        const a = [hm[0] - .62, hm[1], hm[2]], b = [hm[0] + .62, hm[1], hm[2]];
        cap(P, a, b, .016, COL.bar);
        for (const s of [-1, 1]) for (const [o, r] of [[.5, .2], [.455, .17]]) disc(P, [hm[0] + s * o, hm[1], hm[2]], [1, 0, 0], r, COL.plate, { st: '#4a5163' });
      } else if (t === 'dumbbells') {
        const ax = pr.ax === 'z' ? [0, 0, 1] : [1, 0, 0];
        for (const n of ['R', 'L']) {
          if (pr.only && pr.only !== n) continue;
          const h = J['hd' + n];
          cap(P, sub(h, mul(ax, .08)), add(h, mul(ax, .08)), .014, COL.bar);
          for (const s of [-1, 1]) disc(P, add(h, mul(ax, s * .085)), ax, .07, COL.plate, { st: '#4a5163' });
        }
      } else if (t === 'dbv') {
        cap(P, [hm[0], hm[1] - .08, hm[2]], [hm[0], hm[1] + .08, hm[2]], .014, COL.bar);
        for (const s of [-1, 1]) disc(P, [hm[0], hm[1] + s * .085, hm[2]], [0, 1, 0], .075, COL.plate, { st: '#4a5163' });
      } else if (t === 'boxw') {
        box(P, ...pr.b, pr.c || COL.bench);
      } else if (t === 'bike') {
        const cz = pr.cz, cy = pr.cy, hy = J0.hip[1];
        cap(P, [0, .08, cz - .7], [0, .08, cz + .55], .03, COL.metal);
        cap(P, [0, .08, cz + .5], [0, cy + .05, cz + .5], .03, COL.metal);
        cap(P, [0, cy, cz], [0, hy - .1, cz - .42], .03, COL.metal);
        cap(P, [0, hy - .1, cz - .42], [0, hy - .1, cz - .22], .035, COL.bench.length ? '#59627a' : '#59627a');
        cap(P, [0, .08, cz - .55], [0, cy, cz], .028, COL.metal);
        cap(P, [0, cy, cz + .5], [0, J0.hdR[1] - .02, J0.hdR[2] - .03], .028, COL.metal);
        cap(P, [-.2, J0.hdR[1] - .02, J0.hdR[2] - .03], [.2, J0.hdR[1] - .02, J0.hdR[2] - .03], .022, COL.bar);
        disc(P, [0, cy, cz + .5], [1, 0, 0], .27, 'rgba(60,66,84,.9)', { st: '#7d8596' });
        sph(P, [0, cy, cz], .04, COL.metal);
      } else if (t === 'bar') {
        const w = pr.w || hx + .08;
        cap(P, [hm[0] - w, hm[1], hm[2]], [hm[0] + w, hm[1], hm[2]], .016, COL.bar);
      } else if (t === 'cable') {
        const a = pr.a(J0);
        P.push({ k: 'cap', a, b: hm, r: .006, c: '#aeb4c2', nb: 1 }, { k: 'sph', p: a, r: .05, c: COL.metal, nb: 1 });
      } else if (t === 'pullbar') {
        const y = ex.gr.hang;
        cap(P, [-.62, y, 0], [.62, y, 0], .02, COL.bar);
        for (const x of [-.7, .7]) { cap(P, [x, y, 0], [x, y, -.45], .025, COL.metal); cap(P, [x, y, -.45], [x, 0, -.45], .03, COL.metal); }
        cap(P, [-.7, y, -.45], [.7, y, -.45], .025, COL.metal);
      } else if (t === 'step') {
        const z = (J0.toR[2] + J0.toL[2]) / 2;
        box(P, -.28, .28, 0, .035, z - .1, z + .22, [90, 98, 120]);
      } else if (t === 'treadmill') {
        box(P, -.3, .3, 0, .0, -1.0, 1.0, [45, 49, 60]);
        for (let z = -.9; z <= .9; z += .3) poly(P, [[-.28, .003, z], [.28, .003, z], [.28, .003, z + .03], [-.28, .003, z + .03]], 'rgba(255,255,255,.12)', { bg: 1 });
      } else if (t === 'platform') {
        const mf = mul(add(J.toR, J.toL), .5), d = nrm(sub(J.anR, J.knR)), pv = nrm(cross([1, 0, 0], d));
        const c = add(mf, add(mul(d, .06), mul(pv, 0)));
        poly(P, [add(c, add([-.38, 0, 0], mul(pv, -.28))), add(c, add([.38, 0, 0], mul(pv, -.28))), add(c, add([.38, 0, 0], mul(pv, .28))), add(c, add([-.38, 0, 0], mul(pv, .28)))], '#59627a', { st: '#7d8596' });
      } else if (t === 'pad') {
        const c = mul(add(J.anR, J.anL), .5);
        cap(P, [-.2, c[1] + .05, c[2] + .03], [.2, c[1] + .05, c[2] + .03], .045, '#59627a');
      }
    }
    return P;
  }

  // ---------- câmera e desenho ----------
  const ptsOf = p => p.k === 'cap' ? [p.a, p.b] : p.k === 'sph' ? [p.p] : p.pts;
  function makeCam(ex) {
    const all = [];
    ex.F.forEach(f => { const J = solve(f, ex); scene(ex, J, ex.J0).forEach(p => { if (!p.bg && !p.nb) all.push(...ptsOf(p)); }); });
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    all.forEach(p => { for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); } });
    const c = mul(add(lo, hi), .5);
    return { c, rad: Math.max(Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 * .95, .9) };
  }

  function draw(ctx, w, h, ex, J, cam, yaw, pitch = 18 * R) {
    const D = cam.rad * 5, ppu = Math.min(w, h * 1.05) / (cam.rad * 2.25), f = ppu * D;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const proj = p => {
      const x = p[0] - cam.c[0], y = p[1] - cam.c[1], z = p[2] - cam.c[2];
      const X = x * cy + z * sy, Z = -x * sy + z * cy, Y = y * cp - Z * sp, Z2 = y * sp + Z * cp, s = f / (D - Z2);
      return [w / 2 + X * s, h / 2 - Y * s, Z2, s];
    };
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#222733'); bg.addColorStop(1, '#14171e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // piso
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) for (const [a, b] of [[[i * .4, 0, -2.4], [i * .4, 0, 2.4]], [[-2.4, 0, i * .4], [2.4, 0, i * .4]]]) {
      const A = proj(a), B = proj(b); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    const prims = scene(ex, J, ex.J0).map(p => {
      const pr = ptsOf(p).map(proj);
      p.pp = pr; p.z = pr.reduce((s, q) => s + q[2], 0) / pr.length;
      if (p.k === 'cap') p.z += .0; if (p.dc) p.z = proj(p.dc)[2] + .03;
      return p;
    });
    prims.sort((a, b) => (b.bg || 0) - (a.bg || 0) || a.z - b.z);
    ctx.lineJoin = 'round';
    for (const p of prims) {
      if (p.k === 'cap') {
        const [A, B] = p.pp, wd = p.r * 2 * (A[3] + B[3]) / 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = wd + 2; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        ctx.strokeStyle = p.c; ctx.lineWidth = wd; ctx.stroke();
        if (wd > 7) { // realce suave do lado da luz: dá volume ao membro
          const o = wd * .17;
          ctx.strokeStyle = 'rgba(255,255,255,.17)'; ctx.lineWidth = wd * .34;
          ctx.beginPath(); ctx.moveTo(A[0] - o, A[1] - o); ctx.lineTo(B[0] - o, B[1] - o); ctx.stroke();
        }
      } else if (p.k === 'sph') {
        const [A] = p.pp, r = p.r * A[3];
        ctx.fillStyle = p.c; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(A[0], A[1], r, 0, 7); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); p.pp.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
        ctx.fillStyle = p.c; ctx.fill();
        ctx.strokeStyle = p.st || 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
  }

  // ---------- dados dos exercícios ----------
  const SUP = { tt: -90, th: 100, sk: -3, lab: 9 };      // deitado de costas, pés no chão
  // pedalada: 8 posições do pedal em volta do pedivela; o pé esquerdo fica 180° defasado
  function bikeFrames() {
    return Array.from({ length: 8 }, (_, i) => {
      const a = i * 45 * R, pd = ph => [.12, .36 + .17 * Math.cos(ph), .28 + .17 * Math.sin(ph)];
      return { l: 'Pedale em ritmo constante e moderado', laR: pd(a), laL: pd(a + Math.PI) };
    });
  }
  const EX = {
    'supino-reto': { props: ['bench', 'barbell'], base: { ...SUP, eh: [1, -1, 0] }, f: [
      { l: 'Empurre a barra até estender os braços', hp: [.17, .6, .03] }, { l: 'Desça com controle até o meio do peito', hp: [.17, .17, .15] }] },
    'supino-inclinado': { props: ['seat', 'dumbbells'], base: { tt: -45, th: 88, sk: -2, lab: 9, eh: [1, -1, 0] }, f: [
      { l: 'Empurre os halteres para cima', hp: [.14, .6, .05] }, { l: 'Desça até a altura do peito', hp: [.27, -.02, .17] }] },
    'crucifixo': { yaw: 70, props: ['bench', 'dumbbells'], base: { ...SUP, eh: [0, -1, .15] }, f: [
      { l: 'Feche os braços em arco, como um abraço', hp: [.1, .6, .02] }, { l: 'Abra até sentir o peito alongar', hp: [.5, .06, .02] }] },
    'flexao': { gr: 'feet', za: 'R', base: { eh: [1, .2, -1], lab: 4 }, f: [
      { l: 'Empurre o chão até estender os braços', tt: 73.5, th: -73.5, sk: -73.5, ft: 75, ha: [.3, .03, 1.28] },
      { l: 'Desça com o corpo alinhado, cotovelos a 45°', tt: 86, th: -86, sk: -86, ft: 75, ha: [.3, .03, 1.28] }] },
    'puxada-frente': { props: ['seat', { t: 'bar', w: .5 }, { t: 'cable', a: J => [0, 2.5, J.mh[2]] }], base: { tt: -12, th: 88, sk: -2, lab: 10, eh: [.5, -1, -.3] }, f: [
      { l: 'Deixe a barra subir, braços estendidos', hp: [.3, .5, 0] }, { l: 'Puxe a barra até o alto do peito', hp: [.27, -.12, .12], eh: [.6, -1, -.2] }] },
    'remada-curvada': { props: ['barbell'], base: { tt: 48, th: 18, sk: -10, hd: -30, eh: [.6, .3, -1] }, f: [
      { l: 'Estenda os braços com a coluna reta', hp: [.14, -.6, 0] }, { l: 'Puxe a barra até o umbigo', hp: [.17, -.27, -.12] }] },
    'remada-baixa': { props: ['seat', { t: 'bar', w: .12 }, { t: 'cable', a: () => [0, .4, .6] }], base: { th: 72, sk: 55, lab: 8, eh: [.7, -.2, -1] }, f: [
      { l: 'Estenda os braços sem arredondar as costas', tt: 22, hp: [.1, -.12, .58], eh: [0, -1, 0] }, { l: 'Puxe até o abdômen juntando as escápulas', tt: -8, hp: [.1, -.3, .12] }] },
    'barra-fixa': { gr: { hang: 2.15 }, props: [{ t: 'pullbar' }], base: { th: 2, sk: -35, lab: 4, eh: [0, -1, 0] }, f: [
      { l: 'Desça devagar até estender os braços', tt: 0, hp: [.3, .62, 0] }, { l: 'Puxe até o queixo passar da barra', tt: -12, hp: [.26, .17, -.03], eh: [1, -1, -.2] }] },
    'agachamento': { props: ['barbell'], base: { lab: 12, eh: [0, -1, -.6], hp: [.21, .06, -.1] }, f: [
      { l: 'Suba empurrando o chão', tt: 0, th: 0, sk: 0, hd: 0 }, { l: 'Desça como se fosse sentar, joelhos para fora', tt: 40, th: 96, sk: -20, hd: -20 }] },
    'leg-press': { gr: { hip: [.55, 0] }, props: ['seat', 'platform'], base: { tt: -48, lab: 12, hp: [.3, -.3, .28], eh: [1, -1, 0] }, f: [
      { l: 'Empurre sem travar os joelhos', th: 128, sk: 120 }, { l: 'Dobre os joelhos até ~90°', th: 150, sk: 58 }] },
    'afundo': { props: ['dumbbells'], gr: 'feet', za: 'R', base: { lab: 3 }, f: [
      { l: 'Suba empurrando com o pé da frente', thR: 18, skR: -4, thL: -24, skL: -40, ftL: 55 }, { l: 'Desça com o tronco reto', thR: 88, skR: -5, thL: -45, skL: -80, ftL: 30 }] },
    'stiff': { props: ['barbell'], base: { hp: [.15, -.57, .04] }, f: [
      { l: 'Contraia os glúteos e volte à posição em pé', tt: 2, th: 6, sk: -6, hd: 0 }, { l: 'Empurre o quadril para trás, barra rente às pernas', tt: 75, th: 24, sk: -10, hd: -50 }] },
    'cadeira-extensora': { gr: { hip: [.5, 0] }, props: ['seat', 'pad'], base: { tt: -8, th: 90, lab: 8, hp: [.2, -.32, .1], eh: [1, -1, 0] }, f: [
      { l: 'Volte devagar, sem soltar o peso', sk: 0 }, { l: 'Estenda os joelhos e contraia a coxa', sk: 82 }] },
    'mesa-flexora': { gr: { hip: [.52, 0] }, props: ['bench'], base: { tt: -90, th: 90, lab: 6, hp: [.14, -.2, -.1], eh: [1, -1, 0] }, f: [
      { l: 'Estenda as pernas devagar', sk: 92 }, { l: 'Leve os calcanhares em direção aos glúteos', sk: 195 }] },
    'panturrilha': { props: ['step'], base: { lab: 5, hp: [.1, -.45, .05] }, f: [
      { l: 'Suba o máximo que conseguir na ponta dos pés', ft: 40 }, { l: 'Desça alongando bem a panturrilha', ft: -10 }] },
    'hip-thrust': { props: ['bench2', 'barbell'], base: { lab: 10, hp: [.2, .1, .47], eh: [1, .5, 0] }, f: [
      { l: 'Desça o quadril com controle', tt: -65, th: 122, sk: -2, hp: [.2, -.08, .41] }, { l: 'Suba o quadril e contraia os glúteos', tt: -98, th: 82, sk: -4, hp: [.2, .16, .45] }] },
    'desenvolvimento': { props: ['seat', 'dumbbells'], base: { tt: -6, th: 88, sk: -2, lab: 10, eh: [.4, -1, 0] }, f: [
      { l: 'Empurre para cima sem arquear as costas', hp: [.12, .6, .02] }, { l: 'Desça até a altura das orelhas', hp: [.3, -.02, .04] }] },
    'elevacao-lateral': { yaw: 12, props: ['dumbbells'], base: { eh: [0, -1, -.4] }, f: [
      { l: 'Desça devagar, sem deixar cair', hp: [.1, -.58, .04] }, { l: 'Eleve até a altura dos ombros', hp: [.56, .04, .06] }] },
    'rosca-direta': { props: ['barbell'], base: { eh: [0, -1, -.5] }, f: [
      { l: 'Desça devagar, cotovelos colados', hp: [.12, -.58, .08] }, { l: 'Suba contraindo o bíceps', hp: [.12, -.1, .3] }] },
    'triceps-corda': { props: [{ t: 'bar', w: .1 }, { t: 'cable', a: J => [0, 2.3, J.mh[2] - .05] }], base: { tt: 6, eh: [0, -1, -.8] }, f: [
      { l: 'Volte até os antebraços a 90°', hp: [.07, -.25, .3] }, { l: 'Estenda os cotovelos e abra a corda', hp: [.1, -.6, .12] }] },
    'triceps-testa': { props: ['bench', 'barbell'], base: { ...SUP, eh: [0, 1, .2] }, f: [
      { l: 'Estenda os braços sem mexer os ombros', hp: [.12, .6, 0] }, { l: 'Flexione só os cotovelos até a testa', hp: [.1, .2, -.28] }] },
    'prancha': { gr: 'feet', za: 'R', base: { eh: [0, -1, 0], lab: 4 }, f: [
      { l: 'Mantenha o corpo em linha reta', tt: 84, th: -84, sk: -84, ft: 75, ha: [.12, .04, 1.63] }, { l: 'Respire e contraia abdômen e glúteos', tt: 83, th: -83, sk: -83, ft: 75, ha: [.12, .04, 1.63] }] },
    'abdominal': { props: ['mat'], base: { tt: -90, th: 140, sk: -2, lab: 9, hp: [.12, .1, -.12], eh: [1, .3, -.2] }, f: [
      { l: 'Desça devagar sem relaxar totalmente', tt: -90, hd: 0 }, { l: 'Expire e enrole o tronco para cima', tt: -52, hd: 12 }] },
    'esteira': { props: ['treadmill'], dur: .5, hold: 0, base: { tt: 6, hd: -6, eh: [0, -1, -.3] }, f: [
      { l: 'Mantenha a postura ereta e o ritmo', thR: 28, skR: 22, thL: -24, skL: -62, ftL: 40, hpL: [.1, -.35, .3], hpR: [.1, -.5, -.25] },
      { l: 'Mantenha a postura ereta e o ritmo', thR: 2, skR: 2, thL: 34, skL: -28, hpL: [.1, -.45, .03], hpR: [.1, -.45, .03] },
      { l: 'Mantenha a postura ereta e o ritmo', thL: 28, skL: 22, thR: -24, skR: -62, ftR: 40, hpR: [.1, -.35, .3], hpL: [.1, -.5, -.25] },
      { l: 'Mantenha a postura ereta e o ritmo', thL: 2, skL: 2, thR: 34, skR: -28, hpL: [.1, -.45, .03], hpR: [.1, -.45, .03] }] },

    // ----- exercícios adicionados -----
    'terra': { props: ['barbell'], base: { hp: [.15, -.6, .02] }, f: [
      { l: 'Empurre o chão e estenda quadril e joelhos', tt: 2, th: 4, sk: -4, hd: 0 },
      { l: 'Costas retas, quadril para trás e barra rente às pernas', tt: 55, th: 75, sk: -10, hd: -45 }] },
    'supino-halteres': { props: ['bench', 'dumbbells'], base: { ...SUP, eh: [1, -1, 0] }, f: [
      { l: 'Empurre os halteres para cima', hp: [.14, .6, .03] }, { l: 'Desça até alongar o peito', hp: [.24, .14, .14] }] },
    'flexao-joelhos': { gr: 'knees', base: { eh: [1, .2, -1], lab: 4 }, f: [
      { l: 'Empurre o chão até estender os braços', tt: 58, th: -58, sk: -115, ha: [.3, .03, .77] },
      { l: 'Desça com o corpo alinhado dos joelhos à cabeça', tt: 82, th: -82, sk: -115, ha: [.3, .03, .77] }] },
    'remada-unilateral': { yaw: 60, gr: 'feet', za: 'R', props: [{ t: 'dumbbells', only: 'R' },
      { t: 'boxw', b: [-.34, 0, .33, .43, -.45, .5] }, { t: 'boxw', b: [-.32, -.28, 0, .33, -.42, -.38], c: [70, 76, 94] }, { t: 'boxw', b: [-.06, -.02, 0, .33, .42, .46], c: [70, 76, 94] }],
      base: { tt: 76, hd: -50, thR: 22, skR: -6, thL: 30, skL: -90, ftL: 170, lab: 4, hpL: [0, -.57, 0], ehL: [0, -1, 0] }, f: [
      { l: 'Estenda o braço sem girar o tronco', hpR: [.02, -.6, .04], ehR: [0, -1, 0] }, { l: 'Puxe o cotovelo em direção ao quadril', hpR: [.1, -.3, -.14], ehR: [.4, .3, -1] }] },
    'crucifixo-inverso': { yaw: 20, props: ['dumbbells'], base: { tt: 55, hd: -40, th: 18, sk: -10, eh: [0, -1, -.2] }, f: [
      { l: 'Desça devagar, sem balançar o corpo', hp: [.2, -.58, .04] }, { l: 'Abra os braços até a altura dos ombros', hp: [.56, -.02, -.02] }] },
    'rosca-martelo': { props: [{ t: 'dumbbells', ax: 'z' }], base: { eh: [0, -1, -.5] }, f: [
      { l: 'Desça devagar, cotovelos colados', hp: [.1, -.58, .06] }, { l: 'Suba mantendo a pegada neutra', hp: [.1, -.1, .3] }] },
    'mergulho-banco': { gr: 'feet', yaw: 55, props: [{ t: 'boxw', b: [-.3, .3, .28, .42, -1.1, -.72] }, { t: 'boxw', b: [-.28, -.24, 0, .28, -1.08, -1.04], c: [70, 76, 94] }, { t: 'boxw', b: [.24, .28, 0, .28, -.76, -.72], c: [70, 76, 94] }],
      base: { tt: -4, lab: 8, eh: [.3, .2, -1], ha: [.22, .43, -.8] }, f: [
      { l: 'Empurre até estender os cotovelos', th: 65, sk: 35 }, { l: 'Desça até ~90° mantendo o corpo perto do banco', th: 102, sk: -5 }] },
    'goblet': { props: [{ t: 'dbv' }], base: { eh: [0, -1, 0], hp: [.04, -.2, .2], lab: 10 }, f: [
      { l: 'Suba empurrando o chão', tt: 2, th: 0, sk: 0, hd: 0 }, { l: 'Desça com o tronco ereto, cotovelos entre os joelhos', tt: 22, th: 100, sk: -22, hd: -15 }] },
    'bulgaro': { yaw: 60, gr: 'feet', za: 'R', props: ['dumbbells', { t: 'boxw', b: [-.3, .06, .28, .42, -1.25, -.8] }, { t: 'boxw', b: [-.28, -.24, 0, .28, -1.22, -1.18], c: [70, 76, 94] }, { t: 'boxw', b: [.0, .04, 0, .28, -.86, -.82], c: [70, 76, 94] }],
      base: { lab: 3, ftR: 0, ftL: 170, laL: [.12, .47, -.95], lhL: [0, -1, 0], hp: [.1, -.6, .02] }, f: [
      { l: 'Suba empurrando o pé da frente', tt: 5, thR: 30, skR: -4 }, { l: 'Desça até a coxa da frente ficar paralela ao chão', tt: 20, thR: 80, skR: -10 }] },
    'ponte-gluteo': { props: ['mat'], base: { lab: 8, hp: [.12, -.09, .35], eh: [1, -1, 0] }, f: [
      { l: 'Desça devagar até o quadril quase tocar o chão', tt: -90, th: 140, sk: -2, hd: 0 }, { l: 'Suba o quadril e contraia os glúteos', tt: -120, th: 105, sk: -4, hd: 28 }] },
    'abducao': { yaw: 25, gr: { hip: [.48, 0] }, props: ['seat'], base: { tt: -8, th: 88, sk: -2, lab: 6, hp: [.2, -.3, .12], eh: [1, -1, 0] }, f: [
      { l: 'Volte devagar, sem deixar o peso bater', yw: 6 }, { l: 'Abra as pernas contra a resistência', yw: 36 }] },
    'elevacao-pernas': { gr: { hip: [.12, 0] }, props: ['mat'], base: { tt: -90, lab: 4, hp: [.12, -.09, .3], eh: [1, -1, 0] }, f: [
      { l: 'Desça devagar sem encostar no chão', th: 88, sk: 88 }, { l: 'Eleve as pernas até 90°', th: 180, sk: 180 }] },
    'bicicleta': { gr: { hip: [.95, 0] }, dur: .22, hold: 0, props: [{ t: 'bike', cz: .28, cy: .36 }],
      base: { tt: 28, hd: -20, lab: 4, lh: [0, .3, 1], hp: [.12, -.3, .33], eh: [.5, -1, 0] }, f: bikeFrames() },
    'polichinelo': { yaw: 8, dur: .45, hold: 0, base: { tt: 0 }, f: [
      { l: 'Junte os pés e baixe os braços', lab: 4, hp: [.1, -.6, .02], eh: [0, -1, 0] }, { l: 'Salte abrindo pernas e braços', lab: 28, hp: [.42, .5, 0], eh: [1, 0, 0] }] }
  };
  EX.caminhada = { ...EX.esteira, props: [] };
  for (const id in EX) {
    const ex = EX[id];
    ex.F = ex.f.map(fr => { const { l, ...p } = fr; const c = canon({ ...ex.base, ...p }); c.l = l; return c; });
    ex.J0 = null; ex.J0 = solve(ex.F[0], ex);
    ex.cam = makeCam(ex);
    ex._pole = {}; // estado do polo do IK (só a animação em tempo real usa continuidade)
  }

  function pose(ex, t) {
    const n = ex.F.length, hold = ex.hold ?? .3, dur = ex.dur ?? 1.4, seg = hold + dur;
    const i = Math.floor(t / seg) % (n === 2 ? 2 : n), u = t % seg, j = (i + 1) % n;
    const a = ex.F[i], b = ex.F[j];
    if (u < hold) return { p: a, l: a.l };
    const s = ease((u - hold) / dur), o = {};
    for (const k in a) o[k] = Array.isArray(a[k]) ? mix(a[k], b[k], s) : typeof a[k] === 'number' ? a[k] + (b[k] - a[k]) * s : a[k];
    return { p: o, l: b.l };
  }

  // ---------- controle da animação na página ----------
  let cur = null;
  function stop() { if (cur) { cancelAnimationFrame(cur.raf); cur = null; } }
  function mount(canvas, id, labelEl) {
    stop();
    const ex = EX[id]; if (!ex) return null;
    const st = cur = { canvas, ex, t: 0, speed: 1, playing: true, yaw: (ex.yaw ?? 40) * R, base: (ex.yaw ?? 40) * R, sway: true, last: 0, labelEl, lastLabel: '' };
    let drag = null;
    canvas.style.touchAction = 'pan-y';
    canvas.onpointerdown = e => { drag = { x: e.clientX, yaw: st.base }; st.sway = false; canvas.setPointerCapture(e.pointerId); };
    canvas.onpointermove = e => { if (drag) { st.base = drag.yaw + (e.clientX - drag.x) * .012; st.yaw = st.base; } };
    canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
    const ctx = canvas.getContext('2d');
    const loop = ts => {
      if (cur !== st || !canvas.isConnected) return;
      const dt = st.last ? Math.min(.05, (ts - st.last) / 1000) : 0; st.last = ts;
      const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      if (st.playing) st.t += dt * st.speed;
      const goal = st.base + (st.sway ? Math.sin(ts / 2600) * 8 * R : 0);
      st.yaw += (goal - st.yaw) * Math.min(1, dt * 8);
      const { p, l } = pose(ex, st.t);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h, ex, solve(p, ex), ex.cam, st.yaw);
      if (labelEl && l !== st.lastLabel) { labelEl.textContent = l; st.lastLabel = l; }
      st.raf = requestAnimationFrame(loop);
    };
    st.raf = requestAnimationFrame(loop);
    return st;
  }
  const api = {
    has: id => !!EX[id], mount, stop, solve, EX, draw, pose,
    view(deg) { if (cur) { cur.base = deg * R; cur.sway = false; } },
    toggle() { if (cur) cur.playing = !cur.playing; return cur ? cur.playing : false; },
    slow() { if (cur) cur.speed = cur.speed === 1 ? .4 : 1; return cur ? cur.speed : 1; }
  };
  if (typeof module !== 'undefined') module.exports = api;
  return api;
})();
