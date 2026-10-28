/* ═════════════════════════════════════════════════════════════════════
   ANATOMIE — corps humain dessiné en SVG, de face et de dos.

   Le corps est dessiné UNE fois. Chaque exercice déclare simplement
   quels muscles il recrute, et ceux-là s'allument en rouge :
     rouge vif  (--gym)  → muscles moteurs
     rouge pâle          → muscles secondaires, ceux qui stabilisent

   Tout est vectoriel et tient dans quelques Ko : pas de vidéo à héberger,
   pas d'image à télécharger, ça s'affiche hors ligne et instantanément.

   Convention de dessin : la demi-silhouette DROITE est tracée avec l'axe
   du corps en x=0, puis mirror() la duplique en miroir. Les muscles de
   l'axe médian (abdos, lombaires) sont tracés une seule fois.
   ═════════════════════════════════════════════════════════════════════ */

/* Noms affichés sous le schéma */
const MUSCLES = {
  pecto:   "Pectoraux",
  delt_a:  "Deltoïde antérieur",
  delt_l:  "Deltoïde latéral",
  delt_p:  "Deltoïde postérieur",
  biceps:  "Biceps",
  triceps: "Triceps",
  avbras:  "Avant-bras et grip",
  trap:    "Trapèzes",
  dorsaux: "Grand dorsal",
  rhomb:   "Rhomboïdes",
  lomb:    "Lombaires",
  abdos:   "Abdominaux",
  obliq:   "Obliques",
  fessiers:"Fessiers",
  quadri:  "Quadriceps",
  ischios: "Ischio-jambiers",
  adduct:  "Adducteurs",
  mollets: "Mollets",
};

/* Vue dans laquelle chaque muscle est visible : f = face, d = dos */
const MVUE = {
  pecto:"f", delt_a:"f", delt_l:"f", biceps:"f", abdos:"f", obliq:"f",
  quadri:"f", adduct:"f",
  delt_p:"d", triceps:"d", dorsaux:"d", rhomb:"d", lomb:"d",
  fessiers:"d", ischios:"d", trap:"d",
  avbras:"fd", mollets:"fd",
};
/* Les trapèzes se voient aussi de face (la pente du cou) : tracé à part */

/* ── Silhouette : demi-contour droit, axe du corps en x=0 ───────────── */

const SIL_CORPS =
 "M0 5C10.5 5 17 12.5 17 26C17 40.5 11 47 5 48.5L8.5 59" +
 "C20 62 32 66 40 74C44.5 78 46.5 86 45.5 96C44 104 40.5 108.5 37 112" +
 "C33.5 118 30.5 132 29 146C27.5 154 26.5 160 27 166" +
 "C28 174 31 182.5 33 192C34.5 200 34.5 206 33.5 214" +
 "C32.5 232 31 252 29.5 270C29 280 28 288 26.5 296" +
 "C25.5 304 25 312 24.5 320C24 332 22.5 346 20.5 358" +
 "C19.5 366 19 372 18.5 378L6.5 378L5.5 368" +
 "C5.5 348 5 328 4.5 308C4 294 3.5 284 3.2 274" +
 "C3 252 3 224 3 200L0 194Z";

const SIL_BRAS =
 "M32 78C40 74 47 79 49 90C51 104 50 122 48 140" +
 "C50 156 51.5 176 50 196C49 208 47.5 216 46 222" +
 "C44 230 42.5 238 41.5 244C40 248 36 249 34 246" +
 "C33 240 33.5 232 34 224C34.5 216 35 206 34.5 196" +
 "C33 176 32.5 156 34 140C32 122 31 100 32 78Z";

/* ── Muscles, vue de face ──────────────────────────────────────────── */

const MF = {
  trap:
   "M9.5 59.5C21 61.5 32 66 39.5 73.5C36 76 30 74 22 71.5" +
   "C16 69.5 12 68 10 67Z",
  delt_a:
   "M29 72C36 72 43 77 45.5 86C46.5 94 45 101 42 107" +
   "C38 103 34 95 31 86C29.5 80 29 75 29 72Z",
  delt_l:
   "M40 75C45 79 47 87 46 97C45.5 104 43.5 109 41.5 112" +
   "C44 103 45 92 43 83C42 79 41 76.5 40 75Z",
  pecto:
   "M3.5 71.5C14 70.5 25 72.5 32.5 78C37 82 38.5 89.5 36 96.5" +
   "C33 104 24.5 108 15.5 107C8.5 106 4.5 103.5 3.5 100Z",
  obliq:
   "M13 116C21 118 27 126 28.5 138C27 150 25.5 158 26 166" +
   "C24.5 174 20.5 178 15.5 178C12.5 174 13 164 14 150" +
   "C14.5 136 13.5 124 13 116Z",
  quadri:
   "M10 203C19 202 27 206 31.5 213C32.5 226 31.5 243 29.5 259" +
   "C28 271 26 281 23.5 289C18 293 12 292 9 288" +
   "C8 272 8.5 245 10 203Z",
  adduct:
   "M3.6 201C8 202 10.5 206 11.5 214C12 227 10.5 241 8.5 253" +
   "C7 261 5.5 265 4 265C3.6 243 3.6 219 3.6 201Z",
  biceps:
   "M35.5 93C40.5 91.5 45 95 46.5 103.5C47.5 116 46.5 129 44.5 140" +
   "C41.5 143.5 37.5 143 35.5 139.5C34.5 125 34.5 106 35.5 93Z",
  avbras:
   "M36 150C42 148 47 151 49 158C50.5 172 49.5 190 47 204" +
   "C43.5 208 39 207 37 203C35.5 186 35 166 36 150Z",
  mollets:
   "M6 300C14 298 21 302 24 310C25 322 23.5 336 20.5 348" +
   "C17 354 10 354 7 348C5.5 334 5.5 316 6 300Z",
};

/* Abdominaux : sur l'axe, tracés une seule fois */
const MF_ABDOS =
 "M-12 112C-4 110 4 110 12 112C13.5 128 13 146 11 162" +
 "C10 170 8 175 6 178C2 180-2 180-6 178" +
 "C-8 175-10 170-11 162C-13 146-13.5 128-12 112Z";
/* Lignes de séparation du grand droit, purement graphiques */
const MF_ABLIG = "M-11.5 128H11.5M-11 144H11M-9.5 160H9.5";

/* ── Muscles, vue de dos ───────────────────────────────────────────── */

