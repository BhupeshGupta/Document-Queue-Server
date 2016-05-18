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
    function mapSailsToErpDoctype(doctype, data) {
      objToStore = {}
      if (['VAT Form XII', 'Excise Invoice', 'Indent Invoice'].indexOf(doctype) > -1) {
        objToStore.doctype = 'Indent Invoice';
        objToStore.docname = data.bill_number;
      } else if (['Consignment Note'].indexOf(doctype) > -1) {
        objToStore.doctype = 'Sales Invoice';
      }
      return objToStore;
    }


    var data = actionUtil.parseValues(req);
    data.verifiedby = req.user.user;
    data.verifiedon = moment().format("YYYY-MM-DD h:mm:ss A");


    Queue.update({
      qid: data.qid,
    }, {
      status: data.status,
      verifiedby: req.user.user,
      verifiedon: moment().format("YYYY-MM-DD h:mm:ss A")
    }).exec(function afterwarderrors(err, updated) {


      if (err) return res.negotiate(err);

      Currentstat.update({
        cno: updated[0].cno,
        doctype: updated[0].doctype
      }, {
        status: updated[0].status,
      }).exec(function(err, Done) {
        if (err) {
          return res.negotiate(err);
        }

        Files.update({
          parenttype: 'Queue',
          parentid: data.qid
        }, {
          // parenttype: 'Currentstat',
          // parentid: Done[0].id
        }).exec(function(err, file) {
          if (err) {
            return res.negotiate(err);
          }
          console.log(file);

          // Queue.destroy({
          //     qid: data.qid
          //   })
          //   .exec(function(err, res) {
          //     if (err) {
          //       return res.negotiate(err);
          //     }
          //
          //   })

            needle.get("http://192.168.31.195:9005/push?doctype="+ updated[0].doctype +"&docname="+ updated[0].cno + "&link=http://localhost:1337/files/download/"+ file[0].id+ "/", function(error, response) {
                if (error)
                  return res.negotiate(error);
              });


        })
      })

      Audittrail.create(updated[0]).exec(function createCB(err, created) {
        if (err) return res.negotiate(err);
        return res.send(created);
      });
    });
  }

};
