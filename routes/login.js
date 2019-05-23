var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  var port = '4200'
  var hostname = req.headers.host.split(':')[0]
  var host = hostname + ':' + port
  res.redirect('https://' + host);
});

module.exports = router;
