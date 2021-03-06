'use strict';

var idCounter = 0;
var noopFilter = function() {
  return true;
};

/**
 * @param {String} name
 * @param {String} display The CSS class corresponding to the icon of this tab
 * @param {Boolean} pullRight If true the tab will align right in horizontal menu
 * @param {Function} filter A function to use to filter the documents to be shown in this tab
 */
module.exports = function Tab(name, display, hasDocumentList, pullRight, filter) {
  var self = this;

  self.id = idCounter;
  idCounter += 1;

  self.name = name;
  self.url = '#' + self.name.toLowerCase();
  self.display = display;
  self.hasDocumentList = hasDocumentList || false;
  self.pullRight = pullRight || false;
  self.filter = filter || noopFilter;
};
