/* ═════════ ÉTAT ═════════ */

const KEY = "coach.v2";
const BLANK = {
  foodEdits:{}, foodAdd:{}, plan:null, charges:{}, logs:{}, runs:{}, weights:[],
  extras:{}, supps:{}, padel:{}, skipped:{}, apurna:{}, pw:{}, stock:{}, shop:{},
  done:{}, seen:{}, snap:null, manual:[], dette:[], variante:{}, refus:[], phase:"p1", offset:0,
};
let S = load();
if (!S.pw) S.pw = {};
if (!S.stock) S.stock = {};
if (!S.done) S.done = {};
if (!S.seen) S.seen = {};
if (!S.manual) S.manual = [];
if (!S.dette) S.dette = [];
if (!S.variante) S.variante = {};
if (!S.refus) S.refus = [];
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

/* kgs = une charge par série. La référence est la série la plus lourde :
   on ne monte que si toutes les séries ont été tenues à cette charge. */
function progress(ex, reps, kgs) {
  const [lo, hi] = ex.r;
  const top = Math.max.apply(null, kgs);
  const plat = kgs.every((k) => k === top);
  const all = reps.every((r) => r >= hi), ok = reps.every((r) => r >= lo);

  if (ex.bw && !ex.inc)
    return { kg: top, msg: all ? "Haut de fourchette atteint — ajoute une série" : ok ? "Objectif tenu" : "Consolide" };

  if (!plat) {
    const bas = Math.min.apply(null, kgs);
    return { kg: top, msg: "Tu es descendu à " + fr(bas) + " kg en cours de route. Reste à " + fr(top) +
             " kg jusqu'à tenir les " + ex.s + " séries dans la fourchette." };
  }
  if (all) return { kg: Math.round((top + ex.inc) * 10) / 10, msg: "Fourchette bouclée, tu montes de " + fr(ex.inc) + " kg" };
  if (ok) return { kg: top, msg: "Dans la fourchette — même charge, vise le haut" };
  return { kg: top, msg: "Sous la fourchette — même charge, finis les reps" };
}

const SESS = {};
DAYS.forEach((d) => { SESS[DEFAULT_PROGRAM[d].id] = DEFAULT_PROGRAM[d]; });
const HORS = { padel:"Padel à la place", autre:"Autre sport", repos:"Repos", absent:"Absent" };
const PRIO = ["jambes", "pec", "dos", "epaules", "force"];   // du moins sacrifiable au plus
const CHOIX = ["pec","dos","jambes","epaules","force","runeasy","runlong","padel","autre","repos","absent"];
const nomSlot = (id) => (SESS[id] ? SESS[id].name : HORS[id] || "Repos");

function defaultWeek() { const w = {}; DAYS.forEach((d) => { w[d] = DEFAULT_PROGRAM[d].id; }); return w; }
function week() { return S.week || defaultWeek(); }
function setSlot(day, id) {
  const prev = week()[day];
  // on garde en mémoire la séance qu'on vient de sortir du planning, pour pouvoir la décaler
  if (SESS[prev] && SESS[prev].kind === "gym" && !SESS[id]) S.deplace = { day, id: prev };
  const w = Object.assign({}, week()); w[day] = id; S.week = w; save();
}
function resetWeek() { S.week = null; S.skipped = {}; S.deplace = null; save(); }

function sessionOf(day) { return SESS[week()[day]] || null; }

function sessionFor(day) {
  const base = sessionOf(day);
  if (!base || base.kind !== "gym") return base;
  if (!S.padel[day]) return base;
  return Object.assign({}, base, { ex: base.ex.filter((e) => e.tier <= 2).slice(0, 5), light: 1 });
}

/* Décale les séances de muscu à partir d'un jour, en sautant les jours indisponibles.
   Les jours de course ne sont pas écrasés. Renvoie ce qui ne rentre pas. */
