/**
 * search for books by a given field (author or subject)
 * curl http://localhost:3000/api/search/book/by_author?q=Giles,%20Lionel
 * curl http://localhost:3000/api/search/book/by_subject?q=War
 */
'use strict';
const request = require('request');
const permViews = ["author", "title"]
module.exports = function(config, app) {
  app.get('/api/search/book/:view', function(req, res) {
    let viewPar = req.params.view;
    if(permViews.indexOf(viewPar) < 0){
      res.json(400, {error: "bad_request", reason: "view not compatible with search"});
      return;
    }
    request({
      method: 'GET',
      url: config.bookdb + '/_design/seek/_view/' + viewPar,
      qs: {
        startkey: JSON.stringify(req.query.q),  
        endkey: JSON.stringify(req.query.q + "\ufff0"),
        reduce: false,
        //include_docs: true
      }
    }, function(err, couchRes, body) {
      
      // couldn't connect to CouchDB
      if (err) {
        res.json(502, { error: "bad_gateway", reason: err.code });
        return;
      }
      
      // CouchDB couldn't process our request
      if (couchRes.statusCode !== 200) {
        res.json(couchRes.statusCode, JSON.parse(body));
        return;
      }
      
      // send back simplified documents we got from CouchDB
      let booty = JSON.parse(body);
      res.json(booty.rows);
    });
  });
};
