/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

 var create = require('sails/lib/hooks/blueprints/actions/create');
 module.exports = {
 	  create: function(req, res) {
 	    create(req, res);

 	  }
 	};
