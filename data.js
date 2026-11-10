/* ═════════ VERSION ═════════
   Affichée dans Réglages. À incrémenter à chaque envoi sur GitHub : c'est
   le seul moyen de voir du téléphone si la mise à jour est bien arrivée. */
const VERSION = "5.0";
const VERSION_DATE = "10 novembre 2026";

/* ═════════ SAISON ═════════ */
/* Hyrox d'abord, marathon ensuite : un bloc marathon fait fondre et coûte les charges,
   autant le passer après la course qui demande du muscle. Les durées sont fixes,
   la prise de masse absorbe simplement le temps qui reste. */
const SAISON = [
  { id:"seche", n:"Sèche",           ph:"seche", but:"Perdre le gras restant en gardant tes charges" },
  { id:"p1",    n:"Remontée",   s:3,  ph:"p1",    but:"Stabiliser le poids et laisser les charges remonter" },
  { id:"p2",    n:"Prise de masse",   ph:"p2",    but:"La base du sled et du farmers : squat, fentes, tirage, grip" },
  { id:"hx",    n:"Bloc Hyrox", s:12, ph:"p1",    but:"Stations, sled, 1 km rapides sur jambes fatiguées" },
  { id:"HX",    n:"Hyrox",      evt:1,            but:"Objectif sous 1 h 45" },
  { id:"rec",   n:"Reprise",    s:3,  ph:"p1",    but:"Récupération, puis remontée du kilométrage" },
  { id:"mb",    n:"Bloc marathon", s:18, ph:"p1", but:"Kilométrage, sorties longues, allure spécifique" },
  { id:"MR",    n:"Marathon",   evt:1,            but:"Objectif 4 h 00 à 4 h 15" },
];

const DAYS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const LONG = { Lun:"Lundi", Mar:"Mardi", Mer:"Mercredi", Jeu:"Jeudi", Ven:"Vendredi", Sam:"Samedi", Dim:"Dimanche" };

