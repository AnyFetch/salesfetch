'use strict';

require("should");

var async = require('async');
var request = require('supertest');

var app = require('../../app.js');
var cleaner = require('../hooks/cleaner');
var requestBuilder = require('../helpers/login').requestBuilder;
var APIs = require('../helpers/APIs');
var checkUnauthenticated = require('../helpers/access').checkUnauthenticated;

describe('<Application controller>', function() {
  beforeEach(cleaner);
  beforeEach(function(done) {
    APIs.mount('fetchAPI', 'http://api.anyfetch.com', done);
  });

  describe('/context-search page', function() {
    var endpoint = '/app/context-search';

    checkUnauthenticated(app, 'get', endpoint);

    it("should return contextual data", function(done) {

      var context = {
        recordType: 'Contact',
        recordId: '003b000000LHOj3',
        templatedQuery: 'Walter White',
        templatedDisplay: 'Walter White'
      };

      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, context, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .get(url)
            .expect(200)
            .expect(function(res) {
              res.text.should.containDeep("Walter White");
              res.text.should.containDeep("/app/documents/5320a773bc2e51d7135f0c8f");
            })
            .end(cb);
        }
      ], done);
    });

    it("should return just snippets for infinite scroll if there is a start query parameter", function(done) {

      var context = {
        recordType: 'Contact',
        recordId: '003b000000LHOj3',
        templatedQuery: 'Walter White',
        templatedDisplay: 'Walter White'
      };

      endpoint += '?start=1';

      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, context, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .get(url)
            .expect(200)
            .expect(function(res) {
              res.text.should.containDeep("National Security");
              res.text.should.not.containDeep("<body>");
            })
            .end(cb);
        }
      ], done);
    });

    it("should display error if no template found", function(done) {

      var context = {
        recordType: 'Contact',
        recordId: '003b000000LHOj3',
        templatedDisplay: 'Walter White'
      };

      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, context, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .get(url)
            .expect(500)
            .expect(function(res) {
              res.text.should.containDeep("a template is missing");
            })
            .end(cb);
        }
      ], done);
    });
  });

  describe('/document page', function() {
    var endpoint = '/app/documents/5309c57d9ba7daaa265ffdc9';

    checkUnauthenticated(app, 'get', endpoint);

    it("should render the full template", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, null, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .get(url)
            .expect(function(res) {
              res.text.toLowerCase().should.containDeep("email");
              res.text.toLowerCase().should.containDeep("gmail");
              res.text.toLowerCase().should.containDeep("albert einstein");
            })
            .end(cb);
        }
      ], done);
    });
  });

  describe('/providers page', function() {
    var endpoint = '/app/providers';
    beforeEach(function(done) {
      APIs.mount('manager', 'https://manager.anyfetch.com', done);
    });

    checkUnauthenticated(app, 'get', endpoint);

    it("should return all providers", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, null, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .get(url)
            .expect(200)
            .expect(function(res) {
              res.text.toLowerCase().should.containDeep("dropbox");
              res.text.toLowerCase().should.containDeep("/providers/connect?app_id=52bff114c8318c29e9000005");
            })
            .end(cb);
        }
      ], done);
    });
  });

  describe('/providers/connect redirection', function() {
    var endpoint = '/app/providers/connect';

    checkUnauthenticated(app, 'get', endpoint);

    it("should check presence of app_id", function(done) {
      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(endpoint, null, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .get(url)
            .expect(500)
            .expect(function(res) {
              res.text.should.containDeep("app_id");
            })
            .end(cb);
        }
      ], done);
    });

    it("should redirect user on connection page", function(done) {
      var dropboxConnectEndpoint = endpoint + '?app_id=52bff114c8318c29e9000005';

      async.waterfall([
        function buildRequest(cb) {
          requestBuilder(dropboxConnectEndpoint, null, null, cb);
        },
        function sendRequest(url, cb) {
          request(app)
            .get(url)
            .expect(302)
            .expect(function(res) {
              res.text.should.containDeep("bearer=anyFetchToken");
              res.text.should.containDeep("52bff114c8318c29e9000005");
            })
            .end(cb);
        }
      ], done);
    });
  });
});
