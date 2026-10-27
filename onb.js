/* ═════════════════════════════════════════════════════════════════════
   QUESTIONNAIRE D'ACCUEIL

   Il ne s'adresse QU'AUX NOUVEAUX arrivants. Une installation qui porte
   déjà des données — des séances validées, des pesées, une semaine
   personnalisée — ne le voit jamais : onbActif() le refuse, et la
   migration onb0 pose le verrou une fois pour toutes au premier
   chargement sur un téléphone déjà utilisé.

   Ce qu'il produit : une semaine type, la composition de chaque séance,
   des charges de départ, et une cible calorique estimée. Rien de figé —
   tout reste modifiable ensuite dans l'application.
   ═════════════════════════════════════════════════════════════════════ */

const ONBQ = [
  { k:"objectif", t:"Qu'est-ce que tu viens chercher ?",
    s:"Ça décide de la structure de la semaine et du nombre de séries.",
    o:[
      ["muscle",    "Prendre du muscle",   "Volume modéré, charges qui montent régulièrement"],
      ["gras",      "Perdre du gras",      "On garde les charges, le déficit fait le travail"],
      ["force",     "Devenir plus fort",   "Peu d'exercices, lourds, longs temps de repos"],
      ["endurance", "Courir plus loin",    "Musculation réduite au nécessaire, course en priorité"],
    ] },

  { k:"niveau", t:"Depuis combien de temps tu t'entraînes ?",
    s:"Ça fixe les charges de départ et le nombre d'exercices par séance.",
    o:[
      ["debut",    "Moins de 6 mois",   "4 exercices par séance, charges basses, on construit la technique"],
      ["inter",    "6 mois à 2 ans",    "6 exercices, charges moyennes"],
      ["confirme", "Plus de 2 ans",     "Séances complètes, charges proches de ton niveau réel"],
    ] },

  { k:"jours", t:"Combien de jours par semaine ?",
    s:"Sois honnête : un programme sur 3 jours tenu bat un programme sur 6 jours abandonné.",
    o:[
      ["3", "3 jours", "Poussée, tirage, jambes — l'essentiel"],
      ["4", "4 jours", "On ajoute une séance épaules"],
      ["5", "5 jours", "On ajoute une séance de force"],
      ["6", "6 jours", "La cinquième plus une séance légère de rattrapage"],
    ] },

  { k:"matos", t:"Tu t'entraînes où ?",
    s:"Les exercices que tu ne peux pas faire sont retirés du programme.",
    o:[
      ["salle",    "Salle complète",       "Machines, barres, poulies, haltères"],
      ["halteres", "Chez toi, avec du matériel", "Haltères et barre de traction"],
      ["corps",    "Poids du corps",       "Aucun matériel, ou presque"],
    ] },

  { k:"menager", t:"Une articulation à ménager ?",
    s:"Plusieurs réponses possibles. Les exercices concernés sont remplacés, pas simplement supprimés.",
    multi:1,
    o:[
      ["epaules", "Épaules",  "Pas de développé au-dessus de la tête, pas de dips"],
      ["dos",     "Bas du dos","Pas de soulevé de terre ni de rowing barre"],
      ["genoux",  "Genoux",   "Pas de squat profond ni de fentes chargées"],
      ["coudes",  "Coudes",   "Pas de triceps en extension lourde"],
      ["rien",    "Rien à signaler", "Programme complet"],
    ] },

  { k:"poids", t:"Ton poids de corps ?",
    s:"Il sert à deux choses : suivre ta progression aux tractions et aux dips, et estimer tes calories.",
    num:1, unite:"kg", min:40, max:160, pas:1, def:75 },
];

/* ── Matériel ──────────────────────────────────────────────────────────
   Plutôt que d'étiqueter 74 exercices, on liste ce qui RESTE possible
   dans les deux cas restreints. La salle complète ne filtre rien.        */
const MATOS = {
  halteres: ["dch","dch_bar","dim_h","dips","dips_f","tract","tract_sup","tract_f","tract_f0",
             "muscleup","muscleup_el","rowhalt","curlhalt","curlmart","curlinc","b_curlmart",
             "dm_h","elevlat_h","arriere_h","b_oiseaux","elevfront","shrugs","b_rotext",
             "sdt","sdtjt","sdt_pause","fentes","hip","hip_b","hip2","squat_bar","mollets_a",
             "b_mollets","b_hang","levjambes","roue","gainage","gainlat","obliques","b_mob",
             "pompes","pompes_dec","pompes_gen","dips_banc","pompes_pike","rowing_aus",
             "superman","squat_pdc","squat_bul","fentes_pdc","pont","pont_uni","chaise"],
  corps:    ["tract","tract_sup","tract_f0","muscleup","muscleup_el","dips","b_mollets","b_hang",
             "levjambes","roue","gainage","gainlat","b_mob","b_rotext",
             "pompes","pompes_dec","pompes_gen","dips_banc","pompes_pike","rowing_aus",
             "superman","squat_pdc","squat_bul","fentes_pdc","pont","pont_uni","chaise"],
};

