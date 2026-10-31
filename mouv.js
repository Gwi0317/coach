/* ═════════════════════════════════════════════════════════════════════
   MOUVEMENT — la trajectoire exacte de chaque exercice, animée.

   Une figure articulée vue de profil, qui déroule l'exercice en boucle :
   descente, remontée. Ce n'est pas une vidéo — c'est mieux pour un
   téléphone : quelques Ko, aucun fichier à héberger, ça tourne hors
   ligne et la trajectoire est exacte au degré près plutôt qu'approximée
   par un cadrage de caméra.

   Comment ça marche :
     — le corps est une chaîne d'articulations emboîtées (bassin → tronc
       → épaule → coude, bassin → cuisse → genou → cheville) ;
     — une POSE est une liste d'angles, un SCHÉMA MOTEUR est deux poses ;
     — l'animation interpole de l'une à l'autre et revient, en SMIL, donc
       sans une ligne de JavaScript qui tourne en continu.

   Le point d'ancrage est ce qui rend le geste crédible : dans un squat
   ce sont les pieds qui ne bougent pas, dans une traction ce sont les
   mains. On calcule donc la position du bassin à chaque pose pour que le
   point ancré reste immobile, au lieu de voir les pieds décoller.
   ═════════════════════════════════════════════════════════════════════ */

/* Longueurs des segments, cohérentes avec la silhouette d'anat.js */
const SEG = { tronc:62, cou:15, tete:11, bras:40, avbras:36, cuisse:48, tibia:46, pied:20 };

/* Convention d'angles, en degrés, pour que l'écriture des poses soit
   lisible : partout, un angle POSITIF va vers l'avant du corps, sauf le
   genou où il mesure la flexion. La figure regarde vers la droite. */
const POSE0 = { tronc:0, tete:0, epaule:0, coude:0, hanche:0, genou:0, cheville:0 };

const rad = (d) => d * Math.PI / 180;
/* Rotation SVG : y vers le bas, angle positif dans le sens horaire */
function rot(p, a) {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}
const add = (a, b) => ({ x:a.x + b.x, y:a.y + b.y });

/* Cinématique directe : où se trouve chaque point, bassin à l'origine.
   Reproduit exactement l'emboîtement des transformations du SVG — si les
   deux divergeaient, l'ancrage serait faux et la figure glisserait. */
function fk(P) {
  const p = Object.assign({}, POSE0, P);
  const epaule  = rot({ x:0, y:-SEG.tronc }, p.tronc);
  const brasV   = rot({ x:0, y:SEG.bras }, p.tronc - p.epaule);
  const coude   = add(epaule, brasV);
  const avbrasV = rot({ x:0, y:SEG.avbras }, p.tronc - p.epaule - p.coude);
  const main    = add(coude, avbrasV);
  const tete    = add(epaule, rot({ x:0, y:-SEG.cou - SEG.tete }, p.tronc + p.tete));

  const cuisseV = rot({ x:0, y:SEG.cuisse }, -p.hanche);
  const genou   = cuisseV;
  const tibiaV  = rot({ x:0, y:SEG.tibia }, -p.hanche + p.genou);
  const cheville = add(genou, tibiaV);
  const pied    = add(cheville, rot({ x:SEG.pied, y:0 }, -p.hanche + p.genou - p.cheville));

  return { epaule, coude, main, tete, genou, cheville, pied };
}

/* ── Schémas moteurs ───────────────────────────────────────────────────
   Deux poses par schéma : la position haute (ou de départ) et la position
   basse (ou d'arrivée). anc = le point qui reste immobile. mat = ce qu'on
   dessine dans les mains ou dans le décor.                              */

