# Coach — l'app

Site statique installable sur l'écran d'accueil. Aucune donnée ne sort du téléphone.
Version **5.0** : l'application ne s'occupe plus que de l'entraînement et du poids.
L'alimentation se suit ailleurs.

## Installer

Dépôt GitHub `coach` → Settings → Pages → Deploy from a branch, `main`, `/ (root)`.
Adresse : `https://gwi0317.github.io/coach/`
Ouvre-la dans **Safari** → Partager → **Sur l'écran d'accueil**.

## Mettre à jour

Remplace les fichiers sur GitHub (Add file → Upload files, ça écrase), puis ferme et
rouvre l'app avec du réseau. **Réglages** affiche le numéro de version qui tourne
réellement sur le téléphone ; s'il n'a pas changé, le bouton « Forcer la mise à jour »
vide le cache et recharge. Les données ne bougent pas : elles sont dans le stockage du
téléphone, pas dans le cache.

## Ce que fait l'app

**Séance** — les exercices du jour avec tes charges. Tu saisis tes répétitions série par
série ; quand toutes les séries atteignent le haut de la fourchette, la charge monte à la
séance suivante. Le gros bouton numéroté de chaque série se coche d'un appui et lance la
pause toute seule. En haut, une jauge suit l'avancement de la séance. Trois boutons :
padel en plus (séance allégée), déplacer la séance, modifier les exercices.

**Technique** — dans chaque exercice : un corps de face et de dos avec les muscles
recrutés en rouge (vif pour les moteurs, pâle pour ceux qui soutiennent), les points
d'exécution, et l'erreur qui blesse. Les 88 exercices ont leur fiche, et une variante ne
récite pas les consignes d'un autre matériel : le rowing haltère a les siennes, pas
celles du tirage à la poulie.

Les gestes animés de la version 4 ont été retirés : près d'un sur deux était faux.
Ils reviendront avec un moteur refait. `mouv.js` est un fichier d'attente ;
l'interface appelle déjà `mouvHTML()` et `mouvLance()`.

**Progression** — dans chaque exercice : où tu en es en une phrase, trois chiffres
(départ, dernière fois, gain), et deux petits graphiques empilés sur le même axe de
temps. En haut la charge ; en bas les répétitions, série par série, posées sur la
fourchette visée. On y voit la double progression telle qu'elle se vit : les
répétitions grimpent jusqu'en haut de la bande, la charge monte d'un cran, elles
retombent. Toucher un point lit la séance. Dessous, les six dernières séances en clair.

Ce qui est suivi, c'est la charge de travail, pas un 1RM estimé : le 1RM estimé baisse
le jour où on passe de 6-8 à 4-6 répétitions avec 5 kg de plus, alors qu'on est plus
fort. Le verdict (en progression, stable, en recul) compare les trois dernières
séances sur leurs séries communes : passer de 4 séries à 3 n'est pas une régression.
Revenir à une charge déjà soulevée n'est une progression que si on y fait mieux.

