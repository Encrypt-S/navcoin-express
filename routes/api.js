const getMainAddress = require('./get-main-address');
const setMainAddress = require('./set-main-address');

const express = require('express');
const router = express.Router();
// const lodash = require('lodash');
const config = require('config');
const Client = require('bitcoin-core');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const bcrypt = require('bcrypt');

const WALLET_CONFIG_PATH = '/home/odroid/.navcoin4/navcoin.conf';

const RPC_COMMANDS = [
  'walletlock',
  'walletpassphrase',
  '￼getaddressbalance',
  'getaddressdeltas',
  'getaddressmempool',
  'getaddresstxids',
  'getaddressutxosgetbestblockhash',
  'getblock',
  'getblockchaininfo',
  'getblockcountgetblockhash',
  'getblockhashes',
  'getblockheader',
  'getchaintips',
  'getdifficulty',
  'getmempoolancestors',
  'getmempooldescendants',
  'getmempoolentry',
  'getmempoolinfo',
  'getrawmempool',
  'getspentinfo',
  'gettxout',
  'gettxoutproof',
  'gettxoutsetinfo',
  'verifychain',
  'verifytxoutproof',
  'createpaymentrequest',
  'createproposal',
  'donatefund',
  'getpaymentrequest',
  'cfundstats',
  'getproposal',
  'listproposals',
  'paymentrequestvote',
  'paymentrequestvotelist',
  'proposalvote',
  'proposalvotelist',
  'getinfo',
  'help',
  'stopgenerate',
  'generatetoaddress',
  'staking',
  'coinstakeinputs',
  'coinstakeoutputs',
  'forcetransactions',
  'setcoinbasestrdzeel',
  'setcoinstakestrdzeel',
  'getmininginfo',
  'getnetworkhashps',
  'prioritisetransaction',
  'submitblock',
  'addnode',
  'clearbanned',
  'disconnectnode',
  'getaddednodeinfo',
  'getconnectioncount',
  'getnettotals',
  'getnetworkinfo',
  'getpeerinfo',
  'getstakesubsidy',
  'getstakinginfo',
  'listbanned',
  'ping',
  'setban',
  'decoderawtransaction',
  'decodescript',
  'fundrawtransaction',
  'getrawtransaction',
  'sendrawtransaction',
  'signrawtransaction',
  'createwitnessaddress',
  'estimatefee',
  'estimatepriority',
  'estimatesmartfee',
  'estimatesmartpriority',
  'signmessagewithprivkey',
  'validateaddress',
  'verifymessage',
  'addmultisigaddress',
  'addwitnessaddress',
  'anonsend',
  'backupwallet',
  'dumpmasterprivkey',
  'dumpprivkey',
  'dumpwallet',
  'encryptwallet',
  'getaccount',
  'getaccountaddress',
  'getaddressesbyaccount',
  'getanondestination',
  'getbalance',
  'getcoldstakingaddress',
  'getnewaddress',
  'getrawchangeaddress',
  'getreceivedbyaccount',
  'getreceivedbyaddress',
  'getstakereport',
  'gettransaction',
  'getunconfirmedbalance',
  'getwalletinfo',
  'importaddress',
  'importprivkey',
  'importprunedfunds',
  'importpubkey',
  'importwallet',
  'keypoolrefill',
  'listaccounts',
  'listaddressgroupings',
  'listlockunspent',
  'listreceivedbyaccount',
  'listreceivedbyaddress',
  'listsinceblock',
  'listtransactions',
  'listunspent',
  'lockunspent',
  'move',
  'removeprunedfunds',
  'resolveopenallias',
  'sendfrom',
  'sendmany',
  'sendtoaddress',
  'setaccount',
  'settxfee',
  'signmessage',
  'stakervote'
];

//@TODO: remove data.body being parsed back

const settings = config.get('client');

console.log(settings);
const navClient = new Client({
  username: settings.navCoin.user,
  password: settings.navCoin.pass,
  port: settings.navCoin.port,
  host: settings.navCoin.host
});

router.use(function(req, res, next) {
  console.log(`${req.originalUrl} called.`);

  //skip token middleware on auth attempt
  if (req.originalUrl == '/api/auth') {
    next();
    return;
  }

  const token =
    req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    fs.readFile('./config/auth.json', function(err, auth) {
      if (err) {
        const response = {
          type: 'ERROR',
          code: 'JWT_001',
          message: 'Failed to read auth file from disk',
          data: req.body
        };
        res.send(JSON.stringify(response));
        return;
      }

      var authJson = JSON.parse(auth);
      // verifies secret and checks exp
      jwt.verify(token, authJson.secret, function(err, decoded) {
        if (err) {
          var response = {
            type: 'ERROR',
            code: 'JWT_002',
            message: 'Invalid Token',
            data: req.body
          };
          res.send(JSON.stringify(response));
          return;
        }
        // if everything is good, save to request for use in other routes
        console.log('TOKEN AUTHENTICATED');
        next();
        return;
      });
    });
  } else {
    const response = {
      type: 'ERROR',
      code: 'JWT_002',
      message: 'No Token Provided',
      data: req.body
    };
    res.send(JSON.stringify(response));
    return;
  }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Available endpoints [auth, rpc]');
});

