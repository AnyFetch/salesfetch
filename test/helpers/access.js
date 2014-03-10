'use strict';
var request = require('supertest');


module.exports.checkUnauthenticated = function checkUnauthenticated(app, verb, endpoint) {
  it('should reject unauthentified user', function(done) {
    if(endpoint instanceof Function) {
      endpoint = endpoint();
    }

    request(app)
      [verb](endpoint)
      .expect(200)
      .expect(/401/)
      .end(done);
  });
};
