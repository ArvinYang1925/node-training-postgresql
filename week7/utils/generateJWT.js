const jwt = require("jsonwebtoken");

/**
 * create JSON Web Token
 * @param {Object} payload token content
 * @param {String} secret token secret
 * @param {Object} [option] same to npm package - jsonwebtoken
 * @returns {String}
 */

// jsonwebtoken 套件的 jwt.sign 方法本身提供了兩種使用方式
// 非同步版本
module.exports = (payload, secret, option = {}) =>
  new Promise((resolve, reject) => {
    jwt.sign(payload, secret, option, (err, token) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(token);
    });
  });
