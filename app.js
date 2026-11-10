/* ═════════ ÉTAT ═════════ */

const KEY = "coach.v2";
const BLANK = {
  charges:{}, logs:{}, runs:{}, weights:[], padel:{}, skipped:{}, seen:{}, dette:[],
  variante:{}, seance:{}, sets:{}, reset:{}, races:{}, migr:{}, phase:"p1", onb:null,
};
let S = load();
if (!S.seen) S.seen = {};
if (!S.dette) S.dette = [];
if (!S.variante) S.variante = {};
if (!S.seance) S.seance = {};
if (!S.sets) S.sets = {};
if (!S.migr) S.migr = {};
/* Le muscle up s'ajoute en tête de la séance force, une fois et une seule :
   si tu le retires ensuite, il ne revient pas. */
if (!S.migr.muscleup) {
  S.migr.muscleup = 1;
  if (S.seance && S.seance.force && S.seance.force.indexOf("muscleup") < 0)
    S.seance.force = ["muscleup"].concat(S.seance.force);
}
if (!S.races) S.races = {};
if (!S.reset) S.reset = {};
/* Le questionnaire d'accueil ne s'adresse qu'aux nouveaux arrivants.
   Sur un téléphone qui porte déjà des données, on pose le verrou une
   fois pour toutes : il ne pourra jamais s'ouvrir, même après une
   remise à zéro partielle. */
if (!S.migr.onb0) {
  S.migr.onb0 = 1;
  if (!S.onb && (Object.keys(S.logs || {}).length || (S.weights || []).length ||
                 Object.keys(S.seance || {}).length || S.week))
    S.onb = { existant: 1 };
  save();   // le verrou doit survivre même si rien d'autre n'est enregistré ensuite
}
/* L'alimentation est sortie de l'application : le suivi se fait ailleurs.
   On retire ce qu'elle avait enregistré — plan de repas, aliments, courses,
   compléments — pour que l'export ne transporte plus que l'entraînement. */
if (!S.migr.sansRepas) {
  S.migr.sansRepas = 1;
  ["foodEdits", "foodAdd", "plan", "extras", "supps", "apurna", "pw", "stock", "shop", "done",
   "manual", "refus", "perso", "suppOff", "reel", "offset", "minKcal", "snap"].forEach((k) => { delete S[k]; });
  save();
}
// on ne garde les séries cochées que 21 jours : c'est de l'état de séance, pas de l'historique
Object.keys(S.sets).forEach((k) => { if (k.slice(0, 10) < daysAgo(21)) delete S.sets[k]; });
function load() {
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r) return Object.assign({}, BLANK, r); }
  catch (e) {}
  return JSON.parse(JSON.stringify(BLANK));
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ═════════ OUTILS ═════════ */

const $ = (s) => document.querySelector(s);
const fr = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
const fr2 = (n) => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");   // pentes : 0,27 et non 0,3
const signe = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + fr2(Math.abs(n));
const todayKey = () => DAYS[(new Date().getDay() + 6) % 7];
const iso = () => new Date().toISOString().slice(0, 10);
const dayStamp = (d) => iso() + ":" + d;

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

/* ═════════ HISTORIQUE PAR EXERCICE ═════════ */
/* Tout ce que l'onglet Progression et le bilan de la semaine ont besoin de
   savoir sur un exercice, calculé une seule fois à partir des séances.

   La grandeur suivie est la CHARGE de travail, pas un 1RM estimé. Le 1RM
   estimé mélange charge et répétitions : le jour où on passe de 6-8 à 4-6
   répétitions avec 5 kg de plus, il baisse — alors qu'on est plus fort. Une
   courbe qui descend quand la barre monte ne renseigne personne. La charge
   et les répétitions sont donc montrées séparément, comme on les vit en
   salle : on gagne des répétitions à charge égale, puis on monte la charge. */

/* Poids de corps retenu pour les mouvements lestés : la dernière pesée. */
function poidsCorps() {
  const w = S.weights;
  return w && w.length ? w[w.length - 1].kg : 75;
}

/* Une séance → ses nombres utiles. La charge de référence est la série la
   plus lourde ; les répétitions comptées sont celles faites à cette charge. */
