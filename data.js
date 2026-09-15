/* ═════════ CATALOGUE ALIMENTS ═════════
   Valeurs pour 100 g / 100 ml, relevées sur les captures Foodvisor.
   k = kcal · p = protéines · c = glucides · l = lipides
   uG/uN = poids et nom d'une unité (1 carré, 1 tranche…)
   st = pas du curseur · cat = rayon de courses · pack = conditionnement
*/
const DEFAULT_FOODS = {
  skyr:       { n:"Skyr nature Pãturages", u:"g",  k:53,  p:10,  c:3.8, l:0.2,  st:25, cat:"frais",  pack:[500,"pot de 500 g"] },
  skyrvan:    { n:"Skyr vanille Yoplait",  u:"g",  k:78,  p:9,   c:9.5, l:0.2,  st:25, cat:"frais",  pack:[400,"pot de 400 g"] },
  psuisse:    { n:"Petits suisses",        u:"g",  k:132, p:9,   c:3.5, l:9.2,  st:60, uG:60, uN:"pot", cat:"frais", pack:[360,"pack de 6"] },
  cottage:    { n:"Cottage cheese Danone", u:"g",  k:88,  p:11,  c:3.5, l:3.5,  st:30, cat:"frais",  pack:[180,"pot de 180 g"] },
  carre:      { n:"Carré frais 0%",        u:"g",  k:88,  p:11,  c:6,   l:2.5,  st:25, uG:25, uN:"carré", cat:"frais", pack:[200,"boîte de 8"] },
  parmesan:   { n:"Parmesan / Grana râpé", u:"g",  k:400, p:33,  c:0,   l:29.5, st:5,  cat:"frais",  pack:[100,"sachet de 100 g"] },
  beurre:     { n:"Beurre demi-sel",       u:"g",  k:745, p:0.7, c:0.6, l:82,   st:5,  cat:"frais",  pack:[250,"plaquette"] },
  laitavoine: { n:"Lait d'avoine Bjorg",   u:"ml", k:45,  p:0.8, c:6.8, l:1.5,  st:50, cat:"epicerie", pack:[1000,"brique de 1 L"] },

  muesli:     { n:"Muesli protéiné Bjorg", u:"g",  k:380, p:14,  c:53,  l:10,   st:10, cat:"epicerie", pack:[500,"paquet de 500 g"] },
  flocons:    { n:"Flocons d'avoine",      u:"g",  k:372, p:13.5,c:59,  l:7,    st:10, cat:"epicerie", pack:[500,"paquet de 500 g"] },
  painmie:    { n:"Pain de mie complet",   u:"g",  k:257, p:9,   c:42,  l:4.5,  st:20, uG:20, uN:"tranche", cat:"epicerie", pack:[500,"paquet"] },
  wasa:       { n:"Wasa Protein+",         u:"g",  k:400, p:20,  c:50,  l:11,   st:12.5, uG:12.5, uN:"tranche", cat:"epicerie", pack:[270,"paquet"] },
  wrap:       { n:"Wrap complet Old El Paso", u:"g", k:293, p:8.5, c:46, l:7,   st:58, uG:58, uN:"wrap", cat:"epicerie", pack:[350,"paquet de 6"] },
  pates:      { n:"Pâtes crues (fusilli)", u:"g",  k:356, p:13,  c:70,  l:1.5,  st:10, cat:"epicerie", pack:[500,"paquet de 500 g"] },
  riz:        { n:"Riz basmati cru",       u:"g",  k:352, p:8.5, c:78,  l:0.6,  st:10, cat:"epicerie", pack:[500,"paquet de 500 g"] },
  miel:       { n:"Miel",                  u:"g",  k:327, p:0.3, c:80,  l:0,    st:5,  cat:"epicerie", pack:[250,"pot"] },
  confiture:  { n:"Confiture fraise St Mamet", u:"g", k:167, p:0.4, c:40, l:0.1, st:5, cat:"epicerie", pack:[350,"pot"] },
  huile:      { n:"Huile d'olive",         u:"ml", k:900, p:0,   c:0,   l:100,  st:5,  cat:"epicerie", pack:[750,"bouteille"] },

  poulet:     { n:"Aiguillettes de poulet", u:"g", k:110, p:23,  c:0.5, l:1.8,  st:10, cat:"viande", arr:50 },
  steak:      { n:"Steak haché 5%",        u:"g",  k:158, p:21,  c:0,   l:8,    st:125, uG:125, uN:"steak", cat:"viande", pack:[250,"barquette de 2"] },
  truite:     { n:"Pavé de truite",        u:"g",  k:141, p:20,  c:0,   l:6.8,  st:10, cat:"viande", arr:50 },
  saumon:     { n:"Pavé de saumon",        u:"g",  k:205, p:20,  c:0,   l:13.5, st:10, cat:"viande", arr:50 },
  cabillaud:  { n:"Cabillaud / poisson blanc", u:"g", k:80, p:18, c:0,  l:0.8,  st:10, cat:"viande", arr:50 },
  thonhuile:  { n:"Thon à l'huile d'olive", u:"g", k:168, p:26,  c:0,   l:7,    st:104, uG:104, uN:"boîte", cat:"epicerie", pack:[104,"boîte"] },
  truitefum:  { n:"Truite fumée Ovive",    u:"g",  k:157, p:22,  c:0.5, l:7.5,  st:30, cat:"viande", arr:60 },

  haricots:   { n:"Haricots verts",        u:"g",  k:31,  p:2,   c:4.5, l:0.2,  st:50, cat:"legume", pack:[1000,"sachet de 1 kg"] },
  champi:     { n:"Champignons de Paris",  u:"g",  k:22,  p:3,   c:1.5, l:0.3,  st:50, cat:"legume", arr:250 },
  avocat:     { n:"Avocat",                u:"g",  k:174, p:2,   c:2,   l:16.5, st:75, uG:150, uN:"avocat", cat:"legume", arr:150 },
  mangue:     { n:"Mangue surgelée",       u:"g",  k:64,  p:0.8, c:14,  l:0.3,  st:50, cat:"legume", pack:[450,"sachet de 450 g"] },

  wheyfraise: { n:"Whey isolate fruits rouges EA Fit", u:"g", k:377, p:80, c:8, l:2, st:5, uG:30, uN:"dose", cat:"complement" },
  clear:      { n:"Clear Whey Bulk",       u:"g",  k:354, p:82,  c:3,   l:0.5,  st:2,  uG:26, uN:"dose", cat:"complement" },
  barapurna:  { n:"Barre Apurna 35% caramel", u:"g", k:352, p:35, c:21, l:12,  st:45, uG:45, uN:"barre", cat:"complement", pack:[45,"barre"] },
  apurnapw:   { n:"Apurna Pre Workout",    u:"g",  k:310, p:25,  c:40,  l:0,    st:10, uG:20, uN:"dose", cat:"complement", pack:[420,"pot de 420 g"] },
  creatine:   { n:"Créatine",              u:"g",  k:0,   p:0,   c:0,   l:0,    st:1,  cat:"complement" },
  bbq:        { n:"Sauce BBQ 0% Bulk",     u:"g",  k:20,  p:0.2, c:4.5, l:0.1,  st:10, cat:"epicerie" },
  ail:        { n:"Sauce ail & fines herbes", u:"g", k:90, p:0.5, c:5,  l:7.5,  st:10, cat:"epicerie" },
  choco:      { n:"Sauce zéro choco-caramel", u:"g", k:10, p:0,  c:2,   l:0,    st:5,  cat:"epicerie" },

  mcnuggets:  { n:"Chicken McNuggets",     u:"g",  k:244, p:14,  c:16,  l:14,   st:18, uG:18, uN:"nugget", cat:"horsplan" },
  barprotif:  { n:"Barre Protifast chocolat", u:"g", k:362, p:34,  c:20,  l:14,   st:44, uG:44, uN:"barre", cat:"complement", pack:[308,"boîte de 7"] },
  painbio:    { n:"Pain bio complet La Boulangère", u:"g", k:252, p:9, c:41, l:3.5, st:33, uG:33, uN:"tranche", cat:"epicerie", pack:[500,"paquet"] },
};

