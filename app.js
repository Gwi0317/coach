/* ═════════ ÉTAT ═════════ */

const KEY = "coach.v2";
const BLANK = {
  foodEdits:{}, foodAdd:{}, plan:null, charges:{}, logs:{}, runs:{}, weights:[],
  extras:{}, supps:{}, padel:{}, skipped:{}, apurna:{}, pw:{}, stock:{}, shop:{},
  done:{}, seen:{}, snap:null, manual:[], dette:[], variante:{}, refus:[], seance:{}, perso:[], suppOff:{}, reel:{},
  sets:{}, phase:"p1", offset:0,
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
if (!S.seance) S.seance = {};
if (!S.perso) S.perso = [];
if (!S.suppOff) S.suppOff = {};
if (!S.reel) S.reel = {};
if (!S.sets) S.sets = {};
if (!S.races) S.races = {};
if (!S.reset) S.reset = {};
// on ne garde les séries cochées que 21 jours : c'est de l'état de séance, pas de l'historique
Object.keys(S.sets).forEach((k) => { if (k.slice(0, 10) < daysAgo(21)) delete S.sets[k]; });
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
  if (WEEKEND[day]) return WEEKEND[day].kcal;       // samedi et dimanche ont leur propre cible
  if (FULL_DAYS.indexOf(day) < 0) return null;      // pas de cible sur un jour partiel
  return baseTarget() + (S.padel[day] ? 350 : 0);
}
/* Moyenne hebdomadaire réelle : 5 jours de semaine + le week-end budgété. */
function moyenneSemaine() {
  return Math.round((baseTarget() * 5 + WEEKEND.Sam.kcal + WEEKEND.Dim.kcal) / 7);
}
function deficitSemaine() {
  const MAINTENANCE = 2800;
  return Math.round(MAINTENANCE * 7 - (baseTarget() * 5 + WEEKEND.Sam.kcal + WEEKEND.Dim.kcal));
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
SESS[BONUS.id] = BONUS;   // pas attachée à un jour : on la pose où on veut
const HORS = { padel:"Padel à la place", autre:"Autre sport", repos:"Repos", absent:"Absent" };
const PRIO = ["jambes", "pec", "dos", "epaules", "force"];   // du moins sacrifiable au plus
const CHOIX = ["pec","dos","jambes","epaules","force","bonus","runeasy","runlong","padel","autre","repos","absent"];
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
  if (!S.padel[day] || base.easy) return base;
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
  r.perdus.forEach((id) => {
    if (SESS[id] && SESS[id].nodebt) return;   // le bonus ne se rattrape pas
    if (!S.dette.some((x) => x.id === id)) S.dette.push({ id, d: iso() });
  });
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

/* ═════════ SÉRIES COCHÉES ═════════ */
/* Où il en est dans la séance, série par série. Remis à zéro chaque jour
   puisque c'est indexé sur la date. */
function setsFaites(day, exId) { return ((S.sets[dayStamp(day)] || {})[exId]) || []; }
function nbFaites(day, exId) { return setsFaites(day, exId).filter(Boolean).length; }
function toggleSet(day, exId, k, n) {
  const st = dayStamp(day);
  if (!S.sets[st]) S.sets[st] = {};
  const t = (S.sets[st][exId] || []).slice();
  while (t.length < n) t.push(0);
  t[k] = t[k] ? 0 : 1;
  S.sets[st][exId] = t; save();
  return !!t[k];
}
function marquerToutFait(day, exId, n) {
  const st = dayStamp(day);
  if (!S.sets[st]) S.sets[st] = {};
  S.sets[st][exId] = new Array(n).fill(1); save();
}
/* Avancement de la séance entière, pour la ligne « où j'en suis ». */
function avancement(day, sess) {
  const l = exList(sess);
  let sTot = 0, sFaites = 0, exFaits = 0;
  l.forEach((ex) => {
    sTot += ex.s;
    const n = nbFaites(day, ex.id);
    const loggue = (S.logs[dayStamp(day)] || {})[ex.id];
    sFaites += loggue ? ex.s : n;
    if (loggue || (n >= ex.s && ex.s > 0)) exFaits++;
  });
  return { exTot: l.length, exFaits, sTot, sFaites };
}

/* ═════════ CALENDRIER DE SAISON ═════════ */
/* Trois dates suffisent : la fin de la sèche, l'Hyrox, le marathon.
   Tout le reste se déduit en remontant depuis les courses. */
const J = 86400000;
function dPlus(iso0, sem) { const t = new Date(iso0 + "T12:00:00"); t.setDate(t.getDate() + sem * 7); return t.toISOString().slice(0, 10); }
function semEntre(a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / (7 * J)); }
function dateFr(s) {
  const M = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
  const t = new Date(s + "T12:00:00");
  return t.getDate() + " " + M[t.getMonth()] + " " + t.getFullYear();
}
function racesDef() {
  return { fin: S.races.fin || dPlus(iso(), 5),
           hyrox: S.races.hyrox || dPlus(iso(), 52),
           marathon: S.races.marathon || dPlus(iso(), 78) };
}
/* Renvoie les blocs datés, le bloc en cours, et les incohérences de calendrier. */
function calendrier() {
  const R = racesDef(), out = [], alerte = [];
  const debutHx = dPlus(R.hyrox, -12), finP1 = dPlus(R.fin, 3);
  const finRec = dPlus(R.hyrox, 3), debutMb = dPlus(R.marathon, -18);
  const bornes = {
    seche: [iso(), R.fin], p1: [R.fin, finP1], p2: [finP1, debutHx],
    hx: [debutHx, R.hyrox], HX: [R.hyrox, R.hyrox],
    rec: [R.hyrox, finRec], mb: [debutMb, R.marathon], MR: [R.marathon, R.marathon],
  };
  SAISON.forEach((b) => {
    const [d0, d1] = bornes[b.id];
    out.push(Object.assign({}, b, { d0, d1, sem: semEntre(d0, d1), now: iso() >= d0 && iso() < d1 || (b.evt && iso() === d0) }));
  });
  const pm = semEntre(finP1, debutHx);
  if (pm < 12) alerte.push(pm <= 0
    ? "L'Hyrox est trop tôt : il ne reste pas de place pour une prise de masse. Recule la course, ou raccourcis la sèche."
    : "Il ne reste que " + pm + " semaines de prise de masse. En dessous de 12, elle ne sert pas à grand-chose : recule l'Hyrox.");
  if (pm > 24) alerte.push("Avec " + pm + " semaines de prise de masse, prévois une mini-sèche de 4 semaines au milieu : au-delà de 5 à 6 mois d'affilée, la part de gras reprise grimpe.");
  if (debutMb < finRec) alerte.push("Le bloc marathon devrait commencer avant que tu sois remis de l'Hyrox. Écarte les deux courses d'au moins 21 semaines.");
  if (!out.some((b) => b.now)) alerte.push("Aucun bloc en cours : vérifie tes dates.");
  return { blocs: out, alerte: alerte, R: R };
}

