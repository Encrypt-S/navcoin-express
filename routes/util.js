const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const common = require('../lib/common');
const formidable = require('formidable');

function generateResponseObject(type, code, message, data = {}) {
  if (!type || !code || !message) {
    throw new Error('Error incorrect args.');
  }
  return {
    type: type,
    code: code,
    message: message,
    data: data
  };
}

//@TODO: remove data.body being parsed back

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

router.post('/update-daemon', (req, res, next) => {
  var verified = common.checkPassword(req.body.password);
  if (!verified) {
    const response = JSON.stringify(
      generateResponseObject('ERROR', 'PASSWD_001', 'Unauthorized', { test: 'TEST_001A'})
    );
    res.status(500).send(response);
    return;
  }

  try {
    const command = spawn('/home/odroid/navdroid/express/scripts/update-daemon.sh');
    var responded = false;
    command.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      if (data.indexOf('NavCoin server starting') != -1 && !responded) {
        responded = true;
        const response = JSON.stringify(
          generateResponseObject(
            'SUCCESS',
            'UPDATE_DAEMON_001',
            'NavCoin was successfully updated, restarting',
            { code: 0 }
          )
        );
        res.status(200).send(response);

        const command = spawn('/home/odroid/navdroid/express/scripts/restart-web.sh');

        command.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        command.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });

        command.on('close', (code) => {
          console.log(`child process exited with code ${code}`);
        });
      }
    });

    command.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    command.on('close', (code) => {
      console.log(`child process exited with code ${code}`);

      var type = 'ERROR';
      var message = 'Updating NavCoin was unsuccessful';
      switch (code) {
        case 0:
          type = 'SUCCESS';
          message = 'NavCoin was successfully updated, restarting';
          break;
        case 1:
          message = 'NavCoin update failed, invalid release name';
          break;
        case 2:
          message = 'NavCoin update failed, release not found';
          break;
        case 3:
          type = 'SUCCESS'
          message = 'NavCoin is already up to date';
          break;
        case 4:
          message = 'NavCoin update failed, download failed';
          break;
      }

      const response = JSON.stringify(
        generateResponseObject(
          type,
          'RESTART_DAEMON_003',
          message,
          {code},
        )
      );
      res.status(200).send(response);
      return
    });
  } catch (err) {
    const response = JSON.stringify(
      generateResponseObject(
        'ERROR',
        'UPDATE_NAVCOIN_005',
        'Failed to update the NavCoin daemon',
        { err }
      )
    );
    res.status(500).send(response);
  }
});

router.post('/update-ui', (req, res, next) => {
  var verified = common.checkPassword(req.body.password);
  if (!verified) {
    const response = JSON.stringify(
      generateResponseObject('ERROR', 'PASSWD_001', 'Unauthorized', {})
    );
    res.status(500).send(response);
    return;
  }

  try {

    exec(
      '/home/odroid/navdroid/express/scripts/update-ui.sh',
      (error, stdout, stderr) => {
        if (error) {
          const response = JSON.stringify(
            generateResponseObject(
              'ERROR',
              'UPDATE_UI_001',
              'Failed to git update',
              { error }
            )
          );
          res.status(500).send(response);
          return;
        }

        var count = (stdout.match(/Already up to date./g) || []).length;

        if (count == 2) {
          const response = JSON.stringify(
            generateResponseObject(
              'SUCCESS',
              'UPDATE_UI_001A',
              'NavDroid UI is already up to date',
            )
          );
          res.status(200).send(response);
          return;
        }

        const response = JSON.stringify(
          generateResponseObject(
            'SUCCESS',
            'UPDATE_UI_001',
            'Updating NavDroid UI',
            { data: 'TEST_001A'}
          )
        );
        res.status(200).send(response);

        const command = spawn('/home/odroid/navdroid/express/scripts/restart-web.sh');

        command.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        command.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });

        command.on('close', (code) => {
          console.log(`child process exited with code ${code}`);
        });

      }
    );

  } catch (err) {
    const response = JSON.stringify(
      generateResponseObject(
        'ERROR',
        'UIUPD_002',
        'Failed to update the NavDroid Interface',
        { err }
      )
    );
    res.status(500).send(response);
  }
});

router.post('/restart-web', (req, res, next) => {
  var verified = common.checkPassword(req.body.password);
  if (!verified) {
    const response = JSON.stringify(
      generateResponseObject('ERROR', 'PASSWD_001', 'Unauthorized', {})
    );
    res.status(500).send(response);
    return;
  }

  try {
    const response = JSON.stringify(
      generateResponseObject(
        'SUCCESS',
        'RESTART_WEB_001',
        'Restarting NavDroid UI',
      )
    );
    res.status(200).send(response);

    const command = spawn('/home/odroid/navdroid/express/scripts/restart-web.sh');

    command.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    command.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    command.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

  } catch (err) {
    const response = JSON.stringify(
      generateResponseObject(
        'ERROR',
        'RESTART_WEB_002',
        'Failed to restart the Stakebox',
        { err }
      )
    );
    res.status(500).send(response);
  }
});

