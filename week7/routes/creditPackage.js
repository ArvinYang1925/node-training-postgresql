const express = require("express");

const router = express.Router();

const isAuth = require("../middlewares/isAuth");

const creditPackage = require("../controllers/creditPackage");

// 取得購買方案列表
router.get("/", creditPackage.getAll);

// 新增購買方案
router.post("/", creditPackage.post);

// 使用者購買方案
router.post("/:creditPackageId", isAuth, creditPackage.postUserBuy);

// 刪除購買方案
router.delete("/:creditPackageId", creditPackage.deletePackage);

module.exports = router;