/* ═════════ PLAN DE REPAS (lundi → vendredi midi) ═════════ */

const PDJ    = [["skyr",200],["muesli",40],["miel",15],["painmie",80],["confiture",20]];
const GOUT_A = [["wheyfraise",30],["flocons",60],["mangue",100],["laitavoine",200],["creatine",5]];
const GOUT_B = [["clear",26],["wasa",37.5],["miel",20],["mangue",150],["creatine",5]];

/* Variantes de goûter interchangeables — le titre du repas commence par "Goûter" */
const GOUTER_VARIANTS = [
  { n:"smoothie",   f:GOUT_A },
  { n:"clear whey", f:GOUT_B },
  { n:"barre Apurna", f:[["barapurna",45],["skyr",200],["mangue",150],["wasa",25],["creatine",5]] },
  { n:"barre Protifast", f:[["barprotif",44],["skyr",200],["mangue",150],["miel",15],["creatine",5]] },
];

const DEFAULT_PLAN = {
  Lun: [
    { t:"Petit-déjeuner", h:"7h00", f:PDJ },
    { t:"Déjeuner — poulet riz", h:"12h30", f:[["poulet",150],["riz",110],["huile",10],["beurre",5],["parmesan",15],["haricots",200],["painmie",40],["carre",25]] },
    { t:"Goûter — smoothie", h:"16h30", f:GOUT_A },
    { t:"Dîner — truite pâtes", h:"20h00", f:[["truite",150],["pates",110],["huile",10],["champi",150],["parmesan",10]] },
    { t:"Dessert", h:"21h00", f:[["psuisse",120],["choco",15]] },
  ],
  Mar: [
    { t:"Petit-déjeuner", h:"7h00", f:PDJ },
    { t:"Déjeuner — steak pâtes", h:"12h30", f:[["steak",125],["pates",130],["beurre",10],["parmesan",15],["huile",10],["champi",150],["wasa",25],["carre",25]] },
    { t:"Goûter — clear whey", h:"16h30", f:GOUT_B },
    { t:"Dîner — wraps poulet", h:"20h00", f:[["wrap",116],["poulet",130],["huile",10],["champi",100],["ail",30]] },
    { t:"Dessert", h:"21h00", f:[["cottage",150],["miel",15]] },
  ],
  Mer: [
    { t:"Petit-déjeuner", h:"7h00", f:PDJ },
    { t:"Déjeuner — poulet pâtes", h:"12h30", f:[["poulet",150],["pates",125],["huile",10],["beurre",5],["parmesan",15],["haricots",200],["painmie",40],["carre",25]] },
    { t:"Goûter — smoothie", h:"16h30", f:GOUT_A },
    { t:"Dîner — cabillaud riz", h:"20h00", f:[["cabillaud",200],["riz",110],["huile",15],["haricots",150],["ail",20]] },
    { t:"Dessert", h:"21h00", f:[["psuisse",120],["miel",15]] },
  ],
  Jeu: [
    { t:"Petit-déjeuner", h:"7h00", f:PDJ },
    { t:"Déjeuner — steak riz", h:"12h30", f:[["steak",125],["riz",125],["beurre",10],["huile",10],["haricots",200],["bbq",20],["wasa",25],["carre",25],["skyr",100]] },
    { t:"Goûter — clear whey", h:"16h30", f:GOUT_B },
    { t:"Dîner — thon pâtes", h:"20h00", f:[["thonhuile",104],["pates",120],["huile",10],["champi",150],["parmesan",15]] },
    { t:"Dessert", h:"21h00", f:[["cottage",150],["choco",15]] },
  ],
  Ven: [
    { t:"Petit-déjeuner", h:"7h00", f:PDJ },
    { t:"Déjeuner — poulet riz", h:"12h30", f:[["poulet",150],["riz",120],["huile",10],["beurre",5],["parmesan",15],["champi",150],["painmie",40],["carre",25],["skyr",100]] },
    { t:"Goûter — clear whey", h:"16h30", f:GOUT_B },
  ],
  Sam: [],
  Dim: [],
};

