var common = {}

common.checkPassword  = (password) => {

  //check username and password
  var auth = fs.readFileSync('./config/auth.json');
  var authJson = JSON.parse(auth);

  if (!password || !bcrypt.compareSync(password, authJson.password)) {
    return false;
  } else {
    return true;
  }
}

module.exports = common
