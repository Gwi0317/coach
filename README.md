# Coach — l'app

Site statique installable sur l'écran d'accueil. Aucune donnée ne sort du téléphone.

## Installer

Dépôt GitHub `coach` → Settings → Pages → Deploy from a branch, `main`, `/ (root)`.
Adresse : `https://gwi0317.github.io/coach/`
Ouvre-la dans **Safari** → Partager → **Sur l'écran d'accueil**.

## Mettre à jour

Remplace le ou les fichiers modifiés sur GitHub (Add file → Upload files, ça écrase),
puis ferme et rouvre l'app avec du réseau.

## Ce que fait l'app

**Séance** — les exercices du jour avec tes charges réelles. Tu saisis tes reps série par
série, l'app calcule la charge de la fois suivante (toute la fourchette bouclée → tu montes).
Chaque série a sa case à cocher : tu vois où tu en es même en repliant l'exercice, et une
ligne en haut récapitule l'avancement de la séance entière. Cocher une série lance la pause
toute seule. Boutons padel, séance ratée, pre-workout Apurna.

**Chrono** — compte à rebours pour les temps de repos. Huit durées de 30 s à 3 min, plus la
liste des exercices du jour avec leur pause prescrite : un appui lance la bonne. Quand il
tourne, une barre noire reste visible dans toute l'app, avec +15 s, pause et arrêt. À zéro
elle passe au vert, vibre et bipe. Attention : iOS gèle la page quand l'écran est verrouillé,
le son ne sortira pas, mais le décompte reste juste au déverrouillage (il se calcule sur
l'heure de fin, pas sur un compteur).

**Technique** — dans chaque exercice, un onglet qui montre un corps de face et de dos avec
les muscles recrutés en rouge : rouge vif pour les moteurs, rouge pâle pour ceux qui
stabilisent. Chaque muscle porte ses stries dans le sens de ses fibres et un dégradé qui
lui donne du galbe, pour qu'on lise dans quelle direction il tire. Dessous, les points d'exécution qui changent le résultat et, en orange,
l'erreur qui blesse. Les 87 exercices du catalogue sont couverts, les variantes héritant
de leur mouvement de base. Tout est dessiné en SVG : quelques Ko, affichage instantané,
rien à télécharger, ça marche hors ligne.

**Mouvement** — en tête de l'onglet Technique, une figure articulée déroule l'exercice en
boucle : descente, remontée. 25 schémas moteurs couvrent les 87 exercices (les variantes
d'un même geste partagent sa trajectoire). Ce n'est pas une vidéo, et c'est volontaire :
1,5 à 2,5 Ko par schéma au lieu de plusieurs Mo, rien à héberger, et la trajectoire est
exacte au degré près au lieu d'être approximée par un cadrage de caméra. L'animation est
en SMIL, donc aucun JavaScript ne tourne en continu.

Le corps est une chaîne d'articulations emboîtées. Une pose est une liste d'angles, un
schéma est deux poses, l'animation interpole de l'une à l'autre. Le point d'ancrage est ce
qui rend le geste crédible : dans un squat ce sont les pieds qui restent au sol, dans une
traction ce sont les mains sur la barre — la position du bassin est donc recalculée à
chaque pose. Le cadrage est calculé lui aussi, à partir de la boîte englobante des deux
poses : un schéma dont un pied sortirait de l'image se corrige tout seul.

**Progression** — un troisième onglet par exercice, avec la courbe depuis la première
séance validée. Trois façons de mesurer selon le mouvement : 1RM estimé pour une charge
classique, 1RM estimé poids de corps compris pour les tractions et les dips (sinon des
tractions à vide vaudraient zéro), total de répétitions ou de secondes pour le reste. Le
poids de corps actuel est appliqué à tout l'historique, sinon la courbe descendrait
pendant une sèche alors que tu ne perds aucune force. Un trait pointillé marque une remise
à zéro : avant et après ne se comparent pas.

**Repas** — le plan du lundi au vendredi midi, modifiable au gramme près. Coche les repas
que tu as réellement pris. Bouton pour ajouter n'importe quel aliment hors plan.

**Phases** — Sèche (2550 kcal, −0,3 kg/semaine, plancher à 2250), Remontée (2850, poids stable),
Prise de masse (3150, +0,25 kg/semaine). Le bouton se trouve en haut de l'onglet Poids.

**Poids** — pesée lundi, mercredi, vendredi à jeun. Au bout de six pesées l'app compare les
moyennes glissantes et réécrit les féculents de la semaine pour coller à la trajectoire.

**Courses** — calculée depuis le plan, jamais saisie à la main. Bouton « j'en ai » pour ce
que tu ramènes de chez tes parents.

**Réglages** — corriger les valeurs d'un aliment, ajouter un produit par code-barres
(Open Food Facts), exporter tes données.

## Ma semaine

Sur l'écran Séance, le bouton « Je n'ai pas pu » ouvre le planning de la semaine. Tu tapes
un jour, tu choisis ce qui s'y passe vraiment (une des cinq séances, la séance bonus, padel,
repos, absent),
et le bouton « Décaler les séances à partir de… » pousse tout le reste d'un cran en sautant
les jours où tu n'es pas là. L'app te dit ce qui ne rentre plus dans la semaine.

« Remettre la semaine type » rétablit le programme standard.

**La séance bonus** est le jour en plus : arrière d'épaule, rotation externe, mollets, grip,
curl léger, mobilité. Volontairement complémentaire et jamais lourde, pour ne pas abîmer la
séance du lendemain. Un bouton la propose directement sur un jour de repos, ou sur un jour de
course une fois la sortie enregistrée. Ses charges sont suivies à part, le padel ne la rabote
pas, et si elle saute elle ne crée pas de dette : c'est un jour en plus, pas un jour dû.

Quand une séance ne rentre pas, l'app ne coupe pas au hasard : elle garde les plus
importantes (jambes, pec, dos, épaules, force dans cet ordre) et retient celle qui a sauté.
La semaine suivante, cette séance repasse devant et c'est une autre qui saute si nécessaire.
Tant qu'elle n'est pas au planning, une ligne « En retard » propose de la placer sur un jour
de repos, sinon sur le créneau force du vendredi, sinon à la place de la course facile du
samedi.

## Le bilan hebdomadaire

À la première ouverture d'une nouvelle semaine, un bandeau apparaît en tête de l'onglet
Séance. Il relit ce que tu as enregistré et en tire les consignes : séances validées,
charges qui ont monté, exercices bloqués depuis trois séances, repas cochés, moyenne des
écarts hors plan, sortie longue la plus longue, tendance de poids avec le bouton qui
applique l'ajustement au plan.

« Clore la semaine » fige les charges pour la comparaison suivante et remet à zéro la liste
de courses, les séances ratées et les padels.

Rien ne tourne en arrière-plan : tout se recalcule à l'ouverture, y compris hors ligne.

## Le questionnaire d'accueil

Il ne s'adresse **qu'aux nouveaux arrivants**. Une installation qui porte déjà la moindre
donnée — une séance validée, une pesée, une séance modifiée, une semaine type — ne le voit
jamais : le verrou est posé au premier chargement et ne se relâche pas, même si les données
sont effacées ensuite.

Six questions : objectif, ancienneté, jours disponibles, matériel, articulation à ménager,
poids de corps. Il en sort une semaine type, la composition de chaque séance, des charges
de départ et une cible calorique estimée. Tout reste modifiable ensuite.

Ce qu'il fait vraiment, et qui se vérifie dans `onbtest.cjs` sur les 864 combinaisons de
réponses possibles :

- **Le matériel ne supprime pas, il remplace** d'abord. Sans barre, le rowing barre devient
  rowing haltère ; sans rien, la séance se recompose en pompes, tirage australien, squat au
  poids du corps.
- **Une articulation sensible retire ET remplace** : genoux fragiles → la presse prend la
  place du squat, le pont celle des fentes.
- **Jamais deux fois le même mouvement** sous deux habillages : une élévation latérale aux
  haltères et une à la poulie ne comptent qu'une fois.
- **Jamais moins de trois exercices**, et chaque séance travaille réellement ce que son nom
  annonce — la vérification passe par les muscles déclarés dans les fiches, pas par les noms.
- **Rien ne s'ajoute à une séance intacte** : en salle et sans contrainte, le programme sort
  exactement tel qu'il est écrit.

Le plancher calorique devient proportionnel au gabarit au lieu d'hériter de celui d'un autre
corps.

## Tes données

Stockées dans le téléphone. **Réglages → Exporter** avant toute suppression de l'app :
iOS efface le stockage en même temps.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | structure et styles |
| `data.js` | aliments, plan de repas, programme, phases, cures |
| `anat.js` | corps en SVG, muscles par exercice, consignes d'exécution et de sécurité |
| `mouv.js` | figure articulée, schémas moteurs, animation des trajectoires |
| `app.js` | calculs : macros, progression, poids, courses, bilan, code-barres |
| `onb.js` | questionnaire d'accueil et génération du programme |
| `ui.js` | écrans et interactions |
| `sw.js` | hors ligne |
| `manifest.webmanifest` | nom et icône |

**Les dix fichiers sont à mettre sur GitHub.** Si l'un manque, l'app ne s'ouvre pas :
`index.html` les charge tous. Le numéro de version en bas de l'onglet Réglages dit quelle
version tourne réellement sur le téléphone — c'est ce qui distingue « mes fichiers ne sont
pas partis » de « mon téléphone garde l'ancienne ».
