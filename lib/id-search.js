"use strict";
const request = require("request");
module.exports = function(config, e){
  e.get("/api/search/info/:id", function(req, res){
    if(isNaN(parseInt(req.params.id))){
      res.json(400, {error: "bad_request", reason: "id does not belong to the database"});
      return;
    }
    request({method:"GET", url: config.bookdb + '/_design/seek/_view/info', 
      qs: { key: JSON.stringify(req.params.id), reduce: false}},
      function(err, cres, body){
        if (err) { res.json(502, { error: "bad_gateway", reason: err.code }); return;}
      // CouchDB couldn't process our request
        if (cres.statusCode !== 200) {
        res.json(cres.statusCode, JSON.parse(body));
        return;
      }
      // send back simplified documents we got from CouchDB
      let booty = JSON.parse(body);
      res.json(booty.rows);
      });
  });
};