/* ── Renfort ───────────────────────────────────────────────────────────
   Quand le filtrage vide une séance — et sans matériel, il la vide
   presque entièrement — on la recompose avec ces exercices-là, dans
   cet ordre. Une séance à un seul exercice n'est pas une séance.      */
const RENFORT = {
  pec:     ["pompes","dips_banc","pompes_dec","pompes_gen","gainage"],
  dos:     ["tract","rowing_aus","tract_sup","superman","b_hang","b_curlmart"],
  jambes:  ["squat_pdc","fentes_pdc","pont","squat_bul","chaise","b_mollets"],
  epaules: ["pompes_pike","b_oiseaux","b_rotext","levjambes","gainlat"],
  force:   ["tract","pompes","squat_pdc","rowing_aus","roue","gainage"],
  bonus:   ["b_mollets","b_hang","b_rotext","superman","b_mob"],
};
const MINEX = 3;   // en dessous, ce n'est plus une séance

/* ── Articulations ─────────────────────────────────────────────────────
   Ce qui saute quand une zone est déclarée sensible, et par quoi on le
   remplace quand un substitut raisonnable existe.                        */
const RISQUE = {
  epaules: { out:["dm","dm_h","dips","dips_f","dips_m","elevfront","dcbar","dcbar_p","b_hang"],
             sub:{ dm:"elevlat_h", dips:"poulieuni", dips_f:"poulieuni", dcbar:"dch" } },
  dos:     { out:["sdt","sdt_pause","rowing","sdtjt","sdtjt_b","squat_bar"],
             sub:{ sdt:"hip", sdtjt:"legcurl", rowing:"tirhor", squat_bar:"presse" } },
  /* Le squat au poids du corps et la chaise restent : l'amplitude y est
     choisie par celui qui les fait. Ce qui saute, c'est la charge et la
     fente, où le genou encaisse sans qu'on puisse doser. */
  genoux:  { out:["squat","squat_bar","fentes","legext","fentes_pdc","squat_bul"],
             sub:{ squat:"presse", squat_bar:"presse", fentes:"hip",
                   fentes_pdc:"pont", squat_bul:"pont", legext:"legcurl" } },
  coudes:  { out:["triext","triext_p","tricorde","tribarre","roue"],
             sub:{ triext:"poulieuni", tricorde:"poulieuni" } },
};

/* ── Répartition de la semaine ────────────────────────────────────────
   Les jours sont espacés pour laisser de la récupération entre deux
   séances qui tapent sur les mêmes muscles.                              */
const SPLIT = {
  3: { Lun:"pec", Mer:"dos", Ven:"jambes" },
  4: { Lun:"pec", Mar:"dos", Jeu:"jambes", Ven:"epaules" },
  5: { Lun:"pec", Mar:"dos", Mer:"jambes", Jeu:"epaules", Ven:"force" },
  6: { Lun:"pec", Mar:"dos", Mer:"jambes", Jeu:"epaules", Ven:"force", Sam:"bonus" },
};

/* Combien d'exercices on garde par séance, selon le niveau et l'objectif */
function onbCible(niveau, objectif) {
  let n = niveau === "debut" ? 4 : niveau === "inter" ? 6 : 8;
  if (objectif === "force")     n = Math.min(n, 5);
  if (objectif === "endurance") n = Math.min(n, 4);
  return n;
}

/* La phase nutritionnelle qui va avec l'objectif */
const ONBPHASE = { muscle:"p2", gras:"seche", force:"p2", endurance:"p1" };

/* Fraction des charges de référence, selon le niveau. L'application
   réajuste séance après séance : partir trop bas ne coûte rien, partir
   trop haut coûte une blessure. */
const ONBCHARGE = { debut:0.45, inter:0.7, confirme:1 };

function onbArrondi(v, inc) {
  const pas = inc || 2.5;
  return Math.max(pas, Math.round(v / pas) * pas);
}

/* ── Génération ───────────────────────────────────────────────────────── */

/* Deux exercices qui partagent la même base sont le même mouvement : une
   élévation latérale aux haltères et une à la poulie ne comptent qu'une
   fois dans une séance. */
const racine = (id) => (EXCAT[id] && EXCAT[id].base) || id;

