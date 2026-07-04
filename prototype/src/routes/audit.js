const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const prisma = require("../config/prisma");

// GET /api/audit/room/:roomId
router.get("/room/:roomId", requireAuth, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    if (Number.isNaN(roomId))
      return res.status(400).json({ error: "invalid room id" });

    // only allow room owner to view audit logs
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.ownerId !== req.user.userId)
      return res.status(403).json({ error: "Forbidden" });

    const logs = await prisma.auditLog.findMany({
      where: { roomId },
      include: {
        actor: { select: { id: true, name: true, email: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
