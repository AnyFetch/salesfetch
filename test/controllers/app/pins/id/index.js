"use strict";

var request = require('supertest');
var should = require('should');
var async = require('async');
var rarity = require('rarity');

var mongoose = require('mongoose');
var Pin = mongoose.model('Pin');

var app = require('../../../../../app.js');
var cleaner = require('../../../../hooks/cleaner');
var requestBuilder = require('../../../../helpers/login').requestBuilder;
var getUser = require('../../../../helpers/login').getUser;
var APIs = require('../../../../helpers/APIs');
var checkUnauthenticated = require('../../../../helpers/access').checkUnauthenticated;


describe('/app/pins/:id page', function() {
  var sampleUserId = '0000c57d9ba7bbbb265ffdc9';
  var sampleDocumentId = '5309c57d9ba7daaa265ffdc9';
  var sampleContext = {
    "templatedDisplay": "Chuck Norris",
    "templatedQuery": "Chuck Norris",
    "recordId": "0032000001DoV22AAF",
    "recordType": "Contact"
  };

  var invalidEndpoint = '/app/pins/aze';
  var endpoint = '/app/pins/' + sampleDocumentId;

  beforeEach(cleaner);
  beforeEach(function(done) {
    APIs.mount('fetchAPI', 'http://api.anyfetch.com', done);
  });


  describe('POST /app/pins/:id', function() {
    checkUnauthenticated(app, 'post', endpoint);

    it("should err on invalid document ID", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(invalidEndpoint, sampleContext, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .post(url)
            .expect(409)
            .end(cb);
        }
      ], done);
    });

    it("should add a pin", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, sampleContext, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .post(url)
            .expect(204)
            .end(cb);
        },
        function searchMongo(res, cb) {
          var hash = {
            SFDCId: sampleContext.recordId,
            anyFetchId: sampleDocumentId
          };
          Pin.findOne(hash, cb);
        },
        function pinShouldExist(pin, cb) {
          should(pin).not.equal(null);
          cb(null);
        }
      ], done);
    });

    it("should err on duplicate pin", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, sampleContext, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .post(url)
            .expect(204)
            .end(rarity.carry([url], cb));
        },
        function sendRequestAgain(url, res, cb) {
          request(app)
            .post(url)
            .expect(409)
            .end(function(err, res) {
              should(err).equal(null);
              res.text.toLowerCase().should.containDeep('already pinned');
              cb(err);
            });
        }
      ], done);
    });
  });

  describe('DELETE /app/pins/:id', function() {
    checkUnauthenticated(app, 'del', endpoint);

    it("should err on invalid document ID", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(invalidEndpoint, sampleContext, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .del(url)
            .expect(409)
            .end(cb);
        }
      ], done);
    });

    it("should remove an existing pin", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, sampleContext, null, cb);
        },
        function getUserId(url, cb) {
          getUser(rarity.carry([url], cb));
        },
        function addPinByHand(url, user, cb) {
          var hash = {
            SFDCId: sampleContext.recordId,
            anyFetchId: sampleDocumentId,
            createdBy: user._id
          };
          var pin = new Pin(hash);
          pin.save(function(err) {
            cb(err, url, hash);
          });
        },
        function sendRequest(url, hash, cb) {
          request(app)
            .del(url)
            .expect(202)
            .end(rarity.carryAndSlice([hash], 1, cb));
        },
        function searchMongo(hash, cb) {
          Pin.findOne(hash, cb);
        },
        function checkDeleted(pin, cb) {
          should(pin).equal(null);
          cb();
        }
      ], done);
    });

    it("should err on non-existing pin", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, sampleContext, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .del(url)
            .expect(404)
            .end(function(err, res) {
              res.text.toLowerCase().should.containDeep('not pinned');
              cb(err);
            });
        }
      ], done);
    });

    it("should err when trying to remove someone else's pin", function(done) {
      async.waterfall([
        function addPinByHand(cb) {
          // Fake pin added by someone else
          var hash = {
            SFDCId: sampleContext.recordId,
            anyFetchId: sampleDocumentId,
            createdBy: sampleUserId
          };
          var pin = new Pin(hash);
          pin.save(rarity.slice(1, cb));
        },
        function buildRequest(cb) {
          requestBuilder(endpoint, sampleContext, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .del(url)
            .expect(403)
            .end(function(err, res) {
              res.text.toLowerCase().should.containDeep('cannot delete');
              cb(err);
            });
        }
      ], done);
    });
  });
});