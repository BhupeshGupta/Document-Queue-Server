var Promise = require("bluebird");
var http = require('http');


module.exports = {
  VerifySession: function(sid) {
    return new Promise(function(resolve, reject) {
      http.get(Connection.getErpBaseUrl() +
        'api/method/flows.flows.controller.ephesoft_integration.get_user?sid=' + sid,
        function(res) {
          res.setEncoding('utf8');
          var body = '';
          res.on('data', (chunk) => {
            body = body + chunk;
            console.log(chunk);
          });
          res.on('end', () => {
            console.log(res.statusCode);
            if (res.statusCode && res.statusCode == 200) {
              return resolve(JSON.parse(JSON.parse(body).message));
            }
            return reject();
          })
        })
    });
  }
}