const MD = {
  /* Le trapèze s'arrête avant le deltoïde. Tracé jusqu'à l'acromion comme
     en anatomie, il formait une cape qui recouvrait l'épaule dès qu'il
     était allumé, puisqu'un muscle actif passe au-dessus des autres. */
  trap:
   "M2.5 57C12 59 20 62.5 28 69C25.5 74.5 22 79 18.5 84" +
   "C14 91 9.5 104 6 119C4.5 133 3 142 2.5 146Z",
  delt_p:
   "M30 73C37 73 43.5 78 46 87C47 95 45.5 102 42.5 108" +
   "C39 104 35 96 32 87C30.5 81 30 76 30 73Z",
  rhomb:
   "M4.5 80C12.5 82.5 19.5 88 24.5 95C21.5 103.5 15.5 110 9.5 114.5" +
   "C6.5 112 5 103 4.5 92Z",
  dorsaux:
   "M34 112C37 120 37 132 34 142C30 154 23 164 16 172" +
   "C11 177 6 178 4.5 175C4 162 4 142 4.5 126" +
   "C5 120 8 116 12 114C20 111 29 110 34 112Z",
  triceps:
   "M35.5 91C40.5 89.5 45 93.5 46.5 102C47.5 116 46.5 129 44.5 140" +
   "C41.5 143.5 37.5 143 35.5 139.5C34.5 124 34.5 105 35.5 91Z",
  avbras:
   "M36 150C42 148 47 151 49 158C50.5 172 49.5 190 47 204" +
   "C43.5 208 39 207 37 203C35.5 186 35 166 36 150Z",
  fessiers:
   "M3.5 184C14 182 24 185 31 192C34 198 34.5 206 32.5 214" +
   "C29 222 21 227 13 227C7 226 4 223 3.5 219Z",
  ischios:
   "M5 228C14 226 24 228 31 234C32.5 246 31.5 262 29 276" +
   "C27 284 24 290 21 294C15 296 9 294 6.5 290" +
   "C5 272 4.5 248 5 228Z",
  mollets:
   "M6 300C14 298 22 302 25 311C26 324 24 338 20.5 349" +
   "C17 355 10 355 7 349C5.5 334 5.5 316 6 300Z",
};

/* Lombaires : sur l'axe */
const MD_LOMB =
 "M-10 148C-4 146 4 146 10 148C11.5 158 11 170 9 180" +
 "C4 184-4 184-9 180C-11 170-11.5 158-10 148Z";

/* ── Stries musculaires ────────────────────────────────────────────────
   Le sens des fibres de chaque muscle, en quelques traits. C'est ce qui
   fait la différence entre une tache de couleur et une planche
   d'anatomie : on lit dans quelle direction le muscle tire. Les traits
   débordent volontairement — ils sont découpés à la forme du muscle. */

const FIB_F = {
  pecto:   "M4 74C14 74 26 77 34 81M4 82C14 82 25 83.5 34 84.5M4 90C14 90 24 88 33 86M4 98C14 98 23 93 32 89",
  delt_a:  "M31 74C34 84 37 94 40 104M35 72C37 83 39 93 42 103M40 75C41 85 43 95 45 102",
  delt_l:  "M42 77C43 88 43 100 42 110M45 81C45 92 45 103 44 109",
  trap:    "M11 61C20 64 29 68 37 73M10 65C18 68 26 71 34 75",
  obliq:   "M13 119C18 127 24 136 29 143M13 133C18 141 23 150 27 158M13 147C17 155 21 162 25 169M14 161C17 167 20 172 23 177",
  quadri:  "M12 205C13 230 15 262 17 290M18 203C19 230 20 262 21 291M25 206C25 232 25 262 25 288M30 213C30 238 29 262 28 282",
  adduct:  "M6 203C6 222 6 246 6 264M9.5 205C9.5 222 9.5 242 9 258",
  biceps:  "M38 92C38 112 38 130 38 144M42 91C42 112 42 130 42 145M45.5 96C45.5 114 45.5 130 45 142",
  avbras:  "M39 151C39 170 39 190 39 205M43 150C43 170 43 190 43 206M46.5 156C46.5 174 46.5 190 46 202",
  mollets: "M10 301C10 318 10 336 10 350M15 299C15 318 15 338 15 352M20 304C20 320 20 336 20 347",
};

/* Grand droit : le refend central, plus les intersections horizontales */
const FIB_ABDOS = "M0 112V178M-11.5 128H11.5M-11 144H11M-9.5 160H9.5";

const FIB_D = {
  trap:    "M5 61C14 63 25 68 35 73M4 75C12 78 20 83 27 89M3.5 91C9 95 15 102 20 110M3 109C7 115 10 123 13 132M2.8 127C4 133 5 140 6 146",
  delt_p:  "M32 75C35 85 38 95 41 104M36 73C38 84 40 94 43 102M41 76C42 86 44 95 45 101",
  rhomb:   "M6 83C12 87 18 92 24 97M6 93C11 97 16 102 21 107M6 103C9 106 13 110 17 114",
  dorsaux: "M5.5 174C14 166 24 152 33 136M5 162C13 154 22 142 34 126M4.8 148C12 140 21 130 33 118M4.8 134C11 127 19 120 31 114M4.8 122C10 118 16 115 25 112",
  triceps: "M38 92C38 112 38 130 38 144M42 91C42 112 42 130 42 145M45.5 97C45.5 114 45.5 130 45 141",
  avbras:  "M39 151C39 170 39 190 39 205M43 150C43 170 43 190 43 206M46.5 156C46.5 174 46.5 190 46 202",
  fessiers:"M6 187C13 193 21 200 29 208M6 197C12 203 19 210 25 216M6 207C10 211 15 216 20 221M7 216C10 219 13 222 16 224",
  ischios: "M9 231C9 254 9 276 9 292M15 229C15 254 15 278 15 294M21 230C21 254 21 276 21 292M27 237C27 256 27 272 27 284",
  mollets: "M10 301C10 318 10 336 10 350M15 299C15 318 15 338 15 352M20 304C20 320 20 336 20 347",
};

/* Lombaires : fibres verticales de part et d'autre du rachis */
const FIB_LOMB = "M-6 148V182M6 148V182M0 146V184";

/* ── Rendu ─────────────────────────────────────────────────────────── */

/* Duplique une forme en miroir de l'autre côté de l'axe */
function mirror(d, cls) {
  const c = cls ? ' class="' + cls + '"' : "";
  return '<path' + c + ' d="' + d + '"/>' +
         '<path' + c + ' d="' + d + '" transform="scale(-1,1)"/>';
}