router.post('/auth', function(req, res, next) {
  //check username and password
  var auth = fs.readFileSync('./config/auth.json');
  var authJson = JSON.parse(auth);

  if (!req.body || !req.body.username || !req.body.password) {
    const response = {
      type: 'ERROR',
      code: 'AUTH_001',
      message: 'Invalid Request',
      data: req.body
    };
    res.send(JSON.stringify(response));
    return;
  }

  if (
    !bcrypt.compareSync(req.body.username, authJson.username) ||
    !bcrypt.compareSync(req.body.password, authJson.password)
  ) {
    const response = {
      type: 'ERROR',
      code: 'AUTH_002',
      message: 'Invalid Username or Password',
      data: req.body
    };
    res.send(JSON.stringify(response));
    return;
  }

  const data = {
    user: req.body.username
  };

  const token = jwt.sign(data, authJson.secret, {
    expiresIn: 60 * 60 * 24
  });

  //check password is valid
  const response = {
    type: 'SUCCESS',
    code: 'AUTH_002',
    message: 'Successful Login',
    data: data,
    token: token
  };

  res.send(JSON.stringify(response));
  return;
});

router.post('/rpc', function(req, res, next) {
  console.log(
    `${req.body.method} rpc method called with arguments: ${
      req.body.parameters
    }`
  );
  //check if command on allowed list
  if (
    !req.body ||
    !req.body.method ||
    RPC_COMMANDS.indexOf(req.body.method) == -1
  ) {
    const response = {
      type: 'ERROR',
      code: 'RPC_001',
      message: 'Invalid Request',
      data: req.body
    };
    res.send(JSON.stringify(response));
    return;
  }

  let args = [req.body.method];

  //add parameters if they exist
  if (req.body.parameters) args = args.concat(req.body.parameters);

  //forward request to the navcoin cli
  navClient
    .command(...args)
    .then(data => {
      const response = {
        type: 'SUCCESS',
        code: 'RPC_002',
        message: 'Successful Request',
        data: data
      };
      res.send(JSON.stringify(response));
      return;
    })
    .catch(err => {
      const response = {
        type: 'ERROR',
        code: 'RPC_003',
        message: 'RPC Error',
        data: { error: err.code, message: err.message }
      };
      res.send(JSON.stringify(response));
      return;
    });
});

router.post('/rpc/batch', (req, res, next) => {
  if (
    !req.body ||
    !req.body[0].method ||
    RPC_COMMANDS.indexOf(req.body[0].method) == -1
  ) {
    const response = {
      type: 'ERROR',
      code: 'RPC_004',
      message: 'Invalid Request',
      data: req.body
    };
    res.send(JSON.stringify(response));
    return;
  }

  let batchCommands = req.body;
  console.log('batch commands:', batchCommands);
  navClient
    .command(batchCommands)
    .then(responses => {
      const response = {
        type: 'SUCCESS',
        code: 'RPC_002',
        message: 'Successful Request',
        data: responses
      };
      res.send(JSON.stringify(response));
      return;
    })
    .catch(err => {
      const response = {
        type: 'ERROR',
        code: 'RPC_005',
        message: 'RPC Error',
        data: { error: err.code, message: err.message }
      };
      res.send(JSON.stringify(response));
      return;
    });
});

router.post('/get-main-address', function(req, res, next) {
  getMainAddress(req, res, navClient);
});

router.post('/set-main-address', function(req, res, next) {
  setMainAddress(req, res, navClient);
});

router.post('/generate-main-address', function(req, res, next) {
  navClient
    .command('getnewaddress')
    .then(data => {
      const addressJson = JSON.stringify({ address: data });
      console.log(data);
      fs.writeFile('./config/address.json', addressJson, 'utf8', function(err) {
        if (err) {
          const response = {
            type: 'ERROR',
            code: 'GENADR_002',
            message: 'Failed to write to disk',
            data: req.body
          };
          res.send(JSON.stringify(response));
          return;
        }
        const response = {
          type: 'SUCCESS',
          code: 'GENADR_001',
          message: 'Successful Request',
          data: `Main Address Updated to ${data}`
        };
        res.send(JSON.stringify(response));
        return;
      });
    })
    .catch(err => {
      const response = {
        type: 'ERROR',
        code: 'ADR_002',
        message: 'Failed to new address, RPC Error',
        data: { error: err.code, message: err.message }
      };
      res.send(JSON.stringify(response));
      return;
    });
});

