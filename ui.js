/* ═════════ ÉTAT D'AFFICHAGE ═════════ */

let V = { tab:"seance", day: todayKey(), openEx:null, openMeal:null, picker:null, editFood:null, tmp:{} };

const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function bar(pct, col) {
  return '<div class="bar"><i style="width:' + Math.min(100, pct) + '%;background:' + col + '"></i></div>';
}
function checkbox(on, col) {
  return '<span class="cb' + (on ? " on" : "") + '"' + (on ? ' style="background:' + col + ';border-color:' + col + '"' : "") + '>' + (on ? "✓" : "") + "</span>";
}
function stepper(act, id, val, unit) {
  return '<span class="step"><button data-act="' + act + '-" data-id="' + id + '">−</button>' +
         '<b>' + fr(val) + (unit || "") + '</b>' +
         '<button data-act="' + act + '+" data-id="' + id + '">+</button></span>';
}

/* ═════════ SÉANCE ═════════ */

function viewSeance() {
  const d = V.day, sess = sessionFor(d);
  let h = "";

  if (sess.kind === "run") {
    const r = sess.run, logged = S.runs[dayStamp(d)];
    const done = Object.keys(S.runs).length;
    const presc = d === "Dim" ? Math.min(r.min + 5 * Math.min(done, 6), 85) : r.min;
    const t = V.tmp.run || (V.tmp.run = { min: presc, km: 7 });
    const pace = t.km ? (() => { const s = t.min * 60 / t.km; return Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0"); })() : "—";
    h += '<div class="hero run"><small>' + r.label + "</small><h1>" + presc + " min</h1>" +
         '<div class="pair"><div><small>Allure</small><b>' + r.pace + " /km</b></div>" +
         "<div><small>Cardio</small><b>" + r.hr + " bpm</b></div></div>" +
         "<p>Tu dois pouvoir tenir une conversation. Tu pars toujours trop vite : surveille ta montre sur les deux premiers kilomètres, pas à la fin.</p></div>";
    h += '<button class="tog' + (S.padel[d] ? " on" : "") + '" data-act="padel">' + (S.padel[d] ? "✓ " : "") + "Padel ce jour-là</button>";
    if (S.padel[d]) h += '<p class="note warn">' + (d === "Sam"
      ? "Le padel remplace la course facile. C'est déjà du cardio en intermittent, et ça garde tes jambes pour dimanche."
      : "Padel et sortie longue le même jour, c'est lourd. Cours 30 min le matin et garde le padel pour l'après-midi.") + "</p>";
    h += '<h2>Ce que tu as fait</h2><div class="card pad">' +
         '<div class="row"><span>Durée</span>' + stepper("run.min", "", t.min, " min") + "</div>" +
         '<div class="row"><span>Distance</span>' + stepper("run.km", "", t.km, " km") + "</div>" +
         '<div class="row tot"><span>Allure réalisée</span><b>' + pace + " /km</b></div>" +
         '<button class="cta run" data-act="run.save">Enregistrer la course</button>';
    if (logged) h += '<p class="' + (logged.fast ? "warn" : "ok") + ' small">' + (logged.fast
      ? logged.pace + "/km, trop rapide pour de la zone 2. Prochaine sortie : même durée, 30 à 40 secondes plus lent au kilomètre."
      : logged.pace + "/km, pile dans la zone. La prochaine sortie longue passe à " + Math.min(presc + 5, 85) + " min.") + "</p>";
    h += "</div>";
    return h;
  }

  const log = S.logs[dayStamp(d)] || {};
  h += '<div class="hero gym"><small>' + sess.tag + "</small><h1>" + sess.name + "</h1><p>" +
       (sess.light
         ? sess.ex.length + " exercices au lieu de " + DEFAULT_PROGRAM[d].ex.length + " : padel dans la journée, on garde les fondamentaux et on coupe les finisseurs."
         : sess.ex.length + " exercices · " + sess.ex.reduce((a, e) => a + e.s, 0) + " séries") + "</p></div>";

  h += '<div class="duo">' +
       '<button class="tog' + (S.padel[d] ? " on" : "") + '" data-act="padel">' + (S.padel[d] ? "✓ " : "") + "Padel aujourd'hui</button>" +
       '<button class="tog danger' + (S.skipped[d] ? " on" : "") + '" data-act="skip">' + (S.skipped[d] ? "✓ " : "") + "Séance ratée</button></div>";

  if (S.padel[d]) h += '<p class="note warn">Séance allégée. Ta cible du jour monte de 350 kcal de glucides. Si le padel dépasse 1 h 30, coche l\'Apurna dans l\'onglet Repas : l\'Ergymag passe alors à 2 gélules.</p>';

  const rp = replanText();
  if (rp) h += '<div class="card pad replan"><h3>Rattrapage</h3><p>' + rp + '</p><button class="ghost" data-act="resetweek">Réinitialiser la semaine</button></div>';

  if (S.skipped[d]) { h += '<p class="note">Séance marquée comme ratée. Le plan de rattrapage est juste au-dessus.</p>'; return h; }

  sess.ex.forEach((ex, i) => {
    const kg = chargeOf(ex), done = log[ex.id], open = V.openEx === ex.id;
    h += '<div class="card exo' + (open ? " open" : "") + '"><div class="exhead" data-act="openex" data-id="' + ex.id + '">' +
         '<span class="idx">' + (i + 1) + "</span><div class=\"grow\"><b>" + esc(ex.n) + "</b><small>" +
         ex.s + " × " + (ex.r[0] === ex.r[1] ? ex.r[0] : ex.r[0] + "-" + ex.r[1]) + (ex.note ? " · " + esc(ex.note) : "") + "</small></div>" +
         '<div class="kg' + (done ? " ok" : "") + '">' + (ex.bw && !kg ? "PDC" : fr(kg) + "<i>kg</i>") +
         (done ? "<small>" + done.reps.join(" / ") + "</small>" : "") + "</div></div>";
    if (open) {
      const reps = V.tmp.reps || (V.tmp.reps = new Array(ex.s).fill(ex.r[1]));
      const w = V.tmp.kg != null ? V.tmp.kg : (V.tmp.kg = kg);
      h += '<div class="exbody"><small>Reps réalisées, série par série</small><div class="reps">';
      reps.forEach((r, k) => {
        h += '<span class="rep"><button data-act="rep-" data-id="' + k + '">−</button><b class="' + (r >= ex.r[1] ? "ok" : "") + '">' + r + '</b><button data-act="rep+" data-id="' + k + '">+</button></span>';
      });
      h += "</div>";
      if (!ex.bw || ex.inc > 0) h += '<div class="row"><span>Charge utilisée</span>' + stepper("kg", ex.id, w, " kg") + "</div>";
      h += '<button class="cta gym" data-act="logex" data-id="' + ex.id + '">Valider l\'exercice</button>';
      if (done) h += '<p class="small">' + esc(done.msg) + " → prochaine fois <b>" + fr(done.next) + " kg</b></p>";
      h += "</div>";
    }
    h += "</div>";
  });

  if (sess.alt) h += '<p class="note run">Semaine chargée ? Remplace cette séance par 30 min de course en zone 2. Les quatre séances de lundi à jeudi sont la priorité.</p>';
  return h;
}

/* ═════════ REPAS ═════════ */

function viewRepas() {
  const d = V.day, meals = PLAN[d] || [], t = dayMac(d), tg = target(d), P = PHASES[S.phase];
  let h = "";

  if (!meals.length) {
    h += '<div class="hero nut"><small>Week-end</small><h1>Repas libres</h1><p>Chez tes parents. Mange à ta faim, ne compte pas : sur sept jours ça s\'équilibre.</p></div>';
    return h + viewSupps(d);
  }

  h += '<div class="card pad"><div class="big">' + Math.round(t[0]) + "<small>" + (tg ? "/ " + tg + " kcal" : " kcal jusqu'au goûter") + "</small></div>" +
       (tg ? bar(t[0] / tg * 100, t[0] > tg * 1.08 ? "#B4540A" : "#1C6B4A") : '<div class="bar"></div>') +
       '<div class="macros">' +
       ['<div><small>Protéines</small><b>' + Math.round(t[1]) + "<i>/" + P.prot + " g</i></b></div>",
        "<div><small>Glucides</small><b>" + Math.round(t[2]) + "<i>/" + P.gluc + " g</i></b></div>",
        "<div><small>Lipides</small><b>" + Math.round(t[3]) + "<i>/" + P.lip + " g</i></b></div>"].join("") +
       "</div>";
  if (S.padel[d]) h += '<p class="small warn">Padel aujourd\'hui : 350 kcal de glucides ajoutées à ta cible.</p>';
  h += "</div>";

  if (!tg) h += '<p class="note">Vendredi soir tu manges chez tes parents : le dîner n\'est pas compté ici.</p>';
  const gap = tg ? tg - t[0] : 0;
  if (Math.abs(gap) > 120) h += '<div class="card pad"><p class="small">' + (gap > 0
      ? "Il manque " + Math.round(gap) + " kcal sur la journée."
      : "Tu dépasses ta cible de " + Math.round(-gap) + " kcal.") +
      '</p><button class="cta nut" data-act="align">Réécrire les féculents pour tomber sur la cible</button></div>';

  meals.forEach((m, mi) => {
    const mm = mac(m.f), open = V.openMeal === mi;
    h += '<div class="card meal' + (open ? " open" : "") + '"><div class="mhead" data-act="openmeal" data-id="' + mi + '">' +
         '<div class="grow"><b>' + esc(m.t) + "</b><small>" + m.h + " · " + Math.round(mm[1]) + " g de protéines</small></div>" +
         "<div class=\"kcal\">" + Math.round(mm[0]) + "</div></div>";
    if (open) {
      h += '<div class="mbody">';
      m.f.forEach(([f, g], fi) => {
        if (!FOODS[f]) return;
        h += '<div class="item"><div class="grow"><b>' + esc(FOODS[f].n) + "</b><small>" + qtyLabel(f, g) + " · " + Math.round(FOODS[f].k * g / 100) + " kcal</small></div>" +
             stepper("q", mi + "." + fi, g, "") +
             '<button class="del" data-act="delfood" data-id="' + mi + "." + fi + '">✕</button></div>';
      });
      h += '<button class="ghost" data-act="addto" data-id="' + mi + '">+ Ajouter un aliment à ce repas</button></div>';
    }
    h += "</div>";
  });

  const ex = S.extras[dayStamp(d)] || [];
  h += "<h2>Hors plan</h2>";
  ex.forEach((e, i) => {
    h += '<div class="card item pad"><div class="grow"><b>' + esc(FOODS[e.k] ? FOODS[e.k].n : e.k) + "</b><small>" +
         qtyLabel(e.k, e.g) + " · " + Math.round(FOODS[e.k].k * e.g / 100) + " kcal</small></div>" +
         '<button class="del" data-act="delextra" data-id="' + i + '">✕</button></div>';
  });
  h += V.picker != null ? pickerHTML() : '<button class="ghost" data-act="picker" data-id="x">+ J\'ai mangé autre chose</button>';

  return h + viewSupps(d);
}

function pickerHTML() {
  const q = (V.tmp.q || "").toLowerCase();
  const list = Object.keys(FOODS).filter((k) => FOODS[k].n.toLowerCase().indexOf(q) >= 0).slice(0, 7);
  let h = '<div class="card pad picker"><input id="q" placeholder="Chercher un aliment" value="' + esc(V.tmp.q || "") + '">';
  if (V.tmp.pick) {
    const F = FOODS[V.tmp.pick], g = V.tmp.pg;
    h += '<div class="row"><span>' + esc(F.n) + "</span>" + stepper("pg", "", g, " " + F.u) + "</div>" +
         '<p class="small">' + Math.round(F.k * g / 100) + " kcal · " + fr(F.p * g / 100) + " g de protéines</p>" +
         '<button class="cta nut" data-act="addfood">Ajouter</button>';
  } else {
    list.forEach((k) => { h += '<div class="opt" data-act="pick" data-id="' + k + '"><span>' + esc(FOODS[k].n) + "</span><small>" + FOODS[k].k + " kcal /100 " + FOODS[k].u + "</small></div>"; });
  }
  return h + '<button class="ghost" data-act="closepicker">Annuler</button></div>';
}

function viewSupps(d) {
  const list = supplements(d), ck = S.supps[dayStamp(d)] || {}, ap = !!S.apurna[dayStamp(d)];
  let h = "<h2>Compléments du jour</h2><div class=\"card\">";
  list.forEach((s) => {
    h += '<div class="line" data-act="supp" data-id="' + s.id + '">' + checkbox(ck[s.id], "#1C6B4A") +
         '<div class="grow"><b class="' + (ck[s.id] ? "done" : "") + '">' + esc(s.n) + "</b><small>" + esc(s.w) + "</small></div><i>" + esc(s.d) + "</i></div>";
  });
  h += '<div class="line" data-act="apurna">' + checkbox(ap, "#B4540A") +
       '<div class="grow"><small>Effort de plus d\'1 h 30 aujourd\'hui — Apurna pendant, Ergymag limité à 2 gélules</small></div></div></div>';
  return h;
}

/* ═════════ POIDS ═════════ */

function viewPoids() {
  const P = PHASES[S.phase], w = S.weights, dow = new Date().getDay();
  const weighDay = dow === 1 || dow === 3 || dow === 5, doneToday = w.some((x) => x.d === iso());
  const kg = V.tmp.w != null ? V.tmp.w : (V.tmp.w = w.length ? w[w.length - 1].kg : 81);
  let h = '<div class="hero wgt"><small>' + P.n + " · " + P.d + "</small><h1>" + P.goal + "</h1>" +
          '<div class="duo phases">' +
          Object.keys(PHASES).map((k) => '<button class="tog' + (S.phase === k ? " on" : "") + '" data-act="phase" data-id="' + k + '">' + PHASES[k].n + " · " + PHASES[k].kcal + " kcal</button>").join("") +
          "</div></div>";

  h += "<h2>" + (weighDay && !doneToday ? "Pèse-toi ce matin" : "Pesée") + '</h2><div class="card pad">';
  if (weighDay && !doneToday) h += '<p class="small wgt">Jour de pesée. Au réveil, après être passé aux toilettes, avant de boire.</p>';
  h += '<div class="row"><span>Poids</span>' + stepper("w", "", kg, " kg") + "</div>" +
       '<button class="cta wgt" data-act="savew">' + (doneToday ? "Corriger la pesée du jour" : "Enregistrer") + "</button></div>";

  if (w.length > 1) {
    const pts = w.slice(-14), mn = Math.min.apply(null, pts.map((p) => p.kg)) - 0.4, mx = Math.max.apply(null, pts.map((p) => p.kg)) + 0.4;
    const pl = pts.map((p, i) => (i / (pts.length - 1) * 296 + 2) + "," + (86 - (p.kg - mn) / (mx - mn) * 80)).join(" ");
    h += '<h2>Tendance</h2><div class="card pad"><svg viewBox="0 0 300 92" preserveAspectRatio="none" class="spark">' +
         '<polyline points="' + pl + '"/>' + pts.map((p, i) => '<circle cx="' + (i / (pts.length - 1) * 296 + 2) + '" cy="' + (86 - (p.kg - mn) / (mx - mn) * 80) + '" r="2.2"/>').join("") +
         '</svg><div class="ends"><span>' + fr(pts[0].kg) + " kg</span><span>" + fr(pts[pts.length - 1].kg) + " kg</span></div></div>";
  }

  const tr = trend();
  if (tr) {
    h += '<h2>Ajustement</h2><div class="card pad"><p>' + tr.msg + "</p>";
    if (tr.adj) h += '<button class="cta wgt" data-act="applyadj" data-id="' + tr.adj + '">Réécrire mes portions (' + (tr.adj > 0 ? "+" : "") + tr.adj + " kcal)</button>" +
                     '<p class="small">Les féculents de la semaine sont recalculés, et la liste de courses suit.</p>';
    h += "</div>";
  } else {
    h += '<p class="note">Il faut six pesées, soit deux semaines, avant de calculer une tendance fiable. Une pesée isolée ne dit rien : sel, eau et digestion font bouger le chiffre d\'un kilo dans la journée.</p>';
  }
  if (S.offset) h += '<p class="small">Cible actuelle : ' + (PHASES[S.phase].kcal + S.offset) + " kcal (" + (S.offset > 0 ? "+" : "") + S.offset + " d'ajustement)</p>";
  return h;
}

/* ═════════ COURSES ═════════ */

function viewCourses() {
  const L = shoppingList();
  const all = Object.keys(L).reduce((a, r) => a + L[r].length, 0);
  const done = Object.keys(S.shop).filter((k) => S.shop[k]).length;
  let h = '<div class="hero shop"><small>Lundi</small><h1>Liste de courses</h1>' +
          "<p>Calculée depuis ton plan : tous les repas du lundi matin au vendredi midi, goûters compris. Si tu changes une portion, la liste change aussi.</p>" +
          "<p>" + done + " sur " + all + "</p></div>";
  Object.keys(RAYONS).forEach((r) => {
    if (!L[r]) return;
    h += "<h2>" + RAYONS[r] + '</h2><div class="card">';
    L[r].forEach((it) => {
      const on = S.shop[it.f];
      h += '<div class="line" data-act="shop" data-id="' + it.f + '">' + checkbox(on, "#9A6A0B") +
           '<span class="grow ' + (on ? "done" : "") + '">' + esc(it.n) + "</span><i>" + it.q + "</i></div>";
    });
    h += "</div>";
  });
  return h + '<button class="ghost" data-act="resetshop">Nouvelle semaine</button>';
}

/* ═════════ RÉGLAGES ═════════ */

function viewReglages() {
  let h = '<div class="hero"><h1>Réglages</h1><p>Les valeurs viennent de tes captures Foodvisor. Corrige ce qui ne colle pas à tes étiquettes : tout le reste se recalcule.</p></div>';
  h += "<h2>Corriger un aliment</h2>";
  if (V.editFood) {
    const F = FOODS[V.editFood];
    h += '<div class="card pad"><b>' + esc(F.n) + "</b>" +
         ["k", "p", "c", "l"].map((f) => '<div class="row"><span>' + ({ k:"kcal", p:"protéines", c:"glucides", l:"lipides" })[f] +
           " /100 " + F.u + "</span>" + stepper("f." + f, "", F[f], "") + "</div>").join("") +
         '<button class="cta" data-act="closefood">Terminé</button></div>';
  } else {
    h += '<div class="card">' + Object.keys(FOODS).sort((a, b) => FOODS[a].n.localeCompare(FOODS[b].n)).map((k) =>
      '<div class="line" data-act="editfood" data-id="' + k + '"><span class="grow">' + esc(FOODS[k].n) + "</span><i>" + FOODS[k].k + " kcal</i></div>").join("") + "</div>";
  }
  h += "<h2>Données</h2><div class=\"card pad\">" +
       '<button class="ghost" data-act="export">Exporter mes données</button>' +
       '<button class="ghost" data-act="resetplan">Remettre le plan de repas d\'origine</button>' +
       '<button class="ghost danger" data-act="wipe">Tout effacer</button></div>';
  return h;
}

/* ═════════ RENDU ═════════ */

const TABS = [["seance","Séance"],["repas","Repas"],["poids","Poids"],["courses","Courses"],["reglages","Réglages"]];

function render() {
  const d = V.day, sess = DEFAULT_PROGRAM[d];
  $("#head").innerHTML =
    '<div class="hrow"><b>' + LONG[d] + (d === todayKey() ? '<span> · aujourd\'hui</span>' : "") + "</b>" +
    "<i>" + (PHASES[S.phase].kcal + (S.offset || 0)) + " kcal</i></div>" +
    '<div class="days">' + DAYS.map((x) =>
      '<button class="' + (x === V.day ? "on " : "") + (S.skipped[x] ? "miss" : "") + '" data-act="day" data-id="' + x + '">' + x + "</button>").join("") + "</div>";
  $("#main").innerHTML =
    V.tab === "seance" ? viewSeance() :
    V.tab === "repas" ? viewRepas() :
    V.tab === "poids" ? viewPoids() :
    V.tab === "courses" ? viewCourses() : viewReglages();
  $("#nav").innerHTML = TABS.map(([id, n]) =>
    '<button class="' + (V.tab === id ? "on" : "") + '" data-act="tab" data-id="' + id + '">' + n + "</button>").join("");
  const q = $("#q"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

/* ═════════ ÉVÉNEMENTS ═════════ */

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id, d = V.day;
  const sess = sessionFor(d), ex = sess.ex ? sess.ex.filter((x) => x.id === V.openEx)[0] : null;

  if (a === "tab") { V.tab = id; V.openEx = V.openMeal = V.picker = null; V.editFood = null; V.tmp = {}; }
  else if (a === "day") { V.day = id; V.openEx = V.openMeal = V.picker = null; V.tmp = {}; }
  else if (a === "padel") { S.padel[d] = !S.padel[d]; save(); }
  else if (a === "skip") { S.skipped[d] = !S.skipped[d]; save(); }
  else if (a === "resetweek") { S.skipped = {}; save(); }
  else if (a === "openex") { V.openEx = V.openEx === id ? null : id; V.tmp = {}; }
  else if (a === "rep-" || a === "rep+") { const i = +id; V.tmp.reps[i] = Math.max(0, V.tmp.reps[i] + (a === "rep+" ? 1 : -1)); }
  else if (a === "kg+" || a === "kg-") { const s = ex && ex.inc ? ex.inc : 2.5; V.tmp.kg = Math.max(0, Math.round((V.tmp.kg + (a === "kg+" ? s : -s)) * 10) / 10); }
  else if (a === "logex" && ex) {
    const res = progress(ex, V.tmp.reps, V.tmp.kg);
    S.charges[ex.id] = res.kg;
    S.logs[dayStamp(d)] = Object.assign({}, S.logs[dayStamp(d)], { [ex.id]: { reps: V.tmp.reps.slice(), kg: V.tmp.kg, next: res.kg, msg: res.msg } });
    save(); V.openEx = null; V.tmp = {};
  }
  else if (a === "run.min+" || a === "run.min-") V.tmp.run.min = Math.max(5, V.tmp.run.min + (a.endsWith("+") ? 5 : -5));
  else if (a === "run.km+" || a === "run.km-") V.tmp.run.km = Math.max(0.5, Math.round((V.tmp.run.km + (a.endsWith("+") ? 0.5 : -0.5)) * 10) / 10);
  else if (a === "run.save") {
    const t = V.tmp.run, s = t.min * 60 / t.km;
    S.runs[dayStamp(d)] = { min: t.min, km: t.km, pace: Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0"), fast: s < 355 };
    save();
  }
  else if (a === "openmeal") { V.openMeal = V.openMeal === +id ? null : +id; }
  else if (a === "q+" || a === "q-") {
    const [mi, fi] = id.split(".").map(Number);
    editPlan((p) => { const it = p[d][mi].f[fi], st = FOODS[it[0]].st || 10;
      it[1] = Math.max(0, Math.round((it[1] + (a === "q+" ? st : -st)) * 10) / 10); });
  }
  else if (a === "delfood") { const [mi, fi] = id.split(".").map(Number); editPlan((p) => p[d][mi].f.splice(fi, 1)); }
  else if (a === "addto") { V.picker = +id; V.tmp.q = ""; V.tmp.pick = null; }
  else if (a === "picker") { V.picker = "extra"; V.tmp.q = ""; V.tmp.pick = null; }
  else if (a === "pick") { V.tmp.pick = id; V.tmp.pg = FOODS[id].uG || 100; }
  else if (a === "pg+" || a === "pg-") { const st = FOODS[V.tmp.pick].st || 10; V.tmp.pg = Math.max(st, Math.round((V.tmp.pg + (a === "pg+" ? st : -st)) * 10) / 10); }
  else if (a === "addfood") {
    if (V.picker === "extra") {
      const k = dayStamp(d); S.extras[k] = (S.extras[k] || []).concat([{ k: V.tmp.pick, g: V.tmp.pg }]); save();
    } else editPlan((p) => p[d][V.picker].f.push([V.tmp.pick, V.tmp.pg]));
    V.picker = null; V.tmp.pick = null;
  }
  else if (a === "closepicker") { V.picker = null; V.tmp.pick = null; }
  else if (a === "delextra") { const k = dayStamp(d); S.extras[k].splice(+id, 1); save(); }
  else if (a === "supp") { const k = dayStamp(d); S.supps[k] = S.supps[k] || {}; S.supps[k][id] = !S.supps[k][id]; save(); }
  else if (a === "apurna") { const k = dayStamp(d); S.apurna[k] = !S.apurna[k]; save(); }
  else if (a === "phase") { S.phase = id; alignPlan(); save(); }
  else if (a === "align") { alignPlan(); save(); }
  else if (a === "w+" || a === "w-") V.tmp.w = Math.round((V.tmp.w + (a === "w+" ? 0.1 : -0.1)) * 10) / 10;
  else if (a === "savew") { S.weights = S.weights.filter((x) => x.d !== iso()).concat([{ d: iso(), kg: V.tmp.w }]).sort((x, y) => x.d.localeCompare(y.d)); save(); }
  else if (a === "applyadj") { applyAdjust(+id); save(); }
  else if (a === "shop") { S.shop[id] = !S.shop[id]; save(); }
  else if (a === "resetshop") { S.shop = {}; save(); }
  else if (a === "editfood") { V.editFood = id; }
  else if (a === "closefood") { V.editFood = null; }
  else if (a && a.indexOf("f.") === 0) {
    const f = a[2], k = V.editFood, st = f === "k" ? 5 : 0.5;
    const cur = FOODS[k][f], nv = Math.max(0, Math.round((cur + (el.textContent === "+" ? st : -st)) * 10) / 10);
    S.foodEdits[k] = Object.assign({}, S.foodEdits[k], { [f]: nv }); rebuild(); save();
  }
  else if (a === "export") {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
    const u = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = u; link.download = "coach-" + iso() + ".json"; link.click(); URL.revokeObjectURL(u);
  }
  else if (a === "resetplan") { if (confirm("Remettre le plan de repas d'origine ?")) { S.plan = null; rebuild(); save(); } }
  else if (a === "wipe") { if (confirm("Effacer toutes tes données ?")) { S = JSON.parse(JSON.stringify(BLANK)); rebuild(); save(); } }
  else return;
  render();
});

document.addEventListener("input", (e) => {
  if (e.target.id === "q") { V.tmp.q = e.target.value; render(); }
});

if (typeof window !== "undefined" && window.document && document.getElementById("main")) render();