/* Un muscle : sa forme, puis ses fibres découpées à l'intérieur.
   Le découpage laisse les traits de fibres déborder dans le code sans
   jamais déborder à l'écran — bien plus simple que de les ajuster au
   contour à la main. */
function muscle(id, d, fib, cls) {
  let o = '<path class="' + cls + '" d="' + d + '"/>';
  if (fib) o += '<g clip-path="url(#cl_' + id + ')"><path class="fib" d="' + fib + '"/></g>';
  return o;
}

/* Duplique un bloc entier en miroir : la forme ET ses fibres, ET son
   découpage, qui suit la transformation. */
function mirrorG(inner) {
  return "<g>" + inner + '</g><g transform="scale(-1,1)">' + inner + "</g>";
}

/* Les dégradés et les découpes, déclarés une fois par schéma.
   Les dégradés sont en objectBoundingBox : chacun s'ajuste tout seul à la
   boîte du muscle qui l'utilise, ce qui donne le galbe sans avoir à
   positionner quoi que ce soit muscle par muscle. */
function defsAnat() {
  const grad = (id, c0, c1) =>
    '<radialGradient id="' + id + '" cx="0.38" cy="0.3" r="0.85">' +
      '<stop offset="0" stop-color="' + c0 + '"/>' +
      '<stop offset="1" stop-color="' + c1 + '"/>' +
    "</radialGradient>";

  let d = "<defs>" +
    grad("gRepos", "#E8E6DE", "#CFCCC1") +
    grad("gSec",   "#F6B6A6", "#DE8470") +
    grad("gPrim",  "#E8604A", "#B4301C") +
    "";

  /* Une découpe par muscle, face et dos confondus : les identifiants sont
     distincts puisque les deux vues ne partagent aucun muscle de forme. */
  Object.keys(MF).forEach((k) => {
    d += '<clipPath id="cl_f' + k + '"><path d="' + MF[k] + '"/></clipPath>';
  });
  Object.keys(MD).forEach((k) => {
    d += '<clipPath id="cl_d' + k + '"><path d="' + MD[k] + '"/></clipPath>';
  });
  d += '<clipPath id="cl_abdos"><path d="' + MF_ABDOS + '"/></clipPath>' +
       '<clipPath id="cl_lomb"><path d="' + MD_LOMB + '"/></clipPath>';
  return d + "</defs>";
}

/* Classe CSS d'un muscle selon qu'il est moteur, secondaire ou au repos */
function mcls(id, prim, sec) {
  return "mu" + (prim.indexOf(id) >= 0 ? " p" : sec.indexOf(id) >= 0 ? " s" : "");
}

/* Une silhouette complète. vue = "f" (face) ou "d" (dos) */
function figure(vue, prim, sec) {
  const M = vue === "f" ? MF : MD;
  /* Les deux moitiés sont tracées en miroir : le trait de contour se voit
     donc sur l'axe du corps. Un bandeau de la couleur du corps, posé par
     dessus du crâne au bassin, efface cette couture. Il s'arrête à l'entre-
     jambe pour laisser l'écart entre les deux jambes visible. */
  let o = '<g class="sil">' + mirror(SIL_CORPS) + mirror(SIL_BRAS) +
          '<rect class="axe" x="-2" y="6" width="4" height="192"/></g>';

  /* Ordre de tracé : des couches profondes vers les couches de surface.
     Les muscles de l'axe médian ferment la liste — ils occupent le creux
     laissé entre les deux moitiés et ne doivent pas être recouverts. */
  const ordre = vue === "f"
    ? ["trap", "pecto", "obliq", "quadri", "adduct", "delt_a", "delt_l", "biceps", "avbras", "mollets", "abdos"]
    : ["trap", "dorsaux", "rhomb", "fessiers", "ischios", "delt_p", "triceps", "avbras", "mollets", "lomb"];

  /* Les muscles se chevauchent (le rhomboïde mord sur le grand dorsal, le
     triceps sur le dorsal). Si on respectait l'ordre anatomique seul, un
     muscle AU REPOS dessiné par-dessus un muscle ACTIF viendrait y découper
     un trou gris. On trie donc par état — repos, puis secondaires, puis
     moteurs — en gardant l'ordre anatomique à l'intérieur de chaque groupe.
     Un muscle allumé est ainsi toujours au-dessus de la pile. */
  const rang = (id) => (prim.indexOf(id) >= 0 ? 2 : sec.indexOf(id) >= 0 ? 1 : 0);
  const couches = ordre.filter((id) => (id === "abdos" || id === "lomb") || M[id]);
  const FIB = vue === "f" ? FIB_F : FIB_D;
  const pre = vue === "f" ? "cl_f" : "cl_d";

  [0, 1, 2].forEach((r) => couches.forEach((id) => {
    if (rang(id) !== r) return;
    const c = mcls(id, prim, sec);
    if (id === "abdos")      o += muscle("abdos", MF_ABDOS, FIB_ABDOS, c);
    else if (id === "lomb")  o += muscle("lomb", MD_LOMB, FIB_LOMB, c);
    else                     o += mirrorG(muscle(pre.slice(3) + id, M[id], FIB[id], c));
  }));
  return o;
}

/* Le schéma complet : les deux vues côte à côte, plus la légende.
   prim / sec = tableaux d'identifiants de muscles. */
function schemaMuscles(prim, sec) {
  prim = prim || []; sec = sec || [];
  if (!prim.length && !sec.length) return "";

  const svg =
    '<svg class="anat" viewBox="0 0 252 400" aria-hidden="true">' + defsAnat() +
      '<g transform="translate(62,8)">' + figure("f", prim, sec) + "</g>" +
      '<g transform="translate(190,8)">' + figure("d", prim, sec) + "</g>" +
    "</svg>" +
    '<div class="anatvue"><span>Face</span><span>Dos</span></div>';

  /* Légende : les moteurs d'abord, puis les stabilisateurs */
  const nom = (id) => MUSCLES[id] || id;
  let leg = "";
  if (prim.length)
    leg += '<p class="anatleg"><i class="d p"></i>' +
           prim.map(nom).join(" · ") + "</p>";
  if (sec.length)
    leg += '<p class="anatleg"><i class="d s"></i>' +
           sec.map(nom).join(" · ") + "</p>";

  return '<div class="anatbox">' + svg + leg + "</div>";
}

