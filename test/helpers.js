let chai = require('chai');
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');

const { Schema, Helpers } = require('../index');
const sinon = require('sinon');
const { middleware } = Helpers;

chai.use(sinonChai);
chai.should();

let basicSchema = new Schema({
  name: {
    type: String,
    required: true
  }
});

function shouldError(res, status, msg) {
  res.status.should.be.calledWith(status);
  res.send.firstCall.args[0].should.exist;
  res.send.firstCall.args[0].error.should.exist;
  res.send.firstCall.args[0].error.message.should.exist;
  res.send.firstCall.args[0].error.message.should.equal(msg);
}

// function shouldNotError(res, status, msg) {
//   res.status.callCount.should.equal(0);
// }

function failCb() {
  throw new Error('This should not be called');
}

async function buildMiddlewareTest(body, options = {}, next) {
  const req = mockReq();
  const res = mockRes();
  req.body = body;
  await middleware(basicSchema, options)(req, res, next);
  return { req, res };
}

describe('Helpers', () => {
  describe('Express Middleware', () => {
    describe('Invalid Requests', () => {
      it('should error on false body', async () => {
        let { res } = await buildMiddlewareTest(false, null, failCb);
        shouldError(res, 400, 'Cast to Object failed for value "false" (type boolean)');
      });

      it('should error on null body', async () => {
        let { res } = await buildMiddlewareTest(null, null, failCb);
        shouldError(res, 400, 'Cast to Object failed for value "null"');
      });

      it('should error on empty body', async () => {
        let { res } = await buildMiddlewareTest(undefined, null, failCb);
        shouldError(res, 400, 'Cast to Object failed for value "undefined"');
      });

      it('should error on array body', async () => {
        let { res } = await buildMiddlewareTest([], null, failCb);
        shouldError(res, 400, 'Path `name` is required.');
      });

      it('should error on wrong type boolean for string', async () => {
        let { res } = await buildMiddlewareTest({ name: true }, null, failCb);
        shouldError(res, 400, 'Cast to String failed for value "true" (type boolean) at path "name"');
      });
    });
    describe('Valid Requests', () => {
      it('should succeeed with field set to valid string', async () => {
        let next = sinon.stub();
        let { req, res } = await buildMiddlewareTest({ name: 'stringName' }, null, next);
        res.status.callCount.should.equal(0);
        next.callCount.should.equal(1);
        req.validRequest.should.exist;
      });

      it('should silently drop extra field not in schema', async () => {
        let next = sinon.stub();
        let { req, res } = await buildMiddlewareTest({ name: 'stringName', fieldNotDeclared: 'testing' }, null, next);
        res.status.callCount.should.equal(0);
        next.callCount.should.equal(1);
        req.validRequest.should.exist;
        req.validRequest.name.should.exist;
        (typeof req.validRequest.fieldNotDeclared).should.equal('undefined');
      });

      it('should correctly not care about validation if option is set', async () => {
        let next = sinon.stub();
        let { req, res } = await buildMiddlewareTest({ name: 'stringName', fieldNotDeclared: 'testing' }, { validate: false }, next);
        res.status.callCount.should.equal(0);
        next.callCount.should.equal(1);
        req.parsedRequest.should.exist;
        req.parsedRequest.name.should.exist;
        (typeof req.validRequest).should.equal('undefined');
        (typeof req.parsedRequest.fieldNotDeclared).should.equal('undefined');
      });
    });
  });
});
