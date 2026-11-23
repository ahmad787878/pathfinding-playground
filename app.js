const NS = "http://www.w3.org/2000/svg";
const RN = 21;
const CN = 21;
const CS = 23;
const MUD = 5;
const TOT = RN * CN;
const GX = 10;
const GY = 10;

const COL = {
  empty: "#1e293b",
  wall: "#64748b",
  mud: "#78350f",
  start: "#22c55e",
  end: "#f43f5e",
  visited: "#2dd4bf",
  path: "#0f766e"
};

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
      viewBox: "0 0 720 520",
      width: "100%",
      height: "520",
      role: "application",
      "aria-label": "Pathfinding Playground"
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