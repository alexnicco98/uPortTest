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

// creazione identità
/*
    const {did, privateKey} = Credentials.createIdentity()
    console.log(`private key: ${privateKey}, did: ${did}`)
*/

// setup dell'oggetto Credentials con l'identità dell'Aeroporto
const credentials = new Credentials({
    appName: 'Aeroporto',
    did: 'did:ethr:0x349877b13d097ff2dcfc8ab759f6acd8e63ae329',
    privateKey: 'b50e89a29a69070a5a34b89fcbbd8b8f6ba89ed28ad68ac82984c6ce62120b1d'
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
    //verified: ['laboratorioTest','name','passaportoTest'], // titolo del claim
    claims: {
        passaportoTest: {
            essential: true,
            reason: 'Per poter prendere il volo'
        },
        user_info: {
            name: { essential: true, reason: "Per controllare il nome"},
            email: null,
            country: null
        },
        laboratorioTest:{
            essential: true,
            reason: 'Per verificare attestazione del vaccino'
        }
    },
    callbackUrl: endpoint + '/callback' // l'url che si desidera ricevere per la risposta di questa richiesta
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
    //vissualizzo il token richiesto nella console prima quello codificato e dopo quello decodificato
    messageLogger(disclosureRequestJWT, 'Richiesta URI codificata da inviare al client uPort (JWT firmato incapsulato con un URI)')
    messageLogger(decodeJWT(disclosureRequestJWT), 'Token di richiesta decodificato')
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
  const jwt = req.body.access_token
  messageLogger(jwt, 'Token di risposta (JWT firmato)')
  messageLogger(decodeJWT(jwt), 'Token di risposta decodificato')
  credentials.authenticateDisclosureResponse(jwt).then(creds => {
    messageLogger(creds, 'Risposta di uPort analizzata e verificata')
    messageLogger(creds.verified[0], 'Attestazione richiesta')
    messageLogger('Attestazione verificata')
  }).catch( err => {
    messageLogger('Verifica fallita')
  })
})




/*  app.listen([port])
    esegue la parte server, collegando e ascoltando le connessioni sull'host e sulla porta specificati
    Default:    viene assegnata una porta libera
*/
const server = app.listen(8089, () => {
  // espone un server web locale in internet che corrisponde alla porta indicata
  ngrok.connect(8089).then(ngrokUrl => {
      endpoint = ngrokUrl
      console.log(`Login Service running, open at ${endpoint}`)
  }).catch(error => console.error(error))
})
