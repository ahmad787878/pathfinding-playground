const NS="http://www.w3.org/2000/svg";
const RN=21;
const CN=21;
const CS=23;
const MUD=5;
const TOT=RN*CN;
const GX=10;
const GY=10;

const COL={
  empty:"#1e293b", wall:"#64748b", mud:"#78350f", start:"#22c55e", end:"#f43f5e", visited: "#2dd4bf", path: "#0f766e"};
const D4=[[-1, 0], [1, 0], [0, -1], [0, 1]];

const ALG=[
  ["bfs", "BFS"],
  ["dijkstra", "Dijkstra"],
  ["astar", "A*"]
];

const MSG={
  start:[
    "let him cook 🔥",
    "searching… stay tuned bestie",
    "the algorithm is locking in"
  ],
  bfs:[
    "BFS found the fewest steps, no cap",
    "BFS said steps > vibes",
    "BFS ate and left no crumbs"
  ],
  dijkstra:[
    "Dijkstra really said mud? not today 💅",
    "cheapest route secured fr",
    "Dijkstra is so frugal it's iconic"
  ],
  astar:[
    "A* locked in 🎯",
    "A* only checked {n} cells, main character energy",
    "A* knew where it was going, respect"
  ],
  noPath:[
    "it's giving… no path 💀",
    "bro walled himself in",
    "the end is literally unreachable rn"
  ],
  mud:[
    "walked through mud, couldn't be me",
    "mud tax paid, it is what it is"
  ],
  maze:[
    "maze dropped, good luck bestie",
    "this maze is lowkey evil 😈",
    "new maze who dis"
  ],
  clear:[
    "fresh start, slay ✨",
    "clean slate era",
    "walls? never heard of them"
  ],
  raceStart:[
    "race mode activated 🏁",
    "three algos enter, one wins",
    "it's race day, besties"
  ],
  raceWin:[
    "{name} won the race 🏆",
    "{name} said gg ez",
    "{name} is built different"
  ],
  raceNone:[
    "nobody made it, everyone lost 💀",
    "no path, no winner, no vibes"
  ],
  chaseStart:[
    "run bestie, A* is coming 🐭",
    "mouse era activated, good luck",
    "30 seconds to prove you're built different"
  ],
  chaseWin:[
    "You survived 🏆 · ate and left no crumbs",
    "You survived 🏆 · mouse diff fr",
    "You survived 🏆 · main character energy"
  ],
  chaseLose:[
    "Caught after {n}s 💀 · skill issue",
    "Caught after {n}s 💀 · A* locked in",
    "Caught after {n}s 💀 · it's giving gg"
  ]
};
const wait=ms=>new Promise(res=>setTimeout(res, ms));

function el(tag, at={}) {
  const n=document.createElementNS(NS, tag);
  for (const k in at) n.setAttribute(k, at[k]);
  return n;
}

function txt(p, v, x, y, at={}) {
  const n=el("text", { x, y, ...at });
  n.textContent=v;
  p.append(n);
  return n;
}

const pick=a=>a[Math.floor(Math.random() * a.length)];
class Heap{
  constructor(cmp=(a, b)=>a-b){
    this.a=[];
    this.cmp=cmp;
  }
  push(v){
    const a=this.a;
    a.push(v);
    let i=a.length-1;
    while(i>0){
      const p=Math.floor((i-1)/2);
      if(this.cmp(a[i], a[p])>=0) break;
      [a[i], a[p]]= [a[p], a[i]];
      i=p;
    }
  }
  pop(){
    const a=this.a;
    if(!a.length) return;
    const top=a[0];
    const last =a.pop();
    if(!a.length) return top;
    a[0]=last;
    let i=0;
    while(true){
      let b=i;
      const l=i*2+1;
      const r=i*2+2;
      if(l<a.length && this.cmp(a[l], a[b]) <0) b=l;
      if(r<a.length && this.cmp(a[r], a[b]) <0) b=r;
      if(b===i) break;
      [a[i], a[b]]=[a[b], a[i]];
      i=b;
    }
    return top;
  }
  get size(){
    return this.a.length;
  }
}

