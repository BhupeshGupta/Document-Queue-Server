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
var create = require('sails/lib/hooks/blueprints/actions/create');
var _ = require('underscore');
var Promise = require("bluebird");
var Transaction = require('sails-mysql-transactions').Transaction;
var Transact = Promise.promisify(Transaction.start, Transaction);
var needleGet = Promise.promisify(needle.get, needle);

module.exports = {

  create: function(req, res){
    req.connection.on('close',function(){
     console.log('Client closed The connection / Broken Pipe');
   });
   return create(req, res);
  },

  updateStatus: function(req, res) {
    var queue = null,
      currentStat = null,
      file = null,
      data = {};

    var txn = null;

    Transact()
      .then(function(transaction) {
        txn = transaction;
        data = actionUtil.parseValues(req);
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
        queue = queueUpdate[0][0];

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
        file = fileUpdate[0][0];
        var url = [
          Connection.getPythonServerUrl(),
          "push?doctype=",
          queue.doctype,
          "&docname=",
          queue.cno,
          "&link=",
          Connection.getFileDowloadUrl(),
          file.id,
          "/"
        ].join("");
        console.log(url)

        return needleGet(url);
      })
      .then(function(pythonResponse) {
        if (pythonResponse[0].statusCode && pythonResponse[0].statusCode != 200)
          throw new Error('Python returned ' + pythonResponse[0].statusCode);

        var AudittrailP = Promise.promisifyAll(Audittrail.transact(txn));
        var qwerty = _.clone(queue);
        delete qwerty['createdAt'];
        delete qwerty['updatedAt'];
        return AudittrailP.createAsync(qwerty);
      })
      .then(function() {
        txn.commit();
        return res.send(currentStat);
      })
      .catch(function(error) {
        console.log(error);
        txn.rollback();
        return res.negotiate(error);
      });
  }

};
