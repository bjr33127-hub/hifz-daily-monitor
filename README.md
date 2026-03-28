# Hifz Daily Monitor

Application locale de monitoring quotidien.

Elle prend seulement :

- `currentHalfPage`
- `dailyNewHalfPages`
- `programDayIndex`
- `totalHalfPages`

Puis elle calcule automatiquement, dans cet ordre exact :

1. `Ancien`
2. `Consolidation`
3. `Recent`
4. `Veille`
5. `Nouveau`

Le `Nouveau` contient 3 vagues, avec 3 validations par vague.

Le bloc d'`Ancien` est decoupe en `7 parties equilibrees` des qu'il existe, avec rotation automatique sur tout le pool d'ancien, sans curseur manuel.

## Lancer l'app

```powershell
node src/server.js
```

Puis ouvre `http://127.0.0.1:3100`.

## Stockage

L'etat est garde dans :

- `data/state.json`

Pas de base SQL, pas de moteur complexe, juste un monitoring quotidien strict.
