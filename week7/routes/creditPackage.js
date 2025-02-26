const express = require("express");

const router = express.Router();
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CreditPackage");
const {
  isUndefined,
  isNotValidString,
  isNotValidInteger,
  isNotValidUUID,
} = require("../utils/validUtils");

const auth = require("../middlewares/auth")({
  secret: config.get("secret").jwtSecret,
  userRepository: dataSource.getRepository("User"),
  logger,
});

router.get("/", async (req, res, next) => {
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
});

router.post("/", async (req, res, next) => {
  try {
    const { name, credit_amount, price } = req.body;
    if (
      isUndefined(name) ||
      isNotValidString(name) ||
      isUndefined(credit_amount) ||
      isNotValidInteger(credit_amount) ||
      isUndefined(price) ||
      isNotValidInteger(price)
    ) {
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    const creditPackageRepo = await dataSource.getRepository("CreditPackage");
    const existPackage = await creditPackageRepo.find({
      where: {
        name: name,
      },
    });
    if (existPackage.length > 0) {
      res.status(409).json({
        status: "failed",
        message: "資料重複",
      });
      return;
    }
    const newPackage = await creditPackageRepo.create({
      name,
      credit_amount,
      price,
    });
    const result = await creditPackageRepo.save(newPackage);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

// 使用者購買方案
router.post("/:creditPackageId", auth, async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { creditPackageId } = req.params;
    // 驗證傳入的購買方案 id
    const creditPackageRepo = dataSource.getRepository("CreditPackage");
    const existingCreditPackage = await creditPackageRepo.findOne({
      where: { id: creditPackageId },
    });
    if (!existingCreditPackage) {
      res.status(400).json({
        status: "failed",
        message: "ID錯誤",
      });
      return;
    }
    // 購買方案實作
    const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");
    const newPurchase = creditPurchaseRepo.create({
      user_id: id,
      credit_package_id: creditPackageId,
      purchased_credits: existingCreditPackage.credit_amount,
      price_paid: existingCreditPackage.price,
      purchase_at: new Date().toISOString(),
    });
    await creditPurchaseRepo.save(newPurchase);

    res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.delete("/:creditPackageId", async (req, res, next) => {
  try {
    const creditPackageId = req.params.creditPackageId;
    if (
      isUndefined(creditPackageId) ||
      isNotValidString(creditPackageId) ||
      isNotValidUUID(creditPackageId)
    ) {
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    const result = await dataSource
      .getRepository("CreditPackage")
      .delete(creditPackageId);
    if (result.affected === 0) {
      res.status(400).json({
        status: "failed",
        message: "ID錯誤",
      });
      return;
    }
    res.status(200).json({
      status: "success",
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
