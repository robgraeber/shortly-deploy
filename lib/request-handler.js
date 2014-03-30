var request = require('request');
var crypto = require('crypto');
var util = require('../lib/utility');
var Promise = require('bluebird');
var config = require('../app/config');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

var mongoose = require('mongoose');
var dbAddress = process.env.DBURL || 'mongodb://localhost/eugenedb';
mongoose.connect(dbAddress);

var urlSchema = mongoose.Schema({
    url: String,
    base_url: String,
    visits: Number,
    code: String,
    title: String
});
var userSchema = mongoose.Schema({
    username: String,
    password: String
});

var Url = Promise.promisifyAll(mongoose.model('Url', urlSchema));
var User = Promise.promisifyAll(mongoose.model('User', userSchema));
Promise.promisifyAll(Url.prototype);
Promise.promisifyAll(User.prototype);
console.log(User);
console.log("Trying to connect to mongoDB:", dbAddress);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("Mongo connection open");
});


exports.renderIndex = function(req, res) {
  console.log("render index");
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  console.log("render signup");
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  console.log("render login");
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Url.findAsync().then(function(urls){
    res.send(200, urls);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Url.findOneAsync({url: uri}).then(function(url){
    console.log("FIND ONE ASYNC:", url);
    if(url){
      res.send(200, url);
    }
    util.getUrlTitle(uri, function(err, title) {
      console.log('title of the url is ', title);
      if (err) {
        console.log('Error reading URL heading: ', err);
        return res.send(404);
      }

      var shasum = crypto.createHash('sha1');
      shasum.update(uri);
      console.log("URL:", Url);
      Url.create({
        title: title,
        base_url: req.headers.origin,
        url: uri,
        code: shasum.digest('hex').slice(0, 5),
        visits: 0
      }).then(function(url){
        console.log("BAD URL:", url);
        res.send(200, url);
      });
    });
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOneAsync({username: username})
    .then(function(user){
    if (!user) {
      res.send(200, {isValid: false});
    } else {
      console.log('user exists', user);
      bcrypt.compareAsync(password, user.password).then(function(isMatch) {
        console.log("password:", password, "  user.password: ", user.password);
        if (isMatch) {
          console.log("User password success");
          util.createSession(req, res, user);
          res.send(200, {isValid: true});
        } else {
          console.log("User password fail");
          res.send(200, {isValid: false});
        }
      });
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOneAsync({username: username}).then(function(user){
    console.log("Found User:",user);
    if(!user){
      var cipher = Promise.promisify(bcrypt.hash);
      cipher(password, null, null).then(function(hash) {
          password = hash;
          User.create({
            username: username,
            password: password
          }).then(function(newUser) {
            console.log("NEW USER ARRAY:", newUser);
            util.createSession(req, res, newUser);
          });
        });
      
    }else{
      res.redirect('/signup');
    }
  });
};

exports.navToLink = function(req, res) {
  Url.findOneAsync({ code: req.params[0] }).then(function(link){
    if (!link) {
      res.redirect('/');
    } else {
      link.visits++;
      link.save(function(err, link){
        if(err){
          console.log(err);
        }
        res.redirect(link.url);
      });
    }
  });
};