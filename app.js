const NS = "http://www.w3.org/2000/svg";
const RN = 21;
const CN = 21;
const CS = 23;
const MUD = 5;
const TOT = RN * CN;
const GX = 10;
const GY = 10;

const COL = {
  empty: "#1e293b", wall: "#64748b", mud: "#78350f", start: "#22c55e", end: "#f43f5e", visited: "#2dd4bf", path: "#0f766e"};
const D4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const ALG = [
  ["bfs", "BFS"],
  ["dijkstra", "Dijkstra"],
  ["astar", "A*"]
];

const MSG = {
  start: [
    "let him cook 🔥",
    "searching… stay tuned bestie",
    "the algorithm is locking in"
  ],
  bfs: [
    "BFS found the fewest steps, no cap",
    "BFS said steps > vibes",
    "BFS ate and left no crumbs"
  ],
  dijkstra: [
    "Dijkstra really said mud? not today 💅",
    "cheapest route secured fr",
    "Dijkstra is so frugal it's iconic"
  ],
  astar: [
    "A* locked in 🎯",
    "A* only checked {n} cells, main character energy",
    "A* knew where it was going, respect"
  ],
  noPath: [
    "it's giving… no path 💀",
    "bro walled himself in",
    "the end is literally unreachable rn"
  ],
  mud: [
    "walked through mud, couldn't be me",
    "mud tax paid, it is what it is"
  ],
  maze: [
    "maze dropped, good luck bestie",
    "this maze is lowkey evil 😈",
    "new maze who dis"
  ],
  clear: [
    "fresh start, slay ✨",
    "clean slate era",
    "walls? never heard of them"
  ],
  raceStart: [
    "race mode activated 🏁",
    "three algos enter, one wins",
    "it's race day, besties"
  ],
  raceWin: [
    "{name} won the race 🏆",
    "{name} said gg ez",
    "{name} is built different"
  ],
  raceNone: [
    "nobody made it, everyone lost 💀",
    "no path, no winner, no vibes"
  ]
};

const wait = ms => new Promise(res => setTimeout(res, ms));

function el(tag, at = {}) {
  const n = document.createElementNS(NS, tag);
  for (const k in at) n.setAttribute(k, at[k]);
  return n;
}

function txt(p, v, x, y, at = {}) {
  const n = el("text", { x, y, ...at });
  n.textContent = v;
  p.append(n);
  return n;
}

const pick = a => a[Math.floor(Math.random() * a.length)];

class PGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.gr = Array.from({ length: RN }, () => Array(CN).fill("empty"));
    this.mk = Array.from({ length: RN }, () => Array(CN).fill(null));
    this.cs = Array.from({ length: RN }, () => Array(CN).fill(null));

    this.st = { r: 10, c: 3 };
    this.en = { r: 10, c: 17 };

    this.al = "bfs";
    this.md = "wall";
    this.sm = "normal";
    this.ms = 20;

    this.run = false;
    this.dn = false;
    this.dg = null;
    this.rid = 0;

    this.css();

    this.sv = el("svg", {
      viewBox: "0 0 720 520", width: "100%", height: "520", role: "application", "aria-label": "Pathfinding Playground"
    });

    this.shadowRoot.append(this.sv);

    this.mkGrid();
    this.mkCtrl();
    this.mkStats();
    this.mkLearn();
    this.mkBoard();
    this.upStats();

    this.stop = () => {
      this.dn = false;
      this.dg = null;
    };

    this.sv.addEventListener("pointerup", this.stop);
    this.sv.addEventListener("pointercancel", this.stop);
    window.addEventListener("pointerup", this.stop);
    window.addEventListener("pointercancel", this.stop);
  }

  css() {
    const s = document.createElement("style");

    s.textContent = `
      :host {
        display: block;
        width: 100%;
        max-width: 720px;
        margin: 16px auto;
      }

      svg {
        display: block;
        width: 100%;
        height: auto;
        background: #0f172a;
        border-radius: 14px;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }

      text {
        fill: #e2e8f0;
        pointer-events: none;
      }

      .frame {
        fill: #111c33;
        stroke: #1e293b;
      }

      .cell {
        cursor: crosshair;
        transition: fill 0.3s, opacity 0.3s;
      }

      .overlay {
        pointer-events: none;
      }

      .path-line {
        fill: none;
        stroke: #fbbf24;
        stroke-width: 6;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .dot {
        stroke: #0f172a;
        stroke-width: 3;
        transition: cx 0.15s, cy 0.15s;
      }

      .toast,
      .scoreboard {
        opacity: 0;
        transform: translateY(-8px);
        transition: opacity 0.3s, transform 0.3s;
      }

      .toast.show,
      .scoreboard.show {
        opacity: 1;
        transform: translateY(0);
      }

      .toast-bg {
        fill: #f8fafc;
        stroke: #fbbf24;
        stroke-width: 2;
      }

      .toast-text {
        fill: #0f172a;
        font-size: 12.5px;
        font-weight: 700;
      }

      .board-bg {
        fill: #0b1222;
        stroke: #fbbf24;
        stroke-width: 2;
      }

      .board-title {
        font-size: 16px;
        font-weight: 700;
        fill: #fbbf24;
      }

      .board-row {
        fill: #1e293b;
      }

      .board-row.winner {
        fill: #fbbf24;
      }

      .board-name {
        font-size: 13px;
        font-weight: 700;
        fill: #f8fafc;
      }

      .board-info {
        font-size: 11px;
        fill: #cbd5e1;
      }

      .board-text-dark {
        fill: #422006;
      }

      .btn {
        cursor: pointer;
      }

      .btn rect {
        fill: #1e293b;
        stroke: #334155;
        stroke-width: 1;
        transition: fill 0.2s;
      }

      .btn text {
        fill: #cbd5e1;
      }

      .btn:hover rect {
        fill: #334155;
      }

      .btn.active rect {
        fill: #2dd4bf;
        stroke: none;
      }

      .btn.active text {
        fill: #042f2e;
        font-weight: 700;
      }

      .btn.primary rect {
        fill: #fbbf24;
        stroke: none;
      }

      .btn.primary:hover rect {
        fill: #f59e0b;
      }

      .btn.primary text {
        fill: #422006;
        font-weight: 700;
      }

      .btn.race rect {
        fill: #f43f5e;
        stroke: none;
      }

      .btn.race:hover rect {
        fill: #e11d48;
      }

      .btn.race text {
        fill: #fff1f2;
        font-weight: 700;
      }

      .btn:focus {
        outline: none;
      }

      .btn:focus rect {
        stroke: #f8fafc;
        stroke-width: 2;
      }

      .title {
        font-size: 15px;
        font-weight: 700;
        fill: #f8fafc;
      }

      .label {
        font-size: 11px;
        font-weight: 700;
        fill: #94a3b8;
      }

      .card {
        fill: #1e293b;
      }

      .big {
        font-size: 17px;
        font-weight: 700;
        fill: #f8fafc;
      }

      .small {
        font-size: 9.5px;
        fill: #94a3b8;
      }

      .learn-text {
        font-size: 10.5px;
        fill: #cbd5e1;
      }
    `;

    this.shadowRoot.append(s);
  }

  mkGrid() {
    const g = el("g", { id: "grid" });
    this.sv.append(g);

    for (let r = 0; r < RN; r++) {
      for (let c = 0; c < CN; c++) {
        const cell = el("rect", {
          x: GX + c * CS + 1,
          y: GY + r * CS + 1,
          width: CS - 2,
          height: CS - 2,
          rx: 3,
          class: "cell"
        });

        this.cs[r][c] = cell;
        g.append(cell);
        this.paint(r, c);

        cell.addEventListener("pointerdown", e => this.onDown(e, r, c));
        cell.addEventListener("pointerenter", () => this.onEnter(r, c));
      }
    }

    this.pl = el("polyline", { class: "path-line overlay", points: "" });
    this.sd = el("circle", { r: CS / 2 - 3, fill: COL.start, class: "dot overlay" });
    this.ed = el("circle", { r: CS / 2 - 3, fill: COL.end, class: "dot overlay" });

    this.tb = el("g", { class: "toast overlay" });

    this.tb.append(
      el("rect", {
        x: 66,
        y: 18,
        width: 372,
        height: 34,
        rx: 17,
        class: "toast-bg"
      })
    );

    this.tt = txt(this.tb, "", 252, 36, {
      class: "toast-text",
      "text-anchor": "middle",
      "dominant-baseline": "middle"
    });

    this.sv.append(this.pl, this.sd, this.ed);
    this.dots();
  }
  ctr(r, c) {
    return{
      x: GX + c * CS + CS / 2,
      y: GY + r * CS + CS / 2
    };
  }

  dots() {
    const a = this.ctr(this.st.r, this.st.c);
    const b = this.ctr(this.en.r, this.en.c);
  
  this.sd.setAttribute("cx", a.x);
  this.sd.setAttribute("cy", a.y);
  this.ed.setAttribute("cx", b.x);
  this.ed.setAttribute("cy", b.y);
}
toast(m) {
  this.tt.textContent = m;
  this.tb.classList.add("show");

  clearTimeout(this.tm);
  this.tm = setTimeout(() => this.tb.classList.remove("show"), 2500);
}
say(kind, n="", name="") {
  this.toast(pick(MSG[kind]).replace("{n}", n).replace("{name}", name));
}
onDown(e, r, c) {
  if(this.rum || e.button !== 0) return;

  e.preventDefault();
  this.clrPath();
  this.dn = true;

  if(this.isS(r, c)) this.dg = "st";
  else if(this.isE(r, c)) this.dg = "en";
  else this,draw(r, c);
}

 onEnter(r, c) {
    if (!this.dn || this.run) return;

if (this.dg) this.move(this.dg, r, c);
    else this.draw(r, c);
  }