function simulerDecalage(from) {
  const w = Object.assign({}, week()), i0 = DAYS.indexOf(from);
  const aPlacer = [], libres = [];
  if (S.deplace && S.deplace.day === from) aPlacer.push(S.deplace.id);   // la séance sortie du jour
  for (let i = i0; i < 7; i++) { const id = w[DAYS[i]]; if (SESS[id] && SESS[id].kind === "gym") aPlacer.push(id); }
  for (let i = i0 + 1; i < 7; i++) {
    const id = w[DAYS[i]];
    if (id === "absent") continue;
    if (SESS[id] && SESS[id].kind === "run") continue;
    libres.push(DAYS[i]);
    w[DAYS[i]] = "repos";
  }
  // S'il manque des créneaux, on ne coupe pas au hasard : on garde les séances les plus
  // importantes, et celle qui a déjà sauté la semaine d'avant repasse devant.
  const perdus = [];
  let garder = aPlacer;
  if (aPlacer.length > libres.length) {
    const score = (id) => {
      let p = PRIO.indexOf(id); if (p < 0) p = PRIO.length;
      if ((S.dette || []).some((x) => x.id === id)) p -= 2;
      return p;
    };
    const tri = aPlacer.slice().sort((x, y) => score(x) - score(y)).slice(0, libres.length);
    garder = aPlacer.filter((id) => tri.indexOf(id) >= 0);
    aPlacer.forEach((id) => { if (garder.indexOf(id) < 0) perdus.push(id); });
  }
  garder.forEach((id, k) => { if (libres[k]) w[libres[k]] = id; });
  return { w, perdus, libres };
}
function appliquerDecalage(from, slotDuJour) {
  const actuel = week()[from];
  const r = simulerDecalage(from);
  r.w[from] = SESS[actuel] ? (slotDuJour || "padel") : actuel;   // on garde padel/absent/repos déjà posé
  S.week = r.w; S.deplace = null;
  r.perdus.forEach((id) => { if (!S.dette.some((x) => x.id === id)) S.dette.push({ id, d: iso() }); });
  save();
  return r.perdus;
}

/* Mémoire des séances sacrifiées, gardée 15 jours : elle sert à la rotation. */
function dettes() {
  S.dette = (S.dette || []).filter((x) => x.d >= daysAgo(15));
  return S.dette;
}
/* Celles qui ne sont toujours pas au planning de la semaine en cours. */
function dettesEnAttente() {
  return dettes().filter((x) => !DAYS.some((d) => week()[d] === x.id));
}

/* La replace : d'abord un jour de repos, sinon le créneau force du vendredi */
function placerDette(id) {
  const w = Object.assign({}, week());
  let cible = DAYS.filter((d) => w[d] === "repos")[0];
  if (!cible) cible = DAYS.filter((d) => w[d] === "force")[0];
  if (!cible) cible = DAYS.filter((d) => w[d] === "runeasy")[0];   // la course facile est optionnelle
  if (!cible) return null;
  w[cible] = id; S.week = w;
  S.dette = S.dette.filter((x) => x.id !== id);
  save();
  return cible;
}

function replanTextOld() {
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
  const s0 = sessionOf(day); const gym = !!(s0 && s0.kind === "gym");
  const pw = !!S.pw[dayStamp(day)];
  const list = [
    { id:"crea", n:"Créatine", d:pw ? "2 g" : "5 g",
      w:pw ? "Le pre-workout en apporte déjà 3 g" : "Dans le goûter, tous les jours" },
    { id:"om3",  n:"Oméga-3 (Ergy 3)", d:"selon boîte", w:"Au repas" },
    { id:"vitd", n:"Ergy D Plus", d:hiver ? "2 gouttes" : "1 goutte", w:"Petit-déjeuner, avec du gras" },
    { id:"mag",  n:"Ergymag", d:(ap ? 2 : c.mag) + " gélules", w:ap ? "2 maximum : la boisson d'effort en apporte déjà" : "Fractionné midi et soir" },
  ];
  if (c.multi) list.push({ id:"multi", n:"MultiCÉBÉ", d:"dose boîte", w:"Petit-déjeuner" });
  if (c.spi)   list.push({ id:"spi",   n:"Spiruline", d:"4 comprimés", w:"Midi" });
  if (c.ergy)  list.push({ id:"ergyp", n:"Ergyphilus Confort", d:"1 gélule", w:"À jeun le matin" });
  if (gym)     list.push({ id:"whey",  n:"Whey", d:"30 g", w:"Après la séance" });
  if (ap)      list.push({ id:"apurna",n:"Boisson Apurna", d:"1 dose", w:"Pendant l'effort" });
  if (pw)      list.push({ id:"pwsupp", n:"Apurna Pre Workout", d:"1 dose de 20 g", w:"30 à 45 min avant la séance, dans 500 ml d'eau" });
  return list;
}


