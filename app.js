/* ═════════ ÉTAT ═════════ */

const KEY = "coach.v2";
const BLANK = {
  foodEdits:{}, foodAdd:{}, plan:null, charges:{}, logs:{}, runs:{}, weights:[],
  extras:{}, supps:{}, padel:{}, skipped:{}, apurna:{}, shop:{}, phase:"p1", offset:0,
};
let S = load();
let FOODS = {}, PLAN = {};

function load() {
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r) return Object.assign({}, BLANK, r); }
  catch (e) {}
  return JSON.parse(JSON.stringify(BLANK));
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

function rebuild() {
  FOODS = {};
  for (const k in DEFAULT_FOODS) FOODS[k] = Object.assign({}, DEFAULT_FOODS[k], S.foodEdits[k] || {});
  for (const k in S.foodAdd) FOODS[k] = S.foodAdd[k];
  PLAN = S.plan ? S.plan : JSON.parse(JSON.stringify(DEFAULT_PLAN));
}
function editPlan(fn) {
  if (!S.plan) S.plan = JSON.parse(JSON.stringify(DEFAULT_PLAN));
  fn(S.plan); rebuild(); save();
}
rebuild();

/* ═════════ OUTILS ═════════ */

const $ = (s) => document.querySelector(s);
const fr = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
const todayKey = () => DAYS[(new Date().getDay() + 6) % 7];
const iso = () => new Date().toISOString().slice(0, 10);
const dayStamp = (d) => iso() + ":" + d;

function mac(items) {
  let k = 0, p = 0, c = 0, l = 0;
  (items || []).forEach(([f, g]) => {
    const F = FOODS[f]; if (!F) return;
    k += F.k * g / 100; p += F.p * g / 100; c += F.c * g / 100; l += F.l * g / 100;
  });
  return [k, p, c, l];
}
function dayMac(day) {
  const t = [0, 0, 0, 0];
  (PLAN[day] || []).forEach((m) => { const x = mac(m.f); for (let i = 0; i < 4; i++) t[i] += x[i]; });
  const ex = S.extras[dayStamp(day)] || [];
  const x = mac(ex.map((e) => [e.k, e.g])); for (let i = 0; i < 4; i++) t[i] += x[i];
  return t;
}
const FULL_DAYS = ["Lun","Mar","Mer","Jeu"];   // vendredi : dîner chez les parents, hors plan
function baseTarget() { return PHASES[S.phase].kcal + (S.offset || 0); }
function target(day) {
  if (FULL_DAYS.indexOf(day) < 0) return null;      // pas de cible sur un jour partiel
  return baseTarget() + (S.padel[day] ? 350 : 0);
}
function qtyLabel(f, g) {
  const F = FOODS[f];
  if (F.uG) {
    const n = g / F.uG;
    const nn = Math.abs(n - Math.round(n)) < 0.06 ? Math.round(n) : Math.round(n * 10) / 10;
    return nn + " " + F.uN + (nn > 1 ? "s" : "") + " · " + fr(g) + " " + F.u;
  }
  return fr(g) + " " + F.u;
}

/* ═════════ PROGRESSION MUSCU ═════════ */

function chargeOf(ex) { return S.charges[ex.id] != null ? S.charges[ex.id] : ex.kg; }

function progress(ex, reps, kg) {
  const [lo, hi] = ex.r;
  const all = reps.every((r) => r >= hi), ok = reps.every((r) => r >= lo);
  if (ex.bw && !ex.inc) return { kg, msg: all ? "Haut de fourchette atteint — ajoute une série" : ok ? "Objectif tenu" : "Consolide" };
  if (all) return { kg: Math.round((kg + ex.inc) * 10) / 10, msg: "Fourchette bouclée, tu montes de " + fr(ex.inc) + " kg" };
  if (ok) return { kg, msg: "Dans la fourchette — même charge, vise le haut" };
  return { kg, msg: "Sous la fourchette — même charge, finis les reps" };
}

function sessionFor(day) {
  const base = DEFAULT_PROGRAM[day];
  if (!base || base.kind !== "gym") return base;
  if (!S.padel[day]) return base;
  return Object.assign({}, base, { ex: base.ex.filter((e) => e.tier <= 2).slice(0, 5), light: 1 });
}

function replanText() {
  const order = ["Mer", "Lun", "Mar", "Jeu"];
  const miss = DAYS.filter((d) => S.skipped[d] && order.indexOf(d) >= 0)
                   .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  if (!miss.length) return null;
  if (miss.length === 1)
    return "La séance " + DEFAULT_PROGRAM[miss[0]].name.toLowerCase() +
           " passe au vendredi, à la place de la force full body. Le reste de la semaine ne bouge pas.";
  return "Deux séances manquées. " + DEFAULT_PROGRAM[miss[0]].name + " vendredi, " +
         DEFAULT_PROGRAM[miss[1]].name.toLowerCase() + " samedi à la place de la course facile. La sortie longue du dimanche ne se déplace pas.";
}

/* ═════════ POIDS → AJUSTEMENT ═════════ */