isS(r, c) {
    return this.st.r === r && this.st.c === c;
  }

isE(r, c) {
    return this.en.r === r && this.en.c === c;
  }

draw(r, c) {
    if (this.isS(r, c) || this.isE(r, c)) return;

const v = this.md === "erase" ? "empty" : this.md;

if (this.gr[r][c] === v) return;
this.gr[r][c] = v;
    this.paint(r, c);
  }

move(kind, r, c) {
    if (this.gr[r][c] === "wall") return;
    if (which === "st" && this.isE(r, c)) return;
    if (which === "en" && this.isS(r, c)) return;

    const old = { ...this[which] };
    if (old.r== r&& old.c === c) return;

    this[which] = { r, c };
    this.paint(old.r, old.c);
    this.paint(r, c);
    this.dots();
  }

  paint(r, c) {
    let col = COL[this.gr[r][c]];
    if (this.mk[r][c]) col=COL[this.mk[r][c]];
    else this.cs[r][c].setAttribute("opacity", 1);
    if (this.isS(r, c) || this.isE(r, c)) col = COL.empty;
    this.cs[r][c].setAttribute("fill", col);
  }
  mkCtrl() {
    this.pn = el("g", { id: "panel" });
    this.sv.append(this.pn);

    this.pn.append(
      el("rect", {x: 505, y: 10, width: 205, height: 295, rx: 12, class: "frame" })
    );
     txt(this.pn, "Pathfinding Playground", 515, 34, { class: "title" });
    txt(this.pn, "ALGORITHM", 515, 56, { class: "label" });

    this.ab = {};
    ALG.forEach(([k, name], i) => {
      this.ab[k] = this.btn(this.pn, 513 + i * 64, 62, 60, 24, name, () => this.setAlgo(k), 10.5);
    });

    txt(this.pn, "DRAW", 515, 104, { class: "label" });

    this.mb = {};
    [["wall", "Wall"], ["mud", "Mud"], ["erase", "Erase"]].forEach(([k, name], i) => {
      this.mb[k] = this.btn(this.pn, 513 + i * 64, 110, 60, 24, name, () => this.setMode(k), 10.5);
    });

  txt(this.pn, "SPEED", 515, 152, { class: "label" });
    this.spb = {};
    [["slow", "Slow", 60], ["normal", "Normal", 20], ["fast", "Fast", 5]].forEach(([k, name, ms], i) => {
      this.spb[k] = this.btn(this.pn, 513 + i * 64, 158, 60, 24, name, () => this.setSpeed(k, ms), 10.5);
    });

    this.btn(this.pn, 513, 196, 124, 32, "Run", () => this.go(), 13, "primary");
    this.btn(this.pn, 641, 196, 60, 32, "Race 🏁", () => this.race(), 11, "race");
    this.btn(this.pn, 513, 234, 60, 26, "Maze", () => this.maze(), 10);
    this.btn(this.pn, 577, 234, 60, 26, "Clear path", () => this.clrPath(), 9);
    this.btn(this.pn, 641, 234, 60, 26, "Clear walls", () => this.clrWalls(), 9);

    txt(this.pn, "Walls block movement.", 515, 278, { class: "small" });
    txt(this.pn, "Mud costs 5 to cross. Drag the dots.", 515, 293, { class: "small" });

    this.act(this.ab, this.al);
    this.act(this.mb, this.md);
    this.act(this.spb, this.sm);
  }
  btn(parent, x, y, w, h, name, fn, size = 11, kind = "") {
    const g = el("g", {
      class: kind ? `btn ${kind}` : "btn",
      role: "button",
      tabindex: 0,
      "aria-label": name
    });
    const rect = el("rect", { x, y, width: w, height: h, rx: 7 });
    const lab = el("text", {
      x: x + w / 2,
      y: y + h / 2,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-size": size
    });
    lab.textContent = name;
    g.append(rect, lab);
    g.addEventListener("click", fn);
    g.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
    }
    });
    parent.append(g);
    return g;
  }
  act(btns, sel) {
    for (const k in btns) btns[k].classList.toggle("active", k === sel);
  }
  setAlgo(a) {
    this.al = a;
    this.act(this.ab, a);
    this.upLearn();
  }
  setMode(m) {
    this.md = m;
    this.act(this.mb, m);
  }
  setSpeed(name, ms) {
    this.sm = name;
    this.ms = ms;
    this.act(this.spb, name);
  }
  mkStats() {
    this.sts = el("g", { id: "stats" });
    this.sv.append(this.sts);
    this.sts.append(
    el("rect", { x: 505, y: 315, width: 205, height: 295, rx: 12, class: "frame" }));
    txt(this.sts, "STATS", 515, 335, { class: "label" });
    this.stx=txt(this.sts, "Algorithm: ", 700, 355, { class: "small", "text-anchor": "end" });

    const card = (x, name) => {
      this.sts.append(el("rect", { x, y: 343, width: 60, height: 52, rx: 8, class: "card" }));
      const v=txt(this.sts, "-", x + 30, 368, { class: "big", "text-anchor": "middle" });
      return v;
    };
    this.ex = card(513, "explored");
    this.st = card(577, "steps");
    this.ct = card(641, "cost");
  }
  mkLearn() {
    this.lr = el("g", { id: "learn" });
    this.sv.append(this.lr);
    this.lr.append(el("rect", { x: 505, y: 415, width: 205, height: 95, rx: 12, class: "frame" }));
    txt(this.lr, "HOW IT WORKS", 515, 436, { class: "label" });
    this.lt =el("text", {x: 5151, y: 458, class: "learn-text"});
    this.lr.append(this.lt);
    this.upLearn();
  }
  upLearn() {
    const L={
      bfs:
      ["Spreads out one step at a time,", "like ripples in water. Finds the", "fewest steps, but ignores mud."],
      dijkstra:
      ["Explores the cheapest spot", "reached so far. Walks around","mud when that costs less."],
      astar:
      ["Like Dijkstra, but  guesses how", "far the goal is and head toward", "it. Often checks fewer squares"]
    };
    this.lt.textContent="";
    L[this.al].forEach((line, i) => {
      const t=el("tspan", {x: 515, dy:i===0?0:16});
      t.textContent = line;
      this.lt.append(t);
    });
  }
  mkBoard(){
    this.bd = el("g", { class: "scoreboard overlay" });
    this.bd.append(el("rect", { x: 92, y: 150, width: 320, height: 200, rx: 16, class: "board-bg" }));
    txt(this.bd, "Race results", 252, 182, { class: "board-title", "text-anchor": "middle" });

    this.br=[0, 1, 2].map(i => {
      const y = 198 + i * 48;
      const bg = el("rect", { x: 108, y, width: 288, height: 40, class: "board-row" });
    this.bd.append(bg);
    const name = txt(this.bd, "", 122, y + 25, { class: "board-name" });
    const info = txt(this.bd, "", 384, y + 25, { class: "board-info", "text-anchor": "end" });
    return { bg, name, info };
  });
  this.sv.append(this.bd, this.tb);
  }
  showBd(scores) {
    const rk = [...scores].sort((a, b) => {
      if (a.found !== b.found) return a.found ? -1 : 1;
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.explored - b.explored;
    });
    rk.forEach((s, i) => {
      const row = this.br[i];
      const winner = i === 0 && s.found;
      row.name.textContent = `${["🥇", "🥈", "🥉"][i]} ${s.name}`;
      row.info.textContent = s.found
        ? `${s.explored} explored · cost ${s.cost}`
        : "no path";
      row.bg.classList.toggle("winner", win);
      row.name.classList.toggle("board-text-dark", win);
      row.info.classList.toggle("board-text-dark", win);
    });
     this.bd.classList.add("show");
     if (rk[0].found) this.say("raceWin", "", rk[0].name);
    else this.say("raceNone");
  }
  