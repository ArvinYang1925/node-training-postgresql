const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("AdminController");
const appError = require("../utils/appError");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);
const monthMap = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const {
  isUndefined,
  isNotValidInteger,
  isNotValidString,
  isNotValidUUID,
} = require("../utils/validUtils");

const postCourse = async (req, res, next) => {
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
      next(appError(400, "使用者不存在"));
      return;
    } else if (existingUser.role !== "COACH") {
      logger.warn("使用者尚未成為教練");
      next(appError(400, "使用者尚未成為教練"));
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
};

const putCoachCourseDetail = async (req, res, next) => {
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
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    // 檢查要更新的課程是否存在
    const courseRepo = dataSource.getRepository("Course");
    const existingCourse = await courseRepo.findOne({
      where: { id: courseId },
    });
    if (!existingCourse) {
      logger.warn("課程不存在");
      next(appError(400, "課程不存在"));
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
      next(appError(400, "更新課程失敗"));
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
};

const postCoach = async (req, res, next) => {
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
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    // 檢查大頭貼網址
    if (
      profileImageUrl &&
      !isNotValidString(profileImageUrl) &&
      !profileImageUrl.startsWith("https")
    ) {
      logger.warn("大頭貼網址錯誤");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const userRepo = dataSource.getRepository("User");
    const existingUser = await userRepo.findOne({
      where: { id: userId },
    });
    if (!existingUser) {
      logger.warn("使用者不存在");
      next(appError(400, "使用者不存在"));
      return;
    } else if (existingUser.role === "COACH") {
      logger.warn("使用者已經是教練");
      next(appError(409, "使用者已經是教練"));
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
      next(appError(400, "更新使用者失敗"));
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
};

const getCoachCourses = async (req, res, next) => {
  try {
    const { id } = req.user;
    const courses = await dataSource.getRepository("Course").find({
      select: {
        id: true,
        name: true,
        start_at: true,
        end_at: true,
        max_participants: true,
      },
      where: {
        user_id: id,
      },
    });
    // 從 courses 陣列中提取每個課程的 id，生成一個新的陣列 courseIds
    const courseIds = courses.map((course) => course.id);
    // 查詢每個課程所對應的參與人數
    const coursesParticipant = await dataSource
      .getRepository("CourseBooking")
      .createQueryBuilder("course_booking")
      .select("course_id")
      .addSelect("COUNT(course_id)", "count")
      .where("course_id IN (:...courseIds)", { courseIds })
      .andWhere("cancelled_at is null")
      .groupBy("course_id")
      .getRawMany();
    logger.info(
      `coursesParticipant: ${JSON.stringify(coursesParticipant, null, 1)}`
    );
    // TODO
    const now = new Date();
    res.status(200).json({
      status: "success",
      data: courses.map((course) => {
        const startAt = new Date(course.start_at);
        const endAt = new Date(course.end_at);
        let status = "尚未開始";
        if (startAt < now) {
          status = "進行中";
          if (endAt < now) {
            status = "已結束";
          }
        }
        // 從 coursesParticipant 中查找與當前課程 ID 匹配的參與者資訊
        const courseParticipant = coursesParticipant.find(
          (courseParticipant) => courseParticipant.course_id === course.id
        );
        return {
          id: course.id,
          name: course.name,
          status,
          start_at: course.start_at,
          end_at: course.end_at,
          max_participants: course.max_participants,
          participants: courseParticipant ? courseParticipant.count : 0,
        };
      }),
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getCoachCourseDetail = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { id } = req.user;
    if (isUndefined(courseId) || isNotValidString(courseId)) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const coach = await dataSource.getRepository("Coach").findOne({
      where: { user_id: id },
    });
    if (!coach) {
      logger.warn("找不到教練");
      next(appError(400, "找不到教練"));
      return;
    }
    const course = await dataSource.getRepository("Course").findOne({
      select: {
        id: true,
        name: true,
        description: true,
        start_at: true,
        end_at: true,
        max_participants: true,
        Skill: {
          name: true,
        },
      },
      where: {
        id: courseId,
      },
      relations: {
        Skill: true,
      },
    });
    res.status(200).json({
      status: "success",
      data: {
        id: course.id,
        skill_name: course.Skill.name,
        name: course.name,
        description: course.description,
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const putCoachProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl = null,
      skill_ids: skillIds,
    } = req.body;
    if (
      isUndefined(experienceYears) ||
      isNotValidInteger(experienceYears) ||
      isUndefined(description) ||
      isNotValidString(description) ||
      isUndefined(profileImageUrl) ||
      isNotValidString(profileImageUrl) ||
      !profileImageUrl.startsWith("https") ||
      isUndefined(skillIds) ||
      !Array.isArray(skillIds)
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    if (
      skillIds.length === 0 ||
      skillIds.every((skill) => isUndefined(skill) || isNotValidString(skill))
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    // 變更教練基本資料
    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOne({
      select: ["id"],
      where: { user_id: id },
    });
    await coachRepo.update(
      {
        id: coach.id,
      },
      {
        experience_years: experienceYears,
        description,
        profile_image_url: profileImageUrl,
      }
    );
    // 更新教練與技能的關聯資料
    const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
    const newCoachLinkSkill = skillIds.map((skill) => ({
      coach_id: coach.id,
      skill_id: skill,
    }));
    await coachLinkSkillRepo.delete({ coach_id: coach.id });
    const insert = await coachLinkSkillRepo.insert(newCoachLinkSkill);
    logger.info(
      `newCoachLinkSkill: ${JSON.stringify(newCoachLinkSkill, null, 1)}`
    );
    logger.info(`insert: ${JSON.stringify(insert, null, 1)}`);
    // 查詢更新後的完整教練資料與關聯技能
    const result = await coachRepo.find({
      select: {
        id: true,
        experience_years: true,
        description: true,
        profile_image_url: true,
        CoachLinkSkill: {
          skill_id: true,
        },
      },
      where: { id: coach.id },
      relations: {
        CoachLinkSkill: true,
      },
    });
    logger.info(`result: ${JSON.stringify(result, null, 1)}`);
    res.status(200).json({
      status: "success",
      data: {
        id: result[0].id,
        experience_years: result[0].experience_years,
        description: result[0].description,
        profile_image_url: result[0].profile_image_url,
        skill_ids: result[0].CoachLinkSkill.map((skill) => skill.skill_id),
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getCoachProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOne({
      select: ["id"],
      where: { user_id: id },
    });
    // 檢查教練是否存在
    if (!coach) {
      logger.warn("找不到教練");
      next(appError(400, "找不到教練"));
    }
    const result = await coachRepo.findOne({
      select: {
        id: true,
        experience_years: true,
        description: true,
        profile_image_url: true,
        CoachLinkSkill: {
          skill_id: true,
        },
      },
      where: { id: coach.id },
      relations: {
        CoachLinkSkill: true,
      },
    });
    res.status(200).json({
      status: "success",
      data: {
        id: result.id,
        experience_years: result.experience_years,
        description: result.description,
        profile_image_url: result.profile_image_url,
        skill_ids:
          result.CoachLinkSkill.length > 0
            ? result.CoachLinkSkill.map((skill) => skill.skill_id)
            : result.CoachLinkSkill,
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getCoachRevenue = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { month } = req.query;
    // 需為全小寫月份名稱
    if (
      isUndefined(month) ||
      !Object.prototype.hasOwnProperty.call(monthMap, month)
    ) {
      logger.warn("欄位未填寫正確");
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }

    const courseRepo = dataSource.getRepository("Course");
    const courses = await courseRepo.find({
      select: ["id"],
      where: { user_id: id },
    });
    const courseIds = courses.map((course) => course.id);
    // 如果教練沒有任何課程，則返回零收入、零參與者和零課程數
    if (courseIds.length === 0) {
      res.status(200).json({
        status: "success",
        data: {
          total: {
            revenue: 0,
            participants: 0,
            course_count: 0,
          },
        },
      });
      return;
    }

    const courseBookingRepo = dataSource.getRepository("CourseBooking");
    // 準備日期範圍
    const year = new Date().getFullYear();
    const calculateStartAt = dayjs(`${year}-${month}-01`)
      .startOf("month")
      .toISOString();
    const calculateEndAt = dayjs(`${year}-${month}-01`)
      .endOf("month")
      .toISOString();
    // 計算指定月份內未取消的課程預訂總數
    const courseCount = await courseBookingRepo
      .createQueryBuilder("course_booking")
      .select("COUNT(*)", "count")
      .where("course_id IN (:...ids)", { ids: courseIds })
      .andWhere("cancelled_at IS NULL")
      .andWhere("created_at >= :startDate", { startDate: calculateStartAt })
      .andWhere("created_at <= :endDate", { endDate: calculateEndAt })
      .getRawOne();
    // 計算指定月份內預訂課程的不重複用戶數（參與者）
    const participants = await courseBookingRepo
      .createQueryBuilder("course_booking")
      .select("COUNT(DISTINCT(user_id))", "count")
      .where("course_id IN (:...ids)", { ids: courseIds })
      .andWhere("cancelled_at IS NULL")
      .andWhere("created_at >= :startDate", { startDate: calculateStartAt })
      .andWhere("created_at <= :endDate", { endDate: calculateEndAt })
      .getRawOne();

    const totalCreditPackage = await dataSource
      .getRepository("CreditPackage")
      .createQueryBuilder("credit_package")
      .select("SUM(credit_amount)", "total_credit_amount")
      .addSelect("SUM(price)", "total_price")
      .getRawOne();
    const perCreditPrice =
      totalCreditPackage.total_price / totalCreditPackage.total_credit_amount;
    const totalRevenue = courseCount.count * perCreditPrice;

    res.status(200).json({
      status: "success",
      data: {
        total: {
          revenue: Math.floor(totalRevenue),
          participants: parseInt(participants.count, 10),
          course_count: parseInt(courseCount.count, 10),
        },
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = {
  postCourse,
  putCoachCourseDetail,
  postCoach,
  getCoachCourses,
  getCoachCourseDetail,
  putCoachProfile,
  getCoachProfile,
  getCoachRevenue,
};
