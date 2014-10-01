'use strict';

module.exports = function sliceInTime(documents) {
  var timeSlices = [{
    label: 'Today',
    maxDate: moment().startOf('day'),
    documents: []
  }, {
    label: 'Yesterday',
    maxDate: moment().startOf('day').subtract(1, 'day'),
    documents: []
  }, {
    label: 'Earlier this Week',
    maxDate: moment().startOf('week'),
    documents: []
  }, {
    label: 'Last Week',
    maxDate: moment().startOf('week').subtract(1, 'week'),
    documents: []
  }, {
    label: 'Earlier this Month',
    maxDate: moment().startOf('month'),
    documents: []
  }, {
    label: 'Last Month',
    maxDate: moment().startOf('month').subtract(1, 'month'),
    documents: []
  }, {
    label: 'Earlier this Year',
    maxDate: moment().startOf('year'),
    documents: []
  }, {
    label: 'Last Year',
    maxDate: moment().startOf('year').subtract(1, 'year'),
    documents: []
  }, {
    label: 'Older',
    documents: []
  }];

  documents.forEach(function(doc) {
    var modificationDate = moment(doc.modificationDate);
    var found = false;
    for (var i = 0; i < timeSlices.length && !found; i+=1) {
      if(i === 0 && modificationDate.isAfter(timeSlices[i].maxDate)) {
        found = true;
        timeSlices[i].documents.push(doc);
      }

      if(!found && (!timeSlices[i].maxDate || modificationDate.isAfter(timeSlices[i].maxDate))) {
        found = true;
        timeSlices[i].documents.push(doc);
      }
    }
  });

  return timeSlices;
};
