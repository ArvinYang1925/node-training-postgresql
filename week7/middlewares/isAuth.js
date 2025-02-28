const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { verifyJWT } = require("../utils/jwtUtils");
const logger = require("../utils/logger")("isAuth");

// 助教直播版本
const isAuth = async (req, res, next) => {
  try {
    // Authorization: Bearer xxxxxxx.yyyyyyy.zzzzzzz
    // 確認 token 是否存在並取出 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      next(appError(401, "你尚未登入！"));
      return;
    }

    const token = authHeader.split(" ")[1];

    // 驗證 token
    const decoded = await verifyJWT(token);

    // 在資料庫尋找對應 id 的使用者
    const user = await dataSource
      .getRepository("User")
      .findOneBy({ id: decoded.id });

    if (!user) {
      next(appError(401, "無效的 token"));
      return;
    }

    // 在 req 物件加入 user 欄位
    req.user = user;

    next();
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
};

module.exports = isAuth;
