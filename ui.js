/* ═════════ ÉTAT D'AFFICHAGE ═════════ */

let V = { tab:"seance", day: todayKey(), openEx:null, openMeal:null, picker:null, editFood:null, tmp:{} };

/* Ce qu'il faut battre aujourd'hui, et ce qui a été fait la dernière fois */
function objLine(ex, kg, done) {
  const cible = ex.s + " \u00d7 " + ex.r[1] + (ex.bw && !kg ? "" : " à " + fr(kg) + " kg");
  const prec = dernierLog(ex.id, true);
  let h = '<div class="obj">';
  if (done) {
    h += "<b>Prochaine fois</b> " + ex.s + " \u00d7 " + ex.r[1] +
         (ex.bw && !done.next ? "" : " à " + fr(done.next) + " kg");
  } else {
    h += "<b>Objectif</b> " + cible;
  }
  if (prec) {
    const kgs = prec.e.kgs || prec.e.reps.map(() => prec.e.kg);
    const plat = kgs.every((k) => k === kgs[0]);
    h += '<span class="prev">' + ilYA(prec.date) + " : " +
         (plat ? (ex.bw && !kgs[0] ? "" : fr(kgs[0]) + " kg — ") + prec.e.reps.join(" / ")
               : prec.e.reps.map((r, i) => fr(kgs[i]) + "\u00d7" + r).join(" · ")) + "</span>";
    if (!plat && !done) h += '<span class="prev">Toutes les séries à ' + fr(kg) + " kg cette fois.</span>";
  } else {
    h += '<span class="prev">Première fois sur cet exercice, note bien tes séries.</span>';
  }
  return h + "</div>";
}

function EXBASE(d, ex) { return EXCAT[ex.base || ex.id] || null; }

function resume(done) {
  const kgs = done.kgs || done.reps.map(() => done.kg);
  const uniforme = kgs.every((k) => k === kgs[0]);
  if (uniforme) return done.reps.join(" / ");
  return done.reps.map((r, i) => fr(kgs[i]) + "\u00d7" + r).join(" · ");
}

function caffeineWarning() {
  const hh = new Date().getHours();
  if (hh >= 16) return "Il est " + hh + " h : 200 mg de caféine maintenant, il en reste la moitié dans le sang vers 23 h. Prends une demi-dose, ou saute-la.";
  if (hh >= 14) return "Prends-la maintenant au plus tard si tu te couches vers 23 h.";
  return "Idéalement avant 15 h si tu te couches vers 23 h.";
}

const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function bar(pct, col) {
  return '<div class="bar"><i style="width:' + Math.min(100, pct) + '%;background:' + col + '"></i></div>';
}
function checkbox(on, col) {
  return '<span class="cb' + (on ? " on" : "") + '"' + (on ? ' style="background:' + col + ';border-color:' + col + '"' : "") + '>' + (on ? "✓" : "") + "</span>";
}
function stepper(act, id, val, unit, dec) {
  return '<span class="step"><button data-act="' + act + '-" data-id="' + id + '">−</button>' +
         '<input class="qty" type="number" inputmode="decimal" step="' + (dec || 1) + '" value="' + val +
         '" data-fld="' + act + '" data-id="' + id + '">' +
         (unit ? '<span class="un">' + unit.trim() + "</span>" : "") +
         '<button data-act="' + act + '+" data-id="' + id + '">+</button></span>';
}

/* ═════════ SÉANCE ═════════ */

