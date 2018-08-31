var express = require('express');
var router = express.Router();
var lodash = require('lodash');
var config = require('config');
var Client = require('bitcoin-core');

var commands = [
  'getinfo',
  'getbalance',
  'walletpassphrase',
  'sendtoaddress',
  'listtransactions',
  'listreceivedbyaddress',
  'encryptwallet',
  'walletpassphrasechange',
  'backupwallet',
];

var settings = config.get('client');

var navClient = new Client({
  username: settings.navCoin.user,
  password: settings.navCoin.pass,
  port: settings.navCoin.port,
  host: settings.navCoin.host,
})

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Available endpoints - /rpc:POST');
});

router.post('/rpc', function(req, res, next) {

  //check if logged in.
  //JWT.
  //BCrypt hashed password on disk.

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

  //forward request to the navcoin cli
  navClient.command(...args).then((response) => {
    var response = {
      type: 'SUCCESS',
      code: 'RPC_002',
      message: 'Successful Request',
      data: response,
    }
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
