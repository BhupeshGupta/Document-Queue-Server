var needle = require('needle');

module.exports = {

  mapSailsToErpDoctype: function(doctype, data) {
    objToStore = {};
    if (['VAT Form XII', 'Excise Invoice', 'Indent Invoice'].indexOf(doctype) > -1) {
      objToStore.doctype = 'Indent Invoice';
      objToStore.docname = data.bill_number;
    } else if (['Consignment Note'].indexOf(doctype) > -1) {
      objToStore.doctype = 'Sales Invoice';
    }
    return objToStore;
  }
}
