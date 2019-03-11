const fs = require('fs');

function setMainAddress(req, res, navClient) {
  if (!req.body || !req.body.address) {
    var response = {
      type: 'ERROR',
      code: 'SETADR_001',
      message: 'Invalid Args',
      data: req.body
    };
    res.send(JSON.stringify(response));
    return;
  }
  const newAddress = req.body.address;
  navClient
    .validateAddress(newAddress)
    .then(data => {
      if (!data.ismine) {
        const response = {
          type: 'ERROR',
          code: 'SETADR_002',
          message:
            'Main address does not belong to this wallet, please set a new main address in Settings',
          data: newAddress
        };
        res.send(JSON.stringify(response));
        return;
      }

      const addressObject = { address: newAddress };
      console.log(addressObject);
      console.log({ address: newAddress });
      fs.writeFile('./config/address.json', addressObject, 'utf8', function(
        err
      ) {
        if (err) {
          const response = {
            type: 'ERROR',
            code: 'SETADR_004',
            message: 'Failed to write to disk',
            data: req.body
          };
          res.send(JSON.stringify(response));
          return;
        }
        const response = {
          type: 'SUCCESS',
          code: 'SETADR_005',
          message: 'Successful Request',
          data: `Main Address Updated to ${newAddress}`
        };
        res.send(JSON.stringify(response));

        return;
      });
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
}

module.exports = setMainAddress;