const MOUV = {
  squat: { n:"Squat", anc:"cheville", mat:"barre_dos", sol:1, dur:3.4,
    a:{ tronc:5,  hanche:0,  genou:2,  cheville:2,  epaule:-22, coude:122 },
    b:{ tronc:26, hanche:74, genou:88, cheville:22, epaule:-22, coude:122 } },

  presse: { n:"Presse", anc:"cheville", mat:"", sol:1, dur:3.2,
    a:{ tronc:4,  hanche:4,  genou:6,  cheville:4,  epaule:10, coude:30 },
    b:{ tronc:10, hanche:86, genou:100, cheville:22, epaule:10, coude:30 } },

  charniere: { n:"Charnière de hanche", anc:"cheville", mat:"barre_mains", sol:1, dur:3.4,
    a:{ tronc:4,  hanche:2,  genou:4,  cheville:2,  epaule:0, coude:4 },
    b:{ tronc:72, hanche:62, genou:34, cheville:12, epaule:0, coude:4 } },

  sdtjt: { n:"Jambes tendues", anc:"cheville", mat:"barre_mains", sol:1, dur:3.4,
    a:{ tronc:4,  hanche:2,  genou:6,  cheville:2,  epaule:0, coude:4 },
    b:{ tronc:80, hanche:76, genou:12, cheville:6,  epaule:0, coude:4 } },

  fente: { n:"Fente", anc:"cheville", mat:"halteres", sol:1, dur:3.4,
    a:{ tronc:6,  hanche:0,  genou:4,  cheville:2,  epaule:0, coude:6 },
    b:{ tronc:12, hanche:62, genou:92, cheville:20, epaule:0, coude:6 } },

  pousse_v: { n:"Poussée verticale", anc:"cheville", mat:"barre_mains", sol:1, dur:3.0,
    a:{ tronc:2, hanche:0, genou:4, cheville:2, epaule:96,  coude:96 },
    b:{ tronc:2, hanche:0, genou:4, cheville:2, epaule:166, coude:4 } },

  eleve_lat: { n:"Élévation", anc:"cheville", mat:"halteres", sol:1, dur:3.0,
    a:{ tronc:3, hanche:0, genou:4, cheville:2, epaule:4,  coude:12 },
    b:{ tronc:3, hanche:0, genou:4, cheville:2, epaule:88, coude:12 } },

  curl: { n:"Curl", anc:"cheville", mat:"halteres", sol:1, dur:2.8,
    a:{ tronc:3, hanche:0, genou:4, cheville:2, epaule:2, coude:8 },
    b:{ tronc:3, hanche:0, genou:4, cheville:2, epaule:6, coude:138 } },

  tri_ext: { n:"Extension triceps", anc:"cheville", mat:"corde", sol:1, dur:2.8,
    a:{ tronc:8, hanche:0, genou:4, cheville:2, epaule:-10, coude:96 },
    b:{ tronc:8, hanche:0, genou:4, cheville:2, epaule:-10, coude:8 } },

  tire_h: { n:"Tirage horizontal", anc:"cheville", mat:"poignee", sol:1, dur:3.0,
    a:{ tronc:16, hanche:34, genou:28, cheville:8, epaule:72, coude:10 },
    b:{ tronc:4,  hanche:28, genou:26, cheville:6, epaule:16, coude:104 } },

  tire_v: { n:"Tirage vertical", anc:"main", mat:"barre_fixe", dur:3.2,
    a:{ tronc:2, hanche:4,  genou:16, cheville:0, epaule:172, coude:4 },
    b:{ tronc:8, hanche:10, genou:28, cheville:0, epaule:134, coude:112 } },

  dips: { n:"Dips", anc:"main", mat:"barres_para", dur:3.0, ancY:104,
    a:{ tronc:10, hanche:16, genou:52, cheville:0, epaule:-4, coude:2 },
    b:{ tronc:20, hanche:16, genou:52, cheville:0, epaule:-30, coude:86 } },

  pousse_h: { n:"Poussée allongée", anc:"fixe", mat:"barre_mains", banc:1, dur:3.0,
    ancX:58, ancY:148,
    a:{ tronc:90, hanche:-12, genou:74, cheville:-14, epaule:-90, coude:2 },
    b:{ tronc:90, hanche:-12, genou:74, cheville:-14, epaule:-58, coude:72 } },

  pompes: { n:"Pompes", anc:"fixe", mat:"", sol:1, dur:3.0, ancX:128, ancY:166,
    a:{ tronc:-90, hanche:92, genou:2, cheville:30, epaule:-90, coude:0 },
    b:{ tronc:-90, hanche:92, genou:2, cheville:30, epaule:-56, coude:62 } },

  gainage: { n:"Gainage", anc:"fixe", mat:"", sol:1, dur:4.0, ancX:128, ancY:180,
    a:{ tronc:-90, hanche:92, genou:2, cheville:30, epaule:-74, coude:76 },
    b:{ tronc:-87, hanche:92, genou:2, cheville:30, epaule:-74, coude:80 } },

  abdos: { n:"Abdominaux", anc:"main", mat:"barre_fixe", dur:3.2,
    a:{ tronc:2, hanche:4,  genou:10, cheville:0, epaule:176, coude:2 },
    b:{ tronc:6, hanche:92, genou:16, cheville:0, epaule:176, coude:2 } },

  /* À genoux, poulie haute : ce sont les abdos qui enroulent le buste,
     pas la hanche qui plie. La hanche reste donc fixe. */
  crunch: { n:"Crunch", anc:"cheville", mat:"corde", sol:1, dur:2.8, ancX:54,
    a:{ tronc:14, hanche:-8, genou:98, cheville:8, epaule:142, coude:120 },
    b:{ tronc:66, hanche:-8, genou:98, cheville:8, epaule:142, coude:120 } },

  mollets: { n:"Mollets", anc:"cheville", mat:"", sol:1, dur:2.2,
    a:{ tronc:2, hanche:0, genou:2, cheville:14, epaule:2, coude:6 },
    b:{ tronc:2, hanche:0, genou:2, cheville:-30, epaule:2, coude:6 } },

  hip: { n:"Hip thrust", anc:"epaule", mat:"barre_hanche", banc:{x:14,y:150,w:66}, sol:1, dur:3.0,
    ancX:56, ancY:146,
    a:{ tronc:-24, hanche:58,  genou:98, cheville:0, epaule:28, coude:34 },
    b:{ tronc:-46, hanche:100, genou:100, cheville:0, epaule:50, coude:34 } },

  /* Extension de hanche debout : même fonction que le hip thrust, mais la
     cuisse part de l'avant et recule. Une seule jambe est tracée — en vue
     de profil, la jambe d'appui serait de toute façon masquée. */
  hip_debout: { n:"Extension de hanche debout", anc:"fixe", mat:"", sol:1, dur:3.0,
    ancX:104, ancY:100,
    a:{ tronc:4, hanche:32, genou:14, cheville:4,  epaule:44, coude:40 },
    b:{ tronc:4, hanche:-24, genou:6, cheville:-6, epaule:44, coude:40 } },

  shrug: { n:"Haussement d'épaules", anc:"cheville", mat:"halteres", sol:1, dur:2.2,
    a:{ tronc:2, hanche:0, genou:4, cheville:2, epaule:0, coude:4 },
    b:{ tronc:2, hanche:0, genou:4, cheville:2, epaule:0, coude:4 }, epY:[0, 9] },

  rot_ext: { n:"Rotation externe", anc:"cheville", mat:"halteres", sol:1, dur:2.8,
    a:{ tronc:3, hanche:0, genou:4, cheville:2, epaule:4, coude:92 },
    b:{ tronc:3, hanche:0, genou:4, cheville:2, epaule:4, coude:92 }, br:[-40, 30] },

  oiseau: { n:"Oiseau", anc:"cheville", mat:"halteres", sol:1, dur:3.0,
    a:{ tronc:70, hanche:60, genou:22, cheville:8, epaule:68, coude:14 },
    b:{ tronc:70, hanche:60, genou:22, cheville:8, epaule:-6, coude:14 } },

  pecfly: { n:"Écarté", anc:"cheville", mat:"halteres", sol:1, dur:3.0,
    a:{ tronc:6, hanche:0, genou:4, cheville:2, epaule:86, coude:20 },
    b:{ tronc:6, hanche:0, genou:4, cheville:2, epaule:88, coude:20 }, br:[60, -10] },

  suspension: { n:"Suspension", anc:"main", mat:"barre_fixe", dur:4.0,
    a:{ tronc:1, hanche:3, genou:14, cheville:0, epaule:174, coude:2 },
    b:{ tronc:3, hanche:5, genou:18, cheville:0, epaule:176, coude:2 } },

  mobilite: { n:"Mobilité", anc:"cheville", mat:"", sol:1, dur:4.0,
    a:{ tronc:10, hanche:14, genou:10, cheville:4, epaule:20, coude:16 },
    b:{ tronc:56, hanche:62, genou:14, cheville:8, epaule:92, coude:10 } },
};