function onbCompose(sessId, rep) {
  const sess = SESS[sessId];
  if (!sess || !sess.ex) return null;

  const menager = (rep.menager || []).filter((z) => z !== "rien");
  const autorise = MATOS[rep.matos] || null;
  const cible = onbCible(rep.niveau, rep.objectif);
  const interdit = {};
  menager.forEach((z) => (RISQUE[z] ? RISQUE[z].out : []).forEach((id) => { interdit[id] = 1; }));

  const faisable = (id) => !interdit[id] && (!autorise || autorise.indexOf(id) >= 0);

  /* Un exercice indisponible n'est pas forcément perdu : sa variante l'est
     peut-être. Le rowing barre ne passe pas sans barre, le rowing haltère si. */
  function remplace(id) {
    if (faisable(id)) return id;
    const sub = [];
    menager.forEach((z) => { if (RISQUE[z] && RISQUE[z].sub[id]) sub.push(RISQUE[z].sub[id]); });
    const base = EXCAT[id];
    (base && base.alt ? base.alt.map((a) => a.id) : []).forEach((a) => sub.push(a));
    for (let i = 0; i < sub.length; i++) if (faisable(sub[i])) return sub[i];
    return null;
  }

  let ids = [];
  sess.ex.forEach((e) => {
    const r = remplace(e.id);
    if (r && ids.every((x) => racine(x) !== racine(r))) ids.push(r);
  });

  /* Trop d'exercices : on sacrifie l'isolation avant le polyarticulaire.
     Pour la force, on coupe aussi dans le tier 2. */
  if (ids.length > cible) {
    const seuil = rep.objectif === "force" ? 2 : 3;
    for (let t = 3; t >= seuil && ids.length > cible; t--) {
      for (let i = ids.length - 1; i >= 0 && ids.length > cible; i--) {
        const e = EXCAT[ids[i]];
        if (e && (e.tier || 3) === t) ids.splice(i, 1);
      }
    }
    ids = ids.slice(0, cible);
  }

  /* Le renfort ne sert qu'à réparer ce que le filtrage a emporté. Une
     séance intacte n'a pas besoin qu'on lui ajoute des pompes : on ne
     complète que si des exercices ont réellement sauté. */
  const perdus = sess.ex.length - ids.length;
  if (perdus > 0 && ids.length < cible) {
    (RENFORT[sessId] || []).forEach((id) => {
      if (ids.length >= cible) return;
      if (!faisable(id)) return;
      if (ids.some((x) => racine(x) === racine(id))) return;
      ids.push(id);
    });
  }

  return ids.length ? ids : null;
}

function onbGenere(rep) {
  const jours = String(rep.jours || 5);
  const plan = SPLIT[jours] || SPLIT[5];

  /* Semaine : les séances aux jours prévus, de la course ou du repos ailleurs.
     Celui qui vient pour courir récupère les jours libres en sorties. */
  const w = {};
  DAYS.forEach((d) => {
    if (plan[d]) { w[d] = plan[d]; return; }
    if (rep.objectif === "endurance") w[d] = (d === "Dim" ? "runlong" : "runeasy");
    else w[d] = (d === "Dim" ? "runlong" : d === "Sam" ? "runeasy" : "repos");
  });
  S.week = w;

  /* Composition de chaque séance */
  S.seance = {};
  Object.keys(plan).forEach((d) => {
    const ids = onbCompose(plan[d], rep);
    if (ids) S.seance[plan[d]] = ids;
  });

  /* Charges de départ, proportionnelles au niveau. Sans matériel, aucun
     lest : les charges de référence supposent une salle, et un débutant
     chez lui n'a ni ceinture de lest ni disques. */
  const nu = rep.matos === "corps";
  const f = ONBCHARGE[rep.niveau] != null ? ONBCHARGE[rep.niveau] : 0.7;
  S.charges = {};
  if (f < 1 || nu) {
    Object.keys(S.seance).forEach((sid) => S.seance[sid].forEach((id) => {
      const e = EXCAT[id]; if (!e || !e.kg) return;
      S.charges[id] = (e.bw || nu) ? 0 : onbArrondi(e.kg * f, e.inc);
    }));
  }

  /* Poids de corps : première pesée, c'est elle qui fait démarrer les courbes */
  const kg = Number(rep.poids) || 75;
  S.weights = [{ d: iso(), kg: kg }];

  /* Cible calorique estimée. Multiplicateur volontairement prudent, et
     annoncé comme une estimation : c'est un point de départ, pas un verdict. */
  const phase = ONBPHASE[rep.objectif] || "p1";
  const ecart = { gras:-400, muscle:250, force:150, endurance:0 }[rep.objectif] || 0;
  const estim = Math.round((kg * 33 + ecart) / 10) * 10;
  S.phase  = phase;
  S.offset = estim - PHASES[phase].kcal;
  S.minKcal = Math.round(kg * 24 / 10) * 10;   // plancher proportionnel, pas celui d'un autre

  S.onb = Object.assign({}, rep, { fait: iso() });
  save();
  return { jours: Object.keys(plan).length, kcal: estim };
}

