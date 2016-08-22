/**
 * ChequeController
 *
 * @description :: Server-side logic for managing cheques
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var create = require('sails/lib/hooks/blueprints/actions/create');
module.exports = {
  without_payin: function(req,res)
  {
    Cheque.query('SELECT * FROM cheque where PayInSlip IS NULL', function(err, results) {
      if (err) return res.serverError(err);
      console.log(results);
      return res.ok(results);
    });
  },

  with_payin: function(req,res)
  {
    Cheque.query('SELECT * FROM cheque where PayInSlip IS NOT NULL', function(err, results) {
      if (err) return res.serverError(err);
      console.log(results);
      return res.ok(results);
    });
  }



};