/* ── Quel exercice suit quel schéma ────────────────────────────────────
   Un identifiant absent retombe sur son exercice de base (les variantes
   d'un même mouvement partagent évidemment sa trajectoire).            */
const EXMOUV = {
  dch:"pousse_h", dch_bar:"pousse_h", dcbar:"pousse_h", dcbar_p:"pousse_h",
  dim:"pousse_h", dim_h:"pousse_h", dim_lourd:"pousse_h",
  pompes:"pompes", pompes_dec:"pompes", pompes_gen:"pompes",
  dips:"dips", dips_f:"dips", dips_m:"dips", dips_banc:"dips",
  poulieuni:"pecfly", pecdeck:"pecfly", pecfly:"pecfly", pecfly_pan:"pecfly",
  tricorde:"tri_ext", tribarre:"tri_ext", triext:"tri_ext", triext_p:"tri_ext",

  tract:"tire_v", tract_sup:"tire_v", tract_f:"tire_v", tract_f0:"tire_v",
  muscleup:"tire_v", muscleup_el:"tire_v",
  tirvert:"tire_v", tirvert_b:"tire_v",
  tirhor:"tire_h", rowhalt:"tire_h", rowing:"tire_h", rowing_aus:"tire_h",
  pullover:"pecfly", facepull:"tire_h",
  curlbar:"curl", curlez:"curl", curlhalt:"curl", curlinc:"curl",
  curlmart:"curl", b_curlmart:"curl",

  squat:"squat", squat_bar:"squat", squat_pdc:"squat", squat_bul:"fente",
  presse:"presse", legext:"presse", legcurl:"charniere", legcurl_a:"charniere",
  sdt:"charniere", sdt_pause:"charniere", sdtjt:"sdtjt", sdtjt_b:"sdtjt",
  fentes:"fente", fentes_pdc:"fente",
  hip:"hip", hip_b:"hip", hip2:"hip", pont:"hip", pont_uni:"hip", hip_pan:"hip_debout",
  mollets:"mollets", mollets_a:"mollets", b_mollets:"mollets",
  chaise:"presse",

  dm:"pousse_v", dm_h:"pousse_v", pompes_pike:"pousse_v",
  elevlat:"eleve_lat", elevlat_h:"eleve_lat", elevfront:"eleve_lat",
  arriere:"oiseau", arriere_h:"oiseau", arriere_pan:"oiseau",
  b_oiseaux:"oiseau", b_oiseaux_pan:"oiseau",
  shrugs:"shrug", b_rotext:"rot_ext",

  levjambes:"abdos", roue:"gainage", gainage:"gainage", gainlat:"gainage",
  crunch:"crunch", obliques:"crunch", superman:"charniere",
  b_hang:"suspension", b_mob:"mobilite",
};

