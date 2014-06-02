"use strict";
const q = require("q"), request = require("request");
module.exports = function(conf, e){
    // POST A BUNDLE
    e.post("/api/bundle", function(req, res) {
      q.nfcall(request.post, {url: conf.b4db, json: {type: "bundle", name: req.query.name, books: {}}})
      .then(function(arg) {
        let couchRes = arg[0], body = arg[1];
        res.json(couchRes.statusCode, body);
      })
      .catch(function(err){
        res.json(502, {error: "bad gateway", reason: err.code});
      }).done();
       /*let defferred = q.defer();
       request.post({
           url: conf.b4db,
           json: {type: "bundle", name: req.query.name, books: {}}
       }, function(error, couchRes, body) {
           if(error) {defferred.reject(error);}
           else {defferred.resolve([couchRes, body]);}
       });
       defferred.promise.then(function(arg){
           let couchRes = arg[0], body = arg[1];
           res.json(couchRes.statusCode, body);
       }, function(er) {res.json(502, {reason: er.code})});*/
    });
    // GET A BUNDLE WITH AN ID
    e.get("/api/bundle/:id", function (req, res) {
        q.nfcall(request.get, conf.b4db + "/" + req.params.id)
        .then(function(arg) {
            let couchRes = arg[0], bundle = JSON.parse(arg[1]);
            res.json(couchRes.statusCode, bundle);
        }, function (er) { res.json(502, {error: "bad gateway", reason: er.code} )}).done();
    });
    // PUT A BUNDLE NAME
    e.put("/api/bundle/:id/name/:name", function(req, res) {
        // FIRST, CHECK IF THE DAMN THING EXISTS
        q.nfcall(request.get, conf.b4db + "/" + req.params.id)
        .then(function(arg){
            let couchRes = arg[0], bundle = JSON.parse(arg[1]);
            if(couchRes.statusCode !== 200) {return [couchRes, bundle];}
            // OK. IT EXISTS. NOW PUT THE NAME IN THERE
            bundle.name = req.params.name;
            return q.nfcall(request.put, {
                 url: conf.b4db + '/' + req.params.id,
                 json: bundle
            });
        })
        .then(function(arg){
            let couchRes = arg[0], body = arg[1];
            res.json(couchRes.statusCode, body);
        })
        .catch(function(er){
            res.json(502, { error: "bad_gateway", reason: er.code });  
        }).done();
    });
    // PUT A BOOK IN THE BUNDLE
    e.put('/api/bundle/:id/book/:pgid', function(req, res) {
    //check if bundle exists
      let get = q.denodeify(request.get), put = q.denodeify(request.put);
      q.async(function* (){  
        let args, couchRes, bundle, book;
        // grab the bundle from the b4 database
        args = yield get(conf.b4db + "/" + req.params.id);  
        couchRes = args[0];
        bundle = JSON.parse(args[1]);
        // fail fast if we couldn't retrieve the bundle
        if (couchRes.statusCode !== 200) {
          res.json(couchRes.statusCode, bundle);
          return;
        }
        // look up the book by its Project Gutenberg ID
        args = yield get(conf.bookdb + "/" + req.params.pgid);  
        couchRes = args[0];
        book = JSON.parse(args[1]);
        // fail fast if we couldn't retrieve the book
        if (couchRes.statusCode !== 200) {
          res.json(couchRes.statusCode, book);
          return;
        }
        // add the book to the bundle and put it back in CouchDB
        bundle.books[book._id] = book.title;  
        args = yield put({url: conf.b4db + bundle._id, json: bundle});
        res.json(args[0].statusCode, args[1]);
      })().catch(function(err) {  
        res.json(502, { error: "bad_gateway", reason: err.code });
      });
    });
    // DELETE A BOOK IN THE BUNDLE
    e.delete('/api/bundle/:id/book/:pgid', function(req, res) {
    q.async(function* (){
      
      let
        args = yield q.nfcall(request, conf.b4db + "/" + req.params.id),
        couchRes = args[0],
        bundle = JSON.parse(args[1]);
      
      // fail fast if we couldn't retrieve the bundle
      if (couchRes.statusCode !== 200) {
        res.json(couchRes.statusCode, bundle);
        return;
      }
      
      // fail if the bundle doesn't already have that book
      if (!(req.params.pgid in bundle.books)) {
        res.json(409, {
          error: "conflict",
          reason: "Bundle does not contain that book."
        });
        return;
      }
      
      // remove the book from the bundle
      delete bundle.books[req.params.pgid];
      
      // put the updated bundle back into CouchDB
      request.put({ url: conf.b4db + "/" + bundle._id, json: bundle }).pipe(res);
      
    })()
    .catch(function(err) {
      res.json(502, { error: "bad_gateway", reason: err.code });
    });
  });
};