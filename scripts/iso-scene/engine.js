// 아이소메트릭 흐름 장면 — 정거장 사이를 한 사람이 오가며 일을 맡기고 결과를 받아 오는 그림.
// 원고가 장면(정거장·길·동작)을 적어 isoScene(figure, spec) 을 부르면 이 파일이 그린다.
// 이 파일은 `npm run iso -- <원고>` 가 원고의 <!--ISO--> 자리에 구워 넣는다. 규약: POSTING.md 5-11.
(function () {
  const PAL = {
    light: { white: "#ffffff", wall: "#eef1f9", paper: "#fffdf5", blue: "#2f5fe8", navy: "#3b4a78", yellow: "#f5b62e", teal: "#2fbf9f",
             orange: "#ff8a3d", red: "#e5484d", grey: "#cfd5e6", dark: "#2a3352", skin: "#f3cba8", hair: "#5a4636", to: [40, 60, 130], shadow: "rgba(30,50,120,.2)" },
    dark:  { white: "#2e3650", wall: "#3b4460", paper: "#e9e4d2", blue: "#5b86ff", navy: "#8a99cc", yellow: "#e0a526", teal: "#2aa88c",
             orange: "#f0803a", red: "#e5605f", grey: "#4d5775", dark: "#10131c", skin: "#e8bf9b", hair: "#3c2f25", to: [0, 0, 0], shadow: "rgba(0,0,0,.5)" },
  };
  const FLOOR = 0.2; // 정거장 바닥 판 두께 — 부품의 y 기본값

  function isoScene(fig, spec) {
    const stage = fig && fig.querySelector(".iso-stage");
    const lis = fig ? [...fig.querySelectorAll(".iso-steps > li")] : [];
    if (!stage || !lis.length) return;
    const signal = window.postPage && window.postPage.signal;
    const N = lis.length, S = spec.stations, ids = Object.keys(S), R = spec.routes || {};
    const uid = "iso" + Math.random().toString(36).slice(2, 7);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sum = fig.querySelector(".iso-sum");

    stage.innerHTML = '<svg aria-hidden="true"></svg><div class="iso-labs" aria-hidden="true"></div>';
    const svg = stage.firstChild, labs = stage.lastChild;
    const bar = document.createElement("div"); bar.className = "iso-bar";
    bar.innerHTML = '<div class="iso-btns"><button type="button" data-a="prev">이전</button><button type="button" data-a="next">다음</button>' +
      '<button type="button" data-a="play" class="pri">재생</button></div><ol class="iso-dots">' +
      lis.map((li, i) => `<li><button type="button" data-i="${i}"><i>${i + 1}</i><span>${li.dataset.k || ""}</span></button></li>`).join("") +
      `<li><button type="button" data-i="${N}"><i>✓</i><span>전체 흐름</span></button></li></ol>`;
    const desc = document.createElement("p"); desc.className = "iso-desc"; desc.setAttribute("aria-live", "polite");
    stage.after(bar, desc); fig.classList.add("iso-on");

    /* ── 좌표: 장면 크기에 맞춰 눈금(U)과 원점을 정한다 ── */
    let U = 40, OX = 0, OY = 0, W = 0, H = 0, pal = PAL.light;
    const P = (x, y, z, ox = OX, oy = OY) => [ox + (x - z) * U * 0.866, oy + (x + z) * U * 0.5 - y * U];
    const pts = (a) => a.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    function layout() {
      W = stage.clientWidth || 800;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      const add = (x, y, z) => { const a = (x - z) * 0.866, b = (x + z) * 0.5 - y; x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); };
      for (const id of ids) { const [ax, az] = S[id].at, [w, d] = S[id].size, t = S[id].top || 2.2;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(ax + sx * w / 2, 0, az + sz * d / 2); add(ax + sx * w / 2, t, az + sz * d / 2); } }
      for (const k in R) for (const [x, z] of R[k]) { add(x, 0, z); add(x, 2, z); }
      const narrow = W < 560, padX = narrow ? 14 : 70, padT = narrow ? 30 : 44, padB = narrow ? 14 : 22;
      // 한 화면에 그림과 단계 띠가 같이 들어오게 높이는 화면의 55% 까지만 쓴다(예시 요청·단계 띠·설명까지 한 화면, 2026-11-24 사용자 지적)
      U = Math.min(44, (W - padX * 2) / (x1 - x0), (innerHeight * 0.55 - padT - padB) / (y1 - y0));
      H = (y1 - y0) * U + padT + padB; OX = (W - (x1 - x0) * U) / 2 - x0 * U; OY = padT - y0 * U;
      stage.style.height = H.toFixed(0) + "px"; svg.setAttribute("viewBox", `0 0 ${W} ${H.toFixed(0)}`);
      fig.classList.toggle("iso-narrow", narrow);
    }

    /* ── 그리기 ── */
    const col = (c) => pal[c] || c;
    const shade = (c, f) => { const n = parseInt(col(c).slice(1), 16), t = pal.to, m = (v, k) => Math.round(v * f + t[k] * (1 - f)); return `rgb(${m(n >> 16, 0)},${m((n >> 8) & 255, 1)},${m(n & 255, 2)})`; };
    function draw1(b, ox, oy) {
      const Q = (x, y, z) => P(x, y, z, ox, oy);
      if (b.t === "sph") { const [cx, cy] = Q(b.x, b.y, b.z); return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(b.r * U).toFixed(1)}" fill="${col(b.c)}"/>`; }
      const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2, y0 = b.y, y1 = b.y + b.h;
      return `<polygon points="${pts([Q(x0, y0, z1), Q(x1, y0, z1), Q(x1, y1, z1), Q(x0, y1, z1)])}" fill="${shade(b.c, 0.9)}"/>` +
             `<polygon points="${pts([Q(x1, y0, z0), Q(x1, y0, z1), Q(x1, y1, z1), Q(x1, y1, z0)])}" fill="${shade(b.c, 0.78)}"/>` +
             `<polygon points="${pts([Q(x0, y1, z0), Q(x1, y1, z0), Q(x1, y1, z1), Q(x0, y1, z1)])}" fill="${col(b.c)}"/>`;
    }
    // 부품: ["box", x, z, w, d, h, 색, y] · ["person", x, z, 색, y] · ["sph", x, y, z, r, 색] — x·z 는 정거장 중심 기준
    function parts(st) {
      const [ax, az] = st.at, out = [];
      if (st.floor !== false) out.push({ t: "box", x: ax, y: 0, z: az, w: st.size[0], d: st.size[1], h: FLOOR, c: "white" });
      for (const p of st.parts || []) {
        if (p[0] === "box") out.push({ t: "box", x: ax + p[1], z: az + p[2], w: p[3], d: p[4], h: p[5], c: p[6], y: p[7] == null ? FLOOR : p[7] });
        else if (p[0] === "person") { const y = p[4] == null ? FLOOR : p[4];
          out.push({ t: "box", x: ax + p[1], z: az + p[2], w: 0.55, d: 0.55, h: 0.85, c: p[3], y }, { t: "sph", x: ax + p[1], y: y + 1.2, z: az + p[2], r: 0.33, c: "skin" }); }
        else if (p[0] === "sph") out.push({ t: "sph", x: ax + p[1], y: p[2], z: az + p[3], r: p[4], c: p[5] });
      }
      return out;
    }
    const rect = (x0, z0, x1, z1) => pts([P(x0, 0, z0), P(x1, 0, z0), P(x1, 0, z1), P(x0, 0, z1)]);
    function render() {
      pal = document.documentElement.getAttribute("data-theme") === "dark" ? PAL.dark : PAL.light;
      const k = U / 40, line = (p) => pts(p.map(([x, z]) => P(x, 0, z)));
      let s = `<defs><filter id="${uid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${(6 * k).toFixed(1)}"/></filter></defs>`;
      for (const r in R) s += `<polyline points="${line(R[r])}" fill="none" stroke="${pal.yellow}" stroke-width="${(3 * k).toFixed(1)}" stroke-dasharray="${(10 * k).toFixed(1)} ${(8 * k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<g class="iso-act" fill="none" stroke="${pal.blue}" stroke-width="${(4 * k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"></g>`;
      s += `<g filter="url(#${uid})" fill="${pal.shadow}">`;
      for (const id of ids) { const [x, z] = S[id].at, [w, d] = S[id].size; s += `<polygon points="${rect(x - w / 2, z - d / 2 + 0.3, x + w / 2 + 0.5, z + d / 2 + 0.6)}"/>`; }
      s += "</g>";
      // 정거장은 먼 것부터, 정거장 안 부품은 원고에 적은 순서(뒤 → 앞)대로
      for (const id of [...ids].sort((a, b) => S[a].at[0] + S[a].at[1] - (S[b].at[0] + S[b].at[1]))) s += "<g>" + parts(S[id]).map((b) => draw1(b)).join("") + "</g>";
      s += AS.map((X) => `<g class="iso-drop" data-a="${X.id}"></g>`).join("") + AS.map((X) => `<g class="iso-actor" data-a="${X.id}"></g>`).join("");
      svg.innerHTML = s; for (const X of AS) { X.g = svg.querySelector(`.iso-actor[data-a="${X.id}"]`); X.dg = svg.querySelector(`.iso-drop[data-a="${X.id}"]`); drawActor(X); drawDrop(X); } drawActive(); place();
    }

    /* ── 오가는 사람(여럿일 수 있다): 가는 쪽을 보고, 든 종이는 pages 만큼 두껍다 ── */
    const AS = (spec.actors || [{ id: "a", ...(spec.actor || {}) }]).map((o) => ({ id: o.id, color: o.color || "blue", home: o.home || [0, 0],
      pos: [...(o.home || [0, 0])], dir: [1, 0], pages: 1, hold: true, say: "", drop: null, busy: null, stay: false, n: null }));
    const many = AS.length > 1;
    const stepOf = (i) => { const st = spec.steps[i] || []; return Array.isArray(st) ? { [AS[0].id]: st } : st; };
    function drawActor(X) {
      const [dx, dz] = X.dir, toward = dx + dz > 0, alongX = dx !== 0;
      const body = { t: "box", x: 0, y: 0, z: 0, w: 0.55, h: 0.85, d: 0.55, c: X.color };
      const paper = { t: "box", x: dx * 0.45, y: 0.4, z: dz * 0.45, w: alongX ? 0.4 : 0.5, h: 0.07 * X.pages, d: alongX ? 0.5 : 0.4, c: "paper" };
      const head = [{ t: "sph", x: 0, y: 1.2, z: 0, r: 0.33, c: "skin" }];
      if (toward) for (const e of [-1, 1]) head.push({ t: "sph", x: dx * 0.3 - dz * 0.13 * e, y: 1.2, z: dz * 0.3 + dx * 0.13 * e, r: 0.05, c: "dark" });
      else head.push({ t: "sph", x: -dx * 0.06, y: 1.25, z: -dz * 0.06, r: 0.3, c: "hair" });
      const list = !X.hold ? [body, ...head] : toward ? [body, paper, ...head] : [paper, body, ...head];
      if (X.g) { X.g.innerHTML = list.map((b) => draw1(b, 0, 0)).join(""); moveActor(X); }
    }
    function moveActor(X) { if (!X.g) return; const [a, b] = P(X.pos[0], 0, X.pos[1]); X.g.setAttribute("transform", `translate(${a.toFixed(1)} ${b.toFixed(1)})`); }
    function drawDrop(X) {
      const st = X.drop && S[X.drop], d = st && st.drop;
      if (X.dg) X.dg.innerHTML = d ? draw1({ t: "box", x: st.at[0] + d[0], y: d[1], z: st.at[1] + d[2], w: 0.5, h: 0.07 * X.pages, d: 0.4, c: "paper" }) : "";
    }

    /* ── 이름표 ── */
    const lab = {}, mk = (cls) => { const d = document.createElement("div"); d.className = cls; labs.appendChild(d); return d; };
    for (const id of ids) lab[id] = mk("iso-lab");
    const nums = (spec.badges || []).map(([at, text]) => { const d = mk("iso-lab iso-num"); d.textContent = text; d.at = at; return d; });
    for (const X of AS) X.sayEl = mk("iso-lab iso-say");
    // 사람마다 지금 일을 시킨 정거장들. 여럿이면 합쳐서 보인다
    const busyAll = () => AS.flatMap((X) => (X.busy || []).map(([c, t]) => [c, t, X.n]));
    // 글자가 바뀐 요소만 다시 그리고, 바뀔 때는 옅게 사라졌다 떠오르게(교차) 한다. 같은 글자면 건드리지 않는다
    const swap = (el) => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); };
    const fill = (t, n) => (n == null ? t : t.replace(/\{n\}/g, n));
    function labels() {
      const busy = busyAll();
      for (const id of ids) { const hit = busy.find((x) => x[0] === id), b = !!hit;
        // 글자가 ✓ 로 시작하면 끝난 상태: 테두리는 두되 "일하는 중" 점은 빼고 회색으로
        const done = b && hit[1].startsWith("✓"), cls = "iso-lab" + (b ? " busy" : "") + (done ? " done" : ""), body = b ? fill(hit[1], hit[2]) : S[id].meta || "";
        if (lab[id].className !== cls) lab[id].className = cls;
        if (lab[id].dataset.body === body && lab[id].dataset.b === String(b)) continue;
        const small = lab[id].querySelector("small"), onlyCount = small && lab[id].dataset.b === "true" && b && lab[id].dataset.tpl === hit[1];
        lab[id].dataset.body = body; lab[id].dataset.b = String(b); lab[id].dataset.tpl = b ? hit[1] : "";
        if (onlyCount) { small.firstChild.textContent = body; continue; } // 숫자만 올라갈 때는 깜빡이지 않게 글자만 바꾼다
        lab[id].innerHTML = S[id].name + (b ? `<small>${body}${done ? "" : "<span class=\"iso-dotdot\"><i></i><i></i><i></i></span>"}</small>` : body ? `<small class="meta">${body}</small>` : "");
        const sm = lab[id].querySelector("small"); if (sm && !labels.first) swap(sm); }
    }
    // 이름표가 그림 밖으로 나가지 않게 가로 위치를 안쪽으로 당긴다
    const put = (el, p) => { const h = el.offsetWidth / 2 + 4, x = h * 2 < W ? Math.max(h, Math.min(W - h, p[0])) : p[0]; el.style.left = x.toFixed(1) + "px"; el.style.top = p[1].toFixed(1) + "px"; };
    function place() {
      for (const id of ids) put(lab[id], P(S[id].at[0], S[id].top || 2.2, S[id].at[1]));
      for (const d of nums) { put(d, P(d.at[0], 0, d.at[1])); d.style.display = step === N ? "" : "none"; }
      for (const X of AS) { const say = X.sayEl, hide = step === N || !X.say;
        if (!hide && say.dataset.t !== X.say) { say.textContent = X.say; say.dataset.t = X.say; swap(say); }
        say.classList.toggle("hide", hide); put(say, P(X.pos[0], 1.75, X.pos[1])); }
      unclutter();
    }
    // 좁은 화면에서는 이름표와 길 번호가 서로 덮는다(2026-11-26 지적) — 먼저 놓인 것을 피해 조금씩 옮긴다.
    // 정거장 이름표는 위로, 길 번호는 아래·위·옆 순서로 빈 자리를 찾고, 못 찾으면 제자리에 둔다.
    function unclutter() {
      const placed = [], gap = 3;
      const box = (e) => e.getBoundingClientRect();
      const clash = (r) => placed.some((q) => r.left < q.right + gap && r.right > q.left - gap && r.top < q.bottom + gap && r.bottom > q.top - gap);
      const settle = (el, tries) => {
        const x0 = parseFloat(el.style.left), y0 = parseFloat(el.style.top);
        for (const [dx, dy] of tries) {
          el.style.left = (x0 + dx).toFixed(1) + "px"; el.style.top = (y0 + dy).toFixed(1) + "px";
          if (!clash(box(el))) { placed.push(box(el)); return; }
        }
        el.style.left = x0.toFixed(1) + "px"; el.style.top = y0.toFixed(1) + "px"; placed.push(box(el));
      };
      for (const id of ids) { const el = lab[id]; if (!el.offsetWidth) continue; const h = el.offsetHeight + gap;
        settle(el, [[0, 0], [0, -h], [0, -2 * h], [0, h]]); }
      for (const d of nums) { if (d.style.display === "none" || !d.offsetWidth) continue; const h = d.offsetHeight + gap, w = d.offsetWidth / 2 + gap;
        settle(d, [[0, 0], [0, h], [0, -h], [w, 0], [-w, 0], [w, h], [-w, h], [0, 2 * h], [0, -2 * h]]); }
    }

    /* ── 동작: ["at"|"set"|"go"|"back"|"wait", …] 을 순서대로. 사람이 여럿이면 사람마다 따로, 동시에 ── */
    function acts(list0) {
      const out = [], seg = (r) => { for (let k = 0; k < r.length - 1; k++) out.push({ seg: [r[k], r[k + 1]], dur: 300 + Math.hypot(r[k + 1][0] - r[k][0], r[k + 1][1] - r[k][1]) * 240 }); };
      for (const a of list0 || []) {
        if (a[0] === "at") out.push({ dur: 0, jump: typeof a[1] === "string" ? R[a[1]][0] : a[1], ...a[2] });
        else if (a[0] === "set") out.push({ dur: 0, ...a[1] });
        else if (a[0] === "go") seg(R[a[1]]);
        else if (a[0] === "back") seg([...R[a[1]]].reverse());
        else if (a[0] === "wait") out.push({ dur: a[1], comp: a[2], text: a[3], wait: true, ...a[4] });
      }
      return out;
    }
    function apply(X, a) {
      if (a.jump) X.pos = [...a.jump];
      if (a.seg) X.dir = [Math.sign(a.seg[1][0] - a.seg[0][0]), Math.sign(a.seg[1][1] - a.seg[0][1])];
      if (a.face) X.dir = a.face; if (a.pages != null) X.pages = a.pages; if (a.hold != null) X.hold = a.hold; if (a.say != null) X.say = a.say;
      // wait 의 정거장을 배열로 주면 그 정거장들이 동시에 일한다(글자도 배열이면 정거장마다 다르게)
      if (a.wait || a.seg) { const arr = Array.isArray(a.comp);
        // stay: true 인 wait 의 상태는 그 사람이 걷는 동안에도 켜 둔다(정거장이 그사이에도 일하고 있을 때)
        X.busy = !a.wait ? (X.stay ? X.busy : null) : arr ? a.comp.map((c, i) => [c, Array.isArray(a.text) ? a.text[i] : a.text]) : [[a.comp, a.text]];
        if (a.wait) X.stay = !!a.stay;
        X.n = a.wait && a.count ? a.count[0] : (a.wait ? null : X.n);
        X.drop = a.wait && a.drop && !arr ? a.comp : null; drawDrop(X); }
      drawActor(X); labels(); place();
    }

    let step = N, playing = false, raf = 0, timer = 0;
    function drawActive() {
      const g = svg.querySelector(".iso-act"); if (!g) return;
      const st = step < N ? stepOf(step) : {};
      g.innerHTML = Object.values(st).map((l) => { const names = [...new Set(l.filter((a) => a[0] === "go" || a[0] === "back").map((a) => a[1]))];
        return names.length === 1 ? `<polyline points="${pts(R[names[0]].map(([x, z]) => P(x, 0, z)))}"/>` : ""; }).join("");
    }
    function ui() {
      bar.querySelectorAll(".iso-dots button").forEach((b, i) => { b.className = i < step ? "done" : i === step ? "cur" : ""; if (i === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      desc.textContent = step === N ? (sum ? sum.textContent : "") : lis[step].textContent;
      bar.querySelector('[data-a="prev"]').disabled = step === 0; bar.querySelector('[data-a="next"]').disabled = step === N;
      bar.querySelector('[data-a="play"]').textContent = playing ? "일시정지" : step === N ? "다시 재생" : "재생";
      drawActive();
    }
    function stop() { cancelAnimationFrame(raf); clearTimeout(timer); }
    function go(i, auto) {
      stop(); if (!auto) playing = false;
      step = Math.max(0, Math.min(N, i));
      for (const X of AS) Object.assign(X, { busy: null, stay: false, drop: null, n: null });
      if (step === N) { // 전체 흐름: 길마다 순서 번호가 붙은 정지 그림
        playing = false; for (const X of AS) Object.assign(X, { pos: [...X.home], dir: [1, 0], pages: N, hold: true, say: "" });
        ui(); for (const X of AS) { drawDrop(X); drawActor(X); } labels(); place(); return;
      }
      ui();
      const st = stepOf(step);
      const runs = AS.filter((X) => st[X.id]).map((X) => ({ X, list: acts(st[X.id]), k: -1, t0: 0, done: false }));
      const next = (r, now) => { // 길이가 0 인 동작은 바로 적용하고 넘어간다
        while (++r.k < r.list.length) { const a = r.list[r.k]; apply(r.X, a); if (a.dur > 0 && !reduce) { r.t0 = now; return true; } if (a.seg) { r.X.pos = [...a.seg[1]]; moveActor(r.X); } }
        r.X.busy = null; r.done = true; labels(); place(); return false;
      };
      const finish = () => { if (playing) timer = setTimeout(() => go(step + 1, true), 2400); }; // 설명 읽을 시간 (POSTING 5-3 단계 간격)
      const tick = (now) => {
        for (const r of runs) { if (r.done) continue;
          const a = r.list[r.k], t = Math.min(1, (now - r.t0) / a.dur);
          if (a.seg) { r.X.pos = [a.seg[0][0] + (a.seg[1][0] - a.seg[0][0]) * t, a.seg[0][1] + (a.seg[1][1] - a.seg[0][1]) * t]; moveActor(r.X); place(); }
          if (a.count) { const [lo, hi] = a.count, n = Math.min(hi, lo + Math.floor((hi - lo + 1) * t)); if (n !== r.X.n) { r.X.n = n; labels(); place(); } }
          if (t >= 1) next(r, now); }
        if (runs.every((r) => r.done)) return finish();
        raf = requestAnimationFrame(tick);
      };
      const t = performance.now(); for (const r of runs) next(r, t);
      if (runs.every((r) => r.done)) finish(); else raf = requestAnimationFrame(tick);
    }
    let io = null;
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (io) { io.disconnect(); io = null; } // 독자가 먼저 눌렀으면 자동 재생으로 덮어쓰지 않는다
      if (b.dataset.i != null) return go(+b.dataset.i);
      if (b.dataset.a === "prev") return go(step - 1);
      if (b.dataset.a === "next") return go(step + 1);
      if (playing) { playing = false; clearTimeout(timer); return ui(); }
      playing = true; go(step === N ? 0 : step, true);
    }, { signal });

    /* ── 시작: 전체 흐름을 먼저 보이고, 그림이 화면에 다 들어오면 한 번 저절로 재생한다 ── */
    labels.first = true; layout(); labels(); labels.first = false; render(); go(N);
    const ro = new ResizeObserver(() => { const w = stage.clientWidth; if (w && Math.abs(w - W) > 1) { layout(); render(); } }); ro.observe(stage);
    const mo = new MutationObserver(render); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (!reduce && "IntersectionObserver" in window) {
      io = new IntersectionObserver((es) => { const e = es[0];
        if (e.intersectionRatio >= 0.9 && io) { io.disconnect(); io = null; playing = true; go(0, true); } }, { threshold: [0.9, 0.95, 1] });
      io.observe(stage); // 그림 칸이 거의 다 보일 때 — 높이를 화면의 55% 로 묶어 두어 어느 화면에서든 닿는다
    }
    if (signal) signal.addEventListener("abort", () => { stop(); ro.disconnect(); mo.disconnect(); if (io) io.disconnect(); });
    return { go, get step() { return step; }, get playing() { return playing; }, actors: AS };
  }

  // 흔한 한 바퀴: 들고 가서 → 맡기고 기다리고 → 결과를 받아 → 돌아와 적는다
  isoScene.trip = (route, station, o) => [
    ["at", route, { hold: true, pages: o.pages, say: o.carry }], ["go", route],
    ["wait", o.ms || 1600, station, o.work, { hold: false, drop: true, say: "" }],
    ["set", { hold: true, pages: o.pages + 1, say: o.result }], ["wait", 500, station, o.give || "결과를 건네는 중"],
    ["back", route], ...(o.home ? [["wait", 800, o.home, o.write || "결과를 적는 중"]] : []),
  ];
  window.isoScene = isoScene;
})();
