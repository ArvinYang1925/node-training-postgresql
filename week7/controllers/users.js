const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger")("UsersController");
const { generateJWT } = require("../utils/jwtUtils");
const appError = require("../utils/appError");
const {
  isUndefined,
  isNotValidString,
  isValidPassword,
} = require("../utils/validUtils");

const postSignup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 驗證必填欄位
    if (
      isUndefined(name) ||
      isNotValidString(name) ||
      isUndefined(email) ||
      isNotValidString(email) ||
      isUndefined(password) ||
      isNotValidString(password)
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    if (!isValidPassword(password)) {
      logger.warn(
        "建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
      );
      next(
        appError(
          400,
          "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
        )
      );
      return;
    }

    // 檢查 email 是否已存在
    const userRepo = dataSource.getRepository("User");
    const existingUser = await userRepo.findOne({
      where: {
        email,
      },
    });
    if (existingUser) {
      logger.warn("建立使用者錯誤: Email 已被使用");
      next(appError(409, "Email 已被使用"));
      return;
    }

    // 建立新使用者
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const newUser = userRepo.create({
      name,
      email,
      role: "USER",
      password: hashPassword,
    });
    const savedUser = await userRepo.save(newUser);
    logger.info("新建立的使用者ID:", savedUser.id);

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: savedUser.id,
          name: savedUser.name,
        },
      },
    });
  } catch (error) {
    logger.error("建立使用者錯誤:", error);
    next(error);
  }
};

const postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // 驗證欄位
    if (
      isUndefined(email) ||
      isNotValidString(email) ||
      isUndefined(password) ||
      isNotValidString(password)
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    if (!isValidPassword(password)) {
      logger.warn(
        "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
      );
      next(
        appError(
          400,
          "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
        )
      );
      return;
    }
    // 用 Email 來查詢資料庫是否有使用者
    const userRepo = dataSource.getRepository("User");
    const existingUser = await userRepo.findOne({
      select: ["id", "name", "password", "role"],
      where: {
        email: email,
      },
    });
    if (!existingUser) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }
    logger.info(`使用者資料: ${JSON.stringify(existingUser)}`);
    // 比對密碼是否正確
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }

    // 通過上述驗證後，產生 jwt token
    const token = generateJWT({
      id: existingUser.id,
      role: existingUser.role,
    });
    res.status(201).json({
      status: "success",
      data: {
        token,
        user: {
          name: existingUser.name,
        },
      },
    });
  } catch (error) {
    logger.error("登入錯誤:", error);
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    const userRepo = dataSource.getRepository("User");
    const user = await userRepo.findOne({
      select: ["name", "email"],
      where: { id },
    });
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error("取得使用者資料錯誤:", error);
    next(error);
  }
};

const putProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { name } = req.body;
    // 驗證欄位
    if (isUndefined(name) || isNotValidString(name)) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    // 查詢使用者
    const userRepo = dataSource.getRepository("User");
    const existingUser = await userRepo.findOne({
      select: ["name"],
      where: { id },
    });
    if (existingUser.name === name) {
      next(appError(400, "使用者名稱未變更"));
      return;
    }
    // 更新使用者資料
    const updatedResult = await userRepo.update(
      {
        id,
        name: existingUser.name,
      },
      {
        name,
      }
    );
    if (updatedResult.affected === 0) {
      next(appError(400, "更新使用者資料失敗"));
      return;
    }
    // 取得更新後的結果
    const result = await userRepo.findOne({
      select: ["name"],
      where: {
        id,
      },
    });
    res.status(200).json({
      status: "success",
      data: {
        user: result,
      },
    });
  } catch (error) {
    logger.error("更新使用者資料錯誤:", error);
    next(error);
  }
};

module.exports = {
  postSignup,
  postLogin,
  getProfile,
  putProfile,
};
