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

## Tes données

Stockées dans le téléphone. **Réglages → Exporter** avant toute suppression de l'app :
iOS efface le stockage en même temps.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | structure et styles |
| `data.js` | aliments, plan de repas, programme, phases, cures |
| `app.js` | calculs : macros, progression, poids, courses, bilan, code-barres |
| `ui.js` | écrans et interactions |
| `sw.js` | hors ligne |
| `manifest.webmanifest` | nom et icône |
