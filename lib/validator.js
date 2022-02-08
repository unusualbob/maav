const { EventEmitter } = require('events');

// Mongoose specific elements
const mongoose = require('mongoose');
const ObjectParameterError = require('mongoose/lib/error/objectParameter');
const InternalCache = require('mongoose/lib/internal');

/**
 * This is the constructor for the validators themselves, should not be
 * called directly, instead the createValidator function calls this
 * Based *heavily* on mongoose/lib/document
 */

/**
 * Accepts any javascript object to validate against its base schema
 * This validator itself is basically a mongoose 'model', and instances of it are 'documents'
 * @param {Object} sourceObj Object to be validated
 * @returns {ValidatorObject}
 */
function Validator(sourceObj) {
  // Reject validating undefined/null
  if (sourceObj === undefined || sourceObj === null) {
    throw new mongoose.Error(`Cast to Object failed for value "${sourceObj}"`);
  }
  // Reject non-object input
  if (typeof sourceObj !== 'object') {
    throw new mongoose.Error(`Cast to Object failed for value "${sourceObj}" (type ${typeof sourceObj})`);
  }
  // Let devs know they're using this wrong
  if (!this.$__schema) {
    throw new Error('Invalid usage, you must compile validators via `MyValidator = new Validator.compile(schema)`');
  }

  // The rest of this is basically just to mimic internal behavior of the mongoose.document
  // constructor so that we can use its methods without issues. The code footprint has been
  // reduced to remove irrelevant db-based code where possible without impacting compatibility
  this.$__ = new InternalCache();
  this.$isNew = true;
  this.$__.strictMode = true;

  // These two can be removed in mongoose 6.x
  this.$__.$options = {};
  this.$__.emitter = new EventEmitter();

  const schema = this.$__schema;

  const requiredPaths = schema.requiredPaths(true);
  for (const path of requiredPaths) {
    this.$__.activePaths.require(path);
  }

  this.$__buildDoc(sourceObj, null, true, null, false, false);

  applyDefaults(this, true, {
    isNew: this.$isNew
  });

  if (sourceObj) {
    this.$set(sourceObj, undefined, true);
  }

  applyDefaults(this, false, {
    isNew: this.$isNew
  });
}

Validator.prototype.__proto__ = mongoose.Document.prototype;

// Make Validator an event emitter
for (const i in EventEmitter.prototype) {
  Validator[i] = EventEmitter.prototype[i];
}

/**
 * Generates a schema-based Validator, which can then be used to validate objects
 * This is based on mongoose.model.compile
 * @param {ValidationSchema} schema The schema to use for validating all input
 * @constructs {Validator}
 * @constructor
 */
Validator.compile = function compile(schema) {
  if (!schema) {
    throw new Error(`Parameter "schema" to Validator() must be an object, got ${schema}`);
  }
  if (typeof schema !== 'object') {
    throw new ObjectParameterError(schema, 'schema', 'Validator');
  }

  let validator = function validator(obj) {
    Validator.call(this, obj);
  };

  // Make validator an instance of Validator
  validator.__proto__ = Validator;
  validator.prototype.__proto__ = Validator.prototype;

  // Compile our schema
  validator.prototype.$__setSchema(schema);

  // validator.schema = validator.prototype.$__schema;
  return validator;
};

module.exports = Validator;


/**
 * This is basically a trimmed down version of the same function in mongoose/lib/document.js
 * It is called from the Validator constructor when a document is passed in
 * @param doc
 * @param isBeforeSetters
 * @param pathsToSkip
 */
function applyDefaults(doc, isBeforeSetters, pathsToSkip) {
  const paths = Object.keys(doc.$__schema.paths);
  const plen = paths.length;

  for (let i = 0; i < plen; ++i) {
    let def;
    let curPath = '';
    const p = paths[i];

    const type = doc.$__schema.paths[p];
    const path = type.splitPath();
    const len = path.length;
    let doc_ = doc._doc;

    for (let j = 0; j < len; ++j) {
      if (doc_ == null) {
        break;
      }

      const piece = path[j];
      curPath += (!curPath.length ? '' : '.') + piece;

      if (j === len - 1) {
        if (doc_[piece] !== void 0) {
          break;
        }

        if (typeof type.defaultValue === 'function') {
          if (!type.defaultValue.$runBeforeSetters && isBeforeSetters) {
            break;
          }
          if (type.defaultValue.$runBeforeSetters && !isBeforeSetters) {
            break;
          }
        } else if (!isBeforeSetters) {
          // Non-function defaults should always run **before** setters
          continue;
        }

        if (pathsToSkip && pathsToSkip[curPath]) {
          break;
        }

        try {
          def = type.getDefault(doc, false);
        } catch (err) {
          doc.invalidate(p, err);
          break;
        }

        if (typeof def !== 'undefined') {
          doc_[piece] = def;
          doc.$__.activePaths.default(p);
        }
      } else {
        doc_ = doc_[piece];
      }
    }
  }
}

/**
 * Keeping all the extra js-doc definitions down here to keep them out of the way
 */

/**
 * Executes all synchronous validation rules declared on this validator's schema
 * Skips any asynchronous validation rules so can be unsafe to trust if such rules are declared
 * @function validateSync
 * @param {string|string[]} [path] Optionally you can specify a path/paths on this object to limit what fields are validated
 * @returns {ValidationError|CastError|undefined} Returns an error only if a validation rule fails
 */

/**
 * Executes all validation rules declared on this validator's schema
 * @function validate
 * @param {string|string[]} [path] Optionally you can specify a path/paths on this object to limit what fields are validated
 * @async
 * @throws {ValidationError|CastError}
 */

/**
 * Exports the javascript object that this validator represents, generally you want to call this after you've validated your
 * object to get the validated output to use in your functions
 * @function toObject
 * @returns {Object} Plain Javascript Object
 */

/**
 * @typedef {Class} ValidatorObject
 * @property {validate} validate
 * @property {validateSync} validateSync
 * @property {toObject} toObject
 */
