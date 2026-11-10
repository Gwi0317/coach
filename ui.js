/* ═════════ ÉTAT D'AFFICHAGE ═════════ */

let V = { tab:"seance", day: todayKey(), openEx:null, tmp:{}, exTab:"series" };

const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const plur = (n, mot) => n + " " + mot + (n > 1 ? "s" : "");

/* Durée de pause lisible : 150 → « 2 min 30 » */
const pauseTxt = (s) => (s >= 60 ? (s % 60 ? Math.floor(s / 60) + " min " + (s % 60) : Math.floor(s / 60) + " min") : s + " s");
const fourchette = (ex) => (ex.r[0] === ex.r[1] ? ex.r[0] : ex.r[0] + "-" + ex.r[1]);
const kgTxt = (kg) => fr(kg) + " kg";
const dateCourte = (d) => dateFr(d).replace(/ \d{4}$/, "");

function stepper(act, id, val, unit, dec) {
  return '<span class="step"><button data-act="' + act + '-" data-id="' + id + '" aria-label="Moins">−</button>' +
         '<input class="qty" type="number" inputmode="decimal" step="' + (dec || 1) + '" value="' + val +
         '" data-fld="' + act + '" data-id="' + id + '">' +
         (unit ? '<span class="un">' + unit.trim() + "</span>" : "") +
         '<button data-act="' + act + '+" data-id="' + id + '" aria-label="Plus">+</button></span>';
}

/* Le bloc sombre en tête d'écran : ce qu'il y a à faire, écrit gros */
function heros(cls, sur, titre, sous, plus) {
  return '<section class="heros ' + cls + '">' + (sur ? '<p class="sur">' + sur + "</p>" : "") +
         "<h1>" + titre + "</h1>" + (sous ? '<p class="sous">' + sous + "</p>" : "") + (plus || "") + "</section>";
}

/* Une séance en clair : « 62,5 kg : 8 / 7 / 6 » ou « 60×8, 55×7 » si la charge a bougé */
function seriesTxt(e, ex) {
  const kgs = e.kgs || e.reps.map(() => e.kg);
  const plat = kgs.every((k) => k === kgs[0]);
  if (plat) return e.reps.join(" / ");
  return e.reps.map((r, i) => fr(kgs[i]) + "×" + r).join(", ");
}

/* ═════════ PANNEAU TECHNIQUE ═════════ */
/* Le geste animé, les muscles recrutés, les points d'exécution, et l'erreur
   qui blesse. Dans cet ordre : on comprend mieux ce qui travaille quand on a
   vu la trajectoire. */
function panneauTechnique(ex) {
  const f = fiche(ex);
  if (!f) return '<p class="vide">Pas encore de fiche technique pour cet exercice.</p>';
  let h = typeof mouvHTML === "function" ? mouvHTML(ex) : "";
  if ((f.p && f.p.length) || (f.s && f.s.length)) h += schemaMuscles(f.p, f.s);
  h += '<div class="fiche">';
  if (f.tech && f.tech.length)
    h += "<h4>Exécution</h4><ol>" + f.tech.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>";
  if (f.secu) h += '<p class="secu"><b>Pour ne pas te blesser</b>' + esc(f.secu) + "</p>";
  return h + "</div>";
}

/* ═════════ PANNEAU PROGRESSION ═════════ */
/* Deux petits graphiques empilés sur le même axe de temps : la charge en
   haut, les répétitions en bas, posées sur la fourchette visée. C'est la
   double progression telle qu'on la vit : les répétitions grimpent jusqu'en
   haut de la fourchette, puis la charge monte d'un cran et elles retombent. */