/* ═════════ CHRONOMÈTRE DE REPOS ═════════ */
/* Il vit en dehors du DOM : l'app se redessine à chaque clic, le compte à
   rebours ne doit pas repartir de zéro pour autant. */
const CHRO = { fin:0, reste:0, dur:0, run:0, nom:"", tick:null, bip:0, ac:null };
const mmss = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

function chronoReste() { return CHRO.run ? Math.max(0, Math.round((CHRO.fin - Date.now()) / 1000)) : CHRO.reste; }
function chronoActif() { return !!(CHRO.run || CHRO.reste || CHRO.dur); }

/* iOS n'autorise le son que si le contexte audio naît d'un geste : on l'arme
   au démarrage, qui est toujours un appui. */
function chronoArme() {
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    if (!CHRO.ac) CHRO.ac = new C();
    if (CHRO.ac.state === "suspended") CHRO.ac.resume();
  } catch (e) {}
}
function chronoGo(sec, nom) {
  chronoArme();
  CHRO.dur = sec; CHRO.reste = sec; CHRO.fin = Date.now() + sec * 1000;
  CHRO.run = 1; CHRO.bip = 0; CHRO.nom = nom || "Repos";
  chronoBoucle(); chronoPeint();
}
function chronoPause() {
  if (CHRO.run) { CHRO.reste = chronoReste(); CHRO.run = 0; }
  else if (CHRO.reste > 0) { CHRO.fin = Date.now() + CHRO.reste * 1000; CHRO.run = 1; chronoBoucle(); }
  chronoPeint();
}
function chronoDecale(sec) {
  if (!CHRO.dur) return;
  if (CHRO.run) { CHRO.fin = Math.max(Date.now(), CHRO.fin + sec * 1000); CHRO.reste = chronoReste(); }
  else CHRO.reste = Math.max(0, CHRO.reste + sec);
  if (chronoReste() > 0) { CHRO.bip = 0; if (!CHRO.run && CHRO.reste) { CHRO.fin = Date.now() + CHRO.reste * 1000; CHRO.run = 1; } chronoBoucle(); }
  chronoPeint();
}
function chronoStop() {
  CHRO.run = 0; CHRO.reste = 0; CHRO.dur = 0; CHRO.bip = 0; CHRO.nom = "";
  if (CHRO.tick) { clearInterval(CHRO.tick); CHRO.tick = null; }
  chronoPeint();
}
function chronoBoucle() {
  if (CHRO.tick) return;
  CHRO.tick = setInterval(() => {
    if (CHRO.run && chronoReste() <= 0) {
      CHRO.run = 0; CHRO.reste = 0;
      if (!CHRO.bip) { CHRO.bip = 1; chronoSonne(); }
    }
    chronoPeint();
    if (!CHRO.run) { clearInterval(CHRO.tick); CHRO.tick = null; }
  }, 250);
}
function chronoSonne() {
  try { if (navigator.vibrate) navigator.vibrate([130, 90, 130, 90, 240]); } catch (e) {}
  try {
    const c = CHRO.ac; if (!c) return;
    [0, 0.2, 0.4].forEach((t) => {
      const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
      o.type = "sine"; o.frequency.value = 880;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.3, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + 0.17);
    });
  } catch (e) {}
}

