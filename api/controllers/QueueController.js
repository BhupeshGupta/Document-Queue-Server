/**
 * QueueController
 *
 * @description :: Server-side logic for managing queues
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var create = require('sails/lib/hooks/blueprints/actions/create');
var moment = require('moment');
var destroy = require('sails/lib/hooks/blueprints/actions/destroy');

module.exports = {

   create: function(req, res) {
      req.options.values = {
       uploadedby:req.user.user,
       uploadedon: moment().format("YYYY-MM-DD h:mm:ss A")
     };
	console.log(req.body.cno);

     Currentstat.update({
      cno: req.body.cno,
      doctype: req.body.doctype
    }, {
      status: 3
    }).exec(function update(err, updated) {
      if (err)
        console.log("Error while Updating Currentstat With the value 3");
    });
     return create(req, res);
   },

	destroy: function(req, res) {
    console.log(req.body.UpdateStatus);
    if (req.body.UpdateStatus == true) {

      Queue.findOne({
        qid: req.body.qid
      }).exec(function queueData(err, records) {
        if (err) {
          console.log("error happened this" + err);
        } else {

          Currentstat.update({
            cno: records.cno,
            doctype: records.doctype
          }, {
            status: 2
          }).exec(function update(err, update) {
            if (err)
              console.log("Error while Updating Currentstat With the value 3" + err);
            else {
              Queue.destroy({
                qid: req.body.qid
              }).exec(function afterwards(err, updated) {
                if (err)
                  console.log("Error while Updating Currentstat With the value 3" + err);
                else
                  { console.log("this is entered");
		res.send(updated);
		}
              })
            }
          });
        }
      })
    }
  }
};

