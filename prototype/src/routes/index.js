const express = require("express");
const router = express.Router();

const health = require("./health");
const auth = require("./auth");

router.use("/health", health);
router.use("/auth", auth);

const rooms = require("./rooms");
const payments = require("./payments");
const audit = require("./audit");

router.use("/rooms", rooms);
router.use("/payments", payments);
router.use("/audit", audit);
// future: mount /payments

module.exports = router;
