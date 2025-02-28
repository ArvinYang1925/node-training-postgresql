const jwt = require("jsonwebtoken");
const config = require("../config/index");
const appError = require("./appError");

// jsonwebtoken 套件的 jwt.sign 方法本身提供了兩種使用方式
// 同步版本
const generateJWT = (payload) => {
  // 產生 JWT token
  return jwt.sign(payload, config.get("secret.jwtSecret"), {
    expiresIn: config.get("secret.jwtExpiresDay"),
  });
};

const verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.get("secret.jwtSecret"), (err, decoded) => {
      if (err) {
        // reject(err)
        switch (err.name) {
          case "TokenExpiredError":
            reject(appError(401, "Token 已過期"));
            break;
          default:
            reject(appError(401, "無效的 token"));
            break;
        }
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = {
  generateJWT,
  verifyJWT,
};