/* ═════════════════════════════════════════════════════════════════════
   FICHE PAR EXERCICE

   p    = muscles moteurs            s = muscles stabilisateurs
   pdc  = le mouvement déplace le poids du corps, le lest ne fait que s'y
          ajouter : la courbe de progression doit l'inclure, sinon des
          tractions à vide donneraient une charge nulle
   tech = les points d'exécution qui changent le résultat
   secu = l'erreur qui blesse, et quoi faire à la place

   Les variantes héritent de leur exercice de base : seules celles dont
   le profil musculaire ou la technique changent vraiment ont leur entrée.
   ═════════════════════════════════════════════════════════════════════ */

const EXINFO = {

  /* ── Pectoraux et triceps ─────────────────────────────────────── */

  dch: { p:["pecto","delt_a","triceps"], s:["delt_l","avbras"],
    tech:["Omoplates serrées et basses, gardées ainsi du premier au dernier centimètre : c'est l'épaule qui se protège.",
          "Coudes à 45° du buste, jamais écartés à 90°.",
          "Descente contrôlée en 2 secondes, haltères au niveau des pectoraux, puis remontée franche.",
          "Pieds au sol, légère cambrure lombaire naturelle, fessiers en contact avec le banc."],
    secu:"Si l'épaule tire devant, c'est que les coudes partent trop larges ou que tu descends trop bas. Réduis l'amplitude avant de réduire la charge." },

  dch_bar: { p:["pecto","delt_a","triceps"], s:["delt_l","avbras"],
    tech:["Prise légèrement plus large que les épaules, poignets au-dessus des coudes.",
          "La barre descend au bas des pectoraux, pas sur la clavicule.",
          "Pousse le sol avec les pieds : la force part des jambes et traverse le buste.",
          "Pas de rebond sur la poitrine."],
    secu:"Toujours avec des arrêtoirs ou un pareur. Une barre coincée sur la cage est le seul accident grave de la salle." },

  dim: { p:["pecto","delt_a","triceps"], s:["delt_l"],
    tech:["Banc à 30°, pas plus : au-delà, c'est l'épaule qui travaille, plus le haut des pectoraux.",
          "Omoplates serrées, la barre descend haut sur la poitrine.",
          "Contrôle la descente, le guidage de la machine ne le fait pas pour toi."],
    secu:"Un banc trop incliné transforme le mouvement en développé épaules et use l'avant de l'épaule. Vérifie l'angle avant chaque série." },

  dips: { pdc:1, p:["pecto","triceps","delt_a"], s:["abdos"],
    tech:["Buste penché en avant pour cibler les pectoraux, buste droit pour les triceps.",
          "Descends jusqu'à ce que les bras forment un angle droit, pas plus bas.",
          "Épaules basses, éloignées des oreilles, pendant toute la série.",
          "Jambes gainées devant, le corps ne balance pas."],
    secu:"Descendre épaule plus bas que le coude met l'articulation en butée et abîme la capsule. L'amplitude s'arrête à l'angle droit." },

  poulieuni: { p:["pecto"], s:["delt_a","obliq"],
    tech:["Un pas en avant pour mettre le câble en tension dès le départ.",
          "Le coude reste légèrement fléchi et son angle ne change pas : c'est un écarté, pas une poussée.",
          "Amène la main jusqu'à l'axe du corps et serre une seconde."],
    secu:"Garde le bassin de face. Si le buste tourne pour aider, la charge est trop lourde." },

  tricorde: { p:["triceps"], s:["avbras"],
    tech:["Coudes collés au buste et immobiles : seuls les avant-bras bougent.",
          "Écarte la corde en fin de mouvement, bras tendus.",
          "Remonte en contrôlant, sans laisser la poulie te tirer."],
    secu:"Reculer d'un pas pour prendre plus lourd fait travailler le dos à la place des triceps. Reste près de la poulie." },

  triext: { p:["triceps"], s:["delt_a"],
    tech:["Coudes serrés vers l'avant et pointés vers le plafond.",
          "Descends derrière la nuque jusqu'à sentir l'étirement, sans douleur.",
          "Buste gainé, pas de cambrure compensatoire."],
    secu:"Position déjà exigeante pour l'épaule : échauffe-la avant, et abandonne la charge si tu dois cambrer pour la monter." },

  /* ── Dos et biceps ────────────────────────────────────────────── */

  tract: { pdc:1, p:["dorsaux","biceps"], s:["trap","rhomb","avbras","abdos"],
    tech:["Commence épaules basses : descends les omoplates avant de plier les bras.",
          "Tire les coudes vers les hanches, pas les mains vers la barre.",
          "Monte jusqu'à ce que le menton dépasse, descends bras presque tendus.",
          "Corps gainé, pas d'élan de jambes."],
    secu:"Lâcher complètement en bas met toute la charge sur la capsule de l'épaule. Garde une tension minimale dans le dos en position basse." },

  tract_sup: { p:["dorsaux","biceps"], s:["rhomb","avbras","abdos"],
    tech:["Prise supination largeur d'épaules, poignets neutres.",
          "Les biceps prennent une part plus grande qu'en pronation : la charge monte plus vite, la progression aussi.",
          "Coudes vers le bas et l'arrière."],
    secu:"Si les coudes sont sensibles, passe en prise marteau : la supination stricte charge beaucoup le tendon distal du biceps." },

  tirhor: { p:["dorsaux","rhomb"], s:["biceps","trap","lomb"],
    tech:["Buste fixe, vertical : si tu te balances d'avant en arrière, c'est le dos qui prend au lieu des dorsaux.",
          "Tire jusqu'au nombril, coudes le long du corps.",
          "Serre les omoplates une seconde en fin de tirage.",
          "Retour contrôlé, laisse les omoplates s'écarter sans arrondir le dos."],
    secu:"Dos arrondi sous charge en position avancée : c'est le disque qui encaisse. Garde la poitrine ouverte sur toute l'amplitude." },

  tirvert: { p:["dorsaux"], s:["biceps","trap","avbras"],
    tech:["Léger recul du buste, pas plus de 15°.",
          "Barre ou poignée amenée vers le haut de la poitrine.",
          "Épaules basses dès le début : ne laisse pas la charge te tirer vers le haut."],
    secu:"Jamais derrière la nuque : rotation externe forcée, risque pour la coiffe des rotateurs sans aucun bénéfice supplémentaire." },

  pullover: { p:["dorsaux"], s:["triceps","abdos"],
    tech:["Bras quasi tendus, coudes à peine fléchis et figés.",
          "Le mouvement part des épaules, pas des coudes.",
          "Buste légèrement penché, gainé, bassin stable."],
    secu:"Si tu sens l'épaule en fin d'étirement haut, réduis l'amplitude du haut, pas la charge." },

  curlbar: { p:["biceps"], s:["avbras"],
    tech:["Coudes devant les hanches et fixes.",
          "Pas de balancier : le buste reste droit du début à la fin.",
          "Contrôle la descente autant que la montée, c'est là que le muscle se construit."],
    secu:"La barre droite force la supination du poignet. Si les poignets tirent, passe à la barre EZ." },

  curlinc: { p:["biceps"], s:["avbras"],
    tech:["Dos plaqué au banc, bras pendants derrière le corps : c'est ce qui étire la longue portion.",
          "Ne monte pas trop haut, l'épaule ne doit pas avancer.",
          "Charges volontairement légères : c'est une position d'étirement, pas de force."],
    secu:"Position exigeante pour l'épaule et le coude. Échauffe-toi avec une série légère avant la première série effective." },

  curlmart: { p:["biceps","avbras"], s:[],
    tech:["Prise neutre, pouces vers le haut.",
          "Coudes fixes le long du corps.",
          "Travaille le brachial et le long supinateur : c'est ce qui épaissit le bras vu de profil."],
    secu:"Prise la plus douce pour le coude des trois curls. À privilégier si une tendinite se déclare." },

  /* ── Jambes ───────────────────────────────────────────────────── */

  squat: { p:["quadri","fessiers"], s:["ischios","adduct","lomb","abdos","mollets"],
    tech:["Pieds à largeur d'épaules, pointes légèrement ouvertes.",
          "Genoux dans l'axe des pieds, ils suivent la direction des orteils.",
          "Descends jusqu'à ce que la hanche passe sous le genou, si ta mobilité le permet sans que le bassin bascule.",
          "Gainage avant de descendre : inspire, bloque, descends, remonte, souffle en haut."],
    secu:"Le dos qui s'enroule en bas est le signal d'arrêt. Monte la charge seulement quand l'amplitude complète passe sans cette bascule." },

  squat_bar: { p:["quadri","fessiers"], s:["ischios","adduct","lomb","abdos","trap"],
    tech:["Barre posée sur les trapèzes, pas sur les cervicales.",
          "Coudes sous la barre, poitrine ouverte.",
          "La poussée part du milieu du pied.",
          "Même gainage que sur la machine, mais sans guidage : ta tolérance de charge est plus basse, c'est normal."],
    secu:"Toujours dans une cage avec les barres de sécurité réglées au niveau bas de ton squat. Sans cage, pas de squat barre lourd." },

  sdtjt: { p:["ischios","fessiers"], s:["lomb","trap","avbras"],
    tech:["Jambes presque tendues, genoux déverrouillés mais fixes.",
          "Le mouvement vient du bassin qui recule, pas du dos qui s'arrondit.",
          "Descends tant que le dos reste plat, et pas un centimètre de plus.",
          "La charge reste collée aux jambes."],
    secu:"L'exercice le plus facile à rater du programme. Si tu sens le bas du dos et pas l'arrière des cuisses, tu arrondis : réduis l'amplitude et la charge." },

  legext: { p:["quadri"], s:[],
    tech:["Axe de rotation de la machine aligné sur le genou.",
          "Tends complètement en haut et marque une seconde.",
          "Descente lente, ne laisse pas la charge retomber."],
    secu:"Charge lourde en extension complète : contrainte forte sur le tendon rotulien. Fourchette haute en répétitions, pas de lourd ici." },

  legcurl: { p:["ischios"], s:["mollets"],
    tech:["Bassin plaqué, il ne décolle pas du siège.",
          "Pointes de pieds tirées vers les tibias pour impliquer les mollets.",
          "Retour contrôlé jusqu'à l'étirement complet."],
    secu:"Le bassin qui décolle transfère la charge sur le bas du dos. Si ça arrive, c'est trop lourd." },

  hip: { p:["fessiers"], s:["ischios","abdos"],
    tech:["Haut du dos appuyé sur le banc, pieds à plat.",
          "En haut, le corps forme une ligne droite épaules-hanches-genoux, rien de plus.",
          "Rentre les côtes et serre les abdos : l'extension vient de la hanche, pas des lombaires.",
          "Serre les fessiers une seconde en haut."],
    secu:"Hyperextension lombaire en haut : première cause de douleur sur cet exercice. Le menton reste rentré, le regard devant, pas au plafond." },

  mollets: { p:["mollets"], s:[],
    tech:["Amplitude complète : talons bas sous le niveau de la marche, puis montée maximale sur la pointe.",
          "Une seconde d'arrêt en bas, une seconde en haut.",
          "Genoux tendus pour cibler le jumeau, fléchis pour le soléaire."],
    secu:"Les mollets répondent à la fréquence et à l'amplitude, pas à la charge. Charge trop lourde et tu ne fais que rebondir." },

  /* ── Épaules et abdominaux ────────────────────────────────────── */

  dm: { p:["delt_a","delt_l","triceps"], s:["trap","abdos","lomb"],
    tech:["Serre les fessiers et les abdos avant de pousser : c'est ce qui empêche le dos de se cambrer.",
          "La barre passe près du visage et finit au-dessus du milieu de la tête.",
          "Trajectoire verticale, pas vers l'avant.",
          "Coudes légèrement devant la barre au départ."],
    secu:"La cambrure lombaire sous charge est le vrai danger du développé militaire. Si tu dois cambrer, la charge est trop lourde." },

  elevlat: { p:["delt_l"], s:["trap"],
    tech:["Monte jusqu'à l'horizontale, pas au-dessus.",
          "Coudes légèrement plus hauts que les mains, comme si tu versais une carafe.",
          "Épaules basses, les trapèzes ne doivent pas prendre le relais.",
          "Descente lente : c'est 80 % du travail."],
    secu:"Monter au-dessus de l'horizontale fait frotter le tendon sous l'acromion. C'est le geste qui crée les tendinites d'épaule." },

  elevlat_h: { p:["delt_l"], s:["trap"],
    tech:["Même consigne qu'à la poulie, mais la tension disparaît en bas : ne t'arrête pas complètement entre deux répétitions.",
          "Buste très légèrement penché en avant.",
          "Pas d'élan de jambes."],
    secu:"Deux kilos d'écart sur des haltères légers, c'est 25 % de charge. Progresse en répétitions avant de changer d'haltère." },

  arriere: { p:["delt_p","rhomb"], s:["trap"],
    tech:["Poitrine en contact avec le coussin, elle ne décolle pas.",
          "Tire avec les coudes, mains relâchées : les mains ne sont que des crochets.",
          "Serre les omoplates en fin de mouvement.",
          "Amplitude complète, charge légère."],
    secu:"Tirer avec les mains transforme l'exercice en travail de biceps et laisse l'arrière d'épaule au repos. Pense coudes." },

  elevfront: { p:["delt_a"], s:["delt_l","abdos"],
    tech:["Monte à hauteur d'yeux, pas plus haut.",
          "Buste immobile, pas de balancier.",
          "Alterne les bras pour mieux contrôler."],
    secu:"L'avant de l'épaule travaille déjà sur tous tes développés. Charge légère, sinon tu ajoutes de la fatigue sans bénéfice." },

  shrugs: { p:["trap"], s:["avbras"],
    tech:["Monte les épaules vers les oreilles, en ligne droite.",
          "Pas de rotation des épaules : c'est inutile et ça use l'articulation.",
          "Marque un temps en haut."],
    secu:"La nuque reste neutre. Ne tends pas le cou vers l'avant pour aider." },

  levjambes: { p:["abdos"], s:["obliq","quadri","avbras"],
    tech:["Le mouvement commence par la bascule du bassin, pas par la montée des jambes.",
          "Pas de balancement : si tu oscilles, marque un temps d'arrêt en bas.",
          "Épaules basses et actives, le corps ne pend pas mollement."],
    secu:"Le balancement met le bas du dos en contrainte à chaque retour. Mieux vaut six répétitions strictes que douze balancées." },

  crunch: { p:["abdos"], s:["obliq"],
    tech:["Enroule la colonne vertèbre par vertèbre, le bassin ne bouge pas.",
          "Le mouvement est court : c'est un enroulement, pas une flexion de hanche.",
          "Souffle en fin de contraction."],
    secu:"Si tu tires sur la nuque avec la corde, pose les mains sur les tempes et réduis la charge." },

  obliques: { p:["obliq"], s:["abdos","avbras"],
    tech:["Un seul haltère à la fois, l'autre main sur la tempe.",
          "Flexion latérale pure : le buste ne tourne pas et ne part pas en avant.",
          "Amplitude modérée, contrôle total."],
    secu:"Charge lourde en flexion latérale répétée : contrainte sur les disques lombaires. Reste léger, en répétitions hautes." },

  /* ── Force du vendredi ────────────────────────────────────────── */

  muscleup: { p:["dorsaux","pecto","triceps","biceps"], s:["delt_a","trap","abdos","avbras"],
    tech:["Prise pouces par-dessus la barre : c'est ce qui permet la bascule des poignets.",
          "Tirée explosive, la barre doit arriver au bas des pectoraux, pas au menton.",
          "Au point haut de la tirée, bascule les poignets et passe les coudes devant.",
          "Termine par un dips : pousse jusqu'aux bras tendus."],
    secu:"Geste technique avant d'être un geste de force, et c'est pour ça qu'il est en début de séance. Fatigué, on ne l'apprend pas, on le rate et on se rattrape mal. Si la tirée n'atteint pas le bas des pectoraux, reste à l'élastique." },

  sdt: { p:["ischios","fessiers","lomb"], s:["trap","dorsaux","quadri","avbras","abdos"],
    tech:["Barre contre les tibias au départ, milieu du pied sous la barre.",
          "Gaine et verrouille le dos AVANT que la barre décolle : dos plat, poitrine ouverte, dorsaux serrés.",
          "Pousse le sol avec les jambes, la barre reste collée aux jambes tout du long.",
          "Verrouille hanches et genoux en haut sans cambrer en arrière."],
    secu:"L'exercice où une seule mauvaise répétition coûte des semaines. Si le dos s'arrondit au décollage, la série est finie : tu reposes et tu réduis. Pas de négociation là-dessus." },

  dcbar: { p:["pecto","triceps","delt_a"], s:["delt_l","abdos","avbras"],
    tech:["Omoplates serrées et basses, pieds ancrés au sol.",
          "La barre descend au bas des pectoraux, coudes à 45°.",
          "En force, chaque répétition repart de l'arrêt : pas de rebond.",
          "Si les quatre séries ne font pas cinq répétitions, la charge ne bouge pas."],
    secu:"Arrêtoirs réglés ou pareur, systématiquement. Avec une barre chargée, il n'y a pas d'autre option." },

  tract_f: { pdc:1, p:["dorsaux","biceps"], s:["trap","rhomb","avbras","abdos"],
    tech:["Ceinture de lest serrée haut sur les hanches pour éviter le balancement.",
          "Mêmes consignes qu'aux tractions à vide : omoplates d'abord, coudes vers les hanches.",
          "Amplitude complète malgré la charge : menton au-dessus de la barre, bras presque tendus en bas."],
    secu:"Le lest amplifie la traction sur l'épaule en position basse. Descends toujours en contrôlant, ne te laisse jamais tomber." },

  dips_f: { pdc:1, p:["pecto","triceps","delt_a"], s:["abdos","avbras"],
    tech:["Même amplitude qu'à vide : coudes à l'angle droit, pas plus bas.",
          "Le lest accentue la tendance à partir en avant : garde le buste stable.",
          "Épaules basses pendant toute la série."],
    secu:"Lesté, descendre trop bas est le geste qui déclenche les douleurs à l'avant de l'épaule. L'amplitude ne s'allonge pas quand la charge monte." },

  fentes: { p:["quadri","fessiers"], s:["ischios","adduct","abdos","mollets","avbras"],
    tech:["Le genou arrière descend vers le sol à la verticale, il ne part pas en avant.",
          "Buste droit, gainé, le regard devant.",
          "Pas assez long pour que le genou avant reste au-dessus de la cheville.",
          "Transfert direct vers le sled et le farmers de l'Hyrox."],
    secu:"Genou avant qui part vers l'intérieur : c'est le signe que le fessier ne tient pas. Ralentis et réduis la charge avant que ça devienne une habitude." },

  roue: { p:["abdos"], s:["obliq","dorsaux","delt_a"],
    tech:["Bassin rétroversé, bas du dos arrondi, et il reste ainsi tout du long.",
          "Déroule seulement jusqu'où tu peux revenir sans que le dos se creuse.",
          "Mouvement lent dans les deux sens."],
    secu:"Le dos qui se creuse en position allongée met tout le poids du corps sur les lombaires. Mieux vaut cinq répétitions courtes que huit complètes mal tenues." },

  gainage: { p:["abdos"], s:["obliq","delt_a","fessiers","lomb"],
    tech:["Coudes sous les épaules, corps en ligne droite des talons à la tête.",
          "Serre les fessiers et rentre les côtes : c'est ce qui empêche le bassin de tomber.",
          "Respire normalement, ne bloque pas."],
    secu:"Dès que le bassin s'affaisse, le temps ne compte plus et le bas du dos encaisse. Arrête la série à ce moment-là, même avant l'objectif." },

  /* ── Séance bonus ─────────────────────────────────────────────── */

  b_oiseaux: { p:["delt_p"], s:["rhomb","trap"],
    tech:["Buste penché à l'horizontale, dos plat.",
          "Coudes légèrement fléchis et fixes, ouvre avec les coudes.",
          "Monte jusqu'à l'horizontale, pas au-delà.",
          "Charge légère, c'est un muscle qu'on travaille en précision."],
    secu:"Dos plat impératif en position penchée. Si tu ne tiens pas la position, fais-le buste appuyé sur un banc incliné." },

  b_rotext: { p:["delt_p"], s:["trap"],
    tech:["Coude collé au buste, serviette roulée sous l'aisselle si besoin.",
          "Rotation lente de l'avant-bras vers l'extérieur, l'épaule ne bouge pas.",
          "Volontairement léger : c'est de l'assurance sur l'épaule, pas du travail de force."],
    secu:"Prendre lourd ici ne renforce rien et irrite la coiffe. Si tu dois bouger le coude pour y arriver, c'est trop." },

  b_mollets: { p:["mollets"], s:[],
    tech:["Sur une marche, une jambe à la fois.",
          "Deux secondes en position basse, étirement complet.",
          "Monte le plus haut possible sur la pointe."],
    secu:"Appuie-toi à un mur pour l'équilibre : tu dois penser au mollet, pas à ne pas tomber." },

  b_hang: { p:["avbras"], s:["dorsaux","trap","delt_l"],
    tech:["Suspension bras tendus, épaules actives et non relâchées.",
          "Respire calmement, ne bloque pas.",
          "Travaille le grip et décomprime la colonne sans retaper sur les tractions."],
    secu:"Garde une légère activation des épaules. Pendre complètement relâché tire sur la capsule." },

  /* nomuscle : travail global, aucun muscle à mettre en avant sur le schéma */
  b_mob: { p:[], s:[], nomuscle:1,
    tech:["Hanches, ischios, épaules : les trois zones que ton programme raccourcit.",
          "Positions tenues 45 à 60 secondes, pas de ressorts.",
          "Respire : c'est la respiration qui relâche, pas la force."],
    secu:"L'étirement doit tirer, jamais piquer. Une douleur vive signifie qu'il faut reculer." },

  /* ── Exercices hors séance type ───────────────────────────────── */

  dim_lourd: { p:["pecto","delt_a","triceps"], s:["delt_l","abdos"],
    tech:["Banc à 30°, omoplates serrées.",
          "Fourchette basse en répétitions : c'est le mouvement principal de la semaine B.",
          "Descente contrôlée, pas de rebond."],
    secu:"Même règle que sur le développé incliné normal : si l'épaule tire devant, l'angle du banc est trop ouvert." },

  pecfly: { p:["pecto"], s:["delt_a"],
    tech:["Centres de rotation à hauteur du milieu de la poitrine.",
          "Coude fixe, l'angle ne change pas pendant le mouvement.",
          "Amène les mains jusqu'à la ligne médiane et serre."],
    secu:"Ne cherche pas l'étirement maximal en position ouverte sous charge : c'est la position la plus vulnérable pour l'épaule." },

  rowing: { p:["dorsaux","rhomb"], s:["biceps","lomb","trap","avbras"],
    tech:["Buste penché à 45°, dos plat, gainé.",
          "Tire vers le nombril, coudes le long du corps.",
          "Le buste ne se redresse pas pour aider."],
    secu:"Position penchée sous charge : le dos doit rester plat du début à la fin de la série. Dès qu'il s'arrondit, la série est finie." },

  facepull: { p:["delt_p","rhomb"], s:["trap","biceps"],
    tech:["Poulie à hauteur de visage.",
          "Tire la corde vers le front en écartant les mains, coudes hauts.",
          "Finis en rotation externe, pouces vers l'arrière.",
          "Léger, en répétitions hautes."],
    secu:"Le meilleur exercice préventif pour l'épaule du programme, à condition de rester léger. Lourd, il perd tout son intérêt." },

  gainlat: { p:["obliq"], s:["abdos","delt_l","fessiers"],
    tech:["Coude sous l'épaule, corps en ligne droite.",
          "Hanche haute, ne laisse pas le bassin descendre.",
          "Même temps des deux côtés."],
    secu:"Si l'épaule d'appui fatigue avant les obliques, passe en appui sur le genou plutôt que de tenir en mauvaise position." },

  hip2: { p:["fessiers"], s:["ischios","abdos"],
    tech:["Mêmes consignes que le hip thrust du mercredi.",
          "Ligne droite épaules-hanches-genoux en haut.",
          "Côtes rentrées, pas de cambrure."],
    secu:"L'hyperextension en haut est l'erreur à surveiller. Menton rentré, regard devant." },

  /* ── Poids du corps ───────────────────────────────────────────── */

  pompes: { p:["pecto","triceps","delt_a"], s:["abdos","obliq"], pdc:1,
    tech:["Mains juste plus larges que les épaules, doigts vers l'avant.",
          "Corps d'un seul bloc : talons, bassin et épaules alignés.",
          "Coudes à 45° du corps, jamais écartés en croix.",
          "Poitrine jusqu'à un poing du sol, puis on repousse."],
    secu:"Le bassin qui s'affaisse met tout dans le bas du dos. Si la ligne casse, passe sur les genoux et garde la ligne." },

  pompes_dec: { p:["pecto","delt_a","triceps"], s:["abdos","obliq"], pdc:1,
    tech:["Pieds sur une chaise ou une marche, mains au sol.",
          "Plus les pieds sont hauts, plus le travail monte vers le haut des pectoraux et l'épaule.",
          "Même gainage que les pompes classiques."],
    secu:"Monte la hauteur progressivement. Trop haut d'un coup, c'est l'épaule qui encaisse." },

  pompes_gen: { p:["pecto","triceps","delt_a"], s:["abdos"], pdc:1,
    tech:["Genoux au sol, chevilles croisées, bassin à peine fléchi.",
          "La ligne genoux-bassin-épaules reste droite.",
          "Même amplitude que les pompes complètes : la poitrine descend bas."],
    secu:"Ce n'est pas une version au rabais, c'est la version qui permet de travailler l'amplitude complète." },

  dips_banc: { p:["triceps","pecto"], s:["delt_a"], pdc:1,
    tech:["Mains sur l'appui derrière toi, doigts vers l'avant.",
          "Coudes vers l'arrière, pas sur les côtés.",
          "Descends jusqu'à 90° au coude, pas plus bas.",
          "Jambes tendues pour durcir, pliées pour alléger."],
    secu:"Descendre trop bas écrase l'avant de l'épaule. Arrête-toi à l'angle droit." },

  pompes_pike: { p:["delt_a","delt_l","triceps"], s:["trap","abdos"], pdc:1,
    tech:["Pieds et mains au sol, bassin le plus haut possible : le corps fait un V.",
          "La tête descend entre les mains, pas devant.",
          "Plus les pieds sont proches des mains, plus c'est vertical et plus c'est dur."],
    secu:"Garde la nuque longue. Si le cou travaille plus que l'épaule, recule les pieds." },

  rowing_aus: { p:["dorsaux","rhomb","biceps"], s:["trap","delt_p","abdos","avbras"], pdc:1,
    tech:["Sous une barre basse ou une table solide, corps gainé, talons au sol.",
          "On tire la poitrine vers la barre, pas le menton.",
          "Omoplates serrées en haut, une seconde.",
          "Pour durcir : pieds plus loin, ou pieds surélevés."],
    secu:"Vérifie la solidité de l'appui avant de te suspendre dessous. Le bassin ne doit jamais traîner." },

  superman: { p:["lomb"], s:["fessiers","trap"],
    tech:["À plat ventre, bras devant.",
          "On décolle buste et cuisses de quelques centimètres seulement.",
          "On tient une seconde en haut, on redescend lentement.",
          "Le regard reste vers le sol."],
    secu:"L'amplitude est volontairement courte. Décoller trop haut comprime le bas du dos au lieu de le renforcer." },

  squat_pdc: { p:["quadri","fessiers"], s:["ischios","adduct","abdos","mollets"], pdc:1,
    tech:["Pieds largeur d'épaules, pointes légèrement ouvertes.",
          "On s'assoit en arrière, poitrine haute.",
          "Cuisses au moins à l'horizontale, plus bas si les hanches le permettent.",
          "Poussée dans tout le pied, talons qui ne décollent pas."],
    secu:"Les genoux suivent la direction des pointes de pied. S'ils rentrent vers l'intérieur, ralentis et réduis l'amplitude." },

  squat_bul: { p:["quadri","fessiers"], s:["ischios","adduct","abdos"], pdc:1,
    tech:["Pied arrière posé sur une chaise, pied avant assez loin devant.",
          "On descend à la verticale, le genou arrière vers le sol.",
          "Le poids reste sur la jambe avant : la jambe arrière équilibre, elle ne pousse pas.",
          "Buste légèrement penché pour chercher le fessier."],
    secu:"Trouve ta distance à vide avant de charger quoi que ce soit. Trop près, le genou avant dépasse et tire." },

  fentes_pdc: { p:["quadri","fessiers"], s:["ischios","adduct","abdos","mollets"], pdc:1,
    tech:["Grand pas en avant, buste droit.",
          "Genou arrière qui descend vers le sol sans le toucher.",
          "Le genou avant reste au-dessus de la cheville.",
          "Poussée dans le talon avant pour remonter."],
    secu:"Si l'équilibre manque, tiens-toi à un mur du bout des doigts plutôt que de raccourcir le pas." },

  pont: { p:["fessiers"], s:["ischios","lomb","abdos"], pdc:1,
    tech:["Dos au sol, talons près des fesses.",
          "On pousse dans les talons, bassin vers le plafond.",
          "Ligne droite épaules-hanches-genoux en haut, on serre les fessiers une seconde.",
          "Côtes rentrées : c'est le fessier qui monte le bassin, pas le bas du dos."],
    secu:"Si tu sens le bas du dos plutôt que le fessier, monte moins haut et rentre davantage le bassin." },

  pont_uni: { p:["fessiers"], s:["ischios","lomb","abdos","obliq"], pdc:1,
    tech:["Même position, une jambe tendue ou genou ramené vers la poitrine.",
          "Le bassin reste horizontal : il ne part pas en vrille du côté libre.",
          "Deux fois moins de répétitions, deux fois plus de travail par côté."],
    secu:"Le bassin qui bascule d'un côté est le signal d'arrêt : reviens à deux jambes." },

  chaise: { p:["quadri"], s:["fessiers","abdos"], pdc:1,
    tech:["Dos plaqué au mur, cuisses à l'horizontale, genoux à 90°.",
          "Pieds à plat, poids réparti sur tout le pied.",
          "On tient le temps prévu, on respire normalement."],
    secu:"Exercice isométrique : la brûlure est normale, une douleur dans le genou ne l'est pas. Remonte un peu le bassin si c'est le cas." },

  sdt_pause: { p:["ischios","fessiers","lomb"], s:["trap","dorsaux","quadri","avbras"],
    tech:["Une seconde d'arrêt complet sous le genou, barre immobile.",
          "La pause révèle les défauts de position : si le dos bouge pendant l'arrêt, la charge est trop lourde.",
          "Charges volontairement basses par rapport au soulevé classique."],
    secu:"Exercice de contrôle, pas de performance. Le but est justement de ne pas pouvoir tricher." },
};

/* Exercices qui sont le MÊME mouvement qu'un autre, mais dont la charge est
   suivie séparément (le curl marteau léger du bonus contre celui du mardi).
   Même geste, même technique, même anatomie : une seule fiche pour les deux. */
const EXALIAS = {
  b_curlmart: "curlmart",
};

/* Fiche d'un exercice, avec repli sur l'exercice de base pour les variantes */
function fiche(ex) {
  if (!ex) return null;
  return EXINFO[ex.id] ||
         (EXALIAS[ex.id] ? EXINFO[EXALIAS[ex.id]] : null) ||
         (ex.base ? EXINFO[ex.base] : null) ||
         (ex.base && EXALIAS[ex.base] ? EXINFO[EXALIAS[ex.base]] : null) ||
         null;
}
