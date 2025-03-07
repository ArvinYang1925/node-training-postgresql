const { dataSource } = require("../db/data-source");
const { IsNull, In } = require("typeorm");

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

const getCreditPackage = async (req, res, next) => {
  try {
    const { id } = req.user;
    const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");
    const creditPurchase = await creditPurchaseRepo.find({
      select: {
        purchased_credits: true,
        price_paid: true,
        purchase_at: true,
        CreditPackage: {
          name: true,
        },
      },
      where: {
        user_id: id,
      },
      relations: {
        CreditPackage: true,
      },
    });
    res.status(200).json({
      status: "success",
      data: creditPurchase.map((item) => {
        return {
          purchased_credits: item.purchased_credits,
          price_paid: parseInt(item.price_paid),
          name: item.CreditPackage.name,
          purchase_at: item.purchase_at,
        };
      }),
    });
  } catch (error) {
    logger.error("取得使用者資料錯誤:", error);
    next(error);
  }
};

const putPassword = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      password,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    } = req.body;

    // 檢查欄位是否填寫正確
    if (
      isUndefined(password) ||
      isNotValidString(password) ||
      isUndefined(newPassword) ||
      isNotValidString(newPassword) ||
      isUndefined(confirmNewPassword) ||
      isNotValidString(confirmNewPassword)
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    // 檢查密碼是否符合規則
    if (
      !isValidPassword(password) ||
      !isValidPassword(newPassword) ||
      !isValidPassword(confirmNewPassword)
    ) {
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

    // 檢查新舊密碼是否相同
    if (newPassword === password) {
      logger.warn("新密碼不能與舊密碼相同");
      next(appError(400, "新密碼不能與舊密碼相同"));
      return;
    }

    // 檢查新密碼與確認密碼是否一致
    if (newPassword !== confirmNewPassword) {
      logger.warn("新密碼與驗證新密碼不一致");
      next(appError(400, "新密碼與驗證新密碼不一致"));
      return;
    }

    // 查詢使用者現有密碼
    const userRepository = dataSource.getRepository("User");
    const existingUser = await userRepository.findOne({
      select: ["password"],
      where: { id },
    });

    // 驗證舊密碼是否正確
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      next(appError(400, "密碼輸入錯誤"));
      return;
    }

    // 生成新密碼的雜湊值
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // 更新密碼
    const updatedResult = await userRepository.update(
      {
        id,
      },
      {
        password: hashPassword,
      }
    );
    if (updatedResult.affected === 0) {
      next(appError(400, "更新密碼失敗"));
      return;
    }

    res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    logger.error("更新密碼錯誤:", error);
    next(error);
  }
};

const getCourseBooking = async (req, res, next) => {
  try {
    const { id } = req.user;
    const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");
    const courseBookingRepo = dataSource.getRepository("CourseBooking");
    // 計算使用者購買的堂數
    const userCredit = await creditPurchaseRepo.sum("purchased_credits", {
      user_id: id,
    });
    // 計算使用者已使用的堂數
    const userUsedCredit = await courseBookingRepo.count({
      where: {
        user_id: id,
        cancelled_at: IsNull(),
      },
    });

    const courseBookingList = await courseBookingRepo.find({
      select: {
        course_id: true,
        Course: {
          name: true,
          start_at: true,
          end_at: true,
          meeting_url: true,
          user_id: true,
        },
      },
      where: {
        user_id: id,
      },
      order: {
        Course: {
          start_at: "ASC",
        },
      },
      relations: {
        Course: true,
      },
    });
    // TODO
    const coachUserIdMap = {};
    if (courseBookingList.length > 0) {
      courseBookingList.forEach((courseBooking) => {
        coachUserIdMap[courseBooking.Course.user_id] =
          courseBooking.Course.user_id;
      });
      const userRepo = dataSource.getRepository("User");
      const coachUsers = await userRepo.find({
        select: ["id", "name"],
        where: {
          id: In(Object.values(coachUserIdMap)),
        },
      });
      coachUsers.forEach((user) => {
        coachUserIdMap[user.id] = user.name;
      });
      logger.debug(`courseBookingList: ${JSON.stringify(courseBookingList)}`);
      logger.debug(`coachUsers: ${JSON.stringify(coachUsers)}`);
    }

    res.status(200).json({
      status: "success",
      data: {
        credit_remain: userCredit - userUsedCredit,
        credit_usage: userUsedCredit,
        course_booking: courseBookingList.map((courseBooking) => {
          return {
            course_id: courseBooking.course_id,
            name: courseBooking.Course.name,
            start_at: courseBooking.Course.start_at,
            end_at: courseBooking.Course.end_at,
            meeting_url: courseBooking.Course.meeting_url,
            coach_name: coachUserIdMap[courseBooking.Course.user_id],
          };
        }),
      },
    });
  } catch (error) {
    logger.error("取得使用者課程錯誤:", error);
    next(error);
  }
};

module.exports = {
  postSignup,
  postLogin,
  getProfile,
  putProfile,
  getCreditPackage,
  getCourseBooking,
  putPassword,
};
