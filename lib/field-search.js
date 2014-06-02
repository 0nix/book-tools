'use strict';
const request = require('request');
const permViews = ["author", "title"];
module.exports = function(conf, e) {  
  e.get('/api/search/:view', function(req, res) {  
    let viewPar = req.params.view;
    if(permViews.indexOf(viewPar) < 0){
      res.json(400, {error: "bad_request", reason: "view not compatible with search"});
      return;
    }
    request({  
      method: 'GET',
     url: conf.bookdb + '/_design/seek/_view/' + viewPar,    
      qs: {
        startkey: JSON.stringify(req.query.q),  
        endkey: JSON.stringify(req.query.q + "\ufff0"),
        group: true
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
      
      /// send back just the keys we got back from CouchDB
      res.json(JSON.parse(body).rows.map(function(n){return n.key;}));
    });
  });
};