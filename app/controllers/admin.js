/**
 * Administration controller
 */
'use strict';

var anyFetchHelper = require('../helpers/anyfetch');

/**
 * Create a subcompany and add an admin user
 * Called on time at package installation
 */
module.exports.init = function(req, res, next) {
  var data = req.body;
  if (!data.user || !data.organization) {
    return next(new Error('The init account should provide user and org informations'));
  }

  anyFetchHelper.initAccount(data, function(err, createdOrg) {
    if (err) {
      return next(err);
    }

    res.send(200, createdOrg.masterKey);
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