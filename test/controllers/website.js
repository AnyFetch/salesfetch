'use strict';

var request = require('supertest');
var app = require('../../app.js');

describe('website', function() {
  it('respond with valide html', function(done) {
    request(app)
      .get('/')
      .expect(200, done);
  });
});