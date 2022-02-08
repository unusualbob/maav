let { should } = require('chai');
const { Validator, Schema } = require('../index');

// Wrap objects
should = should();

// helper
async function generateAndValidate(Validator, data) {
  let params = new Validator(data);
  let err;

  try {
    await params.validate();
  } catch (e) {
    err = e;
  }
  return { err, params };
}

async function generateBasicTest({
  type,
  required = false,
  data = {},
  error = false,
  keys = 0,
  fn,
  fnAsync,
  def
}) {
  let baseErrorStack = new Error().stack.split('\n').slice(2).join('\n');
  try {
    let schema = new Schema({
      aField: {
        type,
        required,
        default: def
      }
    });
    let { err, params } = await generateAndValidate(new Validator.compile(schema), data);
    should.exist(params);
    error ? should.exist(err) : should.not.exist(err);
    Object.keys(params.toJSON()).length.should.equal(keys);
    fn && fn({ err, params });
    fnAsync && await fnAsync({ err, params });
  } catch (e) {
    e.stack = `${e.stack}${baseErrorStack}`;
    throw e;
  }
}

function checkFieldExists(field) {
  return ({ params }) => {
    should.exist(params[field]);
  };
}


describe('Basic type checks', () => {
  // Make these available for easier overriding of defaults
  let required = true;
  let error = true;
  let keys = 1;

  let typeTests = [{
    title: 'String',
    type: String,
    def: 'hello',
    data: { aField: 'something' }
  }, {
    title: 'Number',
    type: Number,
    def: 10,
    data: { aField: 5 }
  }, {
    title: 'Boolean',
    type: Boolean,
    def: true,
    data: { aField: false }
  }, {
    title: 'Date',
    type: Date,
    def: new Date(),
    data: { aField: new Date('2022-02-06') }
  }, {
    title: 'Date-String',
    type: Date,
    def: new Date(),
    data: { aField: new Date('2022-02-06').toISOString() }
  }];

  typeTests.forEach(generateRequiredTests);

  function generateRequiredTests({ title, type, def, data }) {
    describe(title, () => {
      it(
        'should not error and should be empty if nothing is passed in and nothing is required',
        async () => {
          return generateBasicTest({ type });
        }
      );

      it(
        'should error and should be empty if nothing is passed in and something is required',
        async () => {
          return generateBasicTest({ type, required, error });
        }
      );

      it(
        'should not error and should not be empty if something is passed in',
        async () => {
          return generateBasicTest({ type, required, data, keys });
        }
      );

      it(
        'should not error and should not be empty if nothing is passed in and nothing is required and a default is set',
        async () => {
          return generateBasicTest({ type, def, keys });
        }
      );

      it(
        'should not error and should not be empty if nothing is passed in and something is required and a default is set',
        async () => {
          return generateBasicTest({ type, required, def, keys, fn: checkFieldExists('aField') });
        }
      );

      it(
        'should not error and should not be empty if nothing is passed in and something is required and a default function is set',
        async () => {
          return generateBasicTest({ type, required, def: () => { return def; }, keys, fn: checkFieldExists('aField') });
        }
      );
    });
  }
});

// TODO: Add validation tests from mongoose.js to make sure everything works the same


// let numberSchema = new Schema({
//   emptyNumber: {
//     type: Number
//   },
//   emptyNumberDefault: {
//     type: Number,
//     default: 10
//   },
//   numberWithEnum: {
//     type: Number,
//     enum: [1,2,3]
//   },
//   numberWithMin: {
//     type: Number,
//     min: 5
//   },
//   numberWithMax: {
//     type: Number,
//     enum: [1,2,3],
//     max: 5
//   },
//   name: {
//     type: Number,
//     required: true
//   }
// });
