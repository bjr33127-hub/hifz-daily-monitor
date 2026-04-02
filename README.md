# Hifz Daily Monitor

Version anglaise : [README.en.md](README.en.md)

Application locale de monitoring quotidien pour le hifz.

Elle ne memorise pas a ta place. Elle organise la journee, suit la progression, trace les erreurs sur de vraies pages du mushaf de Medine, puis repropose ces erreurs avec une repetition espacee.

## Ce que l'application gere

- plan du jour en ordre strict :
  1. `Ancien`
  2. `Consolidation`
  3. `Recent`
  4. `Veille`
  5. `Nouveau`
- bloc `Nouveau` en `3 vagues` de `3 validations`
- parcours configurables :
  1. `Debut -> fin`
  2. `Fin -> debut`
  3. `Fin -> debut puis debut -> fin`
- progression double avec compteurs separes par phase
- journee cloturee sans nouveau avec `Ne rien memoriser aujourd'hui`
- carte des pages regroupee par `juz`, reductible, avec etats, sourates et zones du programme
- editeur `page reelle` pour placer une erreur exactement sur la page du Quran de Medine
- types d'erreurs : `Harakats`, `Mot`, `Ligne entiere`, `Liaison page suivante`
- revue des erreurs avec `FSRS`, revele progressif des masques et bibliotheque de toutes les pages fragiles
- mini-jeu sur l'ordre des sourates avec :
  - mode `Avant / apres`
  - mode `Memo 7 sourates`
  - serie, flammes, paliers et plage de sourates configurable

## Ce que l'app prend en entree

- `Page actuelle`
- `Moitie actuelle`
- `Parcours`
- `Phase actuelle`
- `Nouveau / jour (en demi-pages)`
- `Jour du programme`
- `Total de demi-pages`
- `Langue` : francais ou anglais

## Ce que l'app montre

- le bloc d'ancien du jour, sur un roulement automatique en `7 parties`
- la consolidation `J-8 -> J-30`, decoupee en `3 parties`
- le recent `J-1 -> J-7`
- la veille `J-1`
- le nouveau du jour avec ses `9 validations`
- une carte compacte des pages du Coran avec regroupement par `juz`
- les noms de sourates et les reperes de programme directement sur la grille
- une revue ciblee des erreurs avec masques et rappel espace

## Captures

### Vue Aujourd'hui

![Vue Aujourd'hui](docs/screenshots/today-view.png)

### Vue Pages

![Vue Pages](docs/screenshots/pages-view.png)

### Vue Revoir Ses Erreurs

![Vue Revoir Ses Erreurs](docs/screenshots/review-view.png)

### Vue Mini Jeu

![Vue Mini Jeu](docs/screenshots/minigame-view.png)

### Vue Parametres

![Vue Parametres](docs/screenshots/settings-view.png)

## Lancer l'app

```powershell
node src/server.js
```

Puis ouvre [http://127.0.0.1:3100](http://127.0.0.1:3100).

## Stockage

L'etat local est garde dans :

- `data/state.json`

Il n'y a pas de base SQL ni de moteur externe : seulement un suivi local, lisible, et pense pour une routine quotidienne de hifz.