**Chrono** — compte à rebours pour les temps de repos. Huit durées de 30 s à 3 min, plus
les pauses prescrites de la séance du jour. Quand il tourne, une barre jaune reste
visible dans toute l'app, avec +15 s, pause et arrêt ; à zéro elle passe au vert, vibre
et bipe. iOS gèle la page écran verrouillé : le son ne sortira pas, mais le décompte
reste juste au déverrouillage (il se calcule sur l'heure de fin).

**Poids** — pesée lundi, mercredi, vendredi à jeun. La tendance est une droite des
moindres carrés sur les pesées des 28 derniers jours, calculée sur leurs **dates**, avec
son intervalle à 80 % : « −0,53 kg par semaine (−0,70 à −0,36) ». Il faut au moins
4 pesées étalées sur 10 jours ; en dessous, l'app le dit au lieu d'annoncer un chiffre.
Le verdict par rapport à la cible de la phase ne tombe que si tout l'intervalle est du
même côté. Le graphique montre les pesées, la droite, et l'éventail des pentes que les
données n'excluent pas.

**Phases** — Sèche (−0,27 kg/semaine), Remontée (poids stable), Prise de masse
(+0,25 kg/semaine). La phase fixe la cible à laquelle la tendance est comparée.

**Saison** — sous le poids : les blocs de l'année, recalculés à partir de trois dates
(fin de la sèche, Hyrox, marathon).

**Réglages** — exporter les données, tout effacer, version installée, forcer la mise à jour.

## Ma semaine

« Déplacer la séance » ouvre le planning. Tu touches un jour, tu choisis ce qui s'y passe
vraiment (une des cinq séances, la séance bonus, padel, repos, absent), et « Décaler les
séances à partir de… » pousse le reste d'un cran en sautant les jours où tu n'es pas là.
L'app dit ce qui ne rentre plus. « Remettre la semaine type » rétablit le programme.

**La séance bonus** est le jour en plus : arrière d'épaule, rotation externe, mollets,
grip, curl léger, mobilité. Jamais lourde, pour ne pas abîmer la séance du lendemain.
Ses charges sont suivies à part, le padel ne la rabote pas, et si elle saute elle ne
crée pas de dette.

Quand une séance ne rentre pas, l'app garde les plus importantes (jambes, pec, dos,
épaules, force dans cet ordre) et retient celle qui a sauté : la semaine suivante elle
repasse devant. Tant qu'elle n'est pas au planning, une ligne « En retard » propose de
la placer.

## Le bilan hebdomadaire

À la première ouverture d'une nouvelle semaine, une carte apparaît sous le titre de la
séance. Elle porte sur la **dernière semaine complète, du lundi au dimanche**, quel que
soit le jour où on l'ouvre : séances, séries, tonnage (et ceux de la semaine d'avant),
charges montées, fourchettes bouclées qui feront monter la charge à la prochaine séance,
exercices à surveiller (répétitions en recul, ou palier), sortie la plus longue,
tendance du poids.

Un exercice ne peut pas être à la fois « monté » et « à surveiller », et un exercice
qui gagne des répétitions à charge égale n'est pas bloqué : c'est exactement la règle
qui fait monter les charges.

« Démarrer la nouvelle semaine » referme la carte et remet le planning type.

## Le questionnaire d'accueil

Il ne s'adresse **qu'aux nouveaux arrivants**. Une installation qui porte déjà la
moindre donnée ne le voit jamais : le verrou est posé au premier chargement et ne se
relâche pas, même si les données sont effacées ensuite.

Six questions : objectif, ancienneté, jours disponibles, matériel, articulation à
ménager, poids de corps. Il en sort une semaine type, la composition de chaque séance,
des charges de départ et la phase à suivre. Vérifié sur les 864 combinaisons de réponses :

- **Le matériel ne supprime pas, il remplace** d'abord.
- **Une articulation sensible retire ET remplace** : genoux fragiles → la presse prend
  la place du squat.
- **Jamais deux fois le même mouvement** sous deux habillages.
- **Jamais moins de trois exercices**, et chaque séance travaille ce que son nom annonce.
- **Rien ne s'ajoute à une séance intacte.**

## Tes données

Stockées dans le téléphone. **Réglages → Exporter** avant toute suppression de l'app :
iOS efface le stockage en même temps. Au premier lancement de la 5.0, ce que
l'alimentation avait enregistré (plan de repas, aliments, courses, compléments) est
retiré ; séances, charges, pesées, courses à pied et planning sont conservés tels quels.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | structure, styles, police des chiffres embarquée |
| `data.js` | version, programme, exercices, phases, saison |
| `anat.js` | corps en SVG, muscles par exercice, consignes d'exécution et de sécurité |
| `mouv.js` | gestes animés (fichier d'attente en 5.0) |
| `app.js` | calculs : progression, état des exercices, tendance du poids, bilan, planning, chrono |
| `onb.js` | questionnaire d'accueil et génération du programme |
| `ui.js` | écrans et interactions |
| `sw.js` | hors ligne |
| `manifest.webmanifest`, `icon-192.png`, `icon-512.png` | nom, couleurs et icône |

**Tous les fichiers sont à mettre sur GitHub.** Si l'un manque, l'app ne s'ouvre pas :
`index.html` les charge tous.
