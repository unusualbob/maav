# Mongoose-As-A-Validator (MAAV)
| Release | Master |
|---------|--------|
| [![CI](https://github.com/unusualbob/maav/actions/workflows/tests.yml/badge.svg?branch=release)](https://github.com/unusualbob/maav/actions/workflows/tests.yml) | [![CI](https://github.com/unusualbob/maav/actions/workflows/tests.yml/badge.svg)](https://github.com/unusualbob/maav/actions/workflows/tests.yml) |

Have you ever used Mongoose's schema validation and thought, "Hey this is way better than
every schema validation library, why can't I just use it for validation?" Well, technically you
could do it with just Mongoose, but you would end up with collections for every model you made and it would
be a big mess.

Enter **MAAV**. It uses the existing Mongoose schemas and validation logic without involving
the database layers that otherwise come with Mongoose.

### Because this module uses mongoose, it has a peer-dependency of mongoose@5.x or higher. If you do not install mongoose, this won't work.

### Warning: This project is still in a WIP state, which means its API is not yet stable. It may change drastically in the future.

## Getting Started
### Installation
```
npm i maav
```
### Usage
```js
const { Validator, Schema } = require('maav');

const ValidNameSchema = new Schema({
  name: {
    type: String,
    required: true,
    validate: /[^\d]/
  }
});

const SubmitNameRequest = new Validator.compile(ValidNameSchema);

router.post('/submitName', async (req, res) => {
  let nameSubmission = new SubmitNameRequest(req.body);
  try {
    await nameSubmission.validate();
  } catch (e) {
    return res.status(400).send({
      error: e.firstError()
    });
  }

  // Now we can be sure nameSubmission is valid
  // If you need a pure JS verison of the valid object
  // we can call nameSubmission.toObject()
});
```

## Schema design / validation rules
### Just reference [Mongoose's own validation documentation](https://mongoosejs.com/docs/validation.html)


## FAQ
* Is this officially supported by mongoose?
  * LOL no, please don't bug @Automattic for anything you encounter in this library
  unless you can reproduce within a purely mongoose environment. He does really good
  work, seriously. This module would not be possible if mongoose didn't exist. Don't be a jerk.
* Can I do **X** with this like I can in mongoose?
  * Just try it, see if it works. If not, and you really want to, you could always open an issue 
  to ask about it. If it's a good idea maybe I'll work on it. Also, I will accept pull
  requests which are not stupid ideas either.
