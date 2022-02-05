const mongoose = require('mongoose');
const Schema = require('./lib/schema');
const Validator = require('./lib/validator');


module.exports = {
  Schema,
  Validator
};

/**
 * These are some Mongoose patches which should not impact any existing installs
 */

/**
 *  I wrote this validator code based on mongoose 6.x, to make it 5.x compatible
 *  we have to patch mongoose 5.x SchemaType to add this method to the prototype
 */
if (!mongoose.SchemaType.prototype.splitPath) {
  mongoose.SchemaType.prototype.splitPath = function() {
    if (this._presplitPath != null) {
      return this._presplitPath;
    }
    if (this.path == null) {
      return undefined;
    }

    this._presplitPath = this.path.indexOf('.') === -1 ? [this.path] : this.path.split('.');
    return this._presplitPath;
  };
}

/**
 * Patching mongoose validation error to easily obtain the first error in the errors object
 * This allows for easily using error.firstError() as a basic error message response for
 * an API layer response
 */
Object.defineProperty(mongoose.Error.ValidationError.prototype, 'firstError', {
  enumerable: true,
  writable: false,
  configurable: true,
  value: function() {
    for (let path in this.errors) {
      // This will break on the first valid error in the 'errors' object
      if (this.errors.hasOwnProperty(path)) {
        return Object.assign({}, { path, message: this.errors[path].message });
      }
    }
  }
});
