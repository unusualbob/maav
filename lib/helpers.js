const assert = require('assert');
const Schema = require('./schema');
const Validator = require('./validator');

module.exports.middleware = function middleware(schema, options = {}) {
  let {
    status = 400,
    validate = true,
    pojo = true,
    validRequest = 'validRequest',
    parsedRequest = 'parsedRequest'
  } = options || {};

  options = { status, validate, pojo, validRequest, parsedRequest, ...options };

  validateMiddlewareOptions(options);

  let requestSchema = schema instanceof Schema ? schema : new Schema(schema);
  let RequestValidator = new Validator.compile(requestSchema);

  return async function(req, res, next) {
    let parsedRequest;
    try {
      parsedRequest = new RequestValidator(req.body);
    } catch (e) {
      if (validate) {
        return res
          .status(status)
          .send({
            error: e.firstError ? e.firstError() : e
          });
      }
    }

    if (validate) {
      try {
        await parsedRequest.validate();
      } catch (e) {
        return res
          .status(status)
          .send({
            error: e.firstError ? e.firstError() : e
          });
      }

      /**
       * Validated request body
       * @type {Object|validator}
       */
      req[options.validRequest] = pojo ? parsedRequest.toObject() : parsedRequest;
    } else {
      /**
       * Parsed request body, NOT validated
       * @type {Object|validator}
       */
      req[options.parsedRequest] = pojo ? parsedRequest.toObject() : parsedRequest;
    }

    return next();
  };
};

function validateMiddlewareOptions({ status, validate } = {}) {
  // Status
  assert.strictEqual(typeof status, 'number');
  assert.ok(status > 200, '\'status\' must be a valid http status code > 200');
  assert.ok(status < 600, '\'status\' must be a valid http status code < 600');

  // Validate
  assert.equal(typeof validate, 'boolean');
}
