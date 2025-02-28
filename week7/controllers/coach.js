const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CoachesController");

const appError = require("../utils/appError");
const { isNotValidString } = require("../utils/validUtils");

const getCoaches = async (req, res, next) => {
  try {
    let { per, page } = req.query;
    if (isNotValidString(per) || isNotValidString(page)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    // per & page 轉成數字
    per = parseInt(per);
    page = parseInt(page);
    const skip = (page - 1) * per;

    // 取得教練列表，並從 User 表獲取對應的 name
    const coachRepo = dataSource.getRepository("Coach");
    const coaches = await coachRepo.find({
      relations: {
        User: true,
      },
      select: {
        id: true,
        created_at: true, // 加入這個以便排序
        User: {
          name: true,
        },
      },
      skip: skip,
      take: per,
      order: {
        created_at: "DESC",
      },
    });

    const formattedData = coaches.map((coach) => ({
      id: coach.id,
      name: coach.User.name,
    }));

    res.status(200).json({
      status: "success",
      data: formattedData,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getCoachDetail = async (req, res, next) => {
  try {
    const { coachId } = req.params;
    if (isNotValidString(coachId)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    // 確認教練是否存在
    const coachRepo = dataSource.getRepository("Coach");
    const existingCoach = await coachRepo.findOne({
      where: {
        id: coachId,
      },
    });
    if (!existingCoach) {
      next(appError(400, "找不到該教練"));
      return;
    }
    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOne({
      select: ["name", "role"],
      where: {
        id: existingCoach.user_id,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        user: {
          name: findUser.name,
          role: findUser.role,
        },
        coach: {
          id: existingCoach.id,
          user_id: existingCoach.user_id,
          experience_years: existingCoach.experience_years,
          description: existingCoach.description,
          profile_image_url: existingCoach.profile_image_url,
          created_at: existingCoach.created_at,
          updated_at: existingCoach.updated_at,
        },
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = {
  getCoaches,
  getCoachDetail,
};