function panneauProgression(ex) {
  const E = etatExo(ex), H = E.H, s = H.s, n = s.length;
  if (!n) return '<p class="vide">Aucune séance validée' + (H.reset ? " depuis la remise à zéro du " + dateFr(H.reset) : "") +
                 ". Valide l'exercice une première fois et le suivi démarre.</p>";

  const charge = H.mode === "charge" || H.mode === "lest";
  const uR = H.mode === "temps" ? " " + H.unite : "";                 // unité des répétitions
  const dit = (kg) => (H.mode === "lest" ? (kg ? "+" + fr(kg) + " kg" : "poids du corps") : fr(kg) + " kg");
  const court = (kg) => (H.mode === "lest" && kg ? "+" : "") + fr(kg);
  const der = s[n - 1], prem = s[0];

  /* ── Où on en est, en une phrase ── */
  let cls = "neutre", txt;
  if (E.valide) {
    cls = "ok";
    txt = charge && der.next != null && der.next > der.top
      ? "Fourchette bouclée : prochaine séance à " + dit(der.next) + "."
      : "Haut de la fourchette atteint sur toutes les séries.";
  } else if (E.etat === "debut") {
    txt = n === 1 ? "Première séance enregistrée. Il en faut trois pour dire où ça va."
                  : "Deux séances enregistrées. Encore une pour dire où ça va.";
  } else if (E.retour) {
    /* revenu à une charge déjà soulevée : on compare à cette fois-là */
    const quand = "le " + dateCourte(E.retour.d) + " (" + E.retour.ref.join(" / ") + ")";
    cls = E.etat === "monte" ? "ok" : E.etat === "baisse" ? "warn" : "neutre";
    txt = "De retour à " + dit(E.top) + ". " +
          (E.etat === "monte" ? "Mieux que " + quand + " : +" + E.dReps + " répétitions."
           : E.etat === "baisse" ? "En dessous de " + quand + " : −" + (-E.dReps) + " répétitions."
           : "Même niveau que " + quand + ".");
  } else if (E.etat === "monte") {
    cls = "ok";
    txt = E.dKg > 0 ? "En progression : +" + fr(E.dKg) + " kg sur les trois dernières séances." +
                      (E.sous ? " Encore sous les " + dit(E.sous.top) + " du " + dateCourte(E.sous.d) + "." : "")
                    : "En progression : +" + E.dReps + (uR || " répétitions") + " à charge égale sur trois séances.";
  } else if (E.etat === "baisse") {
    cls = "warn";
    txt = E.dKg < 0 ? "Charge en baisse de " + fr(-E.dKg) + " kg sur les trois dernières séances."
                    : "En recul : −" + (-E.dReps) + (uR || " répétitions") + " à charge égale sur trois séances.";
  } else {
    txt = charge ? "Stable : " + plur(E.palier, "séance") + " à " + dit(E.top) + ", sans gagner de répétitions sur les trois dernières."
                 : "Stable sur les trois dernières séances.";
  }
  let h = '<p class="etat ' + cls + '"><i></i><span>' + txt + "</span></p>";

  /* ── Trois chiffres ── */
  const moy = (x) => Math.round(x.moy * 10) / 10;
  if (charge) {
    const g = Math.round((der.top - prem.top) * 10) / 10;
    const base = H.mode === "lest" ? prem.top + H.corps : prem.top;
    h += '<div class="tuiles">' +
         "<div><small>Départ</small><b>" + court(prem.top) + "<i>kg</i></b><small>" + dateCourte(prem.d) + "</small></div>" +
         "<div><small>Dernière fois</small><b>" + court(der.top) + "<i>kg</i></b><small>" + dateCourte(der.d) + "</small></div>" +
         "<div><small>Gain</small><b>" + (g > 0 ? "+" : "") + fr(g) + "<i>kg</i></b><small>" +
           (n > 1 && base > 0 ? (g > 0 ? "+" : "") + Math.round(g / base * 100) + " %" + (H.mode === "lest" ? ", corps compris" : "") : "&nbsp;") +
         "</small></div></div>";
  } else {
    const g = Math.round((moy(der) - moy(prem)) * 10) / 10;
    h += '<div class="tuiles">' +
         "<div><small>Départ</small><b>" + fr(moy(prem)) + "<i>" + (H.unite === "reps" ? "/ série" : H.unite) + "</i></b><small>" + dateCourte(prem.d) + "</small></div>" +
         "<div><small>Dernière fois</small><b>" + fr(moy(der)) + "<i>" + (H.unite === "reps" ? "/ série" : H.unite) + "</i></b><small>" + dateCourte(der.d) + "</small></div>" +
         "<div><small>Gain</small><b>" + (g > 0 ? "+" : "") + fr(g) + "</b><small>" + plur(n, "séance") + "</small></div></div>";
  }

  /* ── Graphique ── */
  if (n >= 2) {
    const W = 320, xg = 30, xd = W - 10;
    const jour = (d) => new Date(d + "T12:00:00").getTime() / 86400000;
    const t0 = jour(prem.d), t1 = jour(der.d);
    const X = (x) => (t1 === t0 ? (xg + xd) / 2 : xg + (xd - xg) * (jour(x.d) - t0) / (t1 - t0));
    const sel = V.tmp.pt != null && s[V.tmp.pt] ? V.tmp.pt : n - 1;
    const f1 = (v) => v.toFixed(1);

    /* panneau du haut : la charge */
    const yA0 = 12, yA1 = charge ? 84 : 0;
    /* panneau du bas : les répétitions, série par série */
    const yB0 = charge ? 118 : 16, yB1 = charge ? 178 : 126;
    const HT = yB1 + 22;
    let svg = '<svg class="graf" viewBox="0 0 ' + W + " " + HT + '" role="img" aria-label="Évolution séance par séance">';

    if (charge) {
      const tops = s.map((x) => x.top);
      let mn = Math.min.apply(null, tops), mx = Math.max.apply(null, tops);
      const plat = mx === mn;
      const Y = (v) => (plat ? (yA0 + yA1) / 2 : yA1 - (yA1 - yA0) * (v - mn) / (mx - mn));
      svg += '<line class="gr" x1="' + xg + '" y1="' + yA1 + '" x2="' + xd + '" y2="' + yA1 + '"/>';
      if (!plat) svg += '<line class="gr" x1="' + xg + '" y1="' + yA0 + '" x2="' + xd + '" y2="' + yA0 + '"/>' +
                        '<text class="ax" x="' + (xg - 6) + '" y="' + (yA0 + 3.5) + '" text-anchor="end">' + fr(mx) + "</text>";
      svg += '<text class="ax" x="' + (xg - 6) + '" y="' + (plat ? Y(mn) + 3.5 : yA1 + 3.5) + '" text-anchor="end">' + fr(mn) + "</text>";
      svg += '<path class="ln" d="M' + s.map((x) => f1(X(x)) + " " + f1(Y(x.top))).join("L") + '"/>';
      s.forEach((x, i) => {
        svg += '<circle class="pt' + (i === sel ? " sel" : "") + '" cx="' + f1(X(x)) + '" cy="' + f1(Y(x.top)) + '" r="' + (i === sel ? 4.5 : 3.2) + '"/>';
      });
      svg += '<text class="tit" x="' + xg + '" y="' + (yA0 - 3) + '">' + (H.mode === "lest" ? "Lest, kg" : "Charge, kg") + "</text>";
    }

    /* répétitions : un petit point par série, un trait pour la moyenne */
    const lo = ex.r[0], hi = ex.r[1];
    let rmn = lo, rmx = hi;
    s.forEach((x) => x.ref.forEach((r) => { if (r < rmn) rmn = r; if (r > rmx) rmx = r; }));
    const pad = Math.max(1, (rmx - rmn) * 0.12); rmn -= pad; rmx += pad;
    const YR = (v) => yB1 - (yB1 - yB0) * (v - rmn) / (rmx - rmn);
    /* la fourchette visée, en bande */
    svg += '<rect class="bande" x="' + xg + '" y="' + f1(YR(hi)) + '" width="' + (xd - xg) + '" height="' + f1(Math.max(2, YR(lo) - YR(hi))) + '"/>' +
           '<text class="ax" x="' + (xg - 6) + '" y="' + f1(YR(hi) + 3.5) + '" text-anchor="end">' + hi + "</text>" +
           (lo !== hi ? '<text class="ax" x="' + (xg - 6) + '" y="' + f1(YR(lo) + 3.5) + '" text-anchor="end">' + lo + "</text>" : "");
    svg += '<path class="ln fin" d="M' + s.map((x) => f1(X(x)) + " " + f1(YR(x.moy))).join("L") + '"/>';
    s.forEach((x, i) => {
      x.ref.forEach((r) => { svg += '<circle class="rp" cx="' + f1(X(x)) + '" cy="' + f1(YR(r)) + '" r="1.7"/>'; });
      svg += '<circle class="pt' + (i === sel ? " sel" : "") + '" cx="' + f1(X(x)) + '" cy="' + f1(YR(x.moy)) + '" r="' + (i === sel ? 4.5 : 3.2) + '"/>';
    });
    svg += '<text class="tit" x="' + xg + '" y="' + (yB0 - 8) + '">' +
           (H.mode === "temps" ? "Durée par série, " + H.unite : "Répétitions par série") + ", sur la fourchette " + fourchette(ex) + "</text>";

    /* axe du temps, et repère de la séance choisie */
    svg += '<text class="ax" x="' + xg + '" y="' + (HT - 6) + '">' + dateCourte(prem.d) + "</text>" +
           '<text class="ax" x="' + xd + '" y="' + (HT - 6) + '" text-anchor="end">' + dateCourte(der.d) + "</text>" +
           '<line class="rep" x1="' + f1(X(s[sel])) + '" y1="' + (charge ? yA0 : yB0) + '" x2="' + f1(X(s[sel])) + '" y2="' + yB1 + '"/>';
    /* zones tactiles, plus larges que les points */
    s.forEach((x, i) => {
      const g = i ? (X(x) + X(s[i - 1])) / 2 : 0, d = i < n - 1 ? (X(x) + X(s[i + 1])) / 2 : W;
      svg += '<rect class="hit" x="' + f1(g) + '" y="0" width="' + f1(Math.max(1, d - g)) + '" height="' + HT + '" data-act="pt" data-id="' + i + '"/>';
    });
    svg += "</svg>";

    const p = s[sel];
    h += '<div class="grafbox"><p class="lect"><b>' + dateFr(p.d) + "</b>" +
         (charge ? dit(p.top) + ", " : "") + p.ref.join(" / ") + uR +
         (p.ref.length < p.series ? " à la charge de tête" : "") + "</p>" + svg +
         '<p class="grafpied">Touche un point pour lire la séance. Petits points : chaque série. Trait : leur moyenne.</p></div>';
  }

  /* ── Les dernières séances, en clair ── */
  h += '<table class="hist"><thead><tr><th>Séance</th>' + (charge ? "<th>Charge</th>" : "") +
       "<th>" + (H.mode === "temps" ? "Durées" : "Répétitions") + "</th></tr></thead><tbody>";
  s.slice(-6).reverse().forEach((x) => {
    const plat = x.kgs.every((k) => k === x.kgs[0]);
    h += "<tr><td>" + dateCourte(x.d) + "</td>" + (charge ? "<td>" + dit(x.top) + "</td>" : "") + "<td>" +
         (plat || !charge ? x.reps.filter((r) => r > 0).join(" / ")
                          : x.reps.map((r, i) => (r ? (x.kgs[i] === x.top ? r : r + " à " + fr(x.kgs[i])) : null)).filter(Boolean).join(" / ")) +
         "</td></tr>";
  });
  h += "</tbody></table>";
  if (n > 6) h += '<p class="small">' + n + " séances au total depuis le " + dateFr(prem.d) + ".</p>";
  if (H.mode === "lest")
    h += '<p class="small">Le pourcentage compte ton poids de corps (' + fr(H.corps) + " kg) : passer de 0 à 10 kg de lest, " +
         "c'est déplacer " + Math.round(10 / H.corps * 100) + " % de plus, pas une infinité.</p>";
  if (H.reset) h += '<p class="small">Comparaisons reparties de zéro le ' + dateFr(H.reset) + ". Les séances d'avant sont conservées mais ne sont plus affichées ici.</p>";
  return h;
}