function mouvDe(ex) {
  if (!ex) return null;
  const id = EXMOUV[ex.id] || (ex.base ? EXMOUV[ex.base] : null);
  return id ? Object.assign({ id: id }, MOUV[id]) : null;
}

/* ═════════ DESSIN ═════════ */

const VB = { w:200, h:230, solY:206, cx:96 };

/* Décalage du bassin pour que le point ancré reste immobile d'une pose
   à l'autre. C'est tout ce qui sépare un squat crédible d'une figure
   dont les pieds décollent du sol. */
function ancrage(M, p) {
  const k = fk(p);
  /* Hauteur du point ancré : par défaut le sol pour les pieds, la barre
     pour les mains, le banc pour les épaules — mais chaque schéma peut
     imposer la sienne (des pompes ont les mains au sol, pas en l'air). */
  const y = M.ancY != null ? M.ancY
          : M.anc === "cheville" ? VB.solY
          : M.anc === "main"     ? 64
          : 150;
  const x = M.ancX != null ? M.ancX : VB.cx;
  if (M.anc === "cheville") return { x: x - k.pied.x / 2, y: y - k.cheville.y };
  if (M.anc === "main")     return { x: x - k.main.x,     y: y - k.main.y };
  if (M.anc === "epaule")   return { x: x - k.epaule.x, y: y - k.epaule.y };
  /* « fixe » : le bassin est posé à la main. Pour les mouvements allongés
     ou en appui, rien ne doit rester planté au sol — calculer un ancrage
     ne ferait que compliquer un placement qui se règle à l'œil. */
  return { x: x, y: M.ancY != null ? M.ancY : 120 };
}