/* ═════════ BILAN AUTOMATIQUE ═════════
   Aucun serveur : à chaque ouverture, l'app relit ce que tu as
   enregistré et en tire les consignes des jours suivants.
*/

function weekId(date) {
  const t = new Date(date || new Date());
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
  const w1 = new Date(t.getFullYear(), 0, 4);
  const n = 1 + Math.round(((t - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  return t.getFullYear() + "-S" + String(n).padStart(2, "0");
}
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
const lastKeys = (obj, n) => Object.keys(obj || {}).filter((k) => k.slice(0, 10) >= daysAgo(n));

/* Ce que la semaine écoulée dit du programme */
function bilanSemaine() {
  const logKeys = lastKeys(S.logs, 7);
  const jours = {};
  logKeys.forEach((k) => { if (Object.keys(S.logs[k] || {}).length) jours[k.slice(0, 10)] = 1; });
  const seances = Object.keys(jours).length;

  // exercices qui ont pris de la charge depuis le dernier bilan
  const snap = S.snap || {};
  const montes = [], bloques = [];
  Object.keys(S.charges).forEach((id) => {
    if (snap[id] != null && S.charges[id] > snap[id]) montes.push(id);
  });

  // stagnation : trois validations d'affilée sans montée
  const parExo = {};
  Object.keys(S.logs).sort().forEach((k) =>
    Object.keys(S.logs[k]).forEach((id) => { (parExo[id] = parExo[id] || []).push(S.logs[k][id]); }));
  Object.keys(parExo).forEach((id) => {
    const t = parExo[id].slice(-3);
    if (t.length === 3 && t.every((e) => e.next === e.kg)) bloques.push(id);
  });

  // écarts hors plan
  let horsPlan = 0;
  lastKeys(S.extras, 7).forEach((k) => { horsPlan += mac((S.extras[k] || []).map((e) => [e.k, e.g]))[0]; });

  // repas suivis
  let faits = 0, prevus = 0;
  lastKeys(S.done, 7).forEach((k) => { faits += Object.keys(S.done[k]).filter((i) => S.done[k][i]).length; });
  FULL_DAYS.concat(["Ven"]).forEach((d) => { prevus += (PLAN[d] || []).length; });

  // course la plus longue
  let longue = 0;
  lastKeys(S.runs, 7).forEach((k) => { longue = Math.max(longue, S.runs[k].min); });

  return { seances, montes, bloques, horsPlan: Math.round(horsPlan / 7), faits, prevus, longue,
           tr: trend(), dette: dettesEnAttente() };
}

function nomExo(id) {
  let n = id;
  Object.keys(DEFAULT_PROGRAM).forEach((d) => {
    const s = DEFAULT_PROGRAM[d];
    if (!s.ex) return;
    s.ex.forEach((e) => {
      if (e.id === id) n = e.n;
      (e.alt || []).forEach((v) => { if (v.id === id) n = v.n; });
    });
  });
  return n;
}

/* Clôture : on fige les charges pour pouvoir comparer la semaine suivante */
function cloreSemaine() {
  S.snap = JSON.parse(JSON.stringify(S.charges));
  S.seen.week = weekId();
  S.manual = S.manual.filter((m) => !S.shop[m.id]);
  S.shop = {}; S.stock = {}; S.skipped = {}; S.padel = {};
  save();
}

/* ═════════ CODE-BARRES (Open Food Facts) ═════════ */

function chercherCodeBarres(code, cb) {
  fetch("https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) +
        ".json?fields=product_name,brands,nutriments,serving_quantity")
    .then((r) => r.json())
    .then((j) => {
      if (!j || j.status === 0 || !j.product) return cb(null, "Produit inconnu dans la base");
      const p = j.product, n = p.nutriments || {};
      const k = n["energy-kcal_100g"];
      if (k == null) return cb(null, "Ce produit n'a pas de valeurs nutritionnelles renseignées");
      const id = "of" + code;
      const food = {
        n: ((p.product_name || "Produit") + (p.brands ? " " + String(p.brands).split(",")[0] : "")).slice(0, 42),
        u: "g", k: Math.round(k), p: Math.round((n.proteins_100g || 0) * 10) / 10,
        c: Math.round((n.carbohydrates_100g || 0) * 10) / 10, l: Math.round((n.fat_100g || 0) * 10) / 10,
        st: 10, cat: "epicerie",
      };
      if (p.serving_quantity > 0) { food.uG = +p.serving_quantity; food.uN = "portion"; }
      S.foodAdd[id] = food; rebuild(); save();
      cb(id, null);
    })
    .catch(() => cb(null, "Pas de réseau — réessaie quand tu auras de la connexion"));
}


/* ═════════ OBJECTIF DU JOUR, PAR EXERCICE ═════════ */

function dernierLog(id, saufAujourdhui) {
  const keys = Object.keys(S.logs).filter((k) => S.logs[k][id] && (!saufAujourdhui || k.slice(0, 10) !== iso())).sort();
  if (!keys.length) return null;
  const k = keys[keys.length - 1];
  return { date: k.slice(0, 10), e: S.logs[k][id] };
}

function ilYA(dateISO) {
  const j = Math.round((new Date(iso()) - new Date(dateISO)) / 86400000);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return "hier";
  if (j < 14) return "il y a " + j + " jours";
  return "il y a " + Math.round(j / 7) + " semaines";
}


/* ═════════ VARIANTES D'EXERCICE ═════════
   Même mouvement, matériel différent : la charge est suivie séparément
   puisque 10 kg d'haltère ne valent pas 12 kg à la poulie.
*/
function exActif(ex) {
  const v = S.variante[ex.id];
  if (!v || v === ex.id || !ex.alt) return ex;
  const a = ex.alt.filter((x) => x.id === v)[0];
  return a ? Object.assign({}, ex, { id:a.id, n:a.n, kg:a.kg, inc:a.inc || ex.inc, note:a.note || "", base:ex.id }) : ex;
}
function exList(sess) { return (sess.ex || []).map(exActif); }

/* ═════════ PROPOSITIONS DE REPAS ═════════ */

function propositions() {
  const out = [], n = parseInt(weekId().slice(-2), 10) || 0;
  ["Lun", "Mar", "Mer", "Jeu", "Ven"].forEach((d, i) => {
    [["dej", 1], ["diner", 3]].forEach(([slot, idx], j) => {
      const meal = (PLAN[d] || [])[idx];
      if (!meal) return;
      const pool = REPAS_VAR[slot];
      const cand = pool[(n + i * 2 + j) % pool.length];
      // même source de protéines = même repas, on ne propose pas
      if (!cand || !meal.f.length || meal.f[0][0] === cand.f[0][0]) return;
      if (S.refus.indexOf(d + slot + cand.n) >= 0) return;
      const delta = Math.round(mac(cand.f)[0] - mac(meal.f)[0]);
      out.push({ d, idx, slot, cand, actuel: meal.t, delta });
    });
  });
  return out.slice(0, 3);
}
function accepter(p) {
  editPlan((plan) => {
    plan[p.d][p.idx] = { t: (p.slot === "dej" ? "Déjeuner — " : "Dîner — ") + p.cand.n,
                         h: plan[p.d][p.idx].h, f: JSON.parse(JSON.stringify(p.cand.f)) };
  });
  alignPlan(); save();
}
function refuser(p) { S.refus.push(p.d + p.slot + p.cand.n); save(); }
