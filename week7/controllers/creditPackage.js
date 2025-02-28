const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CreditPackageController");
const {
  isUndefined,
  isNotValidString,
  isNotValidInteger,
  isNotValidUUID,
} = require("../utils/validUtils");

// async function getAll(req, res, next) {
//   try {
//     const packages = await dataSource.getRepository("CreditPackage").find({
//       select: ["id", "name", "credit_amount", "price"],
//     });
//     res.status(200).json({
//       status: "success",
//       data: packages,
//     });
//   } catch (error) {
//     logger.error(error);
//     next(error);
//   }
// }

const getAll = async (req, res, next) => {
  try {
    const packages = await dataSource.getRepository("CreditPackage").find({
      select: ["id", "name", "credit_amount", "price"],
    });
    res.status(200).json({
      status: "success",
      data: packages,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = {
  getAll,
};
