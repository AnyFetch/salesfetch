/**
 * Administration controller
 */
'use strict';

var async = require('async');
var mongoose =require('mongoose');
var Organization = mongoose.model('Organization');

var anyFetchHelper = require('../helpers/anyfetch');



/**
 * Create a subcompany and add an admin user
 * Called one time at package installation
 */
module.exports.init = function(req, res, next) {
  async.waterfall([
    function checkParams(cb) {
      var data = req.body;
      if (!data.user || !data.organization) {
        return cb(new Error('The init account should provide user and org informations'));
      }

      cb(null, data);
    },
    function initAccount(data, cb) {
      anyFetchHelper.initAccount(data, cb);
    }
  ], function(err, createdOrg) {
    if (err) {
      return next(err);
    }

    res.send(200, createdOrg.masterKey);
  });
};

/**
 * Save in database that the package has been uninstalled
 */
module.exports.delete = function(req, res, next) {
  async.waterfall([
    function retrieveCompany(cb) {
      if (!req.organization.id) {
        return next({message: "Bad Request", status: 401});
      }

      Organization.findOne({SFDCId: req.organization.id}, cb);
    },
    function setDeletedOnCOmpany(org, cb) {
      org.deleted = true;
      org.save(cb);
    }
  ], function(err){
    if (err) {
      return next(err);
    }

    res.send(204);
  });
};

/**
 * Administration index page
 * Display the context profilers settings
 */
module.exports.index = function(req, res) {
  res.render('admin/index.html', {
    organization: req.organization,
    data: req.reqParams
  });
};
