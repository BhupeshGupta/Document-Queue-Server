/**
 * Queue.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    qid: {
      type: 'string',
      unique: 'true',
       primaryKey: true,
       autoIncrement: true
    },

    cno: {
      type: 'string'
    },

    doctype: {
      type: 'string'
    },

    uploadedby: {
      type: 'string'
    },

    uploadedon: {
      type: 'datetime'
    },

    verifiedby: {
      type: 'string'

    },
    verifiedon: {
      type: 'datetime'
    },

    status: {
      type: 'string',
      defaultsTo: function () {
        return 0;
      }},

    uploadedon: {
      type: 'datetime'
    },

    uploadedby: {
      type: 'string'
    }


  }
};