const DEFAULT_PROGRAM = {
  Lun: { id:"pec", name:"Pec + triceps", kind:"gym", tag:"Obligatoire", ex:[
    { id:"dch",       n:"Développé couché haltères",   s:4, r:[8,10],  kg:35,  inc:2.5, rest:150, tier:1,
      note:"Omoplates serrées, descente contrôlée jusqu'à la poitrine",
      alt:[{ id:"dch_bar", n:"Développé couché barre", kg:82.5, inc:2.5, r:[6,8] }] },
    { id:"dim",       n:"Développé incliné Smith machine", s:3, r:[8,10], kg:50, inc:2.5, rest:120, tier:1,
      note:"Banc à 30°, la barre descend sur le haut de la poitrine",
      alt:[{ id:"dim_h", n:"Développé incliné haltères", kg:26, inc:2, r:[8,10] }] },
    { id:"dips",      n:"Dips lestés",                 s:3, r:[6,8],   kg:17.5, inc:2.5, rest:120, tier:1,
      alt:[{ id:"dips_m", n:"Dips machine assistée", kg:20, inc:5 }] },
    { id:"poulieuni", n:"Poulie unilatérale pec",      s:3, r:[10,12], kg:12,  inc:2,   rest:75,  tier:3,
      alt:[{ id:"pecdeck", n:"Pec deck", kg:45, inc:5 }] },
    { id:"tricorde",  n:"Triceps corde poulie basse",  s:3, r:[10,12], kg:17,  inc:2.5, rest:75,  tier:2,
      alt:[{ id:"tribarre", n:"Triceps barre poulie", kg:25, inc:2.5 }] },
    { id:"triext",    n:"Extension au-dessus de la tête", s:3, r:[8,10], kg:14, inc:2, rest:75, tier:3,
      note:"Coudes serrés et fixes : seul l'avant-bras bouge",
      alt:[{ id:"triext_p", n:"Extension poulie au-dessus de la tête", kg:15, inc:2.5 }] },
  ]},
  Mar: { id:"dos", name:"Dos + biceps", kind:"gym", tag:"Obligatoire", ex:[
    { id:"tract",    n:"Tractions",                  s:5, r:[5,5],   kg:0,  inc:2.5, rest:120, bw:1, tier:1,
      note:"5 séries de 5 propres plutôt qu'un maximum : chaque série doit ressembler à la première",
      alt:[{ id:"tract_sup", n:"Tractions supination", kg:0, inc:2.5 }] },
    { id:"tirhor",   n:"Tirage horizontal",          s:4, r:[8,10],  kg:55, inc:5,   rest:120, tier:1,
      alt:[{ id:"rowhalt", n:"Rowing haltère unilatéral", kg:26, inc:2, s:3,
             note:"3 séries par bras. Coude le long du corps, on tire vers la hanche" }] },
    { id:"tirvert",  n:"Tirage vertical unilatéral", s:3, r:[10,12], kg:45, inc:5,   rest:90,  tier:2,
      alt:[{ id:"tirvert_b", n:"Tirage vertical barre", kg:55, inc:5 }] },
    { id:"pullover", n:"Pull over poulie",           s:3, r:[8,10],  kg:40, inc:5,   rest:75,  tier:2 },
    { id:"curlbar",  n:"Curl barre",                 s:4, r:[8,12],  kg:22.5, inc:2.5, rest:90, tier:2,
      note:"Coudes collés au corps, pas d'élan du dos",
      alt:[{ id:"curlez", n:"Curl barre EZ", kg:22.5, inc:2.5 }, { id:"curlhalt", n:"Curl haltères", kg:12, inc:2 }] },
    { id:"curlinc",  n:"Curl banc incliné",          s:3, r:[8,12],  kg:7,  inc:2,   rest:75,  tier:3 },
    { id:"curlmart", n:"Curl marteau",               s:3, r:[10,12], kg:8,  inc:2,   rest:75,  tier:3 },
  ]},
  Mer: { id:"jambes", name:"Jambes", kind:"gym", tag:"Ne la saute pas", ex:[
    /* Plafond à 6 répétitions : au-delà, les dernières reps coûtent plus
       nerveusement qu'elles ne rapportent, et c'est là que la technique
       part. Moins de répétitions à charge plus lourde, même tension. */
    { id:"squat",   n:"Pendule squat",                    s:3, r:[4,6],   kg:125, inc:2.5, rest:180, tier:1,
      note:"Jamais plus de 6. Boucle 3×6 propres et la charge monte : c'est elle qui progresse, pas le nombre de reps",
      alt:[{ id:"squat_bar", n:"Squat barre", kg:100, inc:5 }, { id:"presse", n:"Presse à cuisses", kg:180, inc:10 }] },
    { id:"sdtjt",   n:"Soulevé de terre jambes tendues",  s:3, r:[8,10],  kg:35,  inc:2.5, rest:120, tier:1,
      alt:[{ id:"sdtjt_b", n:"SDT jambes tendues barre", kg:60, inc:5 }] },
    { id:"legext",  n:"Leg extension",                    s:3, r:[10,12], kg:60,  inc:5,  rest:75,  tier:2 },
    { id:"legcurl", n:"Leg curl assis",                   s:3, r:[10,12], kg:35,  inc:5,  rest:75,  tier:2,
      alt:[{ id:"legcurl_a", n:"Leg curl allongé", kg:30, inc:5 }] },
    { id:"hip",     n:"Hip thrust",                       s:3, r:[10,12], kg:35,  inc:5,  rest:90,  tier:2,
      alt:[{ id:"hip_b", n:"Hip thrust barre", kg:60, inc:10 },
           { id:"hip_pan", n:"Multi Hip Panatta, extension", kg:25, inc:5, r:[10,12],
             note:"Réglage EXTENSION, pas abduction. Par jambe : compte 10 à 12 de chaque côté" }] },
    { id:"mollets", n:"Mollets debout",                   s:4, r:[12,15], kg:140, inc:10, rest:60,  tier:3,
      note:"1 s en bas, 1 s en haut : amplitude complète, sans rebond",
      alt:[{ id:"mollets_a", n:"Mollets assis", kg:60, inc:5 }] },
  ]},
  Jeu: { id:"epaules", name:"Épaules + abdos", kind:"gym", tag:"Obligatoire", ex:[
    { id:"dm",        n:"Développé militaire barre",   s:4, r:[6,8],   kg:47.5, inc:2.5, rest:150, tier:1,
      note:"Abdos et fessiers gainés, la barre finit au-dessus de la tête, pas devant",
      alt:[{ id:"dm_h", n:"Développé épaules haltères", kg:24, inc:2, r:[6,8] }] },
    { id:"elevlat",   n:"Élévation latérale poulie",   s:4, r:[10,12], kg:12, inc:2,   rest:60,  tier:1,
      alt:[{ id:"elevlat_h", n:"Élévation latérale haltères", kg:8, inc:2, r:[10,12] }] },
    { id:"arriere",   n:"Arrière d'épaule machine",    s:4, r:[12,15], kg:15, inc:2.5, rest:60,  tier:2,
      note:"Ton point faible : amplitude complète, sans élan",
      alt:[{ id:"arriere_h", n:"Oiseau haltères", kg:8, inc:2, r:[10,12] },
           { id:"arriere_pan", n:"Arrière d'épaule Panatta debout", kg:20, inc:5, r:[12,15],
             note:"Plus d'amplitude qu'un pec deck inversé assis. Poitrine au coussin, elle ne décolle pas" }] },
    { id:"elevfront", n:"Élévation frontale",          s:3, r:[8,12],  kg:8,  inc:2,   rest:60,  tier:3,
      note:"Fourchette large : aux haltères, 2 kg d'écart pèsent lourd" },
    { id:"shrugs",    n:"Shrugs",                      s:3, r:[12,15], kg:35, inc:5,   rest:75,  tier:2 },
    { id:"levjambes", n:"Lever de jambes suspendu",    s:3, r:[6,10],  kg:0,  inc:0,   rest:60,  bw:1, tier:2 },
    { id:"crunch",    n:"Crunch poulie",               s:3, r:[12,15], kg:65, inc:5,   rest:60,  tier:3 },
    { id:"obliques",  n:"Obliques haltère",            s:3, r:[12,15], kg:14, inc:2,   rest:60,  tier:3 },
  ]},
  Ven: { id:"force", name:"Force : tractions et bench", kind:"gym", tag:"Variable d'ajustement", alt:1, ex:[
    /* En tête de séance : le muscle up est un geste technique avant d'être un geste de force.
       Fatigué, on ne l'apprend pas, on le rate. Progression suivie en répétitions, pas en
       charge : sur la version élastique on progresse en AMINCISSANT l'élastique, donc une
       charge chiffrée n'aurait aucun sens ici. */
    { id:"muscleup", n:"Muscle up strict",       s:3, r:[1,3], kg:0, inc:0, rest:180, bw:1, tier:1,
      note:"L'objectif. Tirée explosive jusqu'au bas des pectoraux, puis bascule des poignets",
      alt:[{ id:"muscleup_el", n:"Muscle up à l'élastique", kg:0, inc:0, r:[3,5],
             note:"Quand tu boucles 3×5 proprement, passe à l'élastique plus fin" }] },
    { id:"sdt",     n:"Soulevé de terre",        s:3, r:[5,5], kg:110, inc:2.5, rest:180, tier:1,
      note:"Technique d'abord : dos verrouillé avant que la barre décolle" },
    { id:"dcbar",   n:"Développé couché barre",  s:4, r:[5,5], kg:80,  inc:2.5, rest:180, tier:1,
      note:"Tant que toutes les séries ne font pas 5, la charge ne bouge pas",
      alt:[{ id:"dcbar_p", n:"Développé couché pause 1 s", kg:70, inc:2.5 }] },
    { id:"tract_f", n:"Tractions lestées",       s:3, r:[5,6], kg:10, inc:2.5, rest:150, tier:1,
      note:"Boucle toutes les séries avant de remonter le lest",
      alt:[{ id:"tract_f0", n:"Tractions poids du corps", kg:0, inc:2.5 }] },
    { id:"dips_f",  n:"Dips lestés lourds",      s:4, r:[4,6], kg:17.5, inc:2.5, rest:150, tier:1 },
    { id:"fentes",  n:"Fentes haltères",         s:3, r:[8,10], kg:14, inc:2,   rest:90,  tier:2,
      note:"Quadriceps unilatéral, transfert direct vers le sled de l'Hyrox" },
    { id:"roue",    n:"Roue abdominale",         s:3, r:[5,8], kg:0,   inc:0,   rest:75,  bw:1, tier:3 },
    { id:"gainage", n:"Gainage planche",         s:3, r:[45,90], kg:0, inc:0,   rest:60,  bw:1, tier:3, u:"s", note:"Corps aligné, fessiers serrés" },
  ]},
  Sam: { id:"runeasy", name:"Course facile", kind:"run", tag:"Optionnel", run:{ min:30, pace:"6:15–6:45", hr:"moins de 145", label:"Récupération active" } },
  Dim: { id:"runlong", name:"Sortie longue", kind:"run", tag:"La course qui compte", run:{ min:50, pace:"6:00–6:30", hr:"130–150", label:"Endurance fondamentale" } },
};

