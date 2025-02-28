const { dataSource } = require("../db/data-source");
const { IsNull } = require('typeorm')
const logger = require("../utils/logger")("CoursesController");
const appError = require("../utils/appError");

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await dataSource.getRepository("Course").find({
      select: {
        id: true,
        name: true,
        description: true,
        start_at: true,
        end_at: true,
        max_participants: true,
        User: {
          name: true,
        },
        Skill: {
          name: true,
        },
      },
      relations: {
        User: true,
        Skill: true,
      },
    });
    res.status(200).json({
      status: "success",
      data: courses.map((course) => {
        return {
          id: course.id,
          coach_name: course.User.name,
          skill_name: course.Skill.name,
          name: course.name,
          description: course.description,
          start_at: course.start_at,
          end_at: course.end_at,
          max_participants: course.max_participants,
        };
      }),
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const postCourseBooking = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { courseId } = req.params;
    // 驗證課程 id 是否正確
    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.findOne({
      where: {
        id: courseId,
      },
    });
    if (!course) {
      next(appError(400, "ID錯誤"));
      return;
    }
    // 檢查使用者是否已經報名過課程
    const courseBookingRepo = dataSource.getRepository("CourseBooking");
    const userCourseBooking = await courseBookingRepo.findOne({
      where: {
        user_id: id,
        course_id: courseId,
      },
    });
    if (userCourseBooking) {
      next(appError(400, "已經報名過此課程"));
      return;
    }

    const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");
    // 計算使用者購買堂數
    const userCredit = await creditPurchaseRepo.sum("purchased_credits", {
      user_id: id,
    });
    // 計算使用者已使用堂數
    const userUsedCredit = await courseBookingRepo.count({
      where: {
        user_id: id,
        cancelled_at: IsNull(),
      },
    });
    // 計算該課程被預訂堂數
    const courseBookingCount = await courseBookingRepo.count({
      where: {
        course_id: courseId,
        cancelled_at: IsNull(),
      },
    });
    if (userUsedCredit >= userCredit) {
      next(appError(400, "已無可使用堂數"));
      return;
    } else if (courseBookingCount >= course.max_participants) {
      next(appError(400, "已達最大參加人數，無法參加"));
      return;
    }
    const newCourseBooking = await courseBookingRepo.create({
      user_id: id,
      course_id: courseId,
    });
    await courseBookingRepo.save(newCourseBooking);
    res.status(201).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const deleteCourseBooking = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { courseId } = req.params;
    // 驗證該使用者是否已經報名這堂課
    const courseBookingRepo = dataSource.getRepository("CourseBooking");
    const userCourseBooking = await courseBookingRepo.findOne({
      where: {
        user_id: id,
        course_id: courseId,
        cancelled_at: IsNull(),
      },
    });
    if (!userCourseBooking) {
      next(appError(400, "ID錯誤"));
      return;
    }
    // 取消報名課程
    const updateResult = await courseBookingRepo.update(
      {
        user_id: id,
        course_id: courseId,
        cancelled_at: IsNull(),
      },
      {
        cancelled_at: new Date().toISOString(),
      }
    );
    if (updateResult.affected === 0) {
      next(appError(400, "取消失敗"));
      return;
    }
    res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = {
  getAllCourses,
  postCourseBooking,
  deleteCourseBooking,
};
