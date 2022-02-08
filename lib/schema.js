const mongoose = require('mongoose');
const ObjectParameterError = require('mongoose/lib/error/objectParameter');
const Kareem = require('kareem');

/**
 * Validation schema, based on mongoose's schema, but does not care about any options or non-validation flags
 * @constructor
 * @param {Object} schemaDefinition
 * @param {Object} [options]
 * @param {Boolean=false} [options._id] - Not sure why you would want to enable _ids but leaving the option here
 * @param {Boolean=true} [options.typeStrict] - Fully restrict all types on this schema, ie any casting will throw an error
 */
function ValidationSchema(schemaDefinition, options = {}) {
  let { _id = false, typeStrict = true } = options;

  if (!schemaDefinition) {
    throw new ObjectParameterError(schemaDefinition, 'obj', 'ValidationSchema');
  }
  if (!(this instanceof ValidationSchema)) {
    return new ValidationSchema(schemaDefinition, { _id, typeStrict });
  }

  // These are all used by mongoose.Schema
  this.obj = schemaDefinition;
  this.paths = {};
  this.aliases = {};
  this.subpaths = {};
  this.virtuals = {};
  this.singleNestedPaths = {};
  this.nested = {};
  this.inherits = {};
  this.callQueue = [];
  this._indexes = [];
  this.methods = {};
  this.methodOptions = {};
  this.statics = {};
  this.tree = {};
  this.query = {};
  this.childSchemas = [];
  this.plugins = [];
  // For internal debugging. Do not use this to try to save a schema in MDB.
  // this.$id = ++id;
  this.mapPaths = [];

  this.s = {
    hooks: new Kareem()
  };

  this.options = this.defaultOptions({ _id, typeStrict });

  // build paths
  if (Array.isArray(schemaDefinition)) {
    for (const definition of schemaDefinition) {
      this.add(definition);
    }
  } else if (schemaDefinition) {
    this.add(schemaDefinition);
  }

  this.setupTimestamp(this.options.timestamps);
}

ValidationSchema.prototype.add = function(obj) {
  // This is how we add the strict type-checking setter to each document without having to mess with mongoose code
  if (this.options.typeStrict) {
    if (!(obj instanceof ValidationSchema)) {
      for (let key of Object.keys(obj)) {
        if (obj[key][this.options.typeKey]) {
          if (
            typeof obj[key].set === 'function' &&
            obj[key].set.name !== 'restrictType' &&
            obj[key].set.name !== '_wrapSet'
          ) {
            let ogSet = obj[key].set;
            obj[key].set = function _wrapSet(val, priorVal, scope) {
              ogSet(restrictType(val, priorVal, scope), priorVal, scope);
            };
          } else {
            obj[key].set = restrictType;
          }
        }
      }
    }
  }
  // console.trace('add', obj, prefix, this);
  mongoose.Schema.prototype.add.call(this, ...arguments);
};

ValidationSchema.prototype.__proto__ = mongoose.Schema.prototype;

module.exports = ValidationSchema;

/**
 * Very strict type enforcement for input types
 * This is effectively just a mongoose setter, but we automatically apply it to every field in a schema
 * This can be disabled by changing the schema options
 * @param val
 * @param priorVal
 * @param scope
 * @returns {*}
 */
function restrictType(val, priorVal, scope) {
  // Mongoose 5.x does not pass priorVal, so switch if scope is missing
  if (!scope) {
    scope = priorVal;
  }
  let type = scope.options.type;

  // Skip undefined things, since those will be handled by 'required' logic if necessary
  if (val === null || val === undefined) {
    return val;
  }

  // Allow some types when dealing with dates, as mongoose has reasonable date casting restrictions
  if (
    type === Date &&
    (
      ( // Allow numbers greater than 0 as they can be valid unix timestamps
        typeof val === 'number' &&
        val >= 0
      ) ||
      ( // Allow strings which at least contain a number, as they could be a valid date string
        typeof val === 'string' &&
        /\d/.test(val)
      )
    )
  ) {
    return val;
  }

  let check = val => {
    if (val.constructor !== type) {
      throw new mongoose.Error.CastError(type.name, val, scope.path);
    }
  };

  // For arrays, we enforce that the object must be an array
  if (Array.isArray(scope.options.type)) {
    if (!Array.isArray(val)) {
      throw new mongoose.Error.CastError('Array', val, scope.path);
    }
    if (scope.options.type[0]) {
      type = scope.options.type[0];
    }
    // Then we need to check the types inside the array
    for (let item of val) {
      check(item);
    }
  } else {
    // Not an array, check directly
    check(val);
  }
  return val;
}

module.exports.restrictType = restrictType;