router.post('/reboot', (req, res, next) => {
  var verified = common.checkPassword(req.body.password);
  if (!verified) {
    const response = JSON.stringify(
      generateResponseObject('ERROR', 'PASSWD_001', 'Unauthorized', {})
    );
    res.status(500).send(response);
    return;
  }

  try {
    const response = JSON.stringify(
      generateResponseObject(
        'SUCCESS',
        'REBOOT_002',
        'The NavDroid is rebooting'
      )
    );
    res.status(200).send(response);

    const command = spawn('/home/odroid/navdroid/express/scripts/reboot.sh');

    command.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    command.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    command.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });


  } catch (err) {
    const response = JSON.stringify(
      generateResponseObject(
        'ERROR',
        'REBOOT_004',
        'Failed to restart the Stakebox',
        { err }
      )
    );
    res.status(500).send(response);
  }
});

router.post('/restart-daemon', (req, res, next) => {
  var verified = common.checkPassword(req.body.password);
  if (!verified) {
    const response = JSON.stringify(
      generateResponseObject('ERROR', 'PASSWD_001', 'Unauthorized', {})
    );
    res.status(500).send(response);
    return;
  }

  try {
    var responded = false;
    const command = spawn('/home/odroid/navdroid/express/scripts/restart-daemon.sh');

    command.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      if (data.indexOf('NavCoin server starting') != -1 && !responded) {
        responded = true;
        const response = JSON.stringify(
          generateResponseObject(
            'SUCCESS',
            'RESTART_DAEMON_001',
            'NavCoin is restarting',
            {data},
          )
        );
        res.status(200).send(response);
        return
      }
    });

    command.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
      responded = true;
      const response = JSON.stringify(
        generateResponseObject(
          'ERROR',
          'RESTART_DAEMON_002',
          'There was an error restarting NavCoin',
          {data},
        )
      );
      res.status(500).send(response);
      return
    });

    command.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

  } catch (err) {
    const response = JSON.stringify(
      generateResponseObject(
        'ERROR',
        'RESTART_DAEMON_005',
        'Failed to restart NavCoin',
        { err }
      )
    );
    res.status(500).send(response);
  }
});

router.post('/backup-wallet', (req, res, next) => {
  var verified = common.checkPassword(req.body.password);
  if (!verified) {
    const response = JSON.stringify(
      generateResponseObject('ERROR', 'PASSWD_001', 'Unauthorized', {})
    );
    res.status(500).send(response);
    return;
  }

  try {
    //run the backup proceedure
    var filePath = '/home/odroid/.navcoin4/wallet.dat';
    res.sendFile(filePath);
    return;

  } catch (err) {
    const response = JSON.stringify(
      generateResponseObject(
        'ERROR',
        'BACKUP_001',
        'Failed to backup the wallet file',
        { err }
      )
    );
    res.status(500).send(response);
  }
});

router.post('/import-wallet', (req, res, next) => {

  new formidable.IncomingForm().parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error', err)
      const response = JSON.stringify(
        generateResponseObject('ERROR', 'IMPORT_001', 'Error parsing form', {err})
      );
      res.status(500).send(response);
      return;
    }

    var verified = common.checkPassword(fields.password);
    if (!verified) {
      const response = JSON.stringify(
        generateResponseObject('ERROR', 'PASSWD_001', 'Unauthorized', {})
      );
      res.status(500).send(response);
      return;
    }

    try {
      var responded = false;

      console.log('files.fileKey.path', files.fileKey.path);

      const command = spawn('/home/odroid/navdroid/express/scripts/import.sh', [files.fileKey.path]);

      command.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        if (data.indexOf('NavCoin server starting') != -1 && !responded) {
          responded = true;
          const response = JSON.stringify(
            generateResponseObject(
              'SUCCESS',
              'IMPORT_WALLET_001',
              'NavCoin was successfully updated, restarting',
              { code: 0 }
            )
          );
          res.status(200).send(response);

          const command = spawn('/home/odroid/navdroid/express/scripts/restart-web.sh');

          command.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });

          command.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
          });

          command.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
          });
        }
      });

      command.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      });

      command.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });


    } catch (err) {
      const response = JSON.stringify(
        generateResponseObject(
          'ERROR',
          'IMPORT_002',
          'Failed to import the wallet file',
          { err }
        )
      );
      res.status(500).send(response);
    }

  });

});

module.exports = router;
