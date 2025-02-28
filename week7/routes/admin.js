const express = require("express");

const router = express.Router();

const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");

const admin = require("../controllers/admin");

const {
  isUndefined,
  isNotValidInteger,
  isNotValidString,
  isNotValidUUID,
} = require("../utils/validUtils");

// 新增教練課程資料
router.post("/coaches/courses", isAuth, isCoach, admin.postCourse);

// 編輯教練課程資料
router.put(
  "/coaches/courses/:courseId",
  isAuth,
  isCoach,
  admin.putCoachCourseDetail
);

// 將使用者新增為教練
router.post("/coaches/:userId", admin.postCoach);

module.exports = router;
