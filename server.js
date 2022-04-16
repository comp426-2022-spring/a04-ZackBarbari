const express = require('express')
const app = express()
const args = require('minimist')(process.argv.slice(2))
const db = require("./database.js")

args["port"]
args["argument"]

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)

if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

const port = args.port || process.env.PORT || 5555;

const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%', port))
});

const log = (req, res, next) => {
  const query = db.prepare(`
  INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  )
  const json = query.run(req.ip, req.user, Date.now(), req.method, req.url, req.httpVersion, req.protocol, req.statusCode, req.headers['referers'], req.headers['user-agent']
  )
  next()
}

app.use(log)

app.get('/app/', (req, res) => {
      res.statusCode = 200;
      res.statusMessage = 'OK';
      res.end(res.statusCode+ ' ' +res.statusMessage);
      res.type("text/plain");
});

function coinFlip() {
    if (Math.random() >= 0.5) {
      return "heads"
    } else {
      return "tails"
    }
}
  
function coinFlips(flips) {
    const values = []
    for (let i = 0; i < flips; i++) {
      values[i] = coinFlip()
    }
    return values
}
  
function countFlips(array) {
    let count = { heads: 0, tails: 0 }
  array.forEach(element => 
    { if (element == "heads") {
      count.heads += 1
    } else {
      count.tails += 1
    }
   })
   return count
}
  
function flipACoin(call) {
    let coin = { call: call, flip: "NULL", result: "NULL"}
    let flip = coinFlip()
    coin.flip = flip
    if (call == flip) {
      coin.result = "win"
    } else {
      coin.result = "lose"
    }
    return coin
}

app.get('/app/flip/', (req, res) => {
  const flip = coinFlip()
	res.status(200).json({"flip" : flip})
});

app.get('/app/flips/:number', (req, res) => {
  const flips = coinFlips(req.params.number)
  const counted = countFlips(flips)
  res.status(200).json({"raw" : flips, "summary" : counted})
});

app.get('/app/flip/call/:call', (req, res) => {
  const called = flipACoin(req.params.call)
  res.status(200).json({called})
});

app.use(function(req, res){
  res.statusCode = 404;
      res.statusMessage = 'NOT FOUND';
      res.end(res.statusCode+ ' ' +res.statusMessage);
      res.type("text/plain");
});