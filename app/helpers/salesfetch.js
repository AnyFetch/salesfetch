'use strict';

var express = require('express');
var Mustache = require('mustache');
var async = require('async');
var AnyFetch = require('anyfetch');

var mongoose =require('mongoose');
var Pin = mongoose.model('Pin');
var anyfetchHelpers = require('../helpers/anyfetch.js');

module.exports.findPins = function(sfdcId, user, finalCb) {
  // This is not a failure, just a particular case that we take into account
  var noPinError = new express.errors.NotFound('No pin was found for this context');

  // Retrieve documents pinned to that context
  async.waterfall([
    function searchMongo(cb) {
      Pin.find({ SFDCId: sfdcId }, cb);
    },
    // Fetch all snippets in one call
    function fetchDocumentsAndDocumentTypes(pins, cb) {
      // If no pin was found, abort
      // We use waterfall's err mechanism rather than calling `finalCb` directly
      // in order to avoid a memory leak
      if(pins.length === 0) {
        return cb(noPinError, pins);
      }

      // Fetch all snippets in one call
      var anyfetch = new AnyFetch(user.anyFetchToken);
      var ids = pins.map(function(pin) {
        return pin.anyFetchId;
      });
      var query = { id: ids, sort: '-creationDate' };
      anyfetch.getDocumentsWithInfo(query, cb);
    },
    function applyTemplates(docs, cb) {
      docs = docs.data.map(function(doc) {
        // TODO: refactor (also used in `findDocuments`)
        var template;
        var overridedTemplates = anyfetchHelpers.getOverridedTemplates();
        if (overridedTemplates[doc.document_type.id]) {
          template = overridedTemplates[doc.document_type.id].templates.snippet;
        } else {
          template = doc.document_type.templates.snippet;
        }

        doc.pinned = true;
        doc.snippet_rendered = Mustache.render(template, doc.data);
        return doc;
      });
      cb(null, docs);
    }
  ], function(err, docs) {
    // See in `fetchDocumentsAndDocumentTypes` above
    if (err === noPinError) {
      err = null;
    }
    finalCb(err, docs);
  });
};

/**
 * @param {Object} sfdcId The context's ID
 * @param {Object} anyFetchId The document's ID
 * @param cb(err, pin) The callback will be called with the pin associated to this object in this context, or null if none exists
 */
module.exports.getPin = function(sfdcId, anyFetchId, cb) {
  Pin.findOne({
    SFDCId: sfdcId,
    anyFetchId: anyFetchId
  }, cb);
};

/**
 * Set the property `pinned` on each of the passed documents.
 * @param {String} sfdcId Id of the context in which to look for pins
 * @param {Array} The array of documents to mark
 * @param cb(err, documents)
 */
module.exports.markIfPinned = function(sfdcId, documents, finalCb) {
  async.waterfall([

    function getPinsForThisContext(cb) {
      Pin.find({ SFDCId: sfdcId }, cb);
    },

    function traversePins(pins, cb) {
      if(pins) {
        var hash = {};
        pins.forEach(function(pin) {
          hash[pin.anyFetchId] = true;
        });

        documents.data.forEach(function(doc) {
          doc.pinned = false;
          if(doc.id in hash) {
            doc.pinned = true;
          }
        });

        cb(null, documents);
      }
    }

  ], finalCb);
};

/**
 * Add a new pin
 */
module.exports.addPin = function(sfdcId, anyFetchId, user, cb) {
  var pin = new Pin({
    createdBy: user.id,
    SFDCId: sfdcId,
    anyFetchId: anyFetchId
  });

  pin.save(cb);
};

/**
 * Remove an existing pin
 */
module.exports.removePin = function(sfdcId, anyFetchId, user, finalCb) {
  var hash = {
    SFDCId: sfdcId,
    anyFetchId: anyFetchId
  };

  async.waterfall([
    function findPin(cb) {
      Pin.findOne(hash)
         .populate('createdBy')
         .exec(cb);
    },
    function checkPin(pin, cb) {
      if(!pin) {
        return cb(new express.errors.NotFound('The object ' + anyFetchId + ' was not pinned in the context ' + sfdcId));
      }
      if(!pin.createdBy || !pin.createdBy.organization.equals(user.organization)) {
        return cb(new express.errors.Forbidden('You cannot delete a pin from another organization'));
      }

      cb(null, pin);
    },
    function removePin(pin, cb) {
      pin.remove(cb);
    }
  ], finalCb);
};
