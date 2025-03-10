const express = require("express");

const router = express.Router();
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Admin");
const auth = require("../middlewares/auth")({
  secret: config.get("secret").jwtSecret,
  userRepository: dataSource.getRepository("User"),
  logger,
});

const isCoach = require("../middlewares/isCoach");

const {
  isUndefined,
  isNotValidInteger,
  isNotValidString,
  isNotValidUUID,
} = require("../utils/validUtils");

// 新增教練課程資料
router.post("/coaches/courses", auth, isCoach, async (req, res, next) => {
  try {
    const {
      user_id: userId,
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    } = req.body;
    if (
      isUndefined(userId) ||
      isNotValidString(userId) ||
      isUndefined(skillId) ||
      isNotValidString(skillId) ||
      isUndefined(name) ||
      isNotValidString(name) ||
      isUndefined(description) ||
      isNotValidString(description) ||
      isUndefined(startAt) ||
      isNotValidString(startAt) ||
      isUndefined(endAt) ||
      isNotValidString(endAt) ||
      isUndefined(maxParticipants) ||
      isNotValidInteger(maxParticipants) ||
      isUndefined(meetingUrl) ||
      isNotValidString(meetingUrl) ||
      !meetingUrl.startsWith("https")
    ) {
      logger.warn("欄位未填寫正確");
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    // 檢查使用者是否存在以及是否為教練
    const userRepo = dataSource.getRepository("User");
    const existingUser = await userRepo.findOne({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      logger.warn("使用者不存在");
      res.status(400).json({
        status: "failed",
        message: "使用者不存在",
      });
      return;
    } else if (existingUser.role !== "COACH") {
      logger.warn("使用者尚未成為教練");
      res.status(400).json({
        status: "failed",
        message: "使用者尚未成為教練",
      });
      return;
    }
    // 新增教練課程資料
    const courseRepo = dataSource.getRepository("Course");
    const newCourse = courseRepo.create({
      user_id: userId,
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    });
    const savedCourse = await courseRepo.save(newCourse);
    // 找出剛剛新增的課程資料
    const course = await courseRepo.findOne({
      where: {
        id: savedCourse.id,
      },
    });
    res.status(201).json({
      status: "success",
      data: {
        course,
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

// 編輯教練課程資料
router.put(
  "/coaches/courses/:courseId",
  auth,
  isCoach,
  async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const {
        skill_id: skillId,
        name,
        description,
        start_at: startAt,
        end_at: endAt,
        max_participants: maxParticipants,
        meeting_url: meetingUrl,
      } = req.body;
      if (
        isNotValidString(courseId) ||
        isNotValidUUID(courseId) ||
        isUndefined(skillId) ||
        isNotValidString(skillId) ||
        isNotValidUUID(skillId) ||
        isUndefined(name) ||
        isNotValidString(name) ||
        isUndefined(description) ||
        isNotValidString(description) ||
        isUndefined(startAt) ||
        isNotValidString(startAt) ||
        isUndefined(endAt) ||
        isNotValidString(endAt) ||
        isUndefined(maxParticipants) ||
        isNotValidInteger(maxParticipants) ||
        isUndefined(meetingUrl) ||
        isNotValidString(meetingUrl) ||
        !meetingUrl.startsWith("https")
      ) {
        logger.warn("欄位未填寫正確");
        res.status(400).json({
          status: "failed",
          message: "欄位未填寫正確",
        });
        return;
      }
      // 檢查要更新的課程是否存在
      const courseRepo = dataSource.getRepository("Course");
      const existingCourse = await courseRepo.findOne({
        where: { id: courseId },
      });
      if (!existingCourse) {
        logger.warn("課程不存在");
        res.status(400).json({
          status: "failed",
          message: "課程不存在",
        });
        return;
      }
      // 更新課程
      const updateCourse = await courseRepo.update(
        {
          id: courseId,
        },
        {
          skill_id: skillId,
          name,
          description,
          start_at: startAt,
          end_at: endAt,
          max_participants: maxParticipants,
          meeting_url: meetingUrl,
        }
      );
      if (updateCourse.affected === 0) {
        logger.warn("更新課程失敗");
        res.status(400).json({
          status: "failed",
          message: "更新課程失敗",
        });
        return;
      }
      // 取得更新後的課程
      const savedCourse = await courseRepo.findOne({
        where: { id: courseId },
      });
      res.status(200).json({
        status: "success",
        data: {
          course: savedCourse,
        },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }
);

// 將使用者新增為教練
router.post("/coaches/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl = null,
    } = req.body;

    if (
      isUndefined(experienceYears) ||
      isNotValidInteger(experienceYears) ||
      isUndefined(description) ||
      isNotValidString(description)
    ) {
      logger.warn("欄位未填寫正確");
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    // 檢查大頭貼網址
    if (
      profileImageUrl &&
      !isNotValidString(profileImageUrl) &&
      !profileImageUrl.startsWith("https")
    ) {
      logger.warn("大頭貼網址錯誤");
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    const userRepo = dataSource.getRepository("User");
    const existingUser = await userRepo.findOne({
      where: { id: userId },
    });
    if (!existingUser) {
      logger.warn("使用者不存在");
      res.status(400).json({
        status: "failed",
        message: "使用者不存在",
      });
      return;
    } else if (existingUser.role === "COACH") {
      logger.warn("使用者已經是教練");
      res.status(409).json({
        status: "failed",
        message: "使用者已經是教練",
      });
      return;
    }
    // 更新使用者為教練
    const updatedUser = await userRepo.update(
      {
        id: userId,
        role: "USER",
      },
      {
        role: "COACH",
      }
    );
    if (updatedUser.affected === 0) {
      logger.warn("更新使用者失敗");
      res.status(400).json({
        status: "failed",
        message: "更新使用者失敗",
      });
      return;
    }
    // 將資料存入教練資料表
    const coachRepo = dataSource.getRepository("Coach");
    const newCoach = coachRepo.create({
      user_id: userId,
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl,
    });
    const saveCoach = await coachRepo.save(newCoach);
    // 查詢更新過後的 user
    const savedUser = await userRepo.findOne({
      select: ["name", "role"],
      where: { id: userId },
    });

    res.status(201).json({
      status: "success",
      data: {
        user: savedUser,
        coach: saveCoach,
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