/* ═════════ POIDS → AJUSTEMENT ═════════ */

function trend() {
  const w = S.weights;
  if (w.length < 6) return null;
  const a1 = w.slice(-3).reduce((a, b) => a + b.kg, 0) / 3;
  const a0 = w.slice(-6, -3).reduce((a, b) => a + b.kg, 0) / 3;
  const delta = a1 - a0, cible = PHASES[S.phase].gain, gap = delta - cible;
  const seche = cible < 0;

  // trop bas par rapport à la cible : en sèche ça veut dire que tu descends trop vite
  if (gap < -0.15) return { delta, gap, adj: 150, msg: seche
      ? "Tu perds " + fr(Math.abs(gap)) + " kg/semaine de trop vite. Remonte de 150 kcal : au-delà de 0,5 kg/semaine tu perds du muscle avec le gras."
      : "Tu es " + fr(Math.abs(gap)) + " kg sous la trajectoire. Il faut 150 kcal de plus par jour." };

  // trop haut : en sèche ça veut dire que la perte s'est arrêtée
  if (gap > 0.15) return { delta, gap, adj: -150, msg: seche
      ? "La perte a ralenti de " + fr(gap) + " kg/semaine. Descends de 150 kcal, c'est le palier suivant."
      : "Tu montes " + fr(gap) + " kg trop vite. Il faut 150 kcal de moins par jour." };

  return { delta, gap, adj: 0, msg: "Tu es sur la trajectoire. Ne touche à rien cette semaine." };
}

/* Réécrit les féculents des journées complètes pour que le plan tombe sur la cible. */
function planKcal(plan, d) {
  let k = 0;
  plan[d].forEach((m) => m.f.forEach(([f, g]) => { if (FOODS[f]) k += FOODS[f].k * g / 100; }));
  return k;
}
function planProt(plan, d) {
  let p = 0;
  plan[d].forEach((m) => m.f.forEach(([f, g]) => { if (FOODS[f]) p += FOODS[f].p * g / 100; }));
  return p;
}
function alignPlan() {
  const P = PHASES[S.phase];
  editPlan((plan) => {
    FULL_DAYS.forEach((d) => {
      /* Deux leviers qui se contrarient : monter les protéines ajoute des calories,
         couper les féculents retire des protéines (pâtes et pain en contiennent).
         On alterne donc jusqu'à ce que les deux cibles tiennent ensemble. */
      for (let round = 0; round < 4; round++) {
        /* 1) Les protéines d'abord. En déficit c'est la seule macro qu'on ne négocie pas :
           baisser les calories sans les tenir revient à couper dans le muscle.
           On augmente en priorité l'aliment le plus riche en protéines par calorie. */
        for (let i = 0; i < 60 && P.prot && planProt(plan, d) < P.prot - 1; i++) {
          let best = null;
          plan[d].forEach((m) => m.f.forEach((it) => {
            if (PROT_FOODS.indexOf(it[0]) < 0) return;
            const F = FOODS[it[0]]; if (!F || !F.k) return;
            const r = F.p / F.k;
            if (!best || r > best.r) best = { it: it, r: r, step: F.uG ? F.uG / 2 : 10 };
          }));
          if (!best) break;
          best.it[1] += best.step;
        }
        /* 2) Puis les féculents, pour retomber sur la cible calorique. */
        let bouge = false;
        for (let pass = 0; pass < 4; pass++) {
          const need = baseTarget() - planKcal(plan, d);
          if (Math.abs(need) < 25) break;
          let carbK = 0;
          plan[d].forEach((m) => m.f.forEach(([f, g]) => { if (CARB_FOODS.indexOf(f) >= 0) carbK += FOODS[f].k * g / 100; }));
          if (carbK <= 0) break;
          const factor = Math.max(0.75, Math.min(1.3, (carbK + need) / carbK));
          plan[d].forEach((m) => m.f.forEach((it) => {
            if (CARB_FOODS.indexOf(it[0]) < 0) return;
            const F = FOODS[it[0]], step = F.uG ? F.uG / 2 : 5;
            const avant = it[1];
            it[1] = Math.max(step, Math.round(it[1] * factor / step) * step);
            if (it[1] !== avant) bouge = true;
          }));
        }
        if (!bouge && (!P.prot || planProt(plan, d) >= P.prot - 1)) break;
      }
    });
  });
}
function applyAdjust(adj) {
  const P = PHASES[S.phase], vise = baseTarget() + adj;
  // plancher de sécurité : on ne descend pas en dessous du minimum de la phase
  if (P.min && vise < P.min) S.offset = P.min - P.kcal;
  else S.offset = (S.offset || 0) + adj;
  alignPlan();
}
function auPlancher() { const P = PHASES[S.phase]; return !!(P.min && baseTarget() <= P.min); }

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
  if (ap)      list.push({ id:"apurna", n:"Apurna Hydratation", d:"1 dose",
                          w:"Pendant l'effort, environ 500 ml par heure, à siroter" });
  (S.perso || []).forEach((p) => {
    if (p.jours === "seance" && !gym) return;
    list.push({ id:p.id, n:p.n, d:p.d || "", w:p.w || "" });
  });
  if (pw)      list.push({ id:"pwsupp", n:"Apurna Pre Workout", d:"1 dose de 20 g", w:"30 à 45 min avant la séance, dans 500 ml d'eau" });
  return list.filter((x) => !S.suppOff[x.id]);
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
    Object.keys(S.logs[k]).forEach((id) => {
      if (!depuisReset(id, k)) return;   // avant la remise à zéro, ça ne compte pas
      (parExo[id] = parExo[id] || []).push(S.logs[k][id]);
    }));
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

  // ce que tu as vraiment mangé, relevé sur Foodvisor
  const rk = lastKeys(S.reel, 7).filter((k) => S.reel[k] && S.reel[k].kcal);
  const reel = rk.length ? {
    n: rk.length,
    kcal: Math.round(rk.reduce((s, k) => s + S.reel[k].kcal, 0) / rk.length),
    p: Math.round(rk.reduce((s, k) => s + (S.reel[k].p || 0), 0) / rk.length),
  } : null;
  return { seances, montes, bloques, horsPlan: Math.round(horsPlan / 7), faits, prevus, longue,
           tr: trend(), dette: dettesEnAttente(), reel: reel };
}

