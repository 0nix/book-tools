"use strict";
const config = {
    bookdb: "http://localhost:5984/books/",
    b4db: "http://localhost:5984/b4/"
};
const express = require("express"), 
morgan = require("morgan"), 
e = express(),
redisClient = require("redis").createClient(),
session = require("express-session"),
cookie = require("cookie-parser"),
request = require("request"),
redisStore = require("connect-redis")(session);
e.use(cookie());
e.use(session({
  secret: "Nowisthewinterofourdiscontent",
  store: new redisStore({client: redisClient})
}));
/*e.get("/api/:n", function(req, res){
  res.json(200, {"hello": req.params.n});
});*/

e.put('/bundle', function(req, res) {
  let userURL = config.b4db + "GARBLEDINA123456";
  request(userURL, function(err, couchRes, body) {
    if (err) {
      res.json(502, { error: "bad_gateway", reason: err.code });
      
    } else if (couchRes.statusCode === 200) {
      console.log(JSON.parse(body));
      //let boid = JSON.parse(body);
      //let boid = { url: "kd.io", hands:"fingers"};
      //request.put({url: userURL, json: boid}).pipe(res);
      
    } else if (couchRes.statusCode === 404) {
      let bod = { url: "kd.io", hands:"fingers"};
      request.put({url: userURL, json: bod}).pipe(res);
      
    } else {
      res.send(couchRes.statusCode, body);
    }
  });
});

e.listen(3000, function() {
    console.log('Listening on port 3000');
});