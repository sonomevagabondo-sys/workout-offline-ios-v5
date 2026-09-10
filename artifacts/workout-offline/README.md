# Workout Offline

App mobile iOS-first per registrare allenamenti senza account, backend o cloud. I dati restano sul dispositivo tramite AsyncStorage.

## Architettura

- Expo Router + React Native, con tre tab: Allenamento, Statistiche e Profilo.
- React Context per lo stato condiviso e AsyncStorage per la persistenza locale.
- `domain/workout.ts` contiene i tipi e le regole pure di date, ciclo, serie, volume, streak e 1RM.
- UI con componenti native, safe area, haptic feedback e tema scuro/chiaro.

## Regole implementate

- Programma default di 7 giorni: Upper, Lower, Rest, Upper, Lower, Rest, Rest.
- Ogni serie ha peso e ripetizioni indipendenti; i valori non vengono copiati dal ciclo precedente.
- Il completamento è disponibile solo per il giorno corrente e quando tutte le serie sono complete.
- I giorni passati di allenamento diventano Saltati e non sono recuperabili.
- Dopo 7 giorni il ciclo viene archiviato e riparte con serie vuote.
- Streak, record personale, conferma dei pesi già salvati e dialog di perdita streak.
- Programma personalizzato da 7 giorni con catalogo esercizi per gruppo muscolare.
- Statistiche di volume, progressione, record e distribuzione muscolare.

## Esecuzione

```bash
pnpm install
pnpm --filter @workspace/workout-offline run dev
```

Per il controllo TypeScript:

```bash
pnpm --filter @workspace/workout-offline run typecheck
```

## Scelte

La base mobile del progetto usa Expo/React Native per fornire un’anteprima iOS immediata nel workspace; la logica di dominio è indipendente dalla UI e può essere portata in un’app Flutter senza cambiare le regole.