const n1 = (v) => Math.round(v * 10) / 10;

/* Un segment de membre : un trapèze arrondi, large à la racine */
function membre(L, e0, e1) {
  return "M" + -e0 + " 0C" + -e0 + " " + n1(-e0 * 0.6) + " " + e0 + " " + n1(-e0 * 0.6) + " " + e0 + " 0" +
         "L" + e1 + " " + L + "C" + e1 + " " + n1(L + e1 * 0.8) + " " + -e1 + " " + n1(L + e1 * 0.8) + " " + -e1 + " " + L + "Z";
}

/* Le matériel tenu en main, dessiné dans le repère du poignet */
function materielMain(mat) {
  if (mat === "halteres")
    return '<g class="mat"><rect x="-3" y="-9" width="6" height="18" rx="2"/>' +
           '<rect x="-7" y="-11" width="14" height="5" rx="2"/><rect x="-7" y="6" width="14" height="5" rx="2"/></g>';
  if (mat === "barre_mains" || mat === "barre_dos" || mat === "barre_hanche")
    return '<g class="mat"><rect x="-2.5" y="-30" width="5" height="60" rx="2.5"/>' +
           '<rect x="-7" y="-30" width="14" height="9" rx="3"/><rect x="-7" y="21" width="14" height="9" rx="3"/></g>';
  if (mat === "corde")
    return '<g class="mat"><rect x="-2" y="-8" width="4" height="16" rx="2"/></g>';
  if (mat === "poignee")
    return '<g class="mat"><rect x="-2.5" y="-9" width="5" height="18" rx="2.5"/></g>';
  return "";
}

/* Boîte englobante du geste : tous les points des deux poses, plus ce que
   le décor impose. Le cadrage est CALCULÉ et non fixé une fois pour
   toutes — sans ça, chaque nouveau schéma dont un pied ou une main sort
   un peu du cadre se retrouve tronqué, et il faut le découvrir à l'œil. */
function boite(M) {
  const pts = [];
  [M.a, M.b].forEach((pose) => {
    const p = Object.assign({}, POSE0, pose);
    const o = ancrage(M, p), f = fk(p);
    pts.push({ x:o.x, y:o.y });
    Object.keys(f).forEach((n) => pts.push({ x:f[n].x + o.x, y:f[n].y + o.y }));
  });
  let x0 = Math.min.apply(null, pts.map((p) => p.x)), x1 = Math.max.apply(null, pts.map((p) => p.x));
  let y0 = Math.min.apply(null, pts.map((p) => p.y)), y1 = Math.max.apply(null, pts.map((p) => p.y));

  /* La tête dépasse du point qui la repère, les membres ont une épaisseur */
  y0 -= SEG.tete + 4; x0 -= 13; x1 += 13; y1 += 8;

  if (M.sol)  y1 = Math.max(y1, VB.solY);
  if (M.banc) { const B = M.banc === 1 ? { x:34, y:158, w:132 } : M.banc;
                x0 = Math.min(x0, B.x); x1 = Math.max(x1, B.x + B.w); y1 = Math.max(y1, B.y + 9); }
  if (M.mat === "barre_fixe" || M.mat === "barres_para") y0 = Math.min(y0, 56);

  /* Un geste de faible amplitude ne doit pas être zoomé à l'excès, mais un
     geste large et bas n'a pas à traîner du vide au-dessus de la tête :
     le dessin s'étire à la largeur disponible, une boîte courte suffit. */
  const w = Math.max(x1 - x0, 140), h = Math.max(y1 - y0, 118);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return { x: cx - w / 2 - 8, y: cy - h / 2 - 6, w: w + 16, h: h + 12 };
}

