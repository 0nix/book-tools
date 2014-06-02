"use strict";

const config = {
    bookdb: "http://localhost:5984/books/",
    b4db: "http://localhost:5984/b4/",
    my:"http://localhost:8888"
};
// NPM REQUIREMENTS
const express = require("express"), 
morgan = require("morgan"),
request = require('request'),
bodyParser = require("body-parser"),
log = require("npmlog"),
redisClient = require("redis").createClient(),
session = require("express-session"),
cookie = require("cookie-parser"),
GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
redisStore = require("connect-redis")(session),
pass = require("passport"),
e = express(),
GOOGLE_CLIENT_ID = "300863294017-hlgldshiv6tb1asci7fdf4uli7auee1f.apps.googleusercontent.com",
GOOGLE_CLIENT_SECRET = "88DjDzSRGm0QhMMKJU33fQeE";

//OUTSOURCING
require('./lib/book-search.js')(config, e);
require('./lib/field-search.js')(config, e);
require('./lib/id-search.js')(config, e);
require('./lib/bundle.js')(config, e);

//MIDDLEWARE
const authed = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else if (redisClient.ready) {
    res.json(403, {
      error: "forbidden",
      reason: "not_authenticated"
    });
  } else {
    res.json(503, {
      error: "service_unavailable",
      reason: "authentication_unavailable"
    });
  }
};
//REDIS CONFIGURATION
redisClient.on("ready", function() {log.info("REDIS", "ready")});
redisClient.on("error", function(err) {log.error("REDIS", err.message)});

//PASSPORT CONFIGURATION
pass.serializeUser(function(user, done) {
  // pass the identifier in the session
  done(null, user.identifier);
});
pass.deserializeUser(function(id, done) {
  //pass the identifier as a JSON object called identifier in every request
  done(null, { identifier: id });
});
pass.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://onixpw.kd.io:8888/auth/google/return"
  },
  function(accessToken, refreshToken, profile, done) {
      profile.identifier = profile.id;
      return done(null, profile)
    }));

// APP USE
e.use(morgan("short"));
e.use(bodyParser());
//e.use(express.static(__dirname + '/static'));
e.use(express.static(__dirname));
e.use(cookie());
e.use(session({ 
  secret: "Nowisthewinterofourdiscontent", 
  store: new redisStore({client: redisClient})}));
e.use(pass.initialize());
e.use(pass.session());
e.set('view engine', 'jade');
// APP GET/POST - VIEWS
e.get('/', function(req, res){
  res.render('hello');
});
e.get("/:id", function(req,res){
    if (!req.isAuthenticated()) res.redirect("/");
    request(config.my+"/api/bundle/"+req.params.id, function(err, couchRes, body) {
        let a = JSON.parse(body);
        //log.info("BOOKS", Object.getOwnPropertyNames(a.books).length);
        res.render('bundly', {bundle: a}); 
        //res.render('s');
    });
});
// APP GET/POST - AUTH
e.get('/auth/google', pass.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile', 
  'https://www.googleapis.com/auth/userinfo.email'] }));
e.get('/auth/google/return',
  pass.authenticate('google', { successRedirect: '/' })
);
e.get("/auth/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});
// APP GET/POST - USER API
e.get("/api/user", authed, function(req, res) {res.json(req.user)});
// GET PREVIOUSLY CREATED USER BUNDLES
e.get("/api/user/bundles", authed, function(req, res) {
  // url + the identifier object recieved in PASSPORT and checked by authed middleware
    let userURL = config.b4db + encodeURIComponent(req.user.identifier);
    console.log(req.user.identifier);
    request(userURL, function(err, couchRes, body) {
   if (err) { res.json(502, { error: "bad_gateway", reason: err.code });} 
   else if (couchRes.statusCode === 200) {
      // return the bundle
      log.info("EXPRESS","BUNDLES FOUND");
      res.json(JSON.parse(body));
    } 
    else if(couchRes.statusCode === 404){
      log.info("EXPRESS","BUNDLES NOT FOUND");
      res.send(couchRes.statusCode, body);
    }else {
      res.send(couchRes.statusCode, body);
    }
  });
});
// PUT THE USER BUNDLES IN THE B4D DATABASE
e.put('/api/user/bundles', authed, function (req, res) {
  log.info("EXPRESS","PUTTING IN DATABASE");
  // SCHEMA: PASSPORT IDENTIFIER = DB IDENTIFIER. NOT A GOOD IDEA.
  let userURL = config.b4db + encodeURIComponent(req.user.identifier);
  request(userURL, function(err, couchRes, body) {
    if (err) { res.json(502, { error: "bad_gateway", reason: err.code });} 
    //IF USER BUNDLE ALREADY EXISTS, THEN UPDATE
    else if (couchRes.statusCode === 200) {
      let user = req.body;
      request.put({ url: userURL, json: user }).pipe(res);
    //IF IT DOESNOT EXIST, PUT A NEW DOCUMENT IN THE DATABASE. AT THIS POINT PUT BECOMES POST
    // WOULD HAVE LOVED THIS DETAIL FIRST.
    } else if (couchRes.statusCode === 404) {
      log.info("EXPRESS", "IN 404");
      request.put({url: userURL, json:req.body }).pipe(res);
    } else {
      res.send(couchRes.statusCode, body);
    }
  });
});




e.listen(8888, function() {log.info("EXPRESS","listening to port 8888")});