function nomExo(id) {
  if (EXCAT[id]) return EXCAT[id].n;
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

/* Remise à zéro d'un exercice : quand l'exécution change (plus strict, plus
   profond, charge redescendue volontairement), l'ancien historique ne veut plus
   rien dire. On garde les logs, on déplace juste le point de comparaison. */
function resetExo(id) { S.reset[id] = iso(); if (S.snap) delete S.snap[id]; save(); }
function annulerReset(id) { delete S.reset[id]; save(); }
function depuisReset(id, k) { return !S.reset[id] || k.slice(0, 10) >= S.reset[id]; }

function dernierLog(id, saufAujourdhui) {
  const keys = Object.keys(S.logs).filter((k) => S.logs[k][id] && depuisReset(id, k) && (!saufAujourdhui || k.slice(0, 10) !== iso())).sort();
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
  return a ? Object.assign({}, ex, { id:a.id, n:a.n, kg:a.kg, inc:a.inc || ex.inc,
                                    r:a.r || ex.r, s:a.s || ex.s, note:a.note || "", base:ex.id }) : ex;
}
/* Catalogue de tous les exercices, variantes comprises : on peut composer n'importe quelle séance */
const EXCAT = {};
DAYS.forEach((d) => (DEFAULT_PROGRAM[d].ex || []).forEach((e) => {
  EXCAT[e.id] = e;
  (e.alt || []).forEach((v) => {
    EXCAT[v.id] = Object.assign({}, e, { id:v.id, n:v.n, kg:v.kg, inc:v.inc || e.inc, note:v.note || "", alt:null });
  });
}));
[].concat(BONUS.ex || [], EXTRAS).forEach((e) => {
  EXCAT[e.id] = e;
  (e.alt || []).forEach((v) => {
    EXCAT[v.id] = Object.assign({}, e, { id:v.id, n:v.n, kg:v.kg, inc:v.inc || e.inc,
                                         r:v.r || e.r, s:v.s || e.s, note:v.note || "", alt:null });
  });
});
const EXALL = Object.keys(EXCAT).sort((x, y) => EXCAT[x].n.localeCompare(EXCAT[y].n));

function exIds(sess) { return S.seance[sess.id] || (sess.ex || []).map((e) => e.id); }
function exList(sess) { return exIds(sess).map((id) => EXCAT[id]).filter(Boolean).map(exActif); }
function exSet(sess, ids) { S.seance[sess.id] = ids; save(); }
function exDel(sess, id) { exSet(sess, exIds(sess).filter((x) => x !== id)); }
function exAdd(sess, id) { if (exIds(sess).indexOf(id) < 0) exSet(sess, exIds(sess).concat([id])); }
function exUp(sess, id) {
  const l = exIds(sess).slice(), i = l.indexOf(id);
  if (i > 0) { l[i] = l[i - 1]; l[i - 1] = id; exSet(sess, l); }
}
function exReset(sess) { delete S.seance[sess.id]; save(); }

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
