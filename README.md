# uPort - Un semplice caso d'uso        
![GitHub repo size](https://img.shields.io/github/repo-size/Crostatus/Jitter) ![GitHub](https://img.shields.io/github/license/Crostatus/Jitter) ![GitHub top language](https://img.shields.io/github/languages/top/Crostatus/Jitter?color=red)
 
 ## Introduzione   
 Questo è un caso d'uso realizzato per la tesi, in cui andremo ad utilizzare il nuovo modello di identità digitale Self Sovereign Identity. Quello che vogliamo fare è, andare ad effettuare il vaccino per il COVID-19 ed in seguito prendere un volo in cui è richiesta una certificazione che attesta il vaccino fatto. Andremo ad utilizzare l'app fornita da uPort (disponibile su Android e IOS).Nel dettaglio andremo a dividere  il test in due parti:
 
1.  La prima riguarda l'interazione con un dipendende di un centro abilitato per fare vaccini. Si assume che abbiamo un appuntamento già fissato. Arrivata la data stabilita ci troviamo di fronte al dipendente, scansionando un codice QR ci arriva nella nostra app una richiesta di informazioni da condividere con il centro per i vaccini. Una volta accettata ed effettuato il vaccino, il centro vaccini ci rilascia un'attestazione del vaccino appena effettuato direttamente nell'app.
2. La seconda parte riguarda invece lo scambio di informazioni con l'aeroporto. Anche qui sarà presente una prima fase in cui l'utente scansiona il codice QR e gli arriva una richiesta di informazioni neccessarie all'aeroporto. Tra queste informazioni sarà presente alla l'attestazione del vaccino fatta in precedenza. Una volta accettata l'aeroporto provvederà ad effettuare la verifica della validità di tale attestazione. E se tutto è andato bene l'utente proseguira il volo.

## Come eseguire il codice
Per proseguire con il test è necessario scaricare sul proprio dispositivo mobile l'app di uPort (su Android è disponibile direttamente sul play store).   

Anche in questa parte divideremo il test in due parti, con le rispettive cartelle. Dopo aver scaricato la repository, iniziamo con una fase di setup di due attestazione che sarannò usate successivamente nella parte di test vero e proprio.

### Setup:
Prima di tutto usando due credenziali già impostate all'interno dei file _cartaIdentità.js_ e _passaporto.js_ creiamo due attestazione. Una che rigiarda una carta d'Identità che sarà richiesta dopo dal laboratorio per controllare la persona che si presenta per il vaccino, ed un passaporto che sarà usato dall'aeroporto insieme all'attestazione rilasciata dal laboratorio in cui è stato effettuato il vaccino per controllare la persona e verificare i suoi dati.

Una volta aperto il terminare all'interno della repository appena scaricata, per avviare l'interazione che ci rilascerà la nostra carta d'identità digitale, basta digitare: <br />
`npm i`    		<br />
`npm run start1`  		<br />

La procedura sarà sempre uguale: <br /><br />
1. Aprire il link generato dal terminale <br />
2. Scansionare il codice QR tramite l'app di uPort  (essendo il primo login dovremmo inserire delle informazioni che verranno legate alla nostra identità (nome, email,ecc).)<br />
3. Accettare la richiesta di informazioni arrivata sull'app <br />
4. Accettare l'attestazione


Una volta finito, passiamo a quella del passaporto: <br />
`npm run start2`  		<br />

Una volta terminato il procedimento siamo pronti per il vero test.

### Test:

Iniziamo dalla parte del laboratorio<br /> Entriamo all'interno della cartella ed eseguiamo il codice (che avvierà il server del laboratorio) con <br />
`cd laboratorio` <br />
`npm i`    		<br />
`npm start`  		<br />

Prediamo ora l'applicazione uport precedentemente scaricata. 
Una volta finito siamo pronti per aprire il codice QR di cui troveremo il link generato nel terminale, lo apriamo e scansionamo il codice QR.
Ci verrà inviata una richiesta di informazioni, una volta accettata, ci verrà inviata un'attestazione per provare che abbiamo fatto il vaccino e una volta accettata sarà disponibile tra le attestazioni nella home dell'applicazione.
2. Nella seconda parte andremo a interagire con il dipendente dell'aeroporto che verificherà l'attestazione che riguarda il vaccino. Quindi torniamo indietro ed andiamo nella carte specifica. <br />
`cd ..` <br />
`cd aeroporto` <br />
`npm i`    		<br />
`npm start`  		<br />
Torniamo nell'applicazione e scansioniamo il codice QR che troviamo al link generato nel terminale. Dopo di che, accettiamo la richiesta di informazioni. Una volta che il server dell'aeroporto avrà verificato le informazioni, riporterà l'esito sul terminale.
