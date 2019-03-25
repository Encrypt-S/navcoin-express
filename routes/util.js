const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const common = require('../lib/common');

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

    command.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    command.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
      const response = JSON.stringify(
        generateResponseObject(
          'SUCCESS',
          'UPDATE_NAVCOIN_002',
          'Update script encountered an error',
          {data},
        )
      );
      res.status(200).send(response);
    });

    command.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      const response = JSON.stringify(
        generateResponseObject(
          'SUCCESS',
          'RESTART_DAEMON_003',
          'Restart script exited successfully',
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
        if (error || stderr) {
          const response = JSON.stringify(
            generateResponseObject(
              'ERROR',
              'UPDATE_UI_001',
              'Failed to git update',
              { error, stderr }
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

    const command = spawn('/home/odroid/navdroid/express/scripts/restart-daemon.sh');

    command.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    command.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
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
      const response = JSON.stringify(
        generateResponseObject(
          'SUCCESS',
          'RESTART_DAEMON_003',
          'Restart script exited successfully',
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
    const response = JSON.stringify(
      generateResponseObject(
        'SUCCESS',
        'BACKUP_001',
        'The wallet was succesfully backed up'
      )
    );
    res.status(200).send(response);
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
      '/home/odroid/navdroid/express/scripts/import.sh',
      (error, stdout, stderr) => {
        if (error || stderr) {
          const response = JSON.stringify(
            generateResponseObject(
              'ERROR',
              'IMPORT_001',
              'Failed to import the wallet',
              { error, stderr }
            )
          );
          res.status(500).send(response);
          return;
        }
        const response = JSON.stringify(
          generateResponseObject(
            'SUCCESS',
            'IMPORT_003',
            'The wallet has been successfully imported'
          )
        );
        res.status(200).send(response);
        return;
      }
    );
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

module.exports = router;
