'use strict';

/**
 * @file Functions use to filter lists (documents, types, etc)
 */

/**
 * @return {Array} List filtered by `isActive`
 */
var isActive = function(o) {
  return o.isActive();
};

/**
* @return {Array} providers which are active
*/
module.exports.activeProviders = function(client) {
  return function() {
    var activeProviders = client.facetsProviders().filter(isActive);

    // Update client.filterByProvider
    client.filterByProvider(activeProviders.length !== 0);

    return client.filterByProvider() ? activeProviders : client.facetsProviders();
  };
};

/**
 * @eturn {Array} types which are active
 */
module.exports.activeTypes = function(client) {
  return function() {
    var activeTypes = client.types().filter(isActive);

    // Update client.filterByType
    client.filterByType(activeTypes.length !== 0);

    return client.filterByType() ? activeTypes : client.types();
  };
};

/**
 * @param {Object} document
 * @return {Array} `documents` filtered by active providers and active types
 */
module.exports.providerAndType = function(client) {
  return function(document) {
    var providerFilter = document.provider.isActive() || !client.filterByProvider();
    var typeFilter = document.type.isActive() || !client.filterByType();
    return providerFilter && typeFilter;
  };
};

/**
 * @param {Object} document
 * @return {Array} Only the `documents` which are starred
 */
module.exports.starredFilter = function() {
  return function(document) {
    return (document.isStarred() === true) && module.exports.providerAndType(document);
  };
};

/*
 * @param {SalesfetchViewModel} client
 * @return {Object} The AnyFetch API request parameters corresponding to the currently applied filters
 */
module.exports.paramsForFilter = function(client) {
  var providerIds = [];

  client.filteredProviders().forEach(function(provider) {
    providerIds.push(provider.id);
  });

  var typeIds = [];
  client.filteredTypes().forEach(function(type) {
    typeIds.push(type.id);
  });

  var params = {provider: providerIds, document_type: typeIds};
  return params;
};

/**
 *
 **/
module.exports.updateFilter = function() {
  this.fetchDocuments(false);
};