function viewBilan() {
  if (S.seen.week === weekId()) return "";
  const b = bilanSemaine();
  if (!b.seances && !S.weights.length) return "";      // rien à raconter encore
  let h = '<div class="card pad bilan"><h3>Bilan de la semaine</h3><ul>';
  h += "<li>" + b.seances + " séance" + (b.seances > 1 ? "s" : "") + " validée" + (b.seances > 1 ? "s" : "") +
       " sur les 7 derniers jours" + (b.seances >= 4 ? "." : ", l'objectif est de 4.") + "</li>";
  if (b.montes.length) h += "<li>Charges montées : " + b.montes.map(nomExo).join(", ").toLowerCase() + ".</li>";
  if (b.bloques.length) h += "<li>Bloqué depuis 3 séances : " + b.bloques.map(nomExo).join(", ").toLowerCase() +
       ". Baisse de 10 % la prochaine fois et remonte sur deux semaines, ou coupe une série pour finir la fourchette.</li>";
  if (b.faits) h += "<li>" + b.faits + " repas cochés sur " + b.prevus + " prévus.</li>";
  if (b.horsPlan > 120) h += "<li>En moyenne " + b.horsPlan + " kcal par jour hors plan. Si ça se répète, autant les intégrer au plan plutôt que de les subir.</li>";
  if (b.longue) h += "<li>Sortie la plus longue : " + b.longue + " min.</li>";
  if (b.tr) h += "<li>" + b.tr.msg + "</li>";
  if (b.dette.length) h += "<li><b>" + b.dette.map((x) => nomSlot(x.id)).join(" et ") +
       "</b> a sauté la semaine dernière. À replacer en priorité cette semaine.</li>";
  h += "</ul>";
  b.dette.forEach((x) => {
    h += '<button class="cta gym" data-act="placerdette" data-id="' + x.id + '">Replacer ' + nomSlot(x.id).toLowerCase() + "</button>";
  });
  if (b.tr && b.tr.adj) h += '<button class="cta wgt" data-act="applyadj" data-id="' + b.tr.adj + '">Appliquer ' +
       (b.tr.adj > 0 ? "+" : "") + b.tr.adj + " kcal au plan</button>";
  h += '<button class="ghost" data-act="newweek">Nouvelle semaine : remettre le planning type et vider la liste de courses</button>' +
       '<p class="small">Les calories se règlent sur la moyenne de la semaine, jamais sur un seul écart. Un gros repas ne se rattrape pas le lendemain.</p></div>';
  return h;
}

function viewSemaine() {
  const w = week();
  let h = '<div class="card pad sem"><h3>Ma semaine</h3>';
  dettesEnAttente().forEach((x) => {
    h += '<div class="dette">En retard : <b>' + nomSlot(x.id) + "</b>" +
         '<button class="ghost" data-act="placerdette" data-id="' + x.id + '">Placer</button>' +
         '<button class="ghost" data-act="oublidette" data-id="' + x.id + '">Laisser tomber</button></div>';
  });
  DAYS.forEach((x) => {
    const id = w[x], open = V.tmp.semDay === x;
    h += '<div class="semrow' + (open ? " open" : "") + '" data-act="semday" data-id="' + x + '">' +
         "<b>" + LONG[x] + "</b><i>" + nomSlot(id) + "</i></div>";
    if (open) {
      h += '<div class="semopts">' + CHOIX.map((c) =>
        '<button class="tog' + (c === id ? " on" : "") + '" data-act="setslot" data-id="' + x + "." + c + '">' +
        nomSlot(c) + "</button>").join("") + "</div>" +
        '<button class="ghost" data-act="decaler" data-id="' + x + '">Décaler les séances à partir de ' + LONG[x].toLowerCase() + "</button>";
    }
  });
  h += '<button class="ghost" data-act="resetsem">Remettre la semaine type</button>';
  if (V.tmp.semMsg) h += '<p class="small">' + esc(V.tmp.semMsg) + "</p>";
  return h + "</div>";
}

function newWeekBtn() {
  return '<div class="nw">' + (V.tmp.nwmsg ? '<span class="small">' + esc(V.tmp.nwmsg) + "</span>" : "") +
    '<button class="' + (V.tmp.nw ? "cta danger nwb" : "ghost nwb") + '" data-act="newweek">' +
    (V.tmp.nw ? "Confirmer" : "Nouvelle semaine") + "</button></div>";
}

