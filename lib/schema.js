const mongoose = require('mongoose');
const ObjectParameterError = require('mongoose/lib/error/objectParameter');

/**
 * Validation schema, based on mongoose's schema, but does not care about any options or non-validation flags
 * @constructor
 * @param {Object} schemaDefinition
 */
function ValidationSchema(schemaDefinition) {
  if (!schemaDefinition) {
    throw new ObjectParameterError(schemaDefinition, 'obj', 'ValidationSchema');
  }
  // So that we don't have to explicitly flag every validation-only schema with _id: false in the options
  return new mongoose.Schema(schemaDefinition, { _id: false });
}

module.exports = ValidationSchema;
