/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Transaction = require('sails-mysql-transactions').Transaction;
var create = require('sails/lib/hooks/blueprints/actions/create');
var Promise = require("bluebird");
var Transact = Promise.promisify(Transaction.start, Transaction);

module.exports = {
  create: function(req, res) {
    var txn = null;
    Transact().then(function(transaction) {
      txn = transaction;
      var AccountP = Promise.promisifyAll(Account.transact(transaction));
      return AccountP.createAsync(req.params.all())
        .then(function(account) {
          transaction.commit();
          return res.json(account);
        })
    }).catch(function(err) {
      txn.rollback();
      return res.serverError(err);
    });

  }

};