/* Séance bonus : le jour en plus, quand il reste de l'envie mais pas de la récupération.
   Volontairement complémentaire et pas une 6e séance lourde : arrière d'épaule, mollets,
   grip, mobilité. Rien qui tape sur pec, triceps ou jambes, pour ne pas abîmer le lundi.
   easy:1   → le padel ne la rabote pas, elle est déjà légère.
   nodebt:1 → si elle saute, elle ne crée pas de dette la semaine suivante. */
const BONUS = { id:"bonus", name:"Bonus complémentaire", kind:"gym", tag:"Le jour en plus", easy:1, nodebt:1, ex:[
  { id:"b_oiseaux",  n:"Oiseaux haltères",            s:4, r:[12,15], kg:8, inc:2, rest:60, tier:3,
    note:"Arrière d'épaule : ton point faible, et c'est lui qui stabilise le bench",
    alt:[{ id:"b_oiseaux_pan", n:"Arrière d'épaule Panatta debout", kg:20, inc:5 }] },
  { id:"b_rotext",   n:"Rotation externe épaule",     s:3, r:[12,15], kg:4, inc:2, rest:45, tier:3,
    note:"Par bras. Léger exprès : c'est de l'assurance sur l'épaule, pas du travail de force" },
  { id:"b_mollets",  n:"Mollets une jambe sur marche", s:4, r:[15,20], kg:0, inc:0, rest:45, bw:1, tier:3,
    note:"2 s en bas. Les mollets débloquent par la fréquence, pas par la charge" },
  { id:"b_hang",     n:"Suspension à la barre",       s:3, r:[30,60], kg:0, inc:0, rest:60, bw:1, tier:3, u:"s",
    note:"Grip et épaules sans retaper sur les tractions" },
  { id:"b_curlmart", n:"Curl marteau léger",          s:3, r:[10,12], kg:8, inc:2, rest:60, tier:3,
    note:"Charge suivie à part de ton curl marteau du mardi" },
  { id:"b_mob",      n:"Mobilité hanches, ischios, épaules", s:1, r:[8,10], kg:0, inc:0, rest:0, bw:1, tier:3, u:"min" },
]};