const CARB_FOODS = ["riz","pates","painmie","wasa","flocons","muesli","mangue","miel","wrap","painbio"];

/* ═════════ PROGRAMME ═════════ */

const DAYS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const LONG = { Lun:"Lundi", Mar:"Mardi", Mer:"Mercredi", Jeu:"Jeudi", Ven:"Vendredi", Sam:"Samedi", Dim:"Dimanche" };

const DEFAULT_PROGRAM = {
  Lun: { id:"pec", name:"Pec + triceps", kind:"gym", tag:"Obligatoire", ex:[
    { id:"dch",       n:"Développé couché haltères",   s:4, r:[8,10],  kg:35,  inc:2.5, tier:1, note:"Repos 2 min" },
    { id:"dim",       n:"Développé incliné Smith machine", s:3, r:[8,10], kg:50, inc:2.5, tier:1, note:"1,25 kg de chaque côté pour monter" },
    { id:"dips",      n:"Dips lestés",                 s:3, r:[8,10],  kg:10,  inc:2.5, tier:1, note:"En 3ᵉ position, tu as plus de jus" },
    { id:"poulieuni", n:"Poulie unilatérale pec",      s:3, r:[12,12], kg:12,  inc:2,   tier:3 },
    { id:"tricorde",  n:"Triceps corde poulie basse",  s:3, r:[10,12], kg:15,  inc:2.5, tier:2 },
    { id:"triext",    n:"Extension au-dessus de la tête", s:3, r:[10,10], kg:12, inc:2, tier:3 },
  ]},
  Mar: { id:"dos", name:"Dos + biceps", kind:"gym", tag:"Obligatoire", ex:[
    { id:"tract",    n:"Tractions",                  s:4, r:[6,8],   kg:0,  inc:2.5, bw:1, tier:1, note:"4×8 propres → ajoute du lest" },
    { id:"tirhor",   n:"Tirage horizontal",          s:4, r:[10,10], kg:55, inc:5,   tier:1 },
    { id:"tirvert",  n:"Tirage vertical unilatéral", s:3, r:[10,12], kg:40, inc:5,   tier:2 },
    { id:"pullover", n:"Pull over poulie",           s:3, r:[10,10], kg:35, inc:5,   tier:2 },
    { id:"curlbar",  n:"Curl barre",                 s:4, r:[10,12], kg:20, inc:2.5, tier:2 },
    { id:"curlinc",  n:"Curl banc incliné",          s:3, r:[10,10], kg:8,  inc:2,   tier:3 },
    { id:"curlmart", n:"Curl marteau",               s:3, r:[10,12], kg:8,  inc:2,   tier:3 },
  ]},
  Mer: { id:"jambes", name:"Jambes", kind:"gym", tag:"Ne la saute pas", ex:[
    { id:"squat",   n:"Pendule squat",                    s:4, r:[8,8],   kg:90,  inc:10, tier:1, note:"Ton record : 120 kg × 8" },
    { id:"sdtjt",   n:"Soulevé de terre jambes tendues",  s:3, r:[10,10], kg:30,  inc:5,  tier:1 },
    { id:"legext",  n:"Leg extension",                    s:3, r:[12,12], kg:55,  inc:5,  tier:2 },
    { id:"legcurl", n:"Leg curl assis",                   s:3, r:[12,12], kg:30,  inc:5,  tier:2 },
    { id:"hip",     n:"Hip thrust",                       s:3, r:[12,12], kg:35,  inc:5,  tier:2 },
    { id:"mollets", n:"Mollets",                          s:4, r:[15,15], kg:130, inc:10, tier:3, note:"Pause 1 s en bas" },
  ]},
  Jeu: { id:"epaules", name:"Épaules + abdos", kind:"gym", tag:"Obligatoire", ex:[
    { id:"dm",        n:"Développé militaire barre",   s:4, r:[8,8],   kg:45, inc:2.5, tier:1, note:"Consolide 45 sur les 4 séries" },
    { id:"elevlat",   n:"Élévation latérale poulie",   s:4, r:[12,12], kg:12, inc:2,   tier:1 },
    { id:"elevfront", n:"Élévation frontale",          s:3, r:[12,12], kg:8,  inc:2,   tier:3 },
    { id:"arriere",   n:"Arrière d'épaule machine",    s:3, r:[15,15], kg:15, inc:5,   tier:2 },
    { id:"shrugs",    n:"Shrugs",                      s:3, r:[15,15], kg:30, inc:5,   tier:2 },
    { id:"levjambes", n:"Lever de jambes suspendu",    s:3, r:[8,10],  kg:0,  inc:0, bw:1, tier:2 },
    { id:"crunch",    n:"Crunch poulie",               s:3, r:[15,15], kg:65, inc:5,   tier:3 },
    { id:"obliques",  n:"Obliques haltère",            s:3, r:[15,15], kg:14, inc:2,   tier:3 },
  ]},
  Ven: { id:"force", name:"Force full body", kind:"gym", tag:"Variable d'ajustement", alt:1, ex:[
    { id:"sdt",    n:"Soulevé de terre",       s:4, r:[5,5],   kg:100, inc:5,   tier:1, note:"Technique parfaite, repos 3 min" },
    { id:"dcbar",  n:"Développé couché barre", s:4, r:[5,5],   kg:80,  inc:2.5, tier:1 },
    { id:"rowing", n:"Rowing barre",           s:3, r:[8,8],   kg:60,  inc:5,   tier:2 },
    { id:"hip2",   n:"Hip thrust",             s:3, r:[12,12], kg:35,  inc:5,   tier:3 },
    { id:"roue",   n:"Roue abdominale",        s:3, r:[5,6],   kg:0,   inc:0, bw:1, tier:3 },
  ]},
  Sam: { id:"runeasy", name:"Course facile", kind:"run", tag:"Optionnel", run:{ min:30, pace:"6:15–6:45", hr:"moins de 145", label:"Récupération active" } },
  Dim: { id:"runlong", name:"Sortie longue", kind:"run", tag:"La course qui compte", run:{ min:50, pace:"6:00–6:30", hr:"130–150", label:"Endurance fondamentale" } },
};

