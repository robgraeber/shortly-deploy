var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var Promise = require('bluebird');
var config = require('../app/config');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/eugenedb');

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

var Url = mongoose.model('Url', urlSchema);
var User = mongoose.model('User', userSchema);


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // yay!
  console.log("Mongo connection open");
  new User({
    username: 'hello',
    password: 'there'
  }).save();
});


exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Url.find(function(err, urls){
    if(err){
      console.log(err);
    }

    res.send(200, urls);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Url.findOne({url: uri}, function(err, url){
    if(err){
      console.log(err);
    }

    if(url){
      res.send(200, url);
    }
    util.getUrlTitle(uri, function(err, title) {
      if (err) {
        console.log('Error reading URL heading: ', err);
        return res.send(404);
      }

      var shasum = crypto.createHash('sha1');
      shasum.update(uri);

      new Url({
        title: title,
        base_url: req.headers.origin,
        url: uri,
        code: shasum.digest('hex').slice(0, 5),
        visits: 0
      }).save(function(err, url){
        if(err){
          console.log(err);
        }
        res.send(200, url);
      });
    });
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, function(err, user){
    if(err){
      console.log(err);
    }
    
    if (!user) {
      res.redirect('/login');
    } else {
      console.log('user exists', user);
      bcrypt.compare(password, user.password, function(err, isMatch) {
        console.log("password:", password, "  user.password: ", user.password);
        if (isMatch) {
          console.log("User password success");
          util.createSession(req, res, user);
        } else {
          console.log("User password fail");
          res.redirect('/login');
        }
      });
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, function(err, user){
    if(err){
      console.log(err);
    }
    console.log(user);
    if(!user){
      var cipher = Promise.promisify(bcrypt.hash);
      cipher(password, null, null).then(function(hash) {
          password = hash;
          var newUser = new User({
            username: username,
            password: password
          });
          newUser.save( function(err, newUser) {
            if(err){
              console.log(err);
            }
            util.createSession(req, res, newUser);
          });
        });
      
    }else{
      res.redirect('/signup');
    }
  });
};

exports.navToLink = function(req, res) {
  Url.findOne({ code: req.params[0] }, function(err, link){
    if(err){
      console.log(err);
    }
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