class PGrid extends HTMLElement{
  constructor(){
    super();
    this.attachShadow({ mode:"open" });

    this.gr=Array.from({ length: RN }, ()=>Array(CN).fill("empty"));
    this.mk=Array.from({ length: RN }, ()=>Array(CN).fill(null));
    this.cs=Array.from({ length: RN }, ()=>Array(CN).fill(null));

    this.st={ r:10, c:3 };
    this.en={ r:10, c:17 };

    this.al="bfs";
    this.md="wall";
    this.sm="normal";
    this.ms=20;

    this.run=false;
    this.dn=false;
    this.dg=null;
    this.rid=0;
    this.ch=false;
    this.wl=8;
    this.sec=30;
    this.cms=200;
    this.chAt=0;
    this.chTm=null;
    this.chCd=null;
    this.chKey=e=> this.chMove(e);

    this.css();

    this.sv = el("svg",{
      viewBox:"0 0 720 850", width:"100%", height:"850", role:"application", "aria-label":"Pathfinding Playground"
    });

    this.shadowRoot.append(this.sv);

    this.mkGrid();
    this.mkCtrl();
    this.mkStats();
    this.mkLearn();
    this.mkBoard();
    this.mkHeap();
    this.upStats();

    this.stop =()=>{
      this.dn=false;
      this.dg=null;
    };

    this.sv.addEventListener("pointerup", this.stop);
    this.sv.addEventListener("pointercancel", this.stop);
    window.addEventListener("pointerup", this.stop);
    window.addEventListener("pointercancel", this.stop);
  }

  css(){
    const s=document.createElement("style");
    s.textContent=`
      :host{
        display:block;
        width:100%;
        max-width:720px;
        margin:16px auto;
      }
      svg{
        display:block;
        width:100%;
        height: auto;
        background: #0f172a;
        border-radius:14px;
        font-family:system-ui,-apple-system,"Segoe UI", sans-serif;
        touch-action:none;
        user-select: none;
        -webkit-user-select: none;
      }
      text{
        fill: #e2e8f0;
        pointer-events:none;
      }
      .frame{
        fill: #111c33;
        stroke: #1e293b;
      }

      .cell{
        cursor:crosshair;
        transition:fill 0.3s,opacity 0.3s;
      }
      .overlay{
        pointer-events: none;
      }
      .path-line{
        fill:none;
        stroke: #fbbf24;
        stroke-width: 6;
        stroke-linecap:round;
        stroke-linejoin:round;
      }
      .dot{
        stroke: #0f172a;
        stroke-width:3;
        transition:cx 0.15s, cy 0.15s;
      }
      .toast,
      .scoreboard {
        opacity:0;
        transform:translateY(-8px);
        transition:opacity 0.3s, transform 0.3s;
      }
      .toast.show,
      .scoreboard.show{
        opacity:1;
        transform:translateY(0);
      }
      .toast-bg{
        fill: #f8fafc;
        stroke: #fbbf24;
        stroke-width:2;
      }
      .toast-text{
        fill: #0f172a;
        font-size:12.5px;
        font-weight:700;
      }
      .board-bg{
        fill: #0b1222;
        stroke: #fbbf24;
        stroke-width:2;
      }
      .board-title{
        font-size:16px;
        font-weight:700;
        fill: #fbbf24;
      }
      .board-row{
        fill: #1e293b;
      }
      .board-row.winner{
        fill: #fbbf24;
      }
      .board-name{
        font-size:13px;
        font-weight:700;
        fill: #f8fafc;
      }
      .board-info{
        font-size:11px;
        fill: #cbd5e1;
      }
      .board-text-dark{
        fill: #422006;
      }
      .btn{
        cursor: pointer;
      }
      .btn rect{
        fill: #1e293b;
        stroke: #334155;
        stroke-width:1;
        transition:fill 0.2s;
      }
      .btn text{
        fill: #cbd5e1;
      }
      .btn:hover rect{
        fill: #334155;
      }
      .btn.active rect{
        fill: #2dd4bf;
        stroke: none;
      }
      .btn.active text{
        fill: #042f2e;
        font-weight: 700;
      }
      .btn.primary rect{
        fill: #fbbf24;
        stroke: none;
      }
      .btn.primary:hover rect{
        fill: #f59e0b;
      }
      .btn.primary text{
        fill: #422006;
        font-weight: 700;
      }
      .btn.race rect{
        fill: #f43f5e;
        stroke:none;
      }
      .btn.race:hover rect{
        fill: #e11d48;
      }
      .btn.race text{
        fill: #fff1f2;
        font-weight:700;
      }
      .btn:focus{
        outline:none;
      }
      .btn:focus rect{
        stroke: #f8fafc;
        stroke-width:2;
      }
      .title{
        font-size:15px;
        font-weight:700;
        fill: #f8fafc;
      }
      .label{
        font-size:11px;
        font-weight:700;
        fill: #94a3b8;
      }
      .card{
        fill: #1e293b;
      }
      .big{
        font-size:17px;
        font-weight:700;
        fill: #f8fafc;
      }
      .small{
        font-size:9.5px;
        fill: #94a3b8;
      }
      .learn-text{
        font-size: 10.5px;
        fill: #cbd5e1;
      }
    `;
    this.shadowRoot.append(s);
  }