/* ═════════ PHASES ═════════ */

const PHASES = {
  p1: { n:"Remontée",       d:"3 semaines",  kcal:2850, prot:180, gluc:345, lip:80, gain:0,    goal:"Poids stable pendant qu'on remonte les calories" },
  p2: { n:"Prise de masse", d:"4 à 5 mois",  kcal:3150, prot:180, gluc:410, lip:85, gain:0.25, goal:"+0,25 kg par semaine — 81 vers 85 kg" },
};

/* ═════════ CURES DE COMPLÉMENTS ═════════ */

const CURES = {
  8:{multi:1,spi:0,ergy:1,mag:2}, 9:{multi:1,spi:1,ergy:1,mag:2}, 10:{multi:1,spi:1,ergy:0,mag:2},
  11:{multi:0,spi:1,ergy:1,mag:3}, 0:{multi:1,spi:0,ergy:1,mag:2}, 1:{multi:1,spi:1,ergy:0,mag:2},
  2:{multi:1,spi:1,ergy:1,mag:2},  3:{multi:0,spi:1,ergy:1,mag:3}, 4:{multi:1,spi:1,ergy:1,mag:2},
  5:{multi:1,spi:0,ergy:1,mag:2},  6:{multi:1,spi:1,ergy:1,mag:2}, 7:{multi:0,spi:1,ergy:0,mag:3},
};
