  module.exports = function(req, res, next) {
      if(1){
        return next();
      }
      return res.forbidden('You are not permitted to perform this action.');
    };
