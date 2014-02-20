'use strict';

var request = require('supertest');
var app = require('../../app.js');

describe('<website controller>', function() {
  it('respond with valide html', function(done) {
    request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200, done);
  });
});