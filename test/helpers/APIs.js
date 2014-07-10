'use strict';

/**
 * FetchAPI mockup for testing
 */

var fs = require('fs');
var nock = require('nock');

var APIs = {};

/**
 * Retrieve all the paths
 */
var walk = function(path, api) {
  fs.readdirSync(path).forEach(function(file) {
    var newPath = path + '/' + file;
    var stat = fs.statSync(newPath);
    if (stat.isFile() && file.substr(file.lastIndexOf('.') + 1) === 'json') {
      var endPointConfig = require(newPath);
      api
        .intercept(endPointConfig.path, endPointConfig.verb)
        .reply(endPointConfig.code ,endPointConfig.reply);
    } else if (stat.isDirectory()) {
      walk(newPath, api);
    }
  });
};


/**
 * Override all the HTTP requests on the server
 */
module.exports.mount = function() {
  throw new Error('Deprecated');
};


/**
 * Reset the HTTP calls on the fetchAPI
 */
module.exports.unmount = function() {
  throw new Error('Deprecated');
};
