module.exports = {

  getErpBaseUrl: function() {
    return sails.config.urlconfig.ErpBaseUrl
  },
  getReviewServerBaseUrl: function() {
    return sails.config.urlconfig.ReviewServerBaseUrl
  },
  getFileDowloadUrl: function() {
    return sails.config.urlconfig.FileDowloadUrl
  },
  getPythonServerUrl: function() {
    return sails.config.urlconfig.PythonServerUrl
  }
};