/* ═════════ SÉANCE ═════════ */

/* Ce qu'il faut battre aujourd'hui, et ce qui a été fait la dernière fois */
function objLine(ex, kg, done) {
  const u = ex.u ? " " + ex.u : "";
  let h = '<p class="obj">';
  if (done) {
    h += "<span>Fait : <b>" + seriesTxt(done, ex) + u + "</b></span>" +
         (ex.bw && !ex.inc ? "" : "<span>prochaine fois " + ex.s + " × " + ex.r[1] + " à " + kgTxt(done.next) + "</span>");
    return h + "</p>";
  }
  h += "<span>Objectif <b>" + ex.s + " × " + ex.r[1] + u + "</b></span>";
  const prec = dernierLog(ex.id, true);
  if (prec) {
    const kgs = prec.e.kgs || prec.e.reps.map(() => prec.e.kg);
    const plat = kgs.every((k) => k === kgs[0]);
    h += "<span>" + ilYA(prec.date) + " : " + seriesTxt(prec.e, ex) + u +
         (plat && kgs[0] !== kg && !(ex.bw && !ex.inc) ? " à " + kgTxt(kgs[0]) : "") + "</span>";
  } else {
    h += "<span>première fois, note bien tes séries</span>";
  }
  return h + "</p>";
}

function EXBASE(d, ex) { return EXCAT[ex.base || ex.id] || null; }

/* ── Bilan de la dernière semaine complète ── */
function viewBilan() {
  if (S.seen.week === weekId()) return "";
  const b = bilanSemaine();
  if (!b.seances && !b.avant.seances) return "";      // rien à raconter encore
  const lignes = (l, nom, val) => '<ul class="lst">' + l.map((x) =>
    "<li><span>" + esc(nom(x)) + "</span><b>" + val(x) + "</b></li>").join("") + "</ul>";
  const jour = (d) => +d.slice(8);

  let h = '<section class="carte bilan"><h3>Semaine du ' + jour(b.du) +
          (b.du.slice(5, 7) === b.au.slice(5, 7) ? "" : " " + dateCourte(b.du).replace(/^\d+ /, "")) + " au " + dateCourte(b.au) + "</h3>" +
          '<div class="tuiles">' +
          "<div><small>Séances</small><b>" + b.seances + "</b><small>" + (b.avant.seances ? b.avant.seances + " avant" : "&nbsp;") + "</small></div>" +
          "<div><small>Séries</small><b>" + b.series + "</b><small>" + (b.avant.series ? b.avant.series + " avant" : "&nbsp;") + "</small></div>" +
          "<div><small>Tonnage</small><b>" + fr(b.kg / 1000) + "<i>t</i></b><small>" + (b.avant.kg ? fr(b.avant.kg / 1000) + " t avant" : "&nbsp;") + "</small></div></div>";

  if (b.montes.length)
    h += '<div class="bl ok"><b>Charges montées</b>' +
         lignes(b.montes, (x) => nomExo(x.id), (x) => fr(x.de) + " → " + kgTxt(x.a)) + "</div>";
  const suite = b.valides.filter((x) => x.charge);
  if (suite.length)
    h += '<div class="bl ok"><b>Fourchette bouclée : ça monte à la prochaine séance</b>' +
         lignes(suite, (x) => nomExo(x.id), (x) => kgTxt(x.a)) + "</div>";
  if (b.surveiller.length)
    h += '<div class="bl warn"><b>À surveiller</b>' +
         lignes(b.surveiller, (x) => nomExo(x.id), (x) => (x.etat === "baisse"
           ? (x.dKg < 0 ? "charge en baisse" : "−" + (-x.dReps) + " reps à " + fr(x.top) + " kg")
           : plur(x.palier, "séance") + (x.charge ? " à " + kgTxt(x.top) : " sans bouger"))) +
         "<p>Un palier de trois séances n'est pas un problème en sèche. Au-delà de cinq, retire une série ou " +
         "redescends de 10 % pour repartir.</p></div>";
  if (b.longue) h += '<div class="bl"><b>Course</b><p>Sortie la plus longue : ' + b.longue + " min.</p></div>";
  if (b.tr.ok)
    h += '<div class="bl"><b>Poids</b><p>' + penteTxt(b.tr) + "</p></div>";
  if (b.dette.length)
    h += '<div class="bl warn"><b>Séance en retard</b><p>' + b.dette.map((x) => esc(nomSlot(x.id))).join(" et ") +
         " a sauté la semaine dernière. À replacer en priorité.</p></div>";
  b.dette.forEach((x) => {
    h += '<button class="cta" data-act="placerdette" data-id="' + x.id + '">Replacer ' + esc(nomSlot(x.id).toLowerCase()) + "</button>";
  });
  h += '<button class="' + (V.tmp.nw ? "cta" : "ghost") + '" data-act="newweek">' +
       (V.tmp.nw ? "Confirmer : remettre le planning type" : "Démarrer la nouvelle semaine") + "</button></section>";
  return h;
}

/* La tendance du poids en une phrase, intervalle compris */
function penteTxt(t) {
  const sg = signe;
  const lec = t.verdict === "vite" ? (t.cible < 0 ? "Plus rapide que la cible." : "Plus lent que la cible.")
            : t.verdict === "lent" ? (t.cible < 0 ? "Plus lent que la cible." : "Plus rapide que la cible.")
            : "Compatible avec la cible.";
  return "<b>" + sg(t.pente) + " kg par semaine</b> sur " + t.n + " pesées en " + Math.round(t.etendue) +
         " jours (intervalle à 80 % : " + sg(t.bas) + " à " + sg(t.haut) + "), pour une cible de " + sg(t.cible) + ". " + lec;
}

function viewSemaine() {
  const w = week();
  let h = '<section class="carte sem"><h3>Ma semaine</h3>';
  dettesEnAttente().forEach((x) => {
    h += '<div class="dette"><p>En retard : <b>' + esc(nomSlot(x.id)) + "</b></p>" +
         '<button class="puce" data-act="placerdette" data-id="' + x.id + '">Placer</button>' +
         '<button class="puce" data-act="oublidette" data-id="' + x.id + '">Laisser tomber</button></div>';
  });
  DAYS.forEach((x) => {
    const id = w[x], open = V.tmp.semDay === x;
    h += '<div class="semrow' + (open ? " open" : "") + '" data-act="semday" data-id="' + x + '">' +
         "<b>" + LONG[x] + "</b><i>" + esc(nomSlot(id)) + "</i></div>";
    if (open) {
      h += '<div class="semopts">' + CHOIX.map((c) =>
        '<button class="puce' + (c === id ? " on" : "") + '" data-act="setslot" data-id="' + x + "." + c + '">' +
        esc(nomSlot(c)) + "</button>").join("") + "</div>" +
        '<button class="ghost" data-act="decaler" data-id="' + x + '">Décaler les séances à partir de ' + LONG[x].toLowerCase() + "</button>";
    }
  });
  if (V.tmp.semMsg) h += '<p class="small">' + esc(V.tmp.semMsg) + "</p>";
  h += '<button class="ghost" data-act="resetsem">Remettre la semaine type</button>';
  return h + "</section>";
}