router.post('/get-wallet-overview', (req, res, next) => {
  const batch = [
    { method: 'getblockchaininfo' },
    { method: 'getstakinginfo' },
    { method: 'getwalletinfo' },
    { method: 'help' },
    { method: 'getinfo' }
  ];
  navClient
    .command(batch)
    .then(responses => {
      const getBlockchainInfoData = responses[0];
      const getStakingInfoData = responses[1];
      const getWalletInfoData = responses[2];
      const getInfoData = responses[4];
      // the 'walletlock' command will only appear in 'help' if the wallet is is encrypted
      const isEncrypted =
        responses[3].indexOf('walletlock') === -1 ? false : true;

      const response = {
        type: 'SUCCESS',
        code: 'RPC_002',
        message: 'Successful Request',
        data: {
          walletVersion: getInfoData.version,
          walletChain: getBlockchainInfoData.chain,
          isUnlockedForStaking: getWalletInfoData.unlocked_for_staking,
          isEncrypted: isEncrypted,
          isLocked:
            getWalletInfoData.unlocked_until === 0 ||
            getWalletInfoData.unlocked_for_staking,
          isStaking: getStakingInfoData.staking && getStakingInfoData.enabled,
          currentBlock: getBlockchainInfoData.blocks
        }
      };
      res.send(JSON.stringify(response));
      return;
    })
    .catch(err => {
      const response = {
        type: 'ERROR',
        code: 'RPC_004',
        message: 'RPC Error',
        data: { error: err.code, message: err.message }
      };
      res.send(JSON.stringify(response));
      return;
    });
});

router.post('/get-wallet-config', (req, res, next) => {
  fs.readFile(WALLET_CONFIG_PATH, function(err, fileBuffer) {
    if (err) {
      const response = {
        type: 'ERROR',
        code: 'GET_WALLET_CFG_002',
        message: 'Failed to read wallet config file from disk',
        data: req.body
      };
      res.send(JSON.stringify(response));
      return;
    }
    const config = fileBuffer.toString();

    const response = {
      type: 'SUCCESS',
      code: 'GET_WALLET_CFG_001',
      message: 'RPC SUCCESS',
      data: { config: config }
    };

    res.send(JSON.stringify(response));
  });
});

router.post('/update-wallet-config', (req, res, next) => {
  if (!req.body || !req.body.config) {
    const response = {
      type: 'ERROR',
      code: 'UPDATE_WALLET_CFG_002',
      message: 'Invalid Args',
      data: req.body
    };
    res.send(JSON.stringify(response));
    return;
  }

  fs.writeFile(WALLET_CONFIG_PATH, req.body.config, 'utf8', function(err) {
    if (err) {
      const response = {
        type: 'ERROR',
        code: 'UPDATE_WALLET_CFG_004',
        message: 'Failed to write config to disk',
        data: req.body
      };
      res.send(JSON.stringify(response));
      return;
    }
    const response = {
      type: 'SUCCESS',
      code: 'UPDATE_WALLET_CFG_001',
      message: 'Config successfully updated'
    };

    res.send(JSON.stringify(response));

    return;
  });
});

router.post('/ui-password', function(req, res, next) {
  //check if command on allowed list
  if (
    !req.body ||
    !req.body.username ||
    !req.body.password ||
    !req.body.currentUsername ||
    !req.body.currentPassword
  ) {
    var response = {
      type: 'ERROR',
      code: 'UIPASS_001',
      message: 'Invalid Args',
      data: req.body
    };
    res.send(JSON.stringify(response));
    return;
  }

  fs.readFile('./config/auth.json', function(err, auth) {
    if (err) {
      var response = {
        type: 'ERROR',
        code: 'UIPASS_002',
        message: 'Failed to read auth file from disk',
        data: req.body
      };
      res.send(JSON.stringify(response));
      return;
    }
    var authJson = JSON.parse(auth);

    if (
      !bcrypt.compareSync(req.body.currentUsername, authJson.username) ||
      !bcrypt.compareSync(req.body.currentPassword, authJson.password)
    ) {
      var response = {
        type: 'ERROR',
        code: 'AUTH_002',
        message: 'Invalid Username or Password',
        data: req.body
      };
      res.send(JSON.stringify(response));
      return;
    }

    authJson.username = bcrypt.hashSync(req.body.username, 10);
    authJson.password = bcrypt.hashSync(req.body.password, 10);

    fs.writeFile(
      './config/auth.json',
      JSON.stringify(authJson),
      'utf8',
      function(err) {
        if (err) {
          const response = {
            type: 'ERROR',
            code: 'UIPASS_003',
            message: 'Failed to write to disk',
            data: req.body
          };
          res.send(JSON.stringify(response));
          return;
        }
        const response = {
          type: 'SUCCESS',
          code: 'UIPASS_002',
          message: 'Successful Request',
          data: 'Password Updated'
        };
        res.send(JSON.stringify(response));
        return;
      }
    );
  });
});

module.exports = router;
