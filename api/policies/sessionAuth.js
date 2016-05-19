/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {
  var sid = req.param('sid');
  console.log(sid);
  SessionVerify.VerifySession(sid)
    .then(function(user) {
      console.log(user);
      req.user = user;
      return next();
    })
    .catch(function(error) {
      console.log(error);
      return res.forbidden('You are not permitted to perform this action.');
    });

};
