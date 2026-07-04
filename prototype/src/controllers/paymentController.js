const prisma = require("../config/prisma");
const path = require("path");
const { logAudit } = require("../utils/audit");

exports.createPayment = async (req, res) => {
  try {
    // Expect multipart/form-data with field 'receipt' and 'roomId'
    if (!req.file)
      return res.status(400).json({ error: "receipt image is required" });
    const roomId = parseInt(req.body.roomId, 10);
    if (Number.isNaN(roomId))
      return res.status(400).json({ error: "roomId is required" });

    // Check membership
    const membership = await prisma.membership.findFirst({
      where: { userId: req.user.userId, roomId },
    });
    if (!membership)
      return res
        .status(403)
        .json({ error: "You are not a member of this room" });

    const imagePath = path.join("/uploads", path.basename(req.file.path));

    const payment = await prisma.payment.create({
      data: {
        userId: req.user.userId,
        roomId,
        imagePath,
        status: "pending",
      },
    });

    // audit
    try {
      await logAudit({
        actorId: req.user.userId,
        action: "upload_receipt",
        roomId,
        paymentId: payment.id,
        details: { imagePath },
      });
    } catch (e) {}

    res.status(201).json({ payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.listPaymentsForRoom = async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    if (Number.isNaN(roomId))
      return res.status(400).json({ error: "invalid room id" });

    // Only room owner or members can view, but for now check membership
    const membership = await prisma.membership.findFirst({
      where: { userId: req.user.userId, roomId },
    });
    if (!membership) return res.status(403).json({ error: "Forbidden" });

    const payments = await prisma.payment.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        reviewedByUser: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res.status(400).json({ error: "invalid payment id" });

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { room: true },
    });
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    if (payment.room.ownerId !== req.user.userId)
      return res.status(403).json({ error: "Only room owner can approve" });

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: "approved",
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        room: true,
        reviewedByUser: { select: { id: true, name: true, email: true } },
      },
    });
    try {
      await logAudit({
        actorId: req.user.userId,
        action: "approve_payment",
        roomId: updated.roomId,
        paymentId: updated.id,
        details: { status: updated.status },
      });
    } catch (e) {}
    res.json({ payment: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res.status(400).json({ error: "invalid payment id" });

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { room: true },
    });
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    if (payment.room.ownerId !== req.user.userId)
      return res.status(403).json({ error: "Only room owner can reject" });

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: "rejected",
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        room: true,
        reviewedByUser: { select: { id: true, name: true, email: true } },
      },
    });
    try {
      await logAudit({
        actorId: req.user.userId,
        action: "reject_payment",
        roomId: updated.roomId,
        paymentId: updated.id,
        details: { status: updated.status },
      });
    } catch (e) {}
    res.json({ payment: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