function viewSeance() {
  const d = V.day, sess = sessionFor(d);
  const semBtn = '<button class="puce' + (V.tmp.sem ? " on" : "") + '" data-act="sem">' + (sess ? "Déplacer la séance" : "Ma semaine") + "</button>";
  let h = "";

  /* ── Jour sans séance ── */
  if (!sess) {
    const id = week()[d];
    const sport = id === "padel" || id === "autre";
    h += heros(sport ? "run" : "", id === "absent" ? "Absent" : sport ? esc(nomSlot(id)) : "",
           sport ? "Du sport à la place de la séance" : id === "absent" ? "Journée hors programme" : "Repos",
           sport ? "Ça compte comme séance. Ne rajoute pas de muscu par-dessus si tu es cuit : c'est la récupération qui fait progresser."
                 : id === "absent" ? "Rien de prévu ce jour-là."
                 : "Rien de prévu. S'il te reste de l'envie mais pas de récupération, la séance bonus est faite pour ça : arrière d'épaule, mollets, grip, mobilité, rien de lourd.");
    h += viewBilan() + '<div class="outils">' + semBtn + "</div>";
    if (V.tmp.sem) h += viewSemaine();
    if (!sport && id !== "absent") h += '<button class="cta" data-act="setslot" data-id="' + d + '.bonus">Faire la séance bonus</button>';
    return h;
  }

  /* ── Course ── */
  if (sess.kind === "run") {
    const r = sess.run, logged = S.runs[dayStamp(d)];
    const done = Object.keys(S.runs).length;
    const presc = d === "Dim" ? Math.min(r.min + 5 * Math.min(done, 6), 85) : r.min;
    /* distance proposée : la durée prescrite, à 6 min 20 au kilomètre */
    const t = V.tmp.run || (V.tmp.run = { min: presc, km: Math.round(presc / 6.33 * 2) / 2 });
    const pace = t.km ? (() => { const s = t.min * 60 / t.km; return Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0"); })() : "—";
    h += heros("run", esc(r.label), presc + "<i>min</i>",
           "Tu dois pouvoir tenir une conversation. Surveille ta montre sur les deux premiers kilomètres : c'est là que tu pars trop vite.",
           '<div class="paire"><div><small>Allure</small><b>' + r.pace + "<i>/km</i></b></div>" +
           "<div><small>Cardio</small><b>" + r.hr + "<i>bpm</i></b></div></div>");
    h += viewBilan();
    h += '<div class="outils"><button class="puce' + (S.padel[d] ? " on" : "") + '" data-act="padel">Padel ce jour-là</button>' + semBtn + "</div>";
    if (V.tmp.sem) h += viewSemaine();
    if (S.padel[d]) h += '<p class="note">' + (d === "Sam"
      ? "Le padel remplace la course facile. C'est déjà du cardio en intermittent, et ça garde tes jambes pour dimanche."
      : "Padel et sortie longue le même jour, c'est lourd. Cours 30 min le matin et garde le padel pour l'après-midi.") + "</p>";
    h += '<h2>Ce que tu as fait</h2><section class="carte">' +
         '<div class="row"><span>Durée</span>' + stepper("run.min", "", t.min, " min") + "</div>" +
         '<div class="row"><span>Distance</span>' + stepper("run.km", "", t.km, " km", 0.1) + "</div>" +
         '<div class="row tot"><span>Allure réalisée</span><b>' + pace + "<i>/km</i></b></div>" +
         '<button class="cta" data-act="run.save">Enregistrer la course</button>';
    if (logged) h += '<p class="etat ' + (logged.fast ? "warn" : "ok") + '"><i></i><span>' + (logged.fast
      ? logged.pace + " au kilomètre, trop rapide pour de la zone 2. Prochaine sortie : même durée, 30 à 40 secondes plus lent au kilomètre."
      : logged.pace + " au kilomètre, dans la zone." + (d === "Dim" ? " La prochaine sortie longue passe à " + Math.min(presc + 5, 85) + " min." : "")) + "</span></p>";
    h += "</section>";
    h += '<p class="note">Course déjà faite et tu veux bouger quand même ? La séance bonus est complémentaire : arrière d\'épaule, mollets, grip, mobilité. Elle remplace la course ce jour-là.</p>' +
         '<button class="ghost" data-act="setslot" data-id="' + d + '.bonus">Faire la séance bonus à la place</button>';
    return h;
  }

  /* ── Musculation ── */
  const log = S.logs[dayStamp(d)] || {};
  const liste = exList(sess), v = avancement(d, sess);
  const fini = v.sTot > 0 && v.sFaites >= v.sTot;
  h += heros("gym" + (fini ? " fini" : ""), esc(sess.tag), esc(sess.name),
         sess.light
           ? plur(sess.ex.length, "exercice") + " au lieu de " + ((sessionOf(d) || {}).ex || []).length + " : padel dans la journée, on garde les fondamentaux."
           : plur(liste.length, "exercice") + ", " + plur(v.sTot, "série"),
         '<div class="avance"><div class="jauge"><i style="width:' + (v.sTot ? Math.round(v.sFaites / v.sTot * 100) : 0) + '%"></i></div>' +
         "<span>" + (fini ? "Séance terminée" : v.sFaites ? v.sFaites + " sur " + v.sTot : "") + "</span></div>");

  h += viewBilan();

  const edit = !!V.tmp.edit;
  h += '<div class="outils">' +
       '<button class="puce' + (S.padel[d] ? " on" : "") + '" data-act="padel">Padel en plus</button>' + semBtn +
       '<button class="puce' + (edit ? " on" : "") + '" data-act="editseance">' + (edit ? "Terminer" : "Modifier les exercices") + "</button></div>";
  if (V.tmp.sem) h += viewSemaine();
  if (S.padel[d] && sess.light) h += '<p class="note">Séance allégée : les fondamentaux, sans les finisseurs. Tes jambes et tes épaules ont déjà leur dose avec le padel.</p>';
  if (edit) h += '<p class="note">Retire, remonte, ajoute. Chaque exercice garde sa charge et son historique.</p>';

  liste.forEach((ex, i) => {
    const kg = chargeOf(ex), done = log[ex.id], open = V.openEx === ex.id, nf = nbFaites(d, ex.id);
    const sansCharge = ex.bw && !kg;
    h += '<article class="exo' + (open ? " open" : "") + (done ? " fait" : "") + '">' +
         '<div class="exhead" data-act="openex" data-id="' + ex.id + '">' +
         '<span class="idx">' + (done ? "✓" : i + 1) + '</span><div class="grow"><b>' + esc(ex.n) + "</b><small>" +
         ex.s + " × " + fourchette(ex) + (ex.u ? " " + ex.u : "") +
         (ex.rest ? "<i>pause " + pauseTxt(ex.rest) + "</i>" : "") + "</small></div>" +
         '<div class="kg">' + (sansCharge ? "PDC" : fr(kg) + "<i>kg</i>") +
         (!done && nf ? '<small class="' + (nf >= ex.s ? "ok" : "") + '">' + nf + " / " + ex.s + "</small>" : "") + "</div>" +
         (edit ? '<span class="exedit"><button data-act="exup" data-id="' + ex.id + '" aria-label="Monter">↑</button>' +
                 '<button data-act="exdel" data-id="' + ex.id + '" aria-label="Retirer">✕</button></span>' : "") +
         "</div>" + (edit ? "" : objLine(ex, kg, done));

    if (open) {
      const reps = V.tmp.reps || (V.tmp.reps = new Array(ex.s).fill(ex.r[1]));
      const kgs = V.tmp.kgs || (V.tmp.kgs = new Array(ex.s).fill(kg));
      const charge = !ex.bw || ex.inc > 0;
      h += '<div class="exbody">';

      /* Trois entrées dans un exercice : ce qu'on fait, comment on le fait,
         et où on en est. Elles cohabitent mal sur un même écran de téléphone. */
      h += '<div class="extabs">' +
           [["series", "Séries"], ["tech", "Technique"], ["prog", "Progression"]].map((t) =>
             '<button class="tog' + (V.exTab === t[0] ? " on" : "") + '" data-act="extab" data-id="' +
             t[0] + '">' + t[1] + "</button>").join("") + "</div>";

      if (V.exTab === "tech") h += panneauTechnique(ex);
      else if (V.exTab === "prog") h += panneauProgression(ex);
      else {
        if (ex.note) h += '<p class="cue">' + esc(ex.note) + "</p>";
        const base = EXBASE(d, ex);
        if (base && base.alt) {
          h += '<div class="vars"><small>Version du jour</small><div class="puces">' +
               [{ id:base.id, n:base.n }].concat(base.alt).map((x) =>
                 '<button class="puce' + (x.id === ex.id ? " on" : "") + '" data-act="setvar" data-id="' + base.id + "." + x.id + '">' +
                 esc(x.n) + "</button>").join("") + "</div></div>";
        }
        const faites = setsFaites(d, ex.id);
        h += '<div class="sets">';
        reps.forEach((r, k) => {
          const f = !!faites[k];
          h += '<div class="set' + (f ? " fait" : "") + '">' +
               '<button class="setcb' + (f ? " on" : "") + '" data-act="setdone" data-id="' + k + '" aria-label="Série ' + (k + 1) +
               (f ? " faite" : "") + '">' + (f ? "✓" : k + 1) + "</button>" +
               (charge ? stepper("skg", k, kgs[k], " kg", ex.inc || 0.5) + '<span class="x">×</span>' : "") +
               stepper("rep", k, r, ex.u || (charge ? "" : "reps"), 1) + "</div>";
        });
        h += "</div>";
        if (charge && kgs.some((k) => k !== kgs[0]))
          h += '<button class="ghost" data-act="skgall">Mettre ' + kgTxt(kgs[0]) + " sur toutes les séries</button>";
        h += '<button class="cta" data-act="logex" data-id="' + ex.id + '">' + (done ? "Corriger l'exercice" : "Valider l'exercice") + "</button>";
        if (done) h += '<p class="etat ' + (done.next > Math.max.apply(null, done.kgs || [done.kg]) ? "ok" : "neutre") + '"><i></i><span>' + esc(done.msg) +
                       (charge ? ". Prochaine fois : " + kgTxt(done.next) : "") + ".</span></p>";
        h += S.reset[ex.id]
          ? '<p class="rz">Comparaisons reparties de zéro le ' + dateFr(S.reset[ex.id]) +
            ' <button data-act="unreset" data-id="' + ex.id + '">Annuler</button></p>'
          : '<button class="lien" data-act="reset" data-id="' + ex.id + '">J\'ai changé l\'exécution : repartir de zéro</button>';
      }
      h += "</div>";
    }
    h += "</article>";
  });

  if (edit) {
    h += '<section class="carte"><h3>Ajouter un exercice</h3><div class="puces">' +
         EXALL.filter((id, i) => exIds(sess).indexOf(id) < 0 &&
                               EXALL.findIndex((x) => EXCAT[x].n === EXCAT[id].n) === i).map((id) =>
           '<button class="puce" data-act="exadd" data-id="' + id + '">' + esc(EXCAT[id].n) + "</button>").join("") +
         '</div><button class="ghost" data-act="exreset">Remettre la séance d\'origine</button></section>';
  }

  if (sess.alt) h += '<p class="note">Semaine chargée ? Remplace cette séance par 30 min de course en zone 2. Les quatre séances de lundi à jeudi sont la priorité.</p>';
  return h;
}

/* ═════════ POIDS ═════════ */

function viewSaison() {
  const C = calendrier();
  const encours = C.blocs.filter((b) => b.now)[0];
  const prochain = C.blocs.filter((b) => b.d0 > iso())[0];
  let h = "<h2>Ta saison</h2>";

  if (encours) {
    const reste = semEntre(iso(), encours.d1);
    h += '<section class="carte sais"><h3>' + esc(encours.n) + "</h3><p>" + esc(encours.but) + "</p>" +
         '<p class="small"><b>' + (reste > 0 ? plur(reste, "semaine") + " restante" + (reste > 1 ? "s" : "") : "Dernière semaine") +
         "</b>" + (prochain ? ", puis " + esc(prochain.n).toLowerCase() : "") + "</p></section>";
  }

  h += '<section class="carte liste">';
  C.blocs.forEach((b) => {
    h += '<div class="saisrow' + (b.now ? " on" : "") + (b.evt ? " evt" : "") + '">' +
         '<div class="grow"><b>' + esc(b.n) + "</b><small>" + (b.evt ? dateFr(b.d0) : dateFr(b.d0) + " au " + dateFr(b.d1)) + "</small></div>" +
         "<i>" + (b.evt ? "course" : b.sem + " sem.") + "</i></div>";
  });
  h += "</section>";

  C.alerte.forEach((m) => { h += '<p class="note warn">' + esc(m) + "</p>"; });

  h += '<section class="carte"><h3>Les trois dates</h3>' +
       '<p class="small">Tout le reste se recalcule à partir d\'elles : le bloc Hyrox remonte de 12 semaines avant la course, le bloc marathon de 18.</p>' +
       [["fin", "Fin de la sèche"], ["hyrox", "Hyrox"], ["marathon", "Marathon"]].map(([k, n]) =>
         '<div class="row"><span>' + n + '</span><input type="date" id="dt_' + k + '" data-dte="' + k + '" value="' + C.R[k] + '"></div>').join("") +
       (S.races.fin || S.races.hyrox || S.races.marathon
         ? '<button class="ghost" data-act="racesreset">Revenir aux dates proposées</button>' : "") +
       "</section>";
  return h;
}

/* Les pesées des 28 derniers jours, la droite ajustée et son éventail
   d'incertitude. Une pesée isolée ne dit rien ; la pente, si. */
function grafPoids(t) {
  const w = S.weights.slice().sort((a, b) => a.d.localeCompare(b.d));
  const jour = (d) => new Date(d + "T12:00:00").getTime() / 86400000;
  const fin = jour(w[w.length - 1].d);
  const pts = w.map((p) => ({ x: jour(p.d) - fin, y: p.kg, d: p.d })).filter((p) => p.x >= -42);
  if (pts.length < 2) return "";
  const W = 320, HT = 150, xg = 34, xd = W - 12, y0 = 14, y1 = HT - 24;
  const x0 = Math.min(-28, pts[0].x);
  let mn = Math.min.apply(null, pts.map((p) => p.y)), mx = Math.max.apply(null, pts.map((p) => p.y));
  const pad = Math.max(0.3, (mx - mn) * 0.15); mn -= pad; mx += pad;
  const X = (x) => xg + (xd - xg) * (x - x0) / (0 - x0);
  const Y = (v) => y1 - (y1 - y0) * (v - mn) / (mx - mn);
  const f1 = (v) => v.toFixed(1);
  const sel = V.tmp.wpt != null && pts[V.tmp.wpt] ? V.tmp.wpt : pts.length - 1;

  let svg = '<svg class="graf" viewBox="0 0 ' + W + " " + HT + '" role="img" aria-label="Pesées et tendance">';
  /* repères horizontaux : deux valeurs rondes suffisent */
  const pas = (mx - mn) > 3 ? 1 : 0.5;
  for (let v = Math.ceil(mn / pas) * pas; v <= mx; v += pas)
    svg += '<line class="gr" x1="' + xg + '" y1="' + f1(Y(v)) + '" x2="' + xd + '" y2="' + f1(Y(v)) + '"/>' +
           '<text class="ax" x="' + (xg - 6) + '" y="' + f1(Y(v) + 3.5) + '" text-anchor="end">' + fr(v) + "</text>";

  if (t && t.ok) {
    /* la droite passe par le centre du nuage ; l'éventail montre les pentes
       que les données n'excluent pas */
    const dans = pts.filter((p) => p.x >= -28);
    const cx = dans.reduce((a, p) => a + p.x, 0) / dans.length, cy = t.a + t.b * cx;
    const xa = dans[0].x, xb = 0;
    const yl = (b, x) => cy + b * (x - cx);
    const bB = t.bas / 7, bH = t.haut / 7;
    svg += '<path class="evt" d="M' + f1(X(xa)) + " " + f1(Y(yl(bB, xa))) + "L" + f1(X(cx)) + " " + f1(Y(cy)) + "L" + f1(X(xb)) + " " + f1(Y(yl(bB, xb))) +
           "L" + f1(X(xb)) + " " + f1(Y(yl(bH, xb))) + "L" + f1(X(cx)) + " " + f1(Y(cy)) + "L" + f1(X(xa)) + " " + f1(Y(yl(bH, xa))) + 'Z"/>' +
           '<path class="ln" d="M' + f1(X(xa)) + " " + f1(Y(yl(t.b, xa))) + "L" + f1(X(xb)) + " " + f1(Y(yl(t.b, xb))) + '"/>';
  }
  pts.forEach((p, i) => {
    svg += '<circle class="pt' + (i === sel ? " sel" : "") + '" cx="' + f1(X(p.x)) + '" cy="' + f1(Y(p.y)) + '" r="' + (i === sel ? 4.5 : 3.2) + '"/>';
  });
  svg += '<text class="ax" x="' + xg + '" y="' + (HT - 6) + '">' + dateCourte(pts[0].d) + "</text>" +
         '<text class="ax" x="' + xd + '" y="' + (HT - 6) + '" text-anchor="end">' + dateCourte(pts[pts.length - 1].d) + "</text>";
  pts.forEach((p, i) => {
    const g = i ? (X(p.x) + X(pts[i - 1].x)) / 2 : 0, d = i < pts.length - 1 ? (X(p.x) + X(pts[i + 1].x)) / 2 : W;
    svg += '<rect class="hit" x="' + f1(g) + '" y="0" width="' + f1(Math.max(1, d - g)) + '" height="' + HT + '" data-act="wpt" data-id="' + i + '"/>';
  });
  svg += "</svg>";
  return '<div class="grafbox"><p class="lect"><b>' + dateFr(pts[sel].d) + "</b>" + kgTxt(pts[sel].y) + "</p>" + svg +
         (t && t.ok ? '<p class="grafpied">Points : tes pesées. Trait : la tendance sur 28 jours. Zone claire : les pentes que tes pesées n\'excluent pas.</p>' : "") + "</div>";
}

function viewPoids() {
  const P = PHASES[S.phase], w = S.weights, dow = new Date().getDay();
  const weighDay = dow === 1 || dow === 3 || dow === 5, doneToday = w.some((x) => x.d === iso());
  const der = w.length ? w[w.length - 1] : null;
  const kg = V.tmp.w != null ? V.tmp.w : (V.tmp.w = der ? der.kg : 75);
  const t = tendance();

  let h = heros("poids", esc(P.n), der ? fr(der.kg) + "<i>kg</i>" : "Pas encore de pesée",
            der ? "Pesée " + (der.d === iso() ? "de ce matin" : ilYA(der.d)) + ". Objectif de la phase : " + P.goal.charAt(0).toLowerCase() + P.goal.slice(1) + "."
                : "Objectif de la phase : " + P.goal.charAt(0).toLowerCase() + P.goal.slice(1) + ".");

  h += "<h2>" + (weighDay && !doneToday ? "Pèse-toi ce matin" : "Pesée") + '</h2><section class="carte">';
  if (weighDay && !doneToday) h += '<p class="small">Jour de pesée. Au réveil, après être passé aux toilettes, avant de boire.</p>';
  h += '<div class="row"><span>Poids</span>' + stepper("w", "", kg, " kg", 0.1) + "</div>" +
       '<button class="cta" data-act="savew">' + (doneToday ? "Corriger la pesée du jour" : "Enregistrer la pesée") + "</button></section>";

  h += '<h2>Tendance</h2><section class="carte">';
  if (t.ok) {
    h += '<p class="etat ' + (t.verdict === "cible" ? "ok" : "neutre") + '"><i></i><span>' + penteTxt(t) + "</span></p>" + grafPoids(t);
    if (t.age > 9) h += '<p class="small">Dernière pesée il y a ' + t.age + " jours : la tendance date un peu.</p>";
    h += '<p class="small">Trois pesées par semaine suffisent, toujours dans les mêmes conditions. Avec moins, l\'intervalle s\'élargit et la pente ne veut plus dire grand-chose.</p>';
  } else {
    h += grafPoids(null) + '<p class="small">' + esc(t.msg) + " Une pesée isolée ne dit rien : sel, eau et digestion font bouger le chiffre d'un kilo dans la journée.</p>";
  }
  h += "</section>";

  h += '<h2>Phase en cours</h2><div class="phases">' +
       Object.keys(PHASES).map((k) => '<button class="tog' + (S.phase === k ? " on" : "") + '" data-act="phase" data-id="' + k + '"><b>' +
         PHASES[k].n + "</b><i>" + (PHASES[k].gain ? signe(PHASES[k].gain) + " kg/sem." : "stable") + "</i></button>").join("") +
       "</div>";

  return h + viewSaison();
}

/* ═════════ RÉGLAGES ═════════ */

function viewReglages() {
  const nLogs = Object.keys(S.logs).length;
  let h = '<h2>Tes données</h2><section class="carte">' +
          '<p class="small">' + plur(nLogs, "séance") + " et " + plur(S.weights.length, "pesée") + " enregistrées sur ce téléphone, nulle part ailleurs. " +
          "L'export crée un fichier à garder ou à envoyer avec tes captures Foodvisor pour le point de la semaine.</p>" +
          '<button class="cta" data-act="export">Exporter mes données</button>' +
          '<button class="ghost danger" data-act="wipe">Tout effacer</button></section>';

  /* Savoir quelle version tourne vraiment. Sans ça, impossible de distinguer
     « mes fichiers ne sont pas partis » de « mon téléphone garde l'ancienne ». */
  h += '<h2>Version</h2><section class="carte">' +
       '<div class="row"><span>Version installée</span><b>' + VERSION + "</b></div>" +
       '<div class="row"><span>Mise en ligne</span><b>' + VERSION_DATE + "</b></div>" +
       '<button class="ghost" data-act="maj">Forcer la mise à jour</button>' +
       '<p class="small">Si le numéro ne correspond pas à la dernière version envoyée sur GitHub, ' +
       "c'est le téléphone qui garde l'ancienne : ce bouton vide le cache et recharge. Tes données ne bougent pas.</p></section>";
  return h;
}

/* ═════════ CHRONO ═════════ */

const CHPRE = [30, 45, 60, 75, 90, 120, 150, 180];

function viewChrono() {
  const d = V.day, sess = sessionFor(d), r = chronoReste(), actif = chronoActif();
  let h = heros("chrono" + (actif ? (CHRO.run ? " tourne" : r > 0 ? " pause" : " fini") : ""),
            actif ? esc(CHRO.nom || "Repos") : "Temps de repos",
            '<span id="chbig">' + mmss(r) + "</span>",
            actif ? (CHRO.run ? "Il tourne même si tu changes d'onglet. Vibration et bip à la fin."
                              : r > 0 ? "En pause." : "Repos fini : série suivante.")
                  : "Il se lance tout seul quand tu coches une série. Ou choisis une durée ici.",
            '<div class="jauge"><i id="chbar" style="width:' + (actif && CHRO.dur ? Math.round(r / CHRO.dur * 100) : 0) + '%"></i></div>');

  if (actif) h += '<div class="trio">' +
    '<button class="tog" data-act="ch.moins">− 15 s</button>' +
    '<button class="tog" data-act="ch.pause">' + (CHRO.run ? "Pause" : "Reprendre") + "</button>" +
    '<button class="tog" data-act="ch.plus">+ 15 s</button></div>' +
    '<button class="ghost danger" data-act="ch.stop">Arrêter</button>';

  h += '<h2>Départ rapide</h2><div class="chpre">' +
       CHPRE.map((s) => '<button class="tog' + (actif && CHRO.dur === s ? " on" : "") +
         '" data-act="ch.go" data-id="' + s + '">' + mmss(s) + "</button>").join("") + "</div>";

  if (sess && sess.kind === "gym") {
    h += "<h2>Les pauses de ta séance</h2><section class=\"carte liste\">";
    exList(sess).forEach((ex) => {
      const nf = nbFaites(d, ex.id);
      h += '<div class="line"><div class="grow"><b>' + esc(ex.n) + "</b><small>" +
           plur(ex.s, "série") + (nf ? ", " + nf + " cochée" + (nf > 1 ? "s" : "") : "") + "</small></div>" +
           '<button class="puce" data-act="ch.ex" data-id="' + ex.id + '">' + pauseTxt(ex.rest || 90) + "</button></div>";
    });
    h += "</section><p class=\"note\">Ces durées viennent du programme. Les gros mouvements demandent 2 à 3 min : si tu coupes à 1 min sur le bench ou le squat, tu perds des répétitions et tu crois que tu stagnes.</p>";
  } else {
    h += '<p class="note">Pas de séance de muscu aujourd\'hui. Les durées au-dessus restent disponibles pour du gainage ou du fractionné.</p>';
  }
  return h;
}

/* La barre flottante : elle survit aux redessins, donc elle se peint à part. */
function chronoPeint() {
  const el = $("#chrono"); if (!el) return;
  const r = chronoReste(), actif = chronoActif();
  document.body.classList.toggle("ch", actif);
  const big = $("#chbig"); if (big) big.textContent = mmss(r);
  const bar = $("#chbar"); if (bar) bar.style.width = (actif && CHRO.dur ? Math.min(100, r / CHRO.dur * 100) : 0) + "%";
  if (!actif) { el.className = ""; el.innerHTML = ""; return; }
  const fini = r <= 0 && !CHRO.run;
  el.className = "on" + (fini ? " fini" : CHRO.run ? "" : " pause");
  el.style.setProperty("--p", (CHRO.dur ? Math.max(0, Math.min(100, (1 - r / CHRO.dur) * 100)) : 0) + "%");
  el.innerHTML = "<b>" + mmss(r) + "</b>" +
    "<span>" + (fini ? "Série suivante" : CHRO.run ? esc(CHRO.nom || "Repos") : "En pause") + "</span>" +
    (fini ? "" : '<button data-act="ch.plus" aria-label="Ajouter 15 secondes">+15</button><button data-act="ch.pause" aria-label="' +
                 (CHRO.run ? "Pause" : "Reprendre") + '">' + (CHRO.run ? "❙❙" : "▶") + "</button>") +
    '<button data-act="ch.stop" aria-label="Arrêter">✕</button>';
}

/* ═════════ RENDU ═════════ */

const TABS = [["seance","Séance"],["chrono","Chrono"],["poids","Poids"],["reglages","Réglages"]];
const ICO = {
  seance:   '<path d="M6.5 6v12M3.5 9v6M17.5 6v12M20.5 9v6M6.5 12h11"/>',
  chrono:   '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M9.5 2.75h5M12 2.75V6"/>',
  poids:    '<rect x="3.5" y="4" width="17" height="16.5" rx="4"/><path d="M8 10.5a5.7 5.7 0 0 1 8 0M12 12.5l1.8-3"/>',
  reglages: '<path d="M4 7.5h9M17.5 7.5H20M4 16.5h2.5M11 16.5h9"/><circle cx="15.2" cy="7.5" r="2.2"/><circle cx="8.8" cy="16.5" r="2.2"/>',
};

function render() {
  /* Le questionnaire d'accueil recouvre tout : un nouvel arrivant n'a rien
     à faire dans une séance avant d'avoir dit ce qu'il venait chercher.
     onbActif() est faux dès qu'il reste la moindre donnée. */
  const onbEl = $("#onb");
  if (onbActif()) {
    onbEl.innerHTML = viewOnb();
    document.body.classList.add("onbon");
    return;
  }
  onbEl.innerHTML = "";
  document.body.classList.remove("onbon");
  document.body.dataset.tab = V.tab;

  const d = V.day, jours = V.tab === "seance" || V.tab === "chrono";
  $("#head").innerHTML = jours
    ? '<div class="days">' + DAYS.map((x) => {
        const s = sessionOf(x), fait = faitCetteSemaine(x);
        return '<button class="' + (x === d ? "on " : "") + (x === todayKey() ? "auj " : "") + (S.skipped[x] ? "miss" : "") +
               '" data-act="day" data-id="' + x + '" aria-label="' + LONG[x] + (fait ? ", fait" : "") + '">' + x +
               '<i class="' + (fait ? "ok" : s ? s.kind : "off") + '"></i></button>';
      }).join("") + "</div>"
    : '<p class="titre">' + (V.tab === "poids" ? "Poids et saison" : "Réglages") + "</p>";
  $("#main").innerHTML =
    V.tab === "seance" ? viewSeance() :
    V.tab === "chrono" ? viewChrono() :
    V.tab === "poids" ? viewPoids() : viewReglages();
  $("#nav").innerHTML = TABS.map(([id, n]) =>
    '<button class="' + (V.tab === id ? "on" : "") + '" data-act="tab" data-id="' + id + '">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[id] + "</svg>" + n + "</button>").join("");
  chronoPeint();
  if (typeof mouvLance === "function") mouvLance();
}

/* ═════════ ÉVÉNEMENTS ═════════ */

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id, d = V.day;
  const sess = sessionFor(d) || {}, ex = sess.ex ? exList(sess).filter((x) => x.id === V.openEx)[0] : null;

  /* ── Questionnaire d'accueil ── */
  if (a.slice(0, 3) === "onb") {
    const E = onbEtat();
    if (a === "onbrep") {
      const [k, v] = id.split(".");
      const Q = ONBQ.filter((x) => x.k === k)[0];
      if (Q && Q.multi) {
        let l = E.rep[k] || [];
        /* « Rien à signaler » est exclusif des autres zones */
        if (v === "rien") l = l.indexOf("rien") >= 0 ? [] : ["rien"];
        else l = (l.indexOf(v) >= 0 ? l.filter((x) => x !== v) : l.concat([v])).filter((x) => x !== "rien");
        E.rep[k] = l;
      } else {
        E.rep[k] = v;
        E.i++;                       // choix unique : on enchaîne tout de suite
      }
    }
    else if (a === "onbsuiv")  E.i++;
    else if (a === "onbprec")  E.i = Math.max(0, E.i - 1);
    else if (a === "onbnum+" || a === "onbnum-") {
      const Q = ONBQ.filter((x) => x.k === id)[0] || {};
      const pas = Q.pas || 1, cur = Number(E.rep[id] != null ? E.rep[id] : Q.def || 0);
      E.rep[id] = Math.min(Q.max || 999, Math.max(Q.min || 0, Math.round((cur + (a.slice(-1) === "+" ? pas : -pas)) * 10) / 10));
    }
    else if (a === "onbpasser") { onbPasser(); V.onb = null; }
    else if (a === "onbgo") {
      onbGenere(E.rep);
      V.onb = null; V.tab = "seance"; V.day = todayKey();
    }
    render(); return;
  }

  if (a === "tab") { V.tab = id; V.openEx = null; V.tmp = {}; }
  else if (a === "day") { V.day = id; V.openEx = null; V.tmp = {}; }
  else if (a === "padel") { S.padel[d] = !S.padel[d]; save(); }
  else if (a === "sem") { V.tmp.sem = !V.tmp.sem; if (V.tmp.sem) { V.tmp.semDay = d; V.tmp.semMsg = ""; } }
  else if (a === "semday") { V.tmp.semDay = V.tmp.semDay === id ? null : id; }
  else if (a === "setslot") { const [x, c] = id.split("."); setSlot(x, c); V.tmp.semMsg = LONG[x] + " : " + nomSlot(c) + "."; }
  else if (a === "decaler") {
    const perdus = appliquerDecalage(id, week()[id] === "absent" ? "absent" : "padel");
    V.tmp.semMsg = "Séances décalées à partir de " + LONG[id].toLowerCase() + "." +
      (perdus.length ? " " + perdus.map(nomSlot).join(" et ") + " ne rentre" + (perdus.length > 1 ? "nt" : "") +
        " pas cette semaine : c'est ce qui saute." : "");
    V.tmp.semDay = null;
  }
  else if (a === "resetsem") { resetWeek(); V.tmp.semMsg = "Semaine type rétablie."; }
  else if (a === "placerdette") {
    const jour = placerDette(id);
    V.tmp.sem = 1;
    V.tmp.semMsg = jour ? nomSlot(id) + " est placée " + LONG[jour].toLowerCase() + "."
                        : "Aucun créneau libre. Mets un jour en repos dans Ma semaine, puis réessaie.";
  }
  else if (a === "oublidette") { S.dette = S.dette.filter((x) => x.id !== id); save(); V.tmp.semMsg = "Séance abandonnée pour cette fois."; }
  else if (a === "openex") { V.openEx = V.openEx === id ? null : id; V.tmp = {}; V.exTab = "series"; }
  else if (a === "extab") { V.exTab = id; delete V.tmp.pt; }
  else if (a === "pt") { V.tmp.pt = +id; }
  else if (a === "wpt") { V.tmp.wpt = +id; }
  else if (a === "mouv") { if (typeof mouvBascule === "function") mouvBascule(el); return; }
  else if (a === "setdone" && ex) {
    const k = +id, on = toggleSet(d, ex.id, k, ex.s);
    // cocher une série lance la pause, sauf sur la dernière : il n'y a plus rien à attendre
    if (on && ex.rest && nbFaites(d, ex.id) < ex.s) chronoGo(ex.rest, ex.n);
    else if (on) chronoStop();
  }
  else if (a === "ch.go") chronoGo(+id, "Repos");
  else if (a === "ch.ex") { const e2 = exList(sess).filter((x) => x.id === id)[0]; if (e2) chronoGo(e2.rest || 90, e2.n); }
  else if (a === "ch.pause") chronoPause();
  else if (a === "ch.plus") chronoDecale(15);
  else if (a === "ch.moins") chronoDecale(-15);
  else if (a === "ch.stop") chronoStop();
  else if (a === "racesreset") { S.races = {}; save(); }
  else if (a === "reset") { resetExo(id); }
  else if (a === "unreset") { annulerReset(id); }
  else if (a === "rep-" || a === "rep+") { const i = +id; V.tmp.reps[i] = Math.max(0, V.tmp.reps[i] + (a === "rep+" ? 1 : -1)); }
  else if (a === "skg+" || a === "skg-") {
    const i = +id, s = ex && ex.inc ? ex.inc : 0.5;
    V.tmp.kgs[i] = Math.max(0, Math.round((V.tmp.kgs[i] + (a === "skg+" ? s : -s)) * 10) / 10);
  }
  else if (a === "editseance") { V.tmp.edit = !V.tmp.edit; V.openEx = null; }
  else if (a === "exdel") { exDel(sess, id); }
  else if (a === "exup") { exUp(sess, id); }
  else if (a === "exadd") { exAdd(sess, id); }
  else if (a === "exreset") { exReset(sess); }
  else if (a === "setvar") {
    const [baseId, vId] = id.split(".");
    S.variante[baseId] = vId; save();
    V.openEx = vId; V.tmp = {};
  }
  else if (a === "skgall") { V.tmp.kgs = V.tmp.kgs.map(() => V.tmp.kgs[0]); }
  else if (a === "logex" && ex) {
    const res = progress(ex, V.tmp.reps, V.tmp.kgs);
    S.charges[ex.id] = res.kg;
    S.logs[dayStamp(d)] = Object.assign({}, S.logs[dayStamp(d)], {
      [ex.id]: { reps: V.tmp.reps.slice(), kgs: V.tmp.kgs.slice(), kg: Math.max.apply(null, V.tmp.kgs), next: res.kg, msg: res.msg },
    });
    marquerToutFait(d, ex.id, ex.s);
    save(); V.openEx = null; V.tmp = {};
  }
  else if (a === "run.min+" || a === "run.min-") V.tmp.run.min = Math.max(5, V.tmp.run.min + (a.endsWith("+") ? 5 : -5));
  else if (a === "run.km+" || a === "run.km-") V.tmp.run.km = Math.max(0.5, Math.round((V.tmp.run.km + (a.endsWith("+") ? 0.5 : -0.5)) * 10) / 10);
  else if (a === "run.save") {
    const t = V.tmp.run, s = t.min * 60 / t.km;
    S.runs[dayStamp(d)] = { min: t.min, km: t.km, pace: Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0"), fast: s < 355 };
    save();
  }
  else if (a === "newweek") {
    if (!V.tmp.nw) { V.tmp.nw = 1; }
    else { cloreSemaine(); resetWeek(); V.tmp = {}; }
  }
  else if (a === "phase") { S.phase = id; save(); }
  else if (a === "w+" || a === "w-") V.tmp.w = Math.round((V.tmp.w + (a === "w+" ? 0.1 : -0.1)) * 10) / 10;
  else if (a === "savew") {
    S.weights = S.weights.filter((x) => x.d !== iso()).concat([{ d: iso(), kg: V.tmp.w }]).sort((x, y) => x.d.localeCompare(y.d));
    save(); delete V.tmp.wpt;
  }
  else if (a === "export") {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
    const u = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = u; link.download = "coach-" + iso() + ".json"; link.click(); URL.revokeObjectURL(u);
  }
  else if (a === "maj") {
    /* Vide tout ce qui peut retenir une ancienne version, puis recharge.
       Tes données ne bougent pas : elles sont dans localStorage, pas dans le cache. */
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations)
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    if (window.caches && caches.keys) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
    setTimeout(() => location.reload(), 500);
    return;
  }
  else if (a === "wipe") { if (confirm("Effacer toutes tes données ? Séances, charges et pesées seront perdues.")) { S = JSON.parse(JSON.stringify(BLANK)); save(); } }
  else return;
  render();
});

document.addEventListener("input", (e) => {
  if (e.target.dataset && e.target.dataset.dte && /^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
    S.races[e.target.dataset.dte] = e.target.value; save(); render();
  }
});

document.addEventListener("change", (e) => {
  const el = e.target; if (!el.dataset || !el.dataset.fld) return;
  const v = parseFloat(String(el.value).replace(",", ".")), fld = el.dataset.fld, id = el.dataset.id;
  if (isNaN(v) || v < 0) { render(); return; }
  if (fld === "onbnum") {
    const Q = ONBQ.filter((x) => x.k === id)[0] || {};
    onbEtat().rep[id] = Math.min(Q.max || 999, Math.max(Q.min || 0, v));
    render(); return;
  }
  if (fld === "skg") V.tmp.kgs[+id] = v;
  else if (fld === "rep") V.tmp.reps[+id] = Math.round(v);
  else if (fld === "w") V.tmp.w = Math.round(v * 10) / 10;
  else if (fld === "run.min") V.tmp.run.min = v;
  else if (fld === "run.km") V.tmp.run.km = v;
  render();
});

if (typeof window !== "undefined" && window.document && document.getElementById("main")) render();