/* Exercices hors séance type, disponibles dans « Modifier les exercices » */
const EXTRAS = [
  { id:"dim_lourd", n:"Développé incliné Smith lourd", s:3, r:[6,8],   kg:55, inc:2.5, rest:150, tier:1,
    note:"Le développé principal de la séance : fourchette basse, charge lourde" },
  { id:"pecfly",    n:"Pec fly (écarté machine)",      s:3, r:[10,12], kg:35, inc:5,   rest:75,  tier:3,
    alt:[{ id:"pecfly_pan", n:"Écarté Panatta debout", kg:30, inc:5,
           note:"Centres de rotation à hauteur de milieu de pec, coude fixe, mains jusqu'à la ligne médiane" }] },
  { id:"rowing",    n:"Rowing barre",            s:3, r:[6,8],   kg:60, inc:5,   rest:120, tier:2 },
  { id:"facepull",  n:"Face pull",               s:3, r:[12,15], kg:15, inc:2.5, rest:60,  tier:2 },
  { id:"gainlat",   n:"Gainage latéral",         s:3, r:[20,45], kg:0,  inc:0,   rest:45,  bw:1, tier:3, u:"s", note:"De chaque côté" },
  { id:"hip2",      n:"Hip thrust (force)",      s:3, r:[10,12], kg:35, inc:5,   rest:90,  tier:3 },
  { id:"sdt_pause", n:"Soulevé de terre pause",  s:4, r:[3,5],   kg:80, inc:5,   rest:180, tier:1, note:"1 s d'arrêt sous le genou" },

  /* ── Poids du corps ────────────────────────────────────────────────
     Sans ces exercices, quelqu'un qui s'entraîne chez lui sans matériel
     repart avec une séance vide : les mouvements de salle se filtrent
     tous. Ils progressent en répétitions, pas en charge. */
  { id:"pompes",     n:"Pompes",                     s:4, r:[10,20], kg:0, inc:0, rest:75, bw:1, tier:1,
    note:"Mains sous les épaules, corps gainé d'un bloc",
    alt:[{ id:"pompes_dec", n:"Pompes pieds surélevés", kg:0, inc:0, r:[8,15],
           note:"Plus de charge sur le haut des pectoraux, sans matériel" },
         { id:"pompes_gen", n:"Pompes sur les genoux", kg:0, inc:0, r:[10,20],
           note:"La version qui permet de faire des séries propres quand les pompes complètes ne passent pas encore" }] },
  { id:"dips_banc",  n:"Dips entre deux appuis",     s:3, r:[8,15],  kg:0, inc:0, rest:75, bw:1, tier:2,
    note:"Deux chaises, un canapé, le bord d'une table" },
  { id:"pompes_pike",n:"Pompes piquées",             s:3, r:[6,12],  kg:0, inc:0, rest:90, bw:1, tier:1,
    note:"Bassin haut, tête vers le sol : c'est le développé militaire du poids du corps" },
  { id:"rowing_aus", n:"Tirage australien",          s:4, r:[8,15],  kg:0, inc:0, rest:90, bw:1, tier:1,
    note:"Sous une table solide ou une barre basse. Plus les pieds sont loin, plus c'est dur" },
  { id:"superman",   n:"Extension lombaire au sol",  s:3, r:[12,15], kg:0, inc:0, rest:45, bw:1, tier:3,
    note:"À plat ventre, on décolle buste et cuisses. Lent, sans à-coups" },
  { id:"squat_pdc",  n:"Squat au poids du corps",    s:4, r:[15,25], kg:0, inc:0, rest:60, bw:1, tier:1,
    alt:[{ id:"squat_bul", n:"Squat bulgare", kg:0, inc:0, r:[8,15],
           note:"Pied arrière sur une chaise. Une jambe à la fois : la charge double sans matériel" }] },
  { id:"fentes_pdc", n:"Fentes au poids du corps",   s:3, r:[10,16], kg:0, inc:0, rest:60, bw:1, tier:2,
    note:"Par jambe. Genou arrière qui frôle le sol" },
  { id:"pont",       n:"Pont fessier au sol",        s:3, r:[12,20], kg:0, inc:0, rest:45, bw:1, tier:2,
    alt:[{ id:"pont_uni", n:"Pont fessier une jambe", kg:0, inc:0, r:[8,15] }] },
  { id:"chaise",     n:"Chaise contre le mur",       s:3, r:[30,60], kg:0, inc:0, rest:60, bw:1, tier:3, u:"s",
    note:"Cuisses à l'horizontale, dos plaqué" },
];

/* ═════════ PHASES ═════════ */
/* gain = variation de poids visée, en kg par semaine. C'est la seule chose
   que l'application suit : l'alimentation se pilote ailleurs. */
const PHASES = {
  seche: { n:"Sèche",          gain:-0.27, goal:"−0,27 kg par semaine en gardant tes charges" },
  p1:    { n:"Remontée",       gain:0,     goal:"Poids stable, charges qui remontent" },
  p2:    { n:"Prise de masse", gain:0.25,  goal:"+0,25 kg par semaine" },
};
