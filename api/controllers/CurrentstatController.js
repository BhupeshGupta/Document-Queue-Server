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

module.exports = {

  updateStatus: function(req, res) {
    try {
      Queue.query("BEGIN", function(err) {

        if (err) {
          throw new Error(err);
        }

        var data = actionUtil.parseValues(req);
        getMetaData.mapSailsToErpDoctype(data.doctype, data);

        data.verifiedby = req.user.user;
        data.verifiedon = moment().format("YYYY-MM-DD h:mm:ss A");

        Queue.update({
          qid: data.qid,
        }, {
          status: data.status,
          verifiedby: req.user.user,
          verifiedon: moment().format("YYYY-MM-DD h:mm:ss A")
        }).exec(function afterwarderrors(err, updated) {

          if (err) {
            throw new Error(err);
          }

          Currentstat.update({
            cno: updated[0].cno,
            doctype: updated[0].doctype
          }, {
            status: updated[0].status,
          }).exec(function(err, Done) {
            if (err) {
              throw new Error(err);
            }

            Files.update({
              parenttype: 'Queue',
              parentid: data.qid
            }, {}).exec(function(err, file) {
              if (err) {
                throw new Error(err);
              }

              throw new Error('Error');

              // Queue.destroy({
              //     qid: data.qid
              //   })
              //   .exec(function(err, res) {
              //     if (err) {throw new Error(err);}
              //   })

              needle.get(Connection.getPythonServerUrl() + "push?doctype=" + updated[0].doctype + "&docname=" + Connection.getFileDowloadUrl() + updated[0].cno + "&link=" + file[0].id + "/", function(error, response) {
                if (err) {
                  throw new Error(err);
                }
              });
            })
          })

          Audittrail.create(updated[0]).exec(function createCB(err, created) {
            if (err) {
              throw new Error(err);
            }
            Queue.query("COMMIT", function(err) {
              if (err) {
                throw new Error(err);
              }
              return res.send(created);
            });

          });
        });
      });
    } catch (e) {
      console.log('Yay. error caught');
      console.log(e);
      Queue.query("ROLLBACK", function(err) {
        // The rollback failed--Catastrophic error!
        if (err) {
          return res.serverError(err);
        }
        // Return the error that resulted in the rollback
        return res.serverError(e);
      });
    }



  }
};
