var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken');
var fs = require('fs');
const https = require('https');
const pem = require('pem');
const config = require('config');

var apiRouter = require('./routes/api');
var certRouter = require('./routes/cert');

var app = express();

pem.createCertificate({ days: 1, selfSigned: true }, function(err, keys) {
  if (err) {
    throw err;
  }

  const ssl = {
    key: keys.serviceKey,
    cert: keys.certificate,
    requestCert: false,
    rejectUnauthorized: false
  };

  const httpsServer = https.createServer(ssl, app);

  var port = config.ssl.port == 443 ? '' : ':' + config.ssl.port;

  httpsServer.listen(443, err => {
    console.log(`HTTPS Server running on port ${config.ssl.port}`);
    if (err) console.log(`Error: ${err}`);
    setupServer();
  });
});

function setupServer() {
  app.use(function(req, res, next) {
    if (req.protocol === 'https') {
      console.log(req.protocol, req.secure);
      next();
    } else {
      console.log('redirected');
      var port = config.ssl.port == 443 ? '' : ':' + config.ssl.port;
      var hostname = req.headers.host.split(':')[0];
      var host = hostname + port;
      res.redirect('https://' + host + req.url);
    }
  });

  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, x-access-token'
    );
    next();
  });

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/api', apiRouter);

  app.use('/cert', certRouter);

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
} //setupServer

module.exports = app;
