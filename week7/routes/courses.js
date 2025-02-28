const express = require("express");

const router = express.Router();

const isAuth = require("../middlewares/isAuth");

const courses = require("../controllers/courses");

// 取得課程列表
router.get("/", courses.getAllCourses);

// 報名課程
router.post("/:courseId", isAuth, courses.postCourseBooking);

// 取消課程
router.delete("/:courseId", isAuth, courses.deleteCourseBooking);

module.exports = router;
