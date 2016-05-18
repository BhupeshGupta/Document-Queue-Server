var needle = require('needle');
var cmis = require('cmis');
var url = '/alfresco/cmisbrowser';
var session = cmis.createSession(url);
session.setCredentials('admin', 'root');


module.export = {


  Hello: function(){
    console.log("hello");
  },

  getMeta: function(doctype, docname) {
    needle.get('http://localhost:8080/api/resource/' + doctype + '?filters=[["' + doctype + '","name","=","' + docname + '"], {"docstatus": 1}]',
      function(error, response) {
        if (error)
          return res.negotiate(error);
        if (response.data.length)
          return getmetadata(doctype, response.data[0].name);
      });
    needle.get('http://localhost:8080/api/resource/' + doctype + '?filters=[["' + doctype + '","name","like","' + docname + '"], {"docstatus": 1}]',
      function(error, response) {
        if (error)
          return res.negotiate(error);
        if (response.data.length)
          return getmetadata(doctype, response.data[0].name);
      });
  },

  getMetadata: function(doctype, data) {
    needle.get('http://http://localhost:8080/api/resource/' + doctype + '/"' + data,
      function(error, response) {
        if (error)
          return res.negotiate(error);
        if (response.data.length)
          console.log(getmetadata(response.data));
      });
  }

  // pushdoc: function(options) {}

};