function lireSeance(d, e) {
  const reps = (e.reps || []).map((r) => r || 0);
  /* Avant le suivi série par série, une séance ne stockait qu'une charge. */
  const kgs = (e.kgs && e.kgs.length === reps.length) ? e.kgs.slice() : reps.map(() => e.kg || 0);
  const top = kgs.length ? Math.max.apply(null, kgs) : 0;
  let repsTop = 0, tot = 0, vol = 0, best = 0;
  const ref = [];                      // répétitions des séries faites à la charge de tête
  reps.forEach((r, i) => {
    tot += r; vol += r * kgs[i];
    if (r > best) best = r;
    if (kgs[i] === top && r > 0) { repsTop += r; ref.push(r); }
  });
  return { d: d, reps: reps, kgs: kgs, top: top, tot: tot, vol: vol, best: best,
           repsTop: repsTop, ref: ref, moy: ref.length ? repsTop / ref.length : 0,
           series: reps.filter((r) => r > 0).length,
           next: e.next != null ? e.next : null };
}

/* avant = date ISO facultative : on ne regarde que les séances d'avant ce jour */
function histoExo(ex, avant) {
  const reset = (S.reset || {})[ex.id] || null;
  const tout = [];
  Object.keys(S.logs).sort().forEach((k) => {
    const e = S.logs[k][ex.id];
    if (avant && k.slice(0, 10) >= avant) return;
    if (e && e.reps && e.reps.length) tout.push(lireSeance(k.slice(0, 10), e));
  });

  const f = typeof fiche === "function" ? fiche(ex) : null;
  const pdc = !!(f && f.pdc);
  const leste = tout.some((x) => x.top > 0);
  /* Quatre façons de mesurer, selon ce que l'exercice permet de charger :
       charge — une barre, une machine, des haltères
       lest   — poids du corps plus un lest (tractions, dips)
       temps  — tenue en secondes (gainage, suspension)
       reps   — poids du corps seul */
  const mode = ex.u ? "temps"
             : (ex.bw && !ex.inc) ? "reps"
             : pdc ? (leste ? "lest" : "reps")
             : leste ? "charge" : "reps";

  /* Les comparaisons partent de la remise à zéro s'il y en a une */
  const s = reset ? tout.filter((x) => x.d >= reset) : tout;
  return { tout: tout, s: s, mode: mode, pdc: pdc, corps: pdc ? poidsCorps() : 0, reset: reset,
           unite: mode === "temps" ? ex.u : mode === "reps" ? "reps" : "kg" };
}

/* Où en est un exercice :
     monte   — la fourchette vient d'être bouclée, ou bien, sur trois séances,
               la charge a augmenté ou les répétitions à charge égale
     stable  — ni l'une ni l'autre n'a bougé
     baisse  — la charge ou les répétitions ont reculé
     debut   — pas encore trois séances pour juger
   C'est la règle que l'application applique elle-même pour faire monter une
   charge : on ne peut pas être « bloqué » pendant qu'on gagne des répétitions.

   Les répétitions se comparent sur les séries communes aux deux séances.
   Passer de 4 séries à 3 fait baisser le total sans que personne ait
   régressé ; comparer les trois premières séries entre elles, si. */
