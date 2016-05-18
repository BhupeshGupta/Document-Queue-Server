var needle = require('needle');
var Promise = require("bluebird");
var get = Promise.promisify(needle.get, needle);

module.exports = {
  VerifySession: function(sid) {
    return get(Connection.getErpBaseUrl() + 'api/method/flows.flows.controller.ephesoft_integration.get_user?sid=' + sid, {
      compressed: true
    }).then(function(response) {
      if (response.statusCode == 200) {
        req.user = JSON.parse(response.body.message);
        return req.user;
      }
    }).catch(function(error) {
      return error;
    });
  }
}
