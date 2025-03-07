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

// 取得教練自己的課程列表
router.get("/coaches/courses", isAuth, isCoach, admin.getCoachCourses);

// 取得教練自己的課程詳細資料
router.get("/coaches/courses/:courseId", isAuth, admin.getCoachCourseDetail);

// 變更教練資料
router.put("/coaches", isAuth, isCoach, admin.putCoachProfile);

// 取得教練自己的詳細資料
router.get("/coaches", isAuth, isCoach, admin.getCoachProfile);

// 取得教練自己的月營收資料
router.get("/coaches/revenue", isAuth, isCoach, admin.getCoachRevenue);

module.exports = router;