/* Le décor : sol, banc, barre fixe. Fixe dans l'image, pas sur le corps.
   Il s'étire à la largeur du cadre calculé. */
function decor(M, B) {
  const gx = B.x + 4, gw = B.x + B.w - 4;
  let o = "";
  if (M.sol) o += '<line class="sol" x1="' + n1(gx) + '" y1="' + VB.solY + '" x2="' + n1(gw) + '" y2="' + VB.solY + '"/>';
  if (M.banc) {
    const C = M.banc === 1 ? { x:34, y:158, w:132 } : M.banc;
    o += '<rect class="banc" x="' + C.x + '" y="' + C.y + '" width="' + C.w + '" height="9" rx="3"/>';
  }
  if (M.mat === "barre_fixe")
    o += '<line class="fixe" x1="' + n1(gx + 6) + '" y1="64" x2="' + n1(gw - 6) + '" y2="64"/>';
  if (M.mat === "barres_para")
    o += '<line class="fixe" x1="' + n1(gx + 14) + '" y1="64" x2="' + n1(gw - 14) + '" y2="64"/>' +
         '<line class="fixe2" x1="' + n1(gx + 20) + '" y1="64" x2="' + n1(gx + 20) + '" y2="' + VB.solY + '"/>' +
         '<line class="fixe2" x1="' + n1(gw - 20) + '" y1="64" x2="' + n1(gw - 20) + '" y2="' + VB.solY + '"/>' +
         '<line class="sol" x1="' + n1(gx) + '" y1="' + VB.solY + '" x2="' + n1(gw) + '" y2="' + VB.solY + '"/>';
  return o;
}

/* Une articulation : renvoie la FIN de la balise <g ouvrante, puis son
   animation s'il y a lieu. Une articulation dont l'angle ne change pas
   entre les deux poses garde quand même son angle — sans ça, un tronc
   tenu à 90° pendant tout le mouvement revenait à la verticale et le
   développé couché se faisait debout. */
function anim(a, b, dur) {
  if (Math.abs(a - b) < 0.05)
    return Math.abs(a) < 0.05 ? ">" : ' transform="rotate(' + n1(a) + ')">';
  return ">" + '<animateTransform attributeName="transform" type="rotate" ' +
         'values="' + n1(a) + ";" + n1(b) + ";" + n1(a) + '" keyTimes="0;0.5;1" ' +
         'calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" ' +
         'dur="' + dur + 's" repeatCount="indefinite"/>';
}
function animT(pa, pb, dur) {
  /* Les deux branches doivent refermer la balise ouvrante : sans le ">",
     le contenu du groupe se retrouvait à l'intérieur du tag et la moitié
     de la figure disparaissait. */
  if (Math.abs(pa.x - pb.x) < 0.05 && Math.abs(pa.y - pb.y) < 0.05)
    return ' transform="translate(' + n1(pa.x) + "," + n1(pa.y) + ')">';
  return ">" + '<animateTransform attributeName="transform" type="translate" ' +
         'values="' + n1(pa.x) + "," + n1(pa.y) + ";" + n1(pb.x) + "," + n1(pb.y) + ";" +
         n1(pa.x) + "," + n1(pa.y) + '" keyTimes="0;0.5;1" ' +
         'calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" ' +
         'dur="' + dur + 's" repeatCount="indefinite"/>';
}

