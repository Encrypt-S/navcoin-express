const fs = require('fs');

function getMainAddress(req, res, navClient) {
  fs.readFile('./config/address.json', function(err, auth) {
    if (err) {
      const response = {
        type: 'ERROR',
        code: 'ADR_002',
        message: 'Failed to read address file from disk',
        data: req.body
      };
      res.send(JSON.stringify(response));
      return;
    }

    let addressJson;
    try {
      addressJson = JSON.parse(auth);
    } catch (err) {
      const response = {
        type: 'ERROR',
        code: 'ADR_003',
        message: 'Failed to parse address file JSON, possibly corrupt',
        data: req.body
      };
      res.send(JSON.stringify(response));
      return;
    }
    if (!addressJson.address) {
      navClient
        .command('getnewaddress')
        .then(data => {
          const response = {
            type: 'WARN',
            code: 'ADR_004',
            message:
              'Main address not set, returning new address instead. Set a main address in Settings',
            data: data
          };
          res.send(JSON.stringify(response));
          return;
        })
        .catch(err => {
          const response = {
            type: 'ERROR',
            code: 'ADR_005',
            message: 'Failed to get main address or new address, RPC Error',
            data: { error: err.code, message: err.message }
          };
          res.send(JSON.stringify(response));
          return;
        });
    }
    navClient
      .command('validateaddress', addressJson.address)
      .then(data => {
        if (!data.ismine) {
          const response = {
            type: 'ERROR',
            code: 'ADR_006',
            message:
              'Main address does not belong to this wallet, please set a new main address in Settings',
            data: addressJson
          };
          res.send(JSON.stringify(response));
          return;
        }

        const response = {
          type: 'SUCCESS',
          code: 'ADR_001',
          message: 'Successful Request',
          data: addressJson
        };
        res.send(JSON.stringify(response));
        return;
      })
      .catch(err => {
        const response = {
          type: 'ERROR',
          code: 'ADR_007',
          message:
            'Failed check if main address exists in wallet due to RPC Error',
          data: { error: err.code, message: err.message }
        };
        res.send(JSON.stringify(response));
        return;
      });
  });
}

module.exports = getMainAddress;
