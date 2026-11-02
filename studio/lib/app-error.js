// Built from src/app-error.js by studio-static/build.js.

const module = { exports: {} };
const require = (name) => ({  })[name];
(function (require, module, exports) {
'use strict';

// An error the API answers with: a code the client knows how to word, and an HTTP status.
// Kept on its own so code shared with the desktop studio needs nothing else from the server.
class AppError extends Error {
  constructor(code, status = 400, details = undefined) {
    super(code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

module.exports = { AppError };

})(require, module, module.exports);
export default module.exports;