function etatExo(ex, avant) {
  const H = histoExo(ex, avant), s = H.s, n = s.length;
  if (!n) return { etat: "debut", n: 0, H: H };
  const c = s[n - 1];
  const charge = H.mode === "charge" || H.mode === "lest";

  /* Fourchette bouclée à la dernière séance. Pour une charge, on reprend le
     verdict enregistré ce jour-là : la fourchette a pu changer depuis. */
  const valide = charge
    ? (c.next != null ? c.next > c.top
                      : c.ref.length === c.series && c.series >= ex.s && c.ref.every((r) => r >= ex.r[1]))
    : (c.series >= ex.s && c.ref.every((r) => r >= ex.r[1]));

  let palier = 1;                                    // séances d'affilée à la même charge
  while (palier < n && s[n - 1 - palier].top === c.top) palier++;

  const out = { n: n, palier: palier, top: c.top, H: H, der: c, valide: valide, dReps: 0, dKg: 0 };
  if (valide) { out.etat = "monte"; return out; }
  if (n < 3) { out.etat = "debut"; return out; }

  /* Écart de répétitions entre deux séances, sur leurs séries communes */
  const ecart = (x, y) => {
    const k = Math.min(x.ref.length, y.ref.length);
    const som = (t) => t.slice(0, k).reduce((u, v) => u + v, 0);
    const sx = som(x.ref);
    return { d: som(y.ref) - sx, seuil: Math.max(2, Math.round(sx * 0.05)) };   // sous le seuil, c'est du bruit
  };
  const juge = (e) => (e.d >= e.seuil ? "monte" : e.d <= -e.seuil ? "baisse" : "stable");

  const a = s[n - 3];
  out.av = a;
  out.dKg = Math.round((c.top - a.top) * 10) / 10;
  if (charge && out.dKg < 0) { out.etat = "baisse"; return out; }
  if (charge && out.dKg > 0) {
    /* La charge a monté sur trois séances. Mais si elle avait déjà été
       soulevée avant, ce n'est une progression que si on y fait mieux :
       80 → 82,5 → 85 après être redescendu de 85, c'est un retour. */
    let deja = null;
    for (let i = n - 4; i >= 0 && !deja; i--) if (s[i].top >= c.top) deja = s[i];
    if (deja && deja.top === c.top) {
      const e = ecart(deja, c);
      out.retour = deja; out.dReps = e.d; out.etat = juge(e);
    } else {
      out.etat = "monte";
      if (deja) out.sous = deja;            // encore sous une charge déjà faite
    }
    return out;
  }

  const e = ecart(a, c);
  out.dReps = e.d;
  out.etat = juge(e);
  return out;
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

/* ═════════ TENDANCE DU POIDS ═════════ */
/* Une pente en kg par semaine, calculée sur les DATES des pesées.

   L'ancienne version comparait la moyenne des trois dernières pesées à
   celle des trois précédentes et appelait l'écart « par semaine », quel que
   soit le temps réellement écoulé. Deux blocs de pesées séparés de trois
   semaines donnaient alors une perte trois fois trop rapide.

   Ici : droite des moindres carrés sur les pesées des 28 derniers jours,
   avec son incertitude. Quand l'intervalle est large, on le dit au lieu
   d'annoncer un chiffre. */
const T80 = { 2:1.89, 3:1.64, 4:1.53, 5:1.48, 6:1.44, 7:1.42, 8:1.40, 9:1.38, 10:1.37 };   // Student, 80 %

function tendance() {
  const w = (S.weights || []).slice().sort((a, b) => a.d.localeCompare(b.d));
  if (!w.length) return { ok: 0, n: 0, msg: "Aucune pesée pour l'instant." };
  const jour = (d) => new Date(d + "T12:00:00").getTime() / J;
  const fin = jour(w[w.length - 1].d);
  const pts = w.filter((p) => fin - jour(p.d) <= 28).map((p) => ({ x: jour(p.d) - fin, y: p.kg }));
  const n = pts.length, etendue = n ? -pts[0].x : 0;
  const age = Math.round(jour(iso()) - fin);
  if (n < 4 || etendue < 10)
    return { ok: 0, n: n, etendue: etendue, age: age,
             msg: "Il faut au moins 4 pesées étalées sur 10 jours pour calculer une pente. " +
                  "Tu en as " + n + " sur " + Math.round(etendue) + " jour" + (etendue >= 2 ? "s" : "") + "." };

  const mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n;
  let sxx = 0, sxy = 0;
  pts.forEach((p) => { sxx += (p.x - mx) * (p.x - mx); sxy += (p.x - mx) * (p.y - my); });
  const b = sxy / sxx, a = my - b * mx;
  let sse = 0;
  pts.forEach((p) => { const r = p.y - (a + b * p.x); sse += r * r; });
  const se = n > 2 ? Math.sqrt(sse / (n - 2) / sxx) : 0;
  const t = T80[Math.min(10, n - 2)] || 1.3;

  const pente = b * 7, marge = t * se * 7;
  const cible = PHASES[S.phase].gain;
  const bas = pente - marge, haut = pente + marge;
  /* Le verdict ne tombe que si tout l'intervalle est du même côté de la cible */
  const verdict = haut < cible - 0.05 ? "vite" : bas > cible + 0.05 ? "lent" : "cible";
  return { ok: 1, n: n, etendue: etendue, age: age, pente: pente, bas: bas, haut: haut, marge: marge,
           cible: cible, verdict: verdict, a: a, b: b, fin: w[w.length - 1].d, lisse: a };
}

/* ═════════ SUIVI ═════════ */

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

/* Séances, séries et tonnage entre deux dates (bornes incluses / exclues) */
function volume(depuis, avant) {
  const jours = {}; let series = 0, kg = 0;
  Object.keys(S.logs).forEach((k) => {
    const d = k.slice(0, 10);
    if (d < depuis || (avant && d >= avant)) return;
    Object.keys(S.logs[k]).forEach((id) => {
      const x = lireSeance(d, S.logs[k][id]);
      if (!x.series) return;
      jours[d] = 1; series += x.series; kg += x.vol;
    });
  });
  return { seances: Object.keys(jours).length, series: series, kg: Math.round(kg) };
}

/* Les exercices du programme en cours, variantes actives comprises */
function exosDuProgramme() {
  const vus = {}, out = [];
  DAYS.forEach((d) => {
    const sess = sessionOf(d);
    if (!sess || sess.kind !== "gym") return;
    exList(sess).forEach((ex) => { if (!vus[ex.id]) { vus[ex.id] = 1; out.push(ex); } });
  });
  return out;
}

/* Lundi de la semaine en cours, et ce qui a été fait depuis */
function debutSemaine() {
  const t = new Date(); t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
}
function faitCetteSemaine(jour) {
  const d0 = debutSemaine();
  const dans = (o) => Object.keys(o || {}).some((k) => k.slice(11) === jour && k.slice(0, 10) >= d0 &&
                                                          (o === S.runs || Object.keys(o[k]).length));
  return dans(S.logs) || dans(S.runs);
}

function jourPlus(d, n) { const t = new Date(d + "T12:00:00"); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); }