/* ── Le verrou ────────────────────────────────────────────────────────── */

/* Une installation porte-t-elle déjà des données ? */
function onbDejaUtilise() {
  return !!(Object.keys(S.logs || {}).length ||
            (S.weights || []).length ||
            Object.keys(S.seance || {}).length ||
            S.week ||
            Object.keys(S.charges || {}).length);
}

function onbActif() { return !S.onb && !onbDejaUtilise(); }

function onbPasser() { S.onb = { passe: 1, fait: iso() }; save(); }

/* ═════════ ÉCRAN ═════════ */

function onbEtat() { return (V.onb = V.onb || { i:0, rep:{ poids:75 } }); }

function onbRecap(rep) {
  const lib = (k, v) => {
    const q = ONBQ.filter((x) => x.k === k)[0];
    if (!q || !q.o) return v;
    const o = q.o.filter((x) => x[0] === v)[0];
    return o ? o[1] : v;
  };
  const zones = (rep.menager || []).filter((z) => z !== "rien");
  return [
    ["Objectif",  lib("objectif", rep.objectif)],
    ["Niveau",    lib("niveau", rep.niveau)],
    ["Rythme",    rep.jours + " séances par semaine"],
    ["Matériel",  lib("matos", rep.matos)],
    ["À ménager", zones.length ? zones.map((z) => lib("menager", z)).join(", ") : "Rien"],
    ["Poids",     fr(rep.poids) + " kg"],
  ];
}

function viewOnb() {
  const E = onbEtat(), rep = E.rep, n = ONBQ.length;
  const prog = '<div class="onbp">' +
    new Array(n + 1).fill(0).map((_, k) =>
      '<i class="' + (k <= E.i ? "on" : "") + '"></i>').join("") + "</div>";

  let h = '<div class="onb"><div class="onbin">' + prog;

  /* ── Récapitulatif, dernier écran ── */
  if (E.i >= n) {
    const plan = SPLIT[String(rep.jours)] || SPLIT[5];
    h += "<h1>Voilà ton programme</h1>" +
         '<p class="sub">Rien n\'est figé : chaque séance se modifie ensuite exercice par exercice.</p>' +
         '<div class="recap">' + onbRecap(rep).map(([a, b]) =>
           '<div class="row"><small>' + a + "</small><b>" + esc(b) + "</b></div>").join("") + "</div>" +
         '<div class="recap">' + DAYS.filter((d) => plan[d]).map((d) =>
           '<div class="row"><small>' + LONG[d] + "</small><b>" +
           esc(SESS[plan[d]] ? SESS[plan[d]].name : plan[d]) + "</b></div>").join("") + "</div>" +
         '<button class="cta gym" data-act="onbgo">Créer mon programme</button>' +
         '<button class="back cta" data-act="onbprec" style="flex:none;margin-top:8px">Revenir en arrière</button>';
    return h + "</div></div>";
  }

  /* ── Une question ── */
  const q = ONBQ[E.i];
  h += "<h1>" + esc(q.t) + '</h1><p class="sub">' + esc(q.s) + "</p>";

  if (q.num) {
    const v = Number(rep[q.k] != null ? rep[q.k] : q.def);
    h += '<div class="card pad"><div class="row"><b>' + q.unite + "</b>" +
         stepper("onbnum", q.k, v, q.unite, q.pas) + "</div></div>";
  } else {
    const cur = rep[q.k];
    h += q.o.map((o) => {
      const on = q.multi ? (cur || []).indexOf(o[0]) >= 0 : cur === o[0];
      return '<button class="ch' + (on ? " on" : "") + '" data-act="onbrep" data-id="' +
             q.k + "." + o[0] + '"><b>' + esc(o[1]) + "</b><small>" + esc(o[2]) + "</small></button>";
    }).join("");
  }

  /* Une question à choix unique avance toute seule ; les autres ont un bouton */
  const pret = q.num || q.multi ? true : rep[q.k] != null;
  h += '<div class="nav2">' +
       (E.i ? '<button class="back" data-act="onbprec">Retour</button>' : "") +
       (q.multi || q.num
          ? '<button class="cta" data-act="onbsuiv">Continuer</button>'
          : (pret ? '<button class="cta" data-act="onbsuiv">Continuer</button>' : "")) +
       "</div>";

  if (!E.i) h += '<button class="skip" data-act="onbpasser">Passer, je règle tout moi-même</button>';
  return h + "</div></div>";
}
