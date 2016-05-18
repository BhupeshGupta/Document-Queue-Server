/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

var needle = require('needle');
module.exports = function(req, res, next) {

  var sid = req.param('sid');

  needle.get('http://192.168.31.195:8080/api/method/flows.flows.controller.ephesoft_integration.get_user?sid=' + sid, {
    compressed: true
  }, function(error, response) {
    if (!error && response.statusCode == 200) {
      req.user = JSON.parse(response.body.message);
      return next();
    }
    return res.forbidden('You are not permitted to perform this action.');
  });
};
