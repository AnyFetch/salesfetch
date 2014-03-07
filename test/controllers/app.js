'use strict';

require("should");

var request = require('supertest');
var app = require('../../app.js');
var cleaner = require('../hooks/cleaner');
var login = require('../helpers/login');
var login = require('../helpers/login').authenticateCall;
var APIs = require('../helpers/APIs');
var checkUnauthenticated = require('../helpers/access').checkUnauthenticated;

describe('<Application controller>', function() {
  var agent;
  beforeEach(cleaner);
  beforeEach(function(done) {
    login(request(app), function(loginAgent) {
      agent = loginAgent;
      APIs.mount('fetchAPI', 'http://api.anyfetch.com', done);
    });
  });


  describe('/context-search page', function() {
    var endpoint = '/app/context-search';

    checkUnauthenticated(app, 'get', endpoint);

    it("should return contextual datas", function(done) {
      var req = request(app).get(endpoint);
      agent.attachCookies(req);
      req
        .expect(200)
        .expect(function(res) {
          res.text.should.containDeep("Albert Einstein");
          res.text.should.containDeep("/app/documents/5309c5913a59fda826adc1d8");
        })
        .end(done);
    });
  });

  describe('/documents/:id page', function() {
    var endpoint = '/app/documents/5309c57d9ba7daaa265ffdc9';
    checkUnauthenticated(app, 'get', endpoint);

    it("should return document datas", function(done) {
      var req = request(app).get(endpoint);
      agent.attachCookies(req);
      req
        .expect(200)
        .expect(function(res) {
          res.text.should.containDeep("pdf2htmlEX");
          res.text.should.containDeep("mehdi.bouheddi@papiel.fr");
        })
        .end(done);
    });
  });

});
