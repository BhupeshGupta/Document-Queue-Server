/**
 * Cheque.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    chequeDate: {
      type: 'date',
    },
    receivingDate: {
      type: 'date'
    },
    bankOfCheque: {
      type: 'string',
    },
    chequeNumber: {
      type: 'string',
    },
    customerAccount: {
      type: 'string'
    },
    amount: {
      type: 'float'
    },
    chequeImage:{
      model:'Files',
      unique: true
    },
    company:{
      type:'string'
    },
    PayInSlip: {
      model: 'PayInSlip'
    }
  }

};
