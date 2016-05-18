/**
 * Files.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    fd: {
      type: 'string',
    },
    size: {
      type: 'int',
    },
    type: {
      type: 'string',
    },
    filename: {
      type: 'string'
    },
    parenttype: {
      type: 'string'
    },
    parentid: {
      type: 'string'
    }
  }
  
};
