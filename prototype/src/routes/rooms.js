const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  createRoom,
  joinRoom,
  getRoom,
  getMyRooms,
  getJoinedRooms,
} = require("../controllers/roomController");

router.post("/", requireAuth, createRoom);
router.post("/join", requireAuth, joinRoom);
router.get("/mine", requireAuth, getMyRooms);
router.get("/joined", requireAuth, getJoinedRooms);
router.get("/:id", requireAuth, getRoom);

module.exports = router;
