let { should } = require('chai');
const { Validator, Schema } = require('../index');

// Wrap objects
should = should();

describe('Misc error handling', () => {
  describe('Validator', () => {
    it('should reject null schema', () => {
      let err;
      try {
        new Validator(null)
      } catch (e) {
        err = e;
      }
      should.exist(err);
    });

    it('should reject undefined schema', () => {
      let err;
      try {
        new Validator(undefined)
      } catch (e) {
        err = e;
      }
      should.exist(err);
    });

    it('should reject a non-object schema', () => {
      let err;
      try {
        new Validator('hello')
      } catch (e) {
        err = e;
      }
      should.exist(err);
    });

    it('should reject a non-object', () => {
      let BasicValidator = new Validator.compile(new Schema({ aField: { type: String }}));
      let err;
      try {
        new BasicValidator('hello')
      } catch (e) {
        err = e;
      }
      should.exist(err);
    });

  });

  describe('Schema', () => {
    it('should reject null', () => {
      let err;
      try {
        new Schema(null)
      } catch (e) {
        err = e;
      }
      should.exist(err);
    });
  });
});
