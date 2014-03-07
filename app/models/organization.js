'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');

var defaultProfilers = require('../../config/default-context-profilers.json');

/**
 * Organization Schema
 */
var OrgModel = new Schema ({
  created: {
    type: Date,
    default: Date.now
  },
  organizationId: {
    type: String,
    unique: true
  },
  name: String,
  currency: String,
  contextProfilers: [{
    record_type: String,
    query_template: String,
    display_template: String
  }]
});

/**
 * Validations
 */
OrgModel.path('contextProfilers').validate(function(contextProfilers) {
  // Check if there is duplication in record profilers
  var recordTypes = _.pluck(contextProfilers, 'record_type');
  recordTypes = _.uniq(recordTypes);
  return recordTypes.length === contextProfilers.length;
}, 'Record type in context profilers should be unique');

OrgModel.path('contextProfilers').validate(function(contextProfilers) {
  // Check if there is record type missing
  return contextProfilers.every(function(profiler) {
    return profiler.record_type;
  });
}, 'Record type should be set');

OrgModel.path('contextProfilers').validate(function(contextProfilers) {
  // Check if there is missing query template missing
  return contextProfilers.every(function(profiler) {
    return profiler.query_template;
  });
}, 'Query template should be set');

OrgModel.path('contextProfilers').validate(function(contextProfilers) {
  // Check if there is missing display template missing
  return contextProfilers.every(function(profiler) {
    return profiler.display_template;
  });
}, 'Display template should be set');

/**
 * Pre-save hook
 */
OrgModel.pre('save', function(next) {

  if (!this.isNew) {
    return next();
  }

  this.contextProfilers = defaultProfilers;
  next();
});

mongoose.model('Organization', OrgModel);