/* Ce que la dernière semaine complète, du lundi au dimanche, dit du programme.
   Une fenêtre glissante de sept jours changerait de contenu selon le jour où
   on ouvre l'application ; la semaine civile, non. */
function bilanSemaine() {
  const fin = debutSemaine(), deb = jourPlus(fin, -7);
  const sem = volume(deb, fin), avant = volume(jourPlus(deb, -7), deb);

  const montes = [], valides = [], surveiller = [];
  exosDuProgramme().forEach((ex) => {
    const E = etatExo(ex, fin), s = E.H.s, n = s.length;
    if (!n) return;
    const recent = s[n - 1].d >= deb;
    /* Charge montée : la séance de la semaine est plus lourde que la précédente */
    const monte = n >= 2 && recent && s[n - 1].top > s[n - 2].top;
    if (monte) montes.push({ id: ex.id, de: s[n - 2].top, a: s[n - 1].top });
    /* Fourchette bouclée cette semaine : la charge monte à la prochaine séance */
    if (recent && E.valide) valides.push({ id: ex.id, de: E.top, a: E.der.next, charge: E.der.next != null && E.der.next > E.top });
    /* À surveiller : trois séances récentes sans gagner ni charge ni répétitions */
    else if (!monte && (E.etat === "stable" || E.etat === "baisse") && s[n - 1].d >= jourPlus(deb, -14))
      surveiller.push({ id: ex.id, top: E.top, palier: E.palier, etat: E.etat, dReps: E.dReps, dKg: E.dKg,
                        charge: E.H.mode === "charge" || E.H.mode === "lest" });
  });
  surveiller.sort((x, y) => (x.etat === "baisse" ? 0 : 1) - (y.etat === "baisse" ? 0 : 1));

  let longue = 0;
  Object.keys(S.runs || {}).forEach((k) => { if (k.slice(0, 10) >= deb && k.slice(0, 10) < fin) longue = Math.max(longue, S.runs[k].min); });

  return { du: deb, au: jourPlus(fin, -1), seances: sem.seances, series: sem.series, kg: sem.kg, avant: avant,
           montes: montes, valides: valides, surveiller: surveiller, bloques: surveiller,
           longue: longue, tr: tendance(), dette: dettesEnAttente() };
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

/* Clôture : la semaine suivante repart du planning type */
function cloreSemaine() {
  S.seen.week = weekId();
  S.skipped = {}; S.padel = {};
  save();
}

/* ═════════ OBJECTIF DU JOUR, PAR EXERCICE ═════════ */

/* Remise à zéro d'un exercice : quand l'exécution change (plus strict, plus
   profond, charge redescendue volontairement), l'ancien historique ne veut plus
   rien dire. On garde les logs, on déplace juste le point de comparaison. */
function resetExo(id) { S.reset[id] = iso(); save(); }
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
    EXCAT[v.id] = Object.assign({}, e, { id:v.id, n:v.n, kg:v.kg, inc:v.inc || e.inc,
                                         r:v.r || e.r, s:v.s || e.s, note:v.note || "", alt:null, base:e.id });
  });
}));
[].concat(BONUS.ex || [], EXTRAS).forEach((e) => {
  EXCAT[e.id] = e;
  (e.alt || []).forEach((v) => {
    EXCAT[v.id] = Object.assign({}, e, { id:v.id, n:v.n, kg:v.kg, inc:v.inc || e.inc,
                                         r:v.r || e.r, s:v.s || e.s, note:v.note || "", alt:null, base:e.id });
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
