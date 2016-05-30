var needle = require('needle');
var Promise = require("bluebird");
var get = Promise.promisify(needle.get, needle);

module.exports = {
  VerifySession: function(sid) {
    console.log(sid);
    return get(Connection.getErpBaseUrl() + 'api/method/flows.flows.controller.ephesoft_integration.get_user?sid=' + sid, {
      compressed: true
    }).then(function(res) {
      var response = res[0];
      console.log(response.statusCode);
      if (response.statusCode && response.statusCode == 200) {
        return JSON.parse(response.body.message);
      }
      throw new Error('Logged Out');
    });
  }
}
