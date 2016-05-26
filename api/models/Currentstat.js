/**
 * Currentstat.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    cno: {
      type: 'string',
    },
    doctype: {
      type: "string"
    },
    account: {
      model: 'Account'
    },
    status: {
      type: 'string',
      defaultsTo: function() {
        return 0;
      }
    },
    date: {
      type: 'date'
    }
  }

};
