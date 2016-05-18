var extend = require('node.extend');


/**
 * FilesController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */



module.exports = {

	uploadMultipart: function(req, res) {
    // var SkipperDiskAdapter = require('skipper-disk');
    // var receiver = SkipperDiskAdapter().receive();
    req.file('file')
      .upload({
        maxBytes: 10000000
      }, function whenDone(err, uploadedFiles) {
        if (err) return res.negotiate(err);
        // If no files were uploaded, respond with an error.
        if (uploadedFiles.length === 0)
          return res.badRequest('No file was uploaded');
					var file = uploadedFiles[0];
					file = extend(file, req.body);
				Files.create(uploadedFiles[0]).
				exec(function (err, created) {
					if (err) return res.negotiate(err);
					return res.send(created);
				});
  });
},

download: function (req, res) {

		req.validate({
				id: 'string'
		});

		Files.findOne(req.param('id')).exec(function (err, file) {
				if (err) {
						return res.negotiate(err);
				}
				if (!file) {
						return res.notFound();
				}

				if (!file.fd) {
						return res.notFound();
				}

				var SkipperDisk = require('skipper-disk');
				var fileAdapter = SkipperDisk();

				// Stream the file down
				fileAdapter.read(file.fd)
						.on('error', function (err) {
								return res.serverError(err);
						})
						.pipe(res);
		});
}
};