/* Le schéma animé complet. Les deux poses sont fusionnées avec POSE0 pour
   qu'une pose n'ait à déclarer que ce qui bouge. */
function schemaMouv(M) {
  if (!M) return "";
  const A = Object.assign({}, POSE0, M.a), B = Object.assign({}, POSE0, M.b);
  /* Décalage de bras propre à certains gestes (rotation externe, écarté)
     où ce n'est pas l'angle d'épaule principal qui porte le mouvement */
  const br = M.br || [0, 0];
  const d = M.dur || 3;
  const pa = ancrage(M, A), pb = ancrage(M, B);
  const tb = animT(pa, pb, d);

  /* L'épaule peut monter et descendre : c'est tout le mouvement du
     haussement d'épaules, et aucune rotation ne sait le représenter. */
  const eY = M.epY || [0, 0];
  const bras =
    "<g" + animT({ x:0, y:-SEG.tronc - eY[0] }, { x:0, y:-SEG.tronc - eY[1] }, d) +
      "<g" + anim(-(A.epaule + br[0]), -(B.epaule + br[1]), d) +
        '<path class="os" d="' + membre(SEG.bras, 7.5, 5.5) + '"/>' +
        '<g transform="translate(0,' + SEG.bras + ')">' +
          "<g" + anim(-A.coude, -B.coude, d) +
            '<path class="os" d="' + membre(SEG.avbras, 5.5, 4) + '"/>' +
            '<g transform="translate(0,' + SEG.avbras + ')">' +
              '<circle class="art" cx="0" cy="0" r="3.6"/>' + materielMain(M.mat) +
            "</g>" +
          "</g>" +
        "</g>" +
        '<circle class="art" cx="0" cy="' + SEG.bras + '" r="4"/>' +
      "</g>" +
    "</g>";

  const jambe =
    "<g" + anim(-A.hanche, -B.hanche, d) +
      '<path class="os" d="' + membre(SEG.cuisse, 10, 7) + '"/>' +
      '<g transform="translate(0,' + SEG.cuisse + ')">' +
        "<g" + anim(A.genou, B.genou, d) +
          '<path class="os" d="' + membre(SEG.tibia, 7, 4.5) + '"/>' +
          '<g transform="translate(0,' + SEG.tibia + ')">' +
            "<g" + anim(-A.cheville, -B.cheville, d) +
              '<path class="os" d="M-4 -3L' + SEG.pied + ' -2L' + SEG.pied + ' 3L-4 4Z"/>' +
            "</g>" +
          "</g>" +
        "</g>" +
        '<circle class="art" cx="0" cy="' + SEG.tibia + '" r="3.6"/>' +
      "</g>" +
      '<circle class="art" cx="0" cy="' + SEG.cuisse + '" r="4.5"/>' +
    "</g>";

  const tronc =
    "<g" + anim(A.tronc, B.tronc, d) +
      '<path class="os tr" d="' + membre(-SEG.tronc, 12, 9) + '"/>' +
      bras +
      '<g transform="translate(0,' + -SEG.tronc + ')">' +
        "<g" + anim(A.tete, B.tete, d) +
          '<line class="os2" x1="0" y1="0" x2="0" y2="' + -SEG.cou + '"/>' +
          '<circle class="tete" cx="0" cy="' + (-SEG.cou - SEG.tete + 2) + '" r="' + SEG.tete + '"/>' +
        "</g>" +
      "</g>" +
    "</g>";

  /* La barre sur le dos ou sur les hanches suit le corps, pas les mains */
  let porte = "";
  if (M.mat === "barre_dos")
    porte = '<g transform="translate(0,' + (-SEG.tronc + 6) + ')">' + materielMain("barre_mains") + "</g>";
  if (M.mat === "barre_hanche") porte = materielMain("barre_mains");

  const C = boite(M);
  return '<svg class="mouv" viewBox="' + n1(C.x) + " " + n1(C.y) + " " + n1(C.w) + " " + n1(C.h) +
         '" aria-hidden="true">' + decor(M, C) +
         "<g" + tb + jambe + tronc + porte + "</g></svg>";
}
