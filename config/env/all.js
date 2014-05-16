'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
  root: rootPath,
  port: process.env.PORT || 3000,
  hostname: process.env.HOST || process.env.HOSTNAME,

  fetchApiUrl: process.env.FETCHAPI_URL || "http://api.anyfetch.com",
  fetchApiCreds: process.env.FETCHAPI_CREDS
};