# Roadmap Web, Desktop, Mobile

## Objectif

Construire une trajectoire realiste pour sortir :

- une version web plus propre et portable
- une version desktop Windows et macOS
- une version mobile Android et iOS

## Etat actuel

L'application est aujourd'hui un produit web local :

- front statique dans `public/`
- logique metier dans `src/lib/plan.js`
- stockage et repetition espacee dans `src/storage/store.js`
- serveur HTTP Node dans `src/server.js`
- persistance via un fichier JSON

Cette base est viable pour une app desktop empaquetee, mais pas encore pour une app mobile proprement distribuable.

## Livrable 1 - Web portable

### But

Rendre l'application moins dependante d'un serveur Node local et preparer une future PWA.

### Travaux

1. Introduire une vraie abstraction de persistance.
2. Separer l'acces aux donnees du rendu UI.
3. Extraire `public/app.js` en modules par vue.
4. Ajouter manifest, icones et service worker.
5. Ajouter une gestion explicite du mode hors ligne.

### Resultat attendu

Une app web capable de fonctionner comme produit heberge, avec stockage isole par utilisateur.

## Livrable 2 - Desktop Electron

### But

Sortir rapidement :

- un `.exe` Windows
- une app macOS empaquetee

### Travaux

1. Emballer l'app dans Electron.
2. Lancer le serveur local en processus integre.
3. Stocker les donnees utilisateur dans un dossier systeme dedie.
4. Ajouter packaging Windows et macOS.

### Etat

Phase demarree dans cette branche.

## Livrable 3 - Refacto stockage

### But

Rendre la logique de donnees portable entre :

- web
- desktop
- mobile

### Travaux

1. Sortir le stockage fichier du coeur metier.
2. Definir une interface unique de repository.
3. Ajouter un adaptateur web.
4. Ajouter un adaptateur desktop.
5. Ajouter un adaptateur mobile.

### Resultat attendu

Le coeur metier ne depend plus de `fs` ni d'un serveur HTTP local.

## Livrable 4 - Mobile Capacitor

### But

Sortir Android puis iOS sur un socle plus propre.

### Travaux

1. Integrer Capacitor.
2. Repenser la navigation mobile ecran par ecran.
3. Gerer le stockage local mobile.
4. Mettre en cache les assets Mushaf critiques.
5. Adapter les interactions tactiles, safe areas et cycle de vie app.

### Resultat attendu

Une vraie app mobile web-first, pas un simple emballage du site.

## Ordre recommande

1. Desktop Electron
2. Refacto du stockage
3. Web portable / PWA
4. Android
5. iOS