  mkGrid(){
    const g = el("g", { id:"grid" });
    this.sv.append(g);

    for (let r=0; r<RN; r++) {
      for (let c=0; c<CN; c++) {
        const cell=el("rect", {
          x: GX + c*CS+1,
          y:GY+r*CS+1,
          width:CS-2,
          height:CS-2,
          rx:3,
          class:"cell"
        });

        this.cs[r][c]=cell;
        g.append(cell);
        this.paint(r, c);

        cell.addEventListener("pointerdown", e=>this.onDown(e, r, c));
        cell.addEventListener("pointerenter", ()=>this.onEnter(r, c));
      }
    }

    this.pl=el("polyline", { class: "path-line overlay", points: "" });
    this.sd=el("circle", { r:CS/2-3, fill: COL.start, class: "dot overlay" });
    this.ed=el("circle", { r:CS/2-3, fill: COL.end, class: "dot overlay" });

    this.tb=el("g", { class: "toast overlay" });

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
  ctr(r, c){
    return{
      x: GX+c*CS+CS/2,
      y: GY+r*CS+CS/2
    };
  }

  dots(){
    const a=this.ctr(this.st.r, this.st.c);
    const b=this.ctr(this.en.r, this.en.c);
  
  this.sd.setAttribute("cx", a.x);
  this.sd.setAttribute("cy", a.y);
  this.ed.setAttribute("cx", b.x);
  this.ed.setAttribute("cy", b.y);
}
toast(m){
  this.tt.textContent = m;
  this.tb.classList.add("show");

  clearTimeout(this.tm);
  this.tm = setTimeout(()=>this.tb.classList.remove("show"), 2500);
}
say(kind, n="", name=""){
  this.toast(pick(MSG[kind]).replace("{n}", n).replace("{name}", name));
}
onDown(e,r,c){
  if(e.button!==0) return;
  if(this.ch){
  e.preventDefault();
  this.chWall(r, c);
  return;
  }
  if(this.run) return;
  e.preventDefault();
  this.clrPath();
  this.dn = true;

  if(this.isS(r,c)) this.dg="st";
  else if(this.isE(r,c)) this.dg="en";
  else this.draw(r,c);
}

 onEnter(r,c){
    if (!this.dn || this.run) return;

if (this.dg) this.move(this.dg,r,c);
    else this.draw(r,c);
  }

isS(r, c) {
    return this.st.r===r && this.st.c ===c;
  }

isE(r, c) {
    return this.en.r ===r && this.en.c ===c;
  }

draw(r, c) {
    if (this.isS(r, c) || this.isE(r, c)) return;

const v = this.md==="erase" ? "empty" : this.md;

if (this.gr[r][c]===v) return;
this.gr[r][c] = v;
    this.paint(r, c);
  }

move(which, r, c){
    if (this.gr[r][c]==="wall") return;
    if (which==="st" && this.isE(r, c)) return;
    if (which==="en" && this.isS(r, c)) return;

    const old={ ...this[which] };
    if (old.r== r&& old.c ===c) return;

    this[which]={r,c};
    this.paint(old.r, old.c);
    this.paint(r,c);
    this.dots();
  }
  paint(r, c){
    let col=COL[this.gr[r][c]];
    if (this.mk[r][c]) col=COL[this.mk[r][c]];
    else this.cs[r][c].setAttribute("opacity", 1);
    if (this.isS(r, c) || this.isE(r, c)) col=COL.empty;
    this.cs[r][c].setAttribute("fill", col);
  }
  mkCtrl() {
    this.pn = el("g",{ id:"panel" });
    this.sv.append(this.pn);

    this.pn.append(
      el("rect",{ x:505, y:10, width:205, height:295, rx:12, class:"frame" }));
     txt(this.pn, "Pathfinding Playground", 515, 34, { class: "title" });
    txt(this.pn, "ALGORITHM", 515, 56, { class:"label" });

    this.ab={};
    ALG.forEach(([k, name], i)=>{
      this.ab[k]=this.btn(this.pn, 513 + i*64, 62, 60, 24, name, ()=>this.setAlgo(k), 10.5);
    });

    txt(this.pn,"DRAW", 515, 104, { class: "label" });

    this.mb = {};
    [["wall", "Wall"], ["mud", "Mud"], ["erase", "Erase"]].forEach(([k, name], i)=>{
      this.mb[k] = this.btn(this.pn, 513+i*64, 110, 60, 24, name, ()=>this.setMode(k), 10.5);
    });

  txt(this.pn, "SPEED", 515, 152, { class: "label" });
    this.spb={};
    [["slow", "Slow", 60], ["normal", "Normal", 20], ["fast", "Fast", 5]].forEach(([k, name, ms], i)=>{
      this.spb[k]=this.btn(this.pn, 513+i*64, 158, 60, 24, name, () => this.setSpeed(k, ms), 10.5);
    });

    this.btn(this.pn, 513, 196, 124, 32, "Run", ()=>this.go(), 13, "primary");
    this.btn(this.pn, 641, 196, 60, 32, "Race 🏁", ()=>this.race(), 11, "race");
    this.btn(this.pn, 513, 234, 60, 26, "Maze", ()=>this.maze(), 10);
    this.btn(this.pn, 577, 234, 60, 26, "Clear path",() =>this.clrPath(), 9);
    this.btn(this.pn, 641, 234, 60, 26, "Clear walls", ()=>this.clrWalls(), 9);

    this.btn(this.pn, 513, 267, 188, 29, "Chase 🐭", ()=>this.chase(), 12, "race");

    this.act(this.ab, this.al);
    this.act(this.mb, this.md);
    this.act(this.spb, this.sm);
  }
  btn(parent, x, y, w, h, name, fn, size=11, kind=""){
    const g=el("g", {
      class: kind ? `btn ${kind}`:"btn",
      role:"button",
      tabindex: 0,
      "aria-label":name
    });
    const rect=el("rect", { x, y, width: w, height: h, rx: 7 });
    const lab=el("text",{
      x: x+w/2,
      y: y+h/2,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-size":size
    });
    lab.textContent=name;
    g.append(rect, lab);
    g.addEventListener("click", fn);
    g.addEventListener("keydown", e=>{
    if (e.key==="Enter" || e.key===" ") {
    e.preventDefault();
    fn();
    }
    });
    parent.append(g);
    return g;
  }
  act(btns, sel){
    for (const k in btns) btns[k].classList.toggle("active", k===sel);
  }
  setAlgo(a){
    if(this.ch) return;
    this.al=a;
    this.act(this.ab, a);
    this.upLearn();
  }
  setMode(m){
    this.md=m;
    this.act(this.mb, m);
  }
  setSpeed(name, ms){
    this.sm=name;
    this.ms=ms;
    this.act(this.spb, name);
  }
  mkStats(){
    this.sts=el("g", { id:"stats"});
    this.sv.append(this.sts);
    this.sts.append(
    el("rect", { x:505, y:315, width:205, height:90, rx:12, class:"frame" }));
    txt(this.sts, "STATS", 515, 335, { class: "label" });
    this.stx=txt(this.sts, "Ready", 700, 335, { class:"small", "text-anchor": "end" });
    this.sl=[];

    const card = (x, name) =>{
      this.sts.append(el("rect", { x, y:343, width:60, height: 52, rx: 8, class:"card" }));
      const v=txt(this.sts, "-", x+30, 368, { class: "big", "text-anchor": "middle" });
      this.sl.push(txt(this.sts, name, x+30, 385, {class:"small", "text-anchor": "middle"}));
      return v;
    };
    this.ex=card(513, "explored");
    this.ln=card(577, "steps");
    this.ct=card(641, "cost");
  }
  mkLearn(){
    this.lr=el("g", { id: "learn" });
    this.sv.append(this.lr);
    this.lr.append(el("rect", { x: 505, y: 415, width: 205, height: 95, rx: 12, class: "frame" }));
    txt(this.lr, "HOW IT WORKS", 515, 436, { class: "label" });
    this.lt=el("text", { x: 515, y: 458, class: "learn-text" });
    this.lr.append(this.lt);
    this.upLearn();
  }
  upLearn(){
    const L={
      bfs:
      ["Spreads out one step at a time,", "like ripples in water. Finds the", "fewest steps, but ignores mud."],
      dijkstra:
      ["Explores the cheapest spot", "reached so far. Walks around","mud when that costs less."],
      astar:
      ["Like Dijkstra, but  guesses how", "far the goal is and head toward", "it. Often checks fewer squares"]
    };
    this.lt.textContent="";
    L[this.al].forEach((line, i)=>{
      const t=el("tspan", {x: 515, dy:i===0?0:16});
      t.textContent = line;
      this.lt.append(t);
    });
  }
  mkHeap(){
    this.hp=el("g", {id:"heap"});
    this.sv.append(this.hp); 
    this.hp.append(el("rect", { x:10, y:520, width:700, height:320, rx:12, class:"frame" }));
    txt(this.hp, "Priority queue", 25,545, { class:"title" });
    this.hn=txt(this.hp,"queue size: 0", 695,545, { class:"label", "text-anchor": "end" });
    this.ht = txt(this.hp, "Run an algorithm to see its queue.", 25,565, { class:"small" });
    this.hd =el("g");
    this.hp.append(this.hd);
    txt(this.hp, "The heap always keeps the cheapest cell on top.", 25, 825, {class: "learn-text"});
  }
  hpPos(i){
    const l=Math.floor(Math.log2(i+1));
    const j=i-(2** l-1);
    return {x: 10+700*(j+0.5)/(2**l), y: 600+l*65};
  }
  upHeap(s=null){
    this.hd.textContent="";
    this.hn.textContent=`queue size: ${s?s.size :0}`;
    if(!s){
      this.ht.textContent="Run an algorithm to see its queue.";
      return;
    }
    this.ht.textContent=s.bfs? "BFS · first in, first out · cell IDs (front on left)": `${s.guess ? "A* · f =g+h": "Dijkstra · distance"} · yellow = next valid root · grey=outdated`;
    if(s.skip) this.ht.textContent += " · skipped stale entry";
    if(s.bfs){
      s.a.forEach((id, i) => {
        const x=25+i*44;
        this.hd.append(el("rect", {x, y:615, width: 40, height:34, rx:5, fill: i===0? "#fbbf24" : "#1e293b", stroke: "#334155" }));
        txt(this.hd, id, x + 20, 632, { "font-size": 11, "text-anchor": "middle", "dominant-baseline": "middle", style: i === 0 ? "fill:#422006" : "" });
      });
      return;
    }
    s.a.forEach((v, i)=>{
      if(i===0) return;
      const a=this.hpPos(Math.floor((i-1)/2));
      const b=this.hpPos(i);
      this.hd.append(el("line", {x1:a.x, y1:a.y, x2:b.x, y2:b.y, stroke:"#64748b", "stroke-width": 2}));
    });
    s.a.forEach((v, i)=>{
      const {x, y}=this.hpPos(i);
      const col=v.old? "#64748b" : i === 0 ? "#fbbf24" : "#2dd4bf";
      this.hd.append(el("circle", {cx: x, cy: y, r:17, fill: col, stroke: i===0 ? "#fbbf24":"#0f172a", "stroke-width":2 }));
      txt(this.hd, v.f, x, y, {"font-size": 12, "font-weight": 700, "text-anchor": "middle", "dominant-baseline": "middle", style: v.old ? "fill:#f8fafc" : "fill:#042f2e"});
    });
  }

  mkBoard(){
    this.bd = el("g", { class: "scoreboard overlay" });
    this.bd.append(el("rect", { x: 92, y: 150, width: 320, height: 200, rx: 16, class: "board-bg" }));
    txt(this.bd, "Race results", 252, 182, { class: "board-title", "text-anchor": "middle" });

    this.br=[0, 1, 2].map(i=>{
      const y=198 +i*48;
      const bg=el("rect", { x: 108, y, width: 288, height: 40, class: "board-row" });
    this.bd.append(bg);
    const name=txt(this.bd, "", 122, y+25, { class:"board-name" });
    const info=txt(this.bd, "", 384, y+25, { class:"board-info", "text-anchor": "end" });
    return { bg, name, info };
  });
  this.sv.append(this.bd, this.tb);
  }
  showBd(scores) {
    const rk=[...scores].sort((a, b) => {
      if (a.found!==b.found) return a.found ?-1:1;
      if (a.cost!==b.cost) return a.cost-b.cost;
      return a.explored-b.explored;
    });
    rk.forEach((s, i)=>{
      const row=this.br[i];
      const win=i===0 && s.found;
      row.name.textContent=`${["🥇", "🥈", "🥉"][i]} ${s.name}`;
      row.info.textContent=s.found
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
  hideBd() {
    if (this.bd) this.bd.classList.remove("show");
  }
  idx(r, c) {
    return r * CN + c;
  }
  pos(i) {
    return { r: Math.floor(i / CN), c: i % CN };
  }
  nb(r, c) {
    const out=[];
    for (const [dr, dc] of D4) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < RN && nc >= 0 && nc < CN && this.gr[nr][nc] !== "wall"){
        out.push(this.idx(nr, nc));
      }
    }
    return out;
  }
  cost(r, c) {
    return this.gr[r][c] === "mud" ? MUD : 1;
  }
  trace(prev, s, g) {
      if(s === g) return [s];
    if (!prev.has(g)) return [];
  const p=[g];
  let cur=g;
  while (cur!==s) {
    const b=prev.get(cur);
    if (b===undefined) return [];
    cur=b;
    p.push(cur);
}
    return p.reverse();
  }
  bfs(){
    const s=this.idx(this.st.r, this.st.c);
    const g=this.idx(this.en.r, this.en.c);
    const q=[s];
    const seen=new Set([s]);
    const prev=new Map();
    const order=[];
    const frames=[];
    let h=0;
    const snap=id=> frames.push({id, bfs: true, a:q.slice(h, h+15), size: q.length-h});
    snap(null);
    while(h<q.length){
      const cur=q[h++];
      order.push(cur);
      if(cur!=g){
        const{r, c}=this.pos(cur);
        for(const n of this.nb(r, c)){
          if(seen.has(n)) continue;
          seen.add(n);
          prev.set(n, cur);
          q.push(n);
        }
      }
      snap(cur);
      if(cur===g) break;
    }
    return {order, path: this.trace(prev, s, g), frames};
  }

  dijkstra() {
    return this.wsearch(false);
  }
  astar(rec=true){
    return this.wsearch(true, rec);
  }
  wsearch(guess, rec=true){
    const s=this.idx(this.st.r, this.st.c);
    const g=this.idx(this.en.r, this.en.c);
    const dist=Array(TOT).fill(Infinity);
    const prev=new Map();
    const done=new Set();
    const order=[];
    const frames=[];
    const pq=new Heap((a, b)=> a.f-b.f || a.h-b.h || a.id-b.id);
    const put=(id, d)=>{
      const h=guess ? this.hh(id, g):0;
      pq.push({id, d, h, f:d+h});
    };
    const old=v=> done.has(v.id) || v.d!== dist[v.id];
    const snap=(id, skip=false)=>{
      if(!rec) return;
      frames.push({id, guess, skip, size: pq.size, a:pq.a.slice(0, 15).map(v=>({...v, old: old(v)}))});
    };
    dist[s]=0;
    put(s, 0);
    snap(null);
    while(pq.size){
      const v=pq.pop();
      if(old(v)){
        snap(null, true);
        continue;
      }
    const cur=v.id;
    done.add(cur);
    order.push(cur);
    if(cur!==g){
      const{r, c}=this.pos(cur);
      for(const n of this.nb(r, c)){
        if(done.has(n)) continue;
        const p=this.pos(n);
        const nd=dist[cur]+this.cost(p.r, p.c);
        if(nd<dist[n]){
          dist[n]=nd;
          prev.set(n, cur);
          put(n, nd);
        }
      }
    }
    snap(cur);
    if(cur===g) break;
    }
    return{ order, path: this.trace(prev, s, g), frames};
  }
hh(i, g) {
  const a = this.pos(i);
  const b = this.pos(g);
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}
  async go() {
    if (this.run) return;
this.clrPath();
    this.say("start");

    const res = this[this.al]();
    const ok = await this.play(res);

    if (ok) this.fin(res);
  }
  async race() {
    if (this.run) return;

    this.clrPath();
    this.say("raceStart");

    const scores=[];

    for (const [k, name] of ALG) {
      this.clrMarks();
      this.setAlgo(k);

      const res=this[k]();
      const ok=await this.play(res);

      if (!ok) return;

      scores.push({
        name, found: res.path.length > 0, explored: res.order.length, cost: this.pcost(res.path)});
      this.run = true;
      const my=this.rid;
      await wait(700);
      if (my!==this.rid) return;
    }
    this.run = false;
    this.showBd(scores);
  }
  async play(res) {
    this.run=true;
    const my=++this.rid;
    const s=this.idx(this.st.r, this.st.c);
    const e=this.idx(this.en.r, this.en.c);
    const total=res.order.length;
    this.upStats(res);  
    let i=0;
    for(const s1 of res.frames){
      if(my !==this.rid) return false;
      this.upHeap(s1);
      const id=s1.id;
      if(id !==null){
        if(id!==s && id!==e){
          const f=1-(i/total)*0.65;
          this.pmark(id, "visited", f.toFixed(2));
        }
        i++
      }
      await wait(this.ms);
    }

    const pts=[];
    for (const id of res.path){
      if(my!== this.rid) return false;
      const{r, c}=this.pos(id);
      const{x, y}=this.ctr(r, c);
      pts.push(`${x},${y}`);
      this.pl.setAttribute("points", pts.join(" "));
      if( id!== s && id!==e){
        this.pmark(id, "path");
        await wait(this.ms*2);
      }
    }
    if(my!==this.rid) return false;
    this.run=false;
    this.upStats(res);
    return true;
  }
  fin(res){
    if(res.path.length===0){
      this.say("noPath");
      return;
    }
    const steps=res.path.length-1;
    const tc=this.pcost(res.path);
    if (this.al==="bfs" && tc>steps) {
      this.say("mud");
      return;
    }
    this.say(this.al, res.order.length);
  }
  pcost(path){
    let t=0;
    for(let i=1; i< path.length; i++){
      const {r,c}=this.pos(path[i]);
      t+=this.cost(r, c);
    }
    return t;
  }
  pmark(id, type, op=1) {
    const { r, c}=this.pos(id);
    this.mk[r][c]=type;
    this.paint(r, c);
    this.cs[r][c].setAttribute("opacity", op);
  }
  upStats(res=null){
    ["explored", "steps", "cost"].forEach((v, i) => this.sl[i].textContent = v);
    if(!res){
      this.ex.textContent="—";
      this.ln.textContent = "—";
      this.ct.textContent="—";
      this.stx.textContent="Ready";
      return;
    }
    this.ex.textContent=res.order.length;
    if(res.path.length===0){
      this.ln.textContent = "—";
  this.ct.textContent = "—";
  this.stx.textContent = this.run ? "Searching…" : "No path found";
  return;
    }
    this.ln.textContent=res.path.length-1;
    this.ct.textContent = this.pcost(res.path);
    this.stx.textContent=this.run ? "Searching..." : "Done";
  }

  clrMarks(){
    if(this.hd) this.upHeap();
    if(this.pl) this.pl.setAttribute("points", "");
    for(let r=0; r<RN; r++){
      this.mk[r].fill(null);
      for(let c=0; c<CN; c++) this.paint(r, c);
    }
  }
  clrPath(){
    this.chStop();
    this.rid++;
    this.run=false;
    this.dn=false;
    this.dg=null;
    this.hideBd();
    this.clrMarks();
    this.upStats();
  }
  clrWalls(){
    this.clrPath();
    for(let r=0; r<RN; r++){
      for(let c=0; c<CN; c++){
        this.gr[r][c]="empty";
        this.paint(r, c);
      }
    }
    this.say("clear");
  }
  chase(){
    if(this.run) return;
    this.clrPath();
    this.setAlgo("astar");
    this.ch=true;
    this.run=true;
    this.wl=8;
    this.sec=30;
    this.cms=200;
    this.chAt=performance.now();
    window.addEventListener("keydown", this.chKey);
    this.chStats();
    this.say("chaseStart");
    this.chPlan();
    if(this.isS(this.en.r, this.en.c)){
      this.chEnd(false);
      return;
    }
    this.chCd=setInterval(()=> this.chTime(), 100);
    this.chTm=setTimeout(()=>this.chStep(), this.cms);
  }
  chTime(){
    if(!this.ch) return false;
    const t=(performance.now()-this.chAt)/1000;
    if(t>=30){
      this.sec=0;
      this.chEnd(true);
      return false;
    }
    this.sec=Math.ceil(30-t);
    this.cms=Math.max(80, 200-Math.floor(t)*4);
    this.chStats();
    return true;
  }
  chMove(e){
    if(!this.ch) return;
    const keys={arrowup: [-1, 0], w:[-1, 0], arrowdown:[1, 0], s:[1,0], arrowleft:[0,-1], a:[0,-1], arrowright:[0,1], d:[0,1] };
    const d=keys[e.key.toLowerCase()];
    if(!Array.isArray(d)) return;
    e.preventDefault();
    if(!this.chTime()) return;
    const r=this.en.r +d[0];
    const c=this.en.c+d[1];
    if(r<0 || r>=RN || c<0 || c>=CN || this.gr[r][c]==="wall") return;
    if(this.isS(r, c)){
      this.chEnd(false);
      return;
    }
    this.move("en", r, c);
    this.chPlan();
  }
  chWall(r, c){
    if(!this.chTime()) return;
    if(!this.wl || this.isS(r, c) || this.isE(r, c) || this.gr[r][c]==="wall") return;
    this.gr[r][c]="wall";
    this.wl--;
    this.paint(r, c);
    this.chStats();
    this.chPlan();
  }
  chPlan(){
    const res=this.astar(false);
    const pts=res.path.map(id=>{
      const {r, c}=this.pos(id);
      const {x, y}=this.ctr(r, c);
      return `${x},${y}`;
    });
    this.pl.setAttribute("points", pts.join(" "));
    return res.path;
  }
  chStep(){
    if(!this.chTime()) return;
    const p=this.chPlan();
    let delay=this.cms;
    if(p.length>1){
      const{r, c}=this.pos(p[1]);
      if(this.isE(r, c)){
        this.chEnd(false);
        return;
      }
      this.move("st", r, c);
      delay*=this.cost(r, c);
      this.chPlan();
    }
    this.chTm=setTimeout(()=> this.chStep(), delay);
  }
  chStats(){
    ["time", "walls left", "step ms"].forEach((v, i)=> this.sl[i].textContent=v);
    this.ex.textContent= `${this.sec}s`;
    this.ln.textContent=this.wl;
    this.ct.textContent=this.cms;
    this.stx.textContent="Chase 🐭";
  }
  chEnd(win){
    const t=Math.min(30, (performance.now()- this.chAt)/1000).toFixed(1);
    this.chStats();
    this.chStop();
    this.run =false;
    this.stx.textContent=win? "Survived 🏆" : `Caught ${t}s`;
    this.say(win ? "chaseWin" : "chaseLose", t);
  }
  chStop(){
    if(!this.ch) return;
    this.ch= false;
    clearTimeout (this.chTm);
    clearInterval(this.chCd);
    this.chTm=null;
    this.chCd=null;
    window.removeEventListener("keydown", this.chKey);
    this.pl.setAttribute("points", "");
  }
  inb(r, c){
    return r>0 && r<RN-1 && c>0 && c<CN-1;
  }
  async maze(){
    if (this.run) return;
    this.clrPath();
    this.run=true;
    const my=this.rid;
    for(let r=0; r<RN; r++){
      for(let c=0; c<CN; c++) this.gr[r][c] = "wall";
    }
    this.st={r:1, c:1};
    this.en={r:RN-2, c:CN -2};

    const carved=[{r:1, c:1}];
    const stack=[{r:1, c:1}];
    this.gr[1][1]= "empty";

    while(stack.length){
      const cur= stack[stack.length-1];
      const opts=[];

      for(const [dr, dc] of D4){
        const nr=cur.r + dr*2;
        const nc=cur.c+dc*2;
        if(this.inb(nr, nc) && this.gr[nr][nc]==="wall") opts.push({r:nr, c: nc});
      }
      if (!opts.length){
        stack.pop();
        continue;
      }
      const nx=pick(opts);
      const mid={r:(cur.r+nx.r)/2, c: (cur.c+ nx.c) /2};

      this.gr[mid.r][mid.c] = "empty";
      this.gr[nx.r][nx.c]="empty";
      carved.push(mid, nx);
      stack.push(nx);
    }
    this.loops(15);
    this.muds(10);
    const fin=this.gr.map(row=>[...row]);
    for(let r=0; r<RN; r++){
      for(let c=0; c<CN; c++){
        this.gr[r][c] = "wall";
        this.paint(r, c);
      }
    }
    this.dots();
    for(const {r,c} of carved){
      if(my!==this.rid) return;
      this.gr[r][c] = fin[r][c] === "wall" ? "empty" : fin[r][c];
      this.paint(r, c);
      await wait(4);
    }
    if (my!==this.rid) return;
    this.gr=fin;
      for(let r=0; r<RN; r++){
        for (let c = 0; c < CN; c++) this.paint(r, c);
      }
    this.run = false;
    this.say("maze");
    }
    loops(n) {
    let a = 0;
    let t = 0;
    while (a < n && t < 500) {
      t++;
      const r=1+Math.floor(Math.random()*(RN-2));
      const c=1+Math.floor(Math.random()*(CN-2));
      if(this.gr[r][c] !="wall") continue;
      const across= r%2===1 && c%2 ==0 && this.gr[r][c - 1] !== "wall" && this.gr[r][c + 1]!=="wall";
      const down=r%2===0 && c%2===1 && this.gr[r-1][c] !== "wall" && this.gr[r+1][c]!=="wall";
      if(across || down){
        this.gr[r][c]="empty";
        a++;
    }
  }
}
muds(n){
  let a=0;
  let t=0;
  while (a<n && t<500){
    t++;
    const r=1+Math.floor(Math.random()* (RN-1));
    const c=1+Math.floor(Math.random()*(CN-1));

    if(this.gr[r][c] !== "empty") continue;
    if(this.isS(r,c) || this.isE(r, c)) continue;

    this.gr[r][c]="mud";
    a++
    }
  }
}
customElements.define("pathfinding-grid", PGrid);
document.body.append(document.createElement("pathfinding-grid"));