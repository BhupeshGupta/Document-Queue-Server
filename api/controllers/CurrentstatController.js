/**
 * CurrentstatController
 *
 * @description :: Server-side logic for managing currentstats
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var http = require('http');
var moment = require('moment');
var needle = require('needle');
var fs = require('fs');
var update = require('sails/lib/hooks/blueprints/actions/update');
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var create = require('sails/lib/hooks/blueprints/actions/update');
var _ = require('underscore');
var Promise = require("bluebird");
var Transaction = require('sails-mysql-transactions').Transaction;

var Transact = Promise.promisify(Transaction.start, Transaction);
var needleGet = Promise.promisify(needle.get, needle);

module.exports = {

  updateStatus: function(req, res) {
    var queue = null,
      currentStat = null,
      file = null;

    var txn = null;

    Transact()
      .then(function(transaction) {
        txn = transaction;
        var data = actionUtil.parseValues(req);
        data.verifiedby = req.user.user;
        data.verifiedon = moment().format("YYYY-MM-DD h:mm:ss A");

        var QueueP = Promise.promisifyAll(Queue.transact(txn));

        return QueueP.updateAsync({
          qid: data.qid,
        }, {
          status: data.status,
          verifiedby: req.user.user,
          verifiedon: moment().format("YYYY-MM-DD h:mm:ss A")
        })

      })
      .then(function(queueUpdate) {
        queue = queueUpdate[0];
        var CurrentstatP = Promise.promisifyAll(Currentstat.transact(txn));

        return CurrentstatP.updateAsync({
          cno: queue.cno,
          doctype: queue.doctype
        }, {
          status: queue.status,
        });
      })
      .then(function(currentStatUpdate) {
        currentStat = currentStatUpdate[0];
        var FilesP = Promise.promisifyAll(Files.transact(txn));

        return FilesP.updateAsync({
          parenttype: 'Queue',
          parentid: queue.qid
        }, {
          // TODO UPDATE FILE LINK
        });
      })
      .then(function(fileUpdate) {
        // throw new Error('Fucked up');
        file = fileUpdate;
        return needleGet([
          Connection.getPythonServerUrl(),
          "push?doctype=",
          queue.doctype,
          "&docname=",
          queue.cno,
          "&link=",
          Connection.getFileDowloadUrl(),
          file[0].id,
          "/"
        ].join(""));
      })
      .then(function(pythonResponse) {
        // TODO if status != 200, throw error and rollback
        var AudittrailP = Promise.promisifyAll(Audittrail.transact(txn));
        return AudittrailP.createAsync(queue);
      })
      .then(function() {
        txn.commit();
        return res.send(currentStat);
      })
      .catch(function(error) {
        console.log('Yay. error caught');
        console.log(error);
        txn.rollback();
        return res.negotiate(error);
      });
  }

};
