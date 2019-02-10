var express = require('express');
var router = express.Router();
// var lodash = require('lodash');
var config = require('config');
var Client = require('bitcoin-core');
var jwt = require('jsonwebtoken');
var fs = require('fs');

const commands = [
  'getinfo',
  'getbalance',
  'getwalletinfo',
  'walletpassphrase',
  'sendtoaddress',
  'listtransactions',
  'listreceivedbyaddress',
  'encryptwallet',
  'walletpassphrasechange',
  'backupwallet',
];

//@TODO: remove data.body being parsed back
//@TODO: hash the username and password
//@TODO: enable https
//@TODO: write the new auth details to disk

const settings = config.get('client');

console.log(settings)
var navClient = new Client({
  username: settings.navCoin.user,
  password: settings.navCoin.pass,
  port: settings.navCoin.port,
  host: settings.navCoin.host,
})

router.use(function(req, res, next) {

  //skip token middleware on auth attempt
  if(req.originalUrl == '/api/auth'){
    next();
    return
  }

  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    var auth = fs.readFileSync("./config/auth.json");
    var authJson = JSON.parse(auth);
    // verifies secret and checks exp
    jwt.verify(token, authJson.secret, function(err, decoded) {
      if (err) {
        var response = {
          type: 'ERROR',
          code: 'JWT_001',
          message: 'Invalid Token',
          data: req.body,
        }
        res.send(JSON.stringify(response));
        return
      } else {
        // if everything is good, save to request for use in other routes
        console.log('TOKEN AUTHENTICATED');
        next();
        return
      }
    });

  } else {

    var response = {
      type: 'ERROR',
      code: 'JWT_002',
      message: 'No Token Provided',
      data: req.body,
    }
    res.send(JSON.stringify(response));
    return

  }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Available endpoints [auth, rpc]');
});

router.post('/auth', function(req, res, next) {

  //check username and password
  var auth = fs.readFileSync("./config/auth.json");
  var authJson = JSON.parse(auth);

  if (!req.body || !req.body.username || !req.body.password){
    var response = {
      type: 'ERROR',
      code: 'AUTH_001',
      message: 'Invalid Request',
      data: req.body,
    }
    res.send(JSON.stringify(response));
    return
  }

  if (authJson.username != req.body.username || authJson.password != req.body.password) {
    var response = {
      type: 'ERROR',
      code: 'AUTH_002',
      message: 'Invalid Username or Password',
      data: req.body,
    }
    res.send(JSON.stringify(response));
    return
  }

  const data = {
    user: authJson.username,
  }

  const token = jwt.sign(data, authJson.secret, {
    expiresIn: 60*60*24,
  });

  //check password is valid
  var response = {
    type: 'SUCCESS',
    code: 'AUTH_002',
    message: 'Successful Login',
    data: data,
    token: token,
  }

  res.send(JSON.stringify(response));
  return

});

router.post('/rpc', function(req, res, next) {
  console.log(`'/rpc called: ${req.body.command}`)
  //check if command on allowed list
  if (!req.body || !req.body.command || commands.indexOf(req.body.command) == -1){
    var response = {
      type: 'ERROR',
      code: 'RPC_001',
      message: 'Invalid Request',
      data: req.body,
    }
    res.send(JSON.stringify(response));
    return
  }

  var args = [req.body.command];

  //add params if they exist
  if (req.body.params) args = args.concat(req.body.params);
  
  console.log('Args:', args)
  //forward request to the navcoin cli
  navClient.command(...args).then((data) => {
    var response = {
      type: 'SUCCESS',
      code: 'RPC_002',
      message: 'Successful Request',
      data: data,
    }
    console.log('success')
    res.send(JSON.stringify(response));
    return
  }).catch((err) => {
    var response = {
      type: 'ERROR',
      code: 'RPC_003',
      message: 'RPC Error',
      data: {'error': err.code, 'message': err.message},
    }
    res.send(JSON.stringify(response));
    return
  });
});

module.exports = router;
