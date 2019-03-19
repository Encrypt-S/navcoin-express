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
      // can't read the file, might be corrupt
      createNewAddress(res, navClient);
      return;
    }
    if (!addressJson.address) {
      createNewAddress(res, navClient);
      return;
    }

    navClient
      .command('validateaddress', addressJson.address)
      .then(data => {
        if (!data.ismine) {
          // not our address so create new
          createNewAddress(res, navClient);
          return;
        } else {
          const response = {
            type: 'SUCCESS',
            code: 'ADR_001',
            message: 'Successful Request',
            data: addressJson
          };
          res.send(JSON.stringify(response));
          return;
        }
      })
      .catch(err => {
        const response = {
          type: 'ERROR',
          code: 'ADR_003',
          message:
            'Failed check if main address exists in wallet due to RPC Error',
          data: { error: err.code, message: err.message }
        };
        res.send(JSON.stringify(response));
        return;
      });
  });
}

function createNewAddress(res, navClient) {
  navClient
    .command('getnewaddress')
    .then(newAddress => {
      const addressObject = { address: newAddress };
      fs.writeFile(
        './config/address.json',
        JSON.stringify(addressObject),
        'utf8',
        function(err) {
          if (err) {
            const response = {
              type: 'ERROR',
              code: 'ADR_004',
              message:
                'Failed to get main address or new address. Error writing to file.'
            };
            res.send(JSON.stringify(response));
            return;
          } else {
            const response = {
              type: 'SUCCESS',
              code: 'ADR_001',
              message: 'Successful Request',
              data: { address: newAddress }
            };
            res.send(JSON.stringify(response));
            return;
          }
        }
      );
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

module.exports = getMainAddress;
