/**
 * QueueController
 *
 * @description :: Server-side logic for managing queues
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var create = require('sails/lib/hooks/blueprints/actions/create');
var moment = require('moment');
module.exports = {
   create: function(req, res) {
      req.options.values = {
       uploadedby:req.user.user,
       uploadedon: moment().format("YYYY-MM-DD h:mm:ss A")
     };
     return create(req, res);
   }
 };
