'use strict';

var request = require('superagent');
var Mustache = require('mustache');
var async = require('async');
var crypto = require('crypto');

var mongoose =require('mongoose');
var Organization = mongoose.model('Organization');
var User = mongoose.model('User');

/**
 * Execute query and return a list of templated sinppets
 */
var baseRequest = function(url, endpoint, cb) {
  var urlToCall = url + endpoint;
  return request.get(urlToCall)
    .set('Authorization', 'Basic ' + process.env.FETCHAPI_CREDS)
    .end(function(e, r) {cb(e,r);});
};


module.exports.findDocuments = function(url, params, cb) {
  var query = [];
  for(var key in params) {
    query.push(key + "=" + encodeURIComponent(params[key]));
  }

  var pages = [
    '/document_types',
    '/providers',
    '/documents?' + query.join('&')
  ];

  var batchParams = pages.map(encodeURIComponent).join('&pages=');
  var batchUrl = '/batch?pages=' + batchParams;
  baseRequest(url, batchUrl, function(err, res) {

    if (err) {
      return cb(err);
    }

    var body = res.body;

    var documentTypes = body[pages[0]];
    var providers = body[pages[1]];
    var docReturn = body[pages[2]];

    if (!docReturn.datas) {
      return cb(null, docReturn);
    }

    // Render the datas templated
    docReturn.datas.forEach(function(doc) {
      var relatedTemplate = documentTypes[doc.document_type].template_snippet;
      doc.snippet_rendered = Mustache.render(relatedTemplate, doc.datas);

      doc.provider = providers[doc.token].name;
      doc.document_type = documentTypes[doc.document_type].name;
    });

    // Return all the documents types
    docReturn.document_types = {};
    for (var docType in docReturn.facets.document_types) {
      if (docType) {
        var dT = {
          id: docType,
          count: docReturn.facets.document_types[docType],
          name: documentTypes[docType].name
        };

        docReturn.document_types[docType] = dT;
      }
    }

    // Return all the providers
    docReturn.providers = {};
    for (var provider in docReturn.facets.tokens) {
      if (provider) {
        var p = {
          id: provider,
          count: docReturn.facets.tokens[provider],
          name: providers[provider].name
        };

        docReturn.providers[provider] = p;
      }
    }

    // Result number
    docReturn.count = 0;
    for(var token in docReturn.facets.tokens) {
      docReturn.count += docReturn.facets.tokens[token];
    }

    cb(null, docReturn);
  });
};

/**
 * Find and return a single templated document
 */
module.exports.findDocument = function(url, id, cb) {
  var pages = [
    '/document_types',
    '/providers',
    '/documents/' + id
  ];

  var batchParams = pages.map(encodeURIComponent).join('&pages=');
  baseRequest(url, '/batch?pages=' + batchParams, function(err, res) {
    if (err) {
      return cb(err);
    }

    var body = res.body;

    var documentTypes = body[pages[0]];
    var providers = body[pages[1]];
    var docReturn = body[pages[2]];

    var relatedTemplate = documentTypes[docReturn.document_type].template_full;
    var titleTemplate = documentTypes[docReturn.document_type].template_title;

    docReturn.full_rendered = Mustache.render(relatedTemplate, docReturn.datas);
    docReturn.title_rendered = Mustache.render(titleTemplate, docReturn.datas);

    docReturn.provider = providers[docReturn.token].name;
    docReturn.document_type = documentTypes[docReturn.document_type].name;

    cb(null, docReturn);
  });
};


/**
 * Create a subcompany and an admin on the FetchAPi
 * Store the linking informations btw Salesforce and FetchApi
 */
module.exports.initAccount = function(data, cb) {
  var endpoint = 'http://api.anyfetch.com';

  var user = data.user;
  var org = data.organization;


  async.waterfall([
    function createRandomPassword(cb) {
      crypto.randomBytes(48, function(ex, buf) {
        var password = buf.toString('hex');
        cb(null, password);
      });
    },
    function createAccount(password, cb) {
      user.password = password;

      request.post(endpoint + '/users')
        .set('Authorization', 'Basic ' + process.env.FETCHAPI_CREDS)
        .send({
          email: user.email,
          name: user.name,
          password: password,
          is_admin: true,
        })
        .end(function(e, r) {cb(e,r);});
    },
    function retrieveUserToken(anyFetchUser, cb) {
      user.anyFetchId = anyFetchUser.id;

      request.get(endpoint + '/token')
        .set('Authorization', 'Basic ' + new Buffer(user.email + ':' + user.password).toString('base64'))
        .end(function(err, res) {
          if (err) {
            return cb(new Error('Impossible to retrieve token'));
          }

          cb(null, res.token);
        });
    },
    function createSubCompany(token, cb) {
      user.token = token;

      request.post(endpoint + '/subcompanies')
        .set('Authorization', 'Bearer ' + token)
        .send({
          name: org.name
        })
        .end(function(e, r) {cb(e,r);});
    },
    function saveLocalCompany(anyFetchSubCompany, cb) {
      var localOrg = new Organization({
        name: org.name,
        SFDCId: org.id,
        anyFetchId: anyFetchSubCompany.id
      });

      localOrg.save(cb);
    },
    function saveLocalUser(localOrganization, cb) {
      org = localOrganization;

      var localUser = new User({
        name: user.name,
        email: user.email,
        SFDCId: user.id,
        anyFetchId: user.anyFetchId,
        token: user.token,
        organization: localOrganization._id
      });

      localUser.save(cb);
    }
  ], function(err) {
    if (err) {
      return cb(err);
    }

    cb(null, org);
  });
};
