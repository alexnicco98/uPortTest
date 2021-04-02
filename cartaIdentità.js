const express = require('express')
const bodyParser = require('body-parser')
const ngrok = require('ngrok')
const decodeJWT = require('did-jwt').decodeJWT
const { Credentials } = require('uport-credentials')
const transports = require('uport-transports').transport
const message = require('uport-transports').message.util
const messageLogger = (message, title) => {
  const wrapTitle = title ? ` \n ${title} \n ${'-'.repeat(60)}` : ''
  const wrapMessage = `\n ${'-'.repeat(60)} ${wrapTitle} \n`
  console.log(wrapMessage)
  console.log(message)
}

let endpoint = ''
// creo l'applicazione web che funzionerà da server HTTP e
// gestirà le richieste di GET, di POST, ecc
const app = express();
/* app.use([path], [callback])
   registra una o più funzioni specificate al percorso indicato
   ---------------------------------------------------------------------------------------------
   Argomento         	Descrizione                                                   	Default
   path          Il percorso per il quale viene invocata la funzione middleware       '/' (root path)
   callback      Funzioni di callback                                                  niente
   ----------------------------------------------------------------------------------------------
   bodyParser.json([options])
   Restituisce il middleware(modulo) che analizza solo json e guarda solo le richieste
   in cui l'intestazione Content-Type corrisponde all'opzione type.
   L'opzione type è usata per determinare il tipo di media che il middleware(modulo)
   analizzerà, in questo caso specifico il tipo di file multimediale è uno qualunque*/
app.use(bodyParser.json({ type: '*/*' }))
var access_token = ''

// creazione identità
/*
    const {did, privateKey} = Credentials.createIdentity()
    console.log(`private key: ${privateKey}, did: ${did}`)
*/

// restituisce la stringa della data nel formato dd/mm/yy
function dataTransform(date){
    day=date.getDate();
    month=date.getMonth();
    month=month+1;
    if((String(day)).length==1)
    day='0'+day;
    if((String(month)).length==1)
    month='0'+month;

    dateT=day+ '.' + month + '.' + date.getFullYear();
    return String(dateT);
}

// trasforma il numero di mesi inserito in secondi
function monthsInSeconds(num) {
    var hour = 60 * 60 ,
        day = hour * 24,
        month = (day * 30);

    return (num * month);
};

// restituisce la data di oggi
function dateNow(){
    var date=new Date();
    return dataTransform(date);
}

// genera una stringa alfanumerica casuale di lunghezza lenght
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

// genra una data compresa tra start ed end, viene restituita come dd/mm/yy
function randomDate(start, end) {
    var date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return dataTransform(date);
}

// restituisce la data esatta tra num anni, nel formato dd/mm/yy
function futureDate(num){
    var date = new Date(new Date().setFullYear(new Date().getFullYear() + num));
    return dataTransform(date);
}

// setup dell'oggetto Credentials con l'identità del Laboratorio di Test
const credentials = new Credentials({
    appName: 'cartaIdentità',
    did: 'did:ethr:0x0ab49996b75d23f19d63295c63627e0e151ea4c2',
    privateKey: '8739b83ea88468ff9a5895aa795f18e6384b0593d79a14a5e4ee6d938cc2715a'
})

/*  app.get([path], [callback])
    Instrada le richieste HTTP GET al percorso specificato con le funzioni di callback specificate.
    ---------------------------------------------------------------------------------------------
    Argomento         	Descrizione                                                   	Default
    path          Il percorso per il quale viene invocata la funzione middleware       '/' (root path)
    callback      Funzioni di callback                                                  niente
    ----------------------------------------------------------------------------------------------
    */
app.get('/', (req, res) => {
  // creazione di una richiesta di informazioni, richiedere il token
  // della notifica push e una nuova chiave
  credentials.createDisclosureRequest({
    notifications: true, // boolean per la possibilità di inviare notifiche push
    accountType: 'keypair', // Tipo di account Ethereum: "general", "segregated", "keypair", or "none"
    callbackUrl: endpoint + '/callback', // l'url che si desidera ricevere per la risposta di questa richiesta
    claims: {
        user_info: {
            name: { essential: true, reason: "Per verificare il nome"},
            country: null,
            email: { essential: true, reason: "Per contattare l'utente"},
            phone: { essential: true, reason: "Per contattare l'utente"}
        }
    }
  }).then(disclosureRequestJWT => {

    //creazioine codice QR con le informazioni richieste.
    /*  message.paramsToQueryString([url], [params])
        Aggiunge parametri come parametri della query url
        ---------------------------------------------------------------------------------------------------------------
        Argomento         	                     Descrizione                              	                  Default
        url                                         un url                                                     niente
        params           parametri oggetti di parametri validi da aggiungere come parametri di query url       niente
        --------------------------------------------------------------------------------------------------------------
        message.messageToURI([message], [type])
        Avvolge un JWT in un URI di richiesta secondo lo schema specificato
        ---------------------------------------------------------------------------------------------
        Argomento         	             Descrizione                              	Default
        message                 Il messaggio da codificare in uri                    niente
        type                    'universal' or 'deeplink'                            niente
        ----------------------------------------------------------------------------------------------
    */
    const uri = message.paramsToQueryString(message.messageToURI(disclosureRequestJWT), {callback_type: 'post'})
    /*  transport.ui.getImageDataURI([data])
        Data una stringa di dati restituisce un'immagine URI, ovvero un codice QR.
        Un immagine URI può essere visualizzato in un tag html img impostando
        l'attrbiute src sull'URI immagine.
    */
    const qr =  transports.ui.getImageDataURI(uri)
    res.send(`<div><img src="${qr}"/></div>`)
  })
})

/*  app.post([path], [callback])
Instrada le richieste HTTP POST al percorso specificato con le funzioni di callback specificate.
---------------------------------------------------------------------------------------------
Argomento         	Descrizione                                                   	Default
path          Il percorso per il quale viene invocata la funzione middleware       '/' (root path)
callback      Funzioni di callback                                                  niente
----------------------------------------------------------------------------------------------
*/
app.post('/callback', (req, res) => {
  access_token = req.body.access_token
  /* credentials.authenticateDisclosureResponse([token], [callback])
    Autenticazione di risposta alla comunicazione selettiva JWT dal client
    uPort come parte del flusso di divulgazione selettiva
  */
  var rString = randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  var sBirth = randomDate(new Date(1950, 0, 1), new Date(2001, 0, 1))
  credentials.authenticateDisclosureResponse(access_token).then(userProfile => {
    // attestazione riguardante il client corrispondente a userProfile.did
    const attestation = {
      sub: userProfile.did,             // soggetto attestazione
      claim: {
        cartaIdentità:{
          name: 'CartaIdentità',
          releaseBy: 'Comune di Prova',
          releaseDate: dateNow(),
          expDate: futureDate(10),
          fiscalCode: rString,
          sex: 'maschio',
          dateOfBirth: sBirth,
          communeOfBirth: 'Comune di Prova'
         }
      }
    }
    /*  credentials.createVerification([{ sub, claim, exp, vc, callbackUrl }])
        Crea una credenziale (un JSON web token firmato)
        ---------------------------------------------------------------------------------------------
        Argomento         	                       Descrizione                                	Default
        credential                       un oggetto claim non firmato                           niente
        ----------------------------------------------------------------------------------------------

        l'oggetto claim è a sua volta diviso in:

        credential.sub              soggetto della credenziale (un DID valido)
        credential.claim     claim riguardo un singolo soggetto o mappatura chiave ad
                                         un oggetto con valori multipli
        credential.exp                 tempo in secondi dopo il quale scade il claim
        ----------------------------------------------------------------------------------------------
    */
    credentials.createVerification(attestation)
    .then( credential => {
      /*  transports.push.send([token], [pubEncKey], [pushServiceUrl=PUTUTU_URL])
          Una notifica push di trasporto per inviare richieste al client uPort
          di un utente specifico per il quale è stato dato un valido push token.
          ------------------------------------------------------------------------------------------------------------------------------
          Argomento         	                Descrizione                                                  Default
          token                        un token di notifica push                                             niente
          pubEnckey                  la chiave di cifratura pubblica del ricevitore, codificata
                                     come stringa di base64, trovata nel documento DID                       niente
          pushServiceUrl=PUTUTU_URL         l'url del servizio push                               PUTUTU a https://api.uport.me/pututu/sns/
          ------------------------------------------------------------------------------------------------------------------------------
         */
      const pushTransport = transports.push.send(userProfile.pushToken, userProfile.boxPub)
      messageLogger(credential, `Attestazione codificata mandata all'utente  (JWT firmato)`)
      messageLogger(decodeJWT(credential), `Payload dell'Attestazione decodificata`)
      return pushTransport(credential)
    })
    .then(pushData => {
      messageLogger(`La notifica di push con allegata l'attestazione arriverà in un momento`)
      ngrok.disconnect()
    })
  })
})

/*  app.listen([port])
    esegue la parte server, collegando e ascoltando le connessioni sull'host e sulla porta specificati
    Default:    viene assegnata una porta libera
*/
const server = app.listen(8088, () => {
  // espone un server web locale in internet che corrisponde alla porta indicata
  ngrok.connect(8088).then(ngrokUrl => {
    endpoint = ngrokUrl
    console.log(`Login Service running, open at ${endpoint}\n`)
  }).catch(error => console.error(error))
})
