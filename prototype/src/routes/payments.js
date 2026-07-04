const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  createPayment,
  listPaymentsForRoom,
} = require("../controllers/paymentController");

// POST /api/payments - multipart form with `receipt` file and `roomId`
router.post("/", requireAuth, upload.single("receipt"), createPayment);

// GET /api/payments/room/:roomId
router.get("/room/:roomId", requireAuth, listPaymentsForRoom);

// Approve/reject
router.post("/:id/approve", requireAuth, (req, res, next) =>
  require("../controllers/paymentController").approvePayment(req, res, next),
);
router.post("/:id/reject", requireAuth, (req, res, next) =>
  require("../controllers/paymentController").rejectPayment(req, res, next),
);
module.exports = router;
