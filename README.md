# Hifz Daily Monitor

Application locale de monitoring quotidien pour le hifz.

Elle ne sert pas a apprendre a ta place. Elle calcule simplement ce qu'il faut reciter aujourd'hui a partir de la position actuelle dans le programme, dans cet ordre strict :

1. `Ancien`
2. `Consolidation`
3. `Recent`
4. `Veille`
5. `Nouveau`

Le `Nouveau` contient `3 vagues`, avec `3 validations` par vague.

## Ce que l'app prend en entree

- `Page actuelle`
- `Moitie actuelle`
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
- une carte compacte des pages du Coran avec reperes de programme et erreurs

## Captures

### Vue Aujourd'hui

![Vue Aujourd'hui](docs/screenshots/today-view.png)

### Vue Pages

![Vue Pages](docs/screenshots/pages-view.png)

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

Il n'y a pas de base SQL ni de moteur externe : seulement un tableau de monitoring quotidien strict, local et lisible.