function trend() {
  const w = S.weights;
  if (w.length < 6) return null;
  const a1 = w.slice(-3).reduce((a, b) => a + b.kg, 0) / 3;
  const a0 = w.slice(-6, -3).reduce((a, b) => a + b.kg, 0) / 3;
  const delta = a1 - a0, gap = delta - PHASES[S.phase].gain;
  if (gap < -0.15) return { delta, gap, adj: 150, msg: "Tu es " + fr(Math.abs(gap)) + " kg sous la trajectoire. Il faut 150 kcal de plus par jour." };
  if (gap > 0.15) return { delta, gap, adj: -200, msg: "Tu montes " + fr(gap) + " kg trop vite. Il faut 200 kcal de moins par jour." };
  return { delta, gap, adj: 0, msg: "Tu es sur la trajectoire. Ne touche à rien cette semaine." };
}

/* Réécrit les féculents des journées complètes pour que le plan tombe sur la cible. */
function planKcal(plan, d) {
  let k = 0;
  plan[d].forEach((m) => m.f.forEach(([f, g]) => { if (FOODS[f]) k += FOODS[f].k * g / 100; }));
  return k;
}
function alignPlan() {
  editPlan((plan) => {
    FULL_DAYS.forEach((d) => {
      for (let pass = 0; pass < 3; pass++) {
        const need = baseTarget() - planKcal(plan, d);
        if (Math.abs(need) < 25) break;
        let carbK = 0;
        plan[d].forEach((m) => m.f.forEach(([f, g]) => { if (CARB_FOODS.indexOf(f) >= 0) carbK += FOODS[f].k * g / 100; }));
        if (carbK <= 0) break;
        const factor = Math.max(0.75, Math.min(1.3, (carbK + need) / carbK));
        plan[d].forEach((m) => m.f.forEach((it) => {
          if (CARB_FOODS.indexOf(it[0]) < 0) return;
          const F = FOODS[it[0]], step = F.uG ? F.uG / 2 : 5;
          it[1] = Math.max(step, Math.round(it[1] * factor / step) * step);
        }));
      }
    });
  });
}
function applyAdjust(adj) { S.offset = (S.offset || 0) + adj; alignPlan(); }

/* ═════════ COURSES (calculées depuis le plan) ═════════ */

const RAYONS = { frais:"Frais", viande:"Viandes & poissons", epicerie:"Épicerie", legume:"Fruits & légumes", complement:"Compléments", horsplan:"Divers" };

function shoppingList() {
  const tot = {};
  ["Lun", "Mar", "Mer", "Jeu", "Ven"].forEach((d) =>
    (PLAN[d] || []).forEach((m) => m.f.forEach(([f, g]) => { tot[f] = (tot[f] || 0) + g; })));
  const out = {};
  Object.keys(tot).forEach((f) => {
    const F = FOODS[f]; if (!F || F.k === 0) return;
    const g = tot[f];
    let q;
    if (F.pack) { const n = Math.ceil(g / F.pack[0]); q = n + " × " + F.pack[1]; }
    else { const a = F.arr || 50; q = Math.ceil(g / a) * a + " " + F.u; }
    const r = F.cat || "epicerie";
    (out[r] = out[r] || []).push({ f, n: F.n, q, g });
  });
  Object.keys(out).forEach((r) => out[r].sort((a, b) => a.n.localeCompare(b.n)));
  return out;
}

/* ═════════ COMPLÉMENTS ═════════ */

function supplements(day) {
  const m = new Date().getMonth(), c = CURES[m], hiver = m >= 9 || m <= 3;
  const ap = !!S.apurna[dayStamp(day)];
  const gym = DEFAULT_PROGRAM[day] && DEFAULT_PROGRAM[day].kind === "gym";
  const list = [
    { id:"crea", n:"Créatine", d:"5 g", w:"Dans le goûter, tous les jours" },
    { id:"om3",  n:"Oméga-3 (Ergy 3)", d:"selon boîte", w:"Au repas" },
    { id:"vitd", n:"Ergy D Plus", d:hiver ? "2 gouttes" : "1 goutte", w:"Petit-déjeuner, avec du gras" },
    { id:"mag",  n:"Ergymag", d:(ap ? 2 : c.mag) + " gélules", w:ap ? "2 maximum, tu prends de l'Apurna" : "Fractionné midi et soir" },
  ];
  if (c.multi) list.push({ id:"multi", n:"MultiCÉBÉ", d:"dose boîte", w:"Petit-déjeuner" });
  if (c.spi)   list.push({ id:"spi",   n:"Spiruline", d:"4 comprimés", w:"Midi" });
  if (c.ergy)  list.push({ id:"ergyp", n:"Ergyphilus Confort", d:"1 gélule", w:"À jeun le matin" });
  if (gym)     list.push({ id:"whey",  n:"Whey", d:"30 g", w:"Après la séance" });
  if (ap)      list.push({ id:"apurna",n:"Apurna", d:"1 dose", w:"Pendant l'effort" });
  return list;
}