function viewSeance() {
  const d = V.day, sess = sessionFor(d);
  let h = viewBilan() + newWeekBtn();

  if (V.tmp.sem) h += viewSemaine();

  if (!sess) {
    const id = week()[d];
    const sport = id === "padel" || id === "autre";
    h += '<div class="hero"><small>' + (id === "absent" ? "Tu n\'es pas là" : sport ? nomSlot(id) : "Repos") + "</small>" +
         "<h1>" + (sport ? "Du sport à la place de la séance" : id === "absent" ? "Journée hors programme" : "Repos") + "</h1>" +
         "<p>" + (sport
           ? "Ça compte comme séance. Ne rajoute pas de muscu par-dessus si tu étais cuit : c'est la récupération qui fait progresser."
           : "Rien de prévu. Si tu veux caler une séance ici, ouvre Ma semaine juste en dessous.") + "</p></div>";
    h += '<button class="tog full" data-act="sem">' + (V.tmp.sem ? "Fermer" : "Ouvrir") + " Ma semaine</button>";
    return h;
  }

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
    h += '<button class="tog full' + (S.padel[d] ? " on" : "") + '" data-act="padel">' + (S.padel[d] ? "✓ " : "") + "Padel ce jour-là</button>" +
         '<button class="tog full' + (S.pw[dayStamp(d)] ? " on" : "") + '" data-act="pw">' + (S.pw[dayStamp(d)] ? "✓ " : "") + "Pre-workout Apurna avant la sortie</button>" +
         '<button class="tog full danger" data-act="sem">Je n\'ai pas pu</button>';
    if (S.padel[d]) h += '<p class="note warn">' + (d === "Sam"
      ? "Le padel remplace la course facile. C'est déjà du cardio en intermittent, et ça garde tes jambes pour dimanche."
      : "Padel et sortie longue le même jour, c'est lourd. Cours 30 min le matin et garde le padel pour l'après-midi.") + "</p>";
    h += '<h2>Ce que tu as fait</h2><div class="card pad">' +
         '<div class="row"><span>Durée</span>' + stepper("run.min", "", t.min, " min") + "</div>" +
         '<div class="row"><span>Distance</span>' + stepper("run.km", "", t.km, " km", 0.1) + "</div>" +
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
       '<button class="tog' + (S.padel[d] ? " on" : "") + '" data-act="padel">' + (S.padel[d] ? "✓ " : "") + "Padel en plus</button>" +
       '<button class="tog danger" data-act="sem">Je n\'ai pas pu</button></div>';

  h += '<button class="tog full' + (S.pw[dayStamp(d)] ? " on" : "") + '" data-act="pw">' +
       (S.pw[dayStamp(d)] ? "\u2713 " : "") + "Pre-workout Apurna avant la séance</button>";
  if (S.pw[dayStamp(d)]) h += '<p class="note warn">Une dose de 20 g : 200 mg de caféine, 3 g de créatine, 2 g de bêta-alanine. Ta créatine du goûter descend donc à 2 g aujourd\'hui. ' + caffeineWarning() + "</p>";

  if (S.padel[d]) h += '<p class="note warn">Séance allégée. Ta cible du jour monte de 350 kcal de glucides. Si le padel dépasse 1 h 30, coche l\'Apurna dans l\'onglet Repas : l\'Ergymag passe alors à 2 gélules.</p>';


  const edit = !!V.tmp.edit;
  h += '<button class="tog full" data-act="editseance">' + (edit ? "Terminer la modification" : "Modifier les exercices") + "</button>";
  if (edit) h += '<p class="small">Retire, réordonne, ajoute. Chaque exercice garde sa charge et son historique.</p>';

  exList(sess).forEach((ex, i) => {
    const kg = chargeOf(ex), done = log[ex.id], open = V.openEx === ex.id;
    h += '<div class="card exo' + (open ? " open" : "") + '"><div class="exhead" data-act="openex" data-id="' + ex.id + '">' +
         '<span class="idx">' + (i + 1) + "</span><div class=\"grow\"><b>" + esc(ex.n) + "</b><small>" +
         ex.s + " × " + (ex.r[0] === ex.r[1] ? ex.r[0] : ex.r[0] + "-" + ex.r[1]) +
         (ex.rest ? " · pause " + (ex.rest >= 60 ? (ex.rest % 60 ? Math.floor(ex.rest / 60) + " min " + (ex.rest % 60) : Math.floor(ex.rest / 60) + " min") : ex.rest + " s") : "") +
         (ex.note ? " · " + esc(ex.note) : "") + "</small></div>" +
         '<div class="kg' + (done ? " ok" : "") + '">' + (ex.bw && !kg ? "PDC" : fr(kg) + "<i>kg</i>") +
         (done ? "<small>" + resume(done) + "</small>" : "") + "</div>" +
         (edit ? '<span class="exedit"><button data-act="exup" data-id="' + ex.id + '">↑</button>' +
                 '<button data-act="exdel" data-id="' + ex.id + '">✕</button></span>' : "") +
         "</div>" + (edit ? "" : objLine(ex, kg, done));
    if (open) {
      const reps = V.tmp.reps || (V.tmp.reps = new Array(ex.s).fill(ex.r[1]));
      const kgs = V.tmp.kgs || (V.tmp.kgs = new Array(ex.s).fill(kg));
      const charge = !ex.bw || ex.inc > 0;
      h += '<div class="exbody">';
      const base = EXBASE(d, ex);
      if (base && base.alt) {
        h += '<div class="vars"><small>Version du jour</small><div class="duo wrap">' +
             [{ id:base.id, n:base.n, kg:base.kg }].concat(base.alt).map((v) =>
               '<button class="tog' + (v.id === ex.id ? " on" : "") + '" data-act="setvar" data-id="' + base.id + "." + v.id + '">' +
               v.n + "</button>").join("") + "</div></div>";
      }
      h += '<small>Série par série : charge et reps</small><div class="sets">';
      reps.forEach((r, k) => {
        h += '<div class="set"><span class="sn">' + (k + 1) + "</span>" +
             (charge ? stepper("skg", k, kgs[k], " kg", ex.inc || 0.5) : '<span class="pdc">poids du corps</span>') +
             '<span class="x">\u00d7</span>' + stepper("rep", k, r, "", 1) + "</div>";
      });
      h += "</div>";
      if (charge) h += '<button class="ghost" data-act="skgall">Mettre ' + fr(kgs[0]) + " kg sur toutes les séries</button>";
      h += '<button class="cta gym" data-act="logex" data-id="' + ex.id + '">Valider l\'exercice</button>';
      if (done) h += '<p class="small">' + esc(done.msg) + " → prochaine fois <b>" + fr(done.next) + " kg</b></p>";
      h += "</div>";
    }
    h += "</div>";
  });

  if (edit) {
    h += '<div class="card pad"><h3>Ajouter un exercice</h3><div class="addex">' +
         EXALL.filter((id) => exIds(sess).indexOf(id) < 0).map((id) =>
           '<button class="tog" data-act="exadd" data-id="' + id + '">' + esc(EXCAT[id].n) + "</button>").join("") +
         '</div><button class="ghost" data-act="exreset">Remettre la séance d\'origine</button></div>';
  }

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

  const props = propositions();
  if (props.length && !V.tmp.propsOff) {
    h += '<div class="card pad prop"><h3>Envie de changer cette semaine ?</h3>';
    props.forEach((p, i) => {
      h += '<div class="propline"><b>' + LONG[p.d] + (p.slot === "dej" ? " midi" : " soir") + "</b> : " + esc(p.cand.n) + '<span class="small">au lieu de ' + esc(p.actuel.replace(/^(Déjeuner|Dîner) — /, "")) +
           (p.delta ? ", " + (p.delta > 0 ? "+" : "") + p.delta + " kcal, rattrapés sur les féculents" : "") + "</span>" +
           '<span class="propbtn"><button class="tog" data-act="propok" data-id="' + i + '">Oui</button>' +
           '<button class="tog" data-act="propno" data-id="' + i + '">Non</button></span></div>';
    });
    h += '<button class="ghost" data-act="propoff">Pas maintenant</button></div>';
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
    const fait = (S.done[dayStamp(d)] || {})[mi];
    h += '<div class="card meal' + (open ? " open" : "") + '"><div class="mhead" data-act="openmeal" data-id="' + mi + '">' +
         '<span data-act="mealdone" data-id="' + mi + '">' + checkbox(fait, "#1C6B4A") + "</span>" +
         '<div class="grow"><b class="' + (fait ? "done" : "") + '">' + esc(m.t) +
         "</b><small>" + m.h + " · " + Math.round(mm[1]) + " g de protéines</small></div>" +
         '<div class="kcal">' + Math.round(mm[0]) + "</div></div>";
    if (open) {
      h += '<div class="mbody">';
      m.f.forEach(([f, g], fi) => {
        if (!FOODS[f]) return;
        h += '<div class="item"><div class="grow"><b>' + esc(FOODS[f].n) + "</b><small>" + qtyLabel(f, g) + " · " + Math.round(FOODS[f].k * g / 100) + " kcal</small></div>" +
             stepper("q", mi + "." + fi, g, "") +
             '<button class="del" data-act="delfood" data-id="' + mi + "." + fi + '">✕</button></div>';
      });
      if (m.t.indexOf("Goûter") === 0) {
        h += '<div class="vars"><small>Remplacer par</small><div class="duo wrap">' +
             GOUTER_VARIANTS.map((v, vi) =>
               '<button class="tog' + (m.t.indexOf(v.n) > 0 ? " on" : "") + '" data-act="swapg" data-id="' + mi + "." + vi + '">' + v.n + "</button>").join("") +
             "</div></div>";
      }
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
       '<div class="grow"><small>Apurna aujourd\'hui, en pre-workout ou pendant l\'effort — Ergymag limité à 2 gélules. La barre Apurna du goûter ne compte pas.</small></div></div></div>';
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
  h += '<div class="row"><span>Poids</span>' + stepper("w", "", kg, " kg", 0.1) + "</div>" +
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
  S.stock = S.stock || {};
  let all = 0, stocked = [];
  Object.keys(L).forEach((r) => L[r].forEach((it) => { if (S.stock[it.f]) stocked.push(it); else all++; }));
  all += S.manual.length;
  const done = Object.keys(S.shop).filter((k) => S.shop[k] && !S.stock[k]).length;
  const manuelKeys = S.manual.map((m) => m.id);
  let h = '<div class="hero shop"><small>Lundi</small><h1>Liste de courses</h1>' +
          "<p>Calculée depuis ton plan : tous les repas du lundi matin au vendredi midi, goûters compris. Si tu changes une portion, la liste change aussi.</p>" +
          "<p>" + done + " sur " + all + " à acheter</p></div>";
  Object.keys(RAYONS).forEach((r) => {
    if (!L[r]) return;
    const items = L[r].filter((it) => !S.stock[it.f]);
    if (!items.length) return;
    h += "<h2>" + RAYONS[r] + '</h2><div class="card">';
    items.forEach((it) => {
      const on = S.shop[it.f];
      h += '<div class="line" data-act="shop" data-id="' + it.f + '">' + checkbox(on, "#9A6A0B") +
           '<span class="grow ' + (on ? "done" : "") + '">' + esc(it.n) + "</span><i>" + it.q + "</i>" +
           '<button class="tag" data-act="stock" data-id="' + it.f + '">j\'en ai</button></div>';
    });
    h += "</div>";
  });
  h += "<h2>Ajoutés à la main</h2>";
  if (S.manual.length) {
    h += '<div class="card">';
    S.manual.forEach((m) => {
      const on = S.shop[m.id];
      h += '<div class="line"><span data-act="shop" data-id="' + m.id + '">' + checkbox(on, "#9A6A0B") + "</span>" +
           '<span class="grow ' + (on ? "done" : "") + '" data-act="shop" data-id="' + m.id + '">' + esc(m.n) + "</span>" +
           (m.q ? "<i>" + esc(m.q) + "</i>" : "") +
           '<button class="del" data-act="delman" data-id="' + m.id + '">✕</button></div>';
    });
    h += "</div>";
  }
  if (V.tmp.addman) {
    h += '<div class="card pad"><input id="ma" placeholder="Article" value="' + esc(V.tmp.ma || "") + '">' +
         '<input id="mq" placeholder="Quantité (facultatif)" value="' + esc(V.tmp.mq || "") + '">' +
         '<button class="cta shop" data-act="saveman">Ajouter à la liste</button>' +
         '<button class="ghost" data-act="cancelman">Annuler</button></div>';
  } else {
    h += '<button class="ghost" data-act="addman">+ Ajouter un article</button>';
  }

  h += "<h2>Déjà chez moi</h2>";
  if (!stocked.length) {
    h += '<p class="note">Ce que tu ramènes de chez tes parents ou qu\'il te reste du placard : appuie sur « j\'en ai » à droite de la ligne. L\'aliment reste dans tes repas, il sort juste de la liste à acheter.</p>';
  } else {
    h += '<div class="card">';
    stocked.forEach((it) => {
      h += '<div class="line" data-act="stock" data-id="' + it.f + '">' + checkbox(true, "#8A8F99") +
           '<span class="grow done">' + esc(it.n) + "</span><i>" + it.q + "</i></div>";
    });
    h += "</div>";
  }
  return h + '<button class="ghost" data-act="resetshop">Vider la liste</button>';
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
  h += "<h2>Ajouter par code-barres</h2><div class=\"card pad\">" +
       '<input id="bc" inputmode="numeric" placeholder="Tape les chiffres sous le code-barres" value="' + esc(V.tmp.bc || "") + '">' +
       '<button class="cta" data-act="scan">Chercher dans Open Food Facts</button>' +
       (V.tmp.bcmsg ? '<p class="small">' + esc(V.tmp.bcmsg) + "</p>" : "") +
       '<p class="small">Base publique et gratuite, il faut du réseau. Le produit rejoint ton catalogue et tu peux corriger ses valeurs juste au-dessus.</p></div>';
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
  const ma = $("#ma"); if (ma && !ma.value) ma.focus();
  const bc = $("#bc"); if (bc && V.tmp.bcfocus) { bc.focus(); bc.setSelectionRange(bc.value.length, bc.value.length); }
}

/* ═════════ ÉVÉNEMENTS ═════════ */

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id, d = V.day;
  const sess = sessionFor(d) || {}, ex = sess.ex ? exList(sess).filter((x) => x.id === V.openEx)[0] : null;

  if (a === "tab") { V.tab = id; V.openEx = V.openMeal = V.picker = null; V.editFood = null; V.tmp = {}; }
  else if (a === "day") { V.day = id; V.openEx = V.openMeal = V.picker = null; V.tmp = {}; }
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
  else if (a === "openex") { V.openEx = V.openEx === id ? null : id; V.tmp = {}; }
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
    save(); V.openEx = null; V.tmp = {};
  }
  else if (a === "run.min+" || a === "run.min-") V.tmp.run.min = Math.max(5, V.tmp.run.min + (a.endsWith("+") ? 5 : -5));
  else if (a === "run.km+" || a === "run.km-") V.tmp.run.km = Math.max(0.5, Math.round((V.tmp.run.km + (a.endsWith("+") ? 0.5 : -0.5)) * 10) / 10);
  else if (a === "run.save") {
    const t = V.tmp.run, s = t.min * 60 / t.km;
    S.runs[dayStamp(d)] = { min: t.min, km: t.km, pace: Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0"), fast: s < 355 };
    save();
  }
  else if (a === "pw") {
    const k = dayStamp(d), on = !S.pw[k];
    S.pw[k] = on;
    S.extras[k] = (S.extras[k] || []).filter((e) => !e.pw);
    if (on) S.extras[k] = S.extras[k].concat([{ k:"apurnapw", g: FOODS.apurnapw.uG, pw: 1 }]);
    save();
  }
  else if (a === "swapg") {
    const [mi, vi] = id.split(".").map(Number), v = GOUTER_VARIANTS[vi];
    editPlan((p) => { p[d][mi].f = JSON.parse(JSON.stringify(v.f)); p[d][mi].t = "Goûter — " + v.n; });
  }
  else if (a === "propok") { accepter(propositions()[+id]); }
  else if (a === "propno") { refuser(propositions()[+id]); }
  else if (a === "propoff") { V.tmp.propsOff = 1; }
  else if (a === "mealdone") {
    const k = dayStamp(d); S.done[k] = S.done[k] || {};
    S.done[k][id] = !S.done[k][id]; save();
  }
  else if (a === "clore") { cloreSemaine(); }
  else if (a === "newweek") {
    if (!V.tmp.nw) { V.tmp.nw = 1; }
    else {
      cloreSemaine(); resetWeek();
      V.tmp = { nwmsg: "Planning type rétabli, courses et padels remis à zéro." };
    }
  }
  else if (a === "scan") {
    const code = (V.tmp.bc || "").replace(/\D/g, "");
    if (!code) { V.tmp.bcmsg = "Tape d'abord les chiffres du code-barres."; render(); return; }
    V.tmp.bcmsg = "Recherche…"; render();
    chercherCodeBarres(code, (id2, err) => {
      V.tmp.bcmsg = err || ("Ajouté : " + FOODS[id2].n + " — " + FOODS[id2].k + " kcal /100 g");
      if (!err) V.tmp.bc = "";
      render();
    });
    return;
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
  else if (a === "stock") { S.stock = S.stock || {}; S.stock[id] = !S.stock[id]; if (S.stock[id]) S.shop[id] = false; save(); }
  else if (a === "resetshop") { S.manual = S.manual.filter((m) => !S.shop[m.id]); S.shop = {}; S.stock = {}; save(); }
  else if (a === "addman") { V.tmp.addman = 1; V.tmp.ma = ""; V.tmp.mq = ""; }
  else if (a === "cancelman") { V.tmp.addman = 0; }
  else if (a === "saveman") {
    const n = (V.tmp.ma || "").trim();
    if (!n) { V.tmp.addman = 1; render(); return; }
    S.manual.push({ id: "m" + Date.now(), n, q: (V.tmp.mq || "").trim() });
    V.tmp.addman = 0; V.tmp.ma = ""; V.tmp.mq = ""; save();
  }
  else if (a === "delman") { S.manual = S.manual.filter((m) => m.id !== id); delete S.shop[id]; save(); }
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
  if (e.target.id === "bc") { V.tmp.bc = e.target.value; }
  if (e.target.id === "ma") { V.tmp.ma = e.target.value; }
  if (e.target.id === "mq") { V.tmp.mq = e.target.value; }
});

document.addEventListener("change", (e) => {
  const el = e.target; if (!el.dataset || !el.dataset.fld) return;
  const v = parseFloat(String(el.value).replace(",", ".")), fld = el.dataset.fld, id = el.dataset.id, d = V.day;
  if (isNaN(v) || v < 0) { render(); return; }
  if (fld === "q") { const [mi, fi] = id.split(".").map(Number); editPlan((p) => { p[d][mi].f[fi][1] = v; }); }
  else if (fld === "skg") V.tmp.kgs[+id] = v;
  else if (fld === "rep") V.tmp.reps[+id] = Math.round(v);
  else if (fld === "pg") V.tmp.pg = v;
  else if (fld === "w") V.tmp.w = v;
  else if (fld === "run.min") V.tmp.run.min = v;
  else if (fld === "run.km") V.tmp.run.km = v;
  else if (fld.indexOf("f.") === 0) {
    S.foodEdits[V.editFood] = Object.assign({}, S.foodEdits[V.editFood], { [fld[2]]: v });
    rebuild(); save();
  }
  render();
});

if (typeof window !== "undefined" && window.document && document.getElementById("main")) render();
