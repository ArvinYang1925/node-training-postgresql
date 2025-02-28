const express = require("express");

const router = express.Router();

const isAuth = require("../middlewares/isAuth");

const users = require("../controllers/users");

// 註冊使用者
router.post("/signup", users.postSignup);

// 使用者登入
router.post("/login", users.postLogin);

// 取得個人資料
router.get("/profile", isAuth, users.getProfile);

// 更新個人資料
router.put("/profile", isAuth, users.putProfile);

module.exports = router;
