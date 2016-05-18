/**
 * Audittrail.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        cno: {
            type: 'string',
        },
        doctype: {
            type: "string"
        },
        account: {
            model: 'account'
        },
        status: {
            type: 'string'
        },
        uploadedby: {
          type: 'string'
        },
        uploadedon: {
          type: 'datetime'
        },
        verifiedby: {
          type: 'string'
        },
        verifiedon: {
          type: 'datetime'
        }
    }
    
};
