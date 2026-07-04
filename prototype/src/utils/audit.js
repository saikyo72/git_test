const prisma = require("../config/prisma");

async function logAudit({
  actorId = null,
  action,
  roomId = null,
  paymentId = null,
  details = null,
}) {
  try {
    const entry = await prisma.auditLog.create({
      data: { action, actorId, roomId, paymentId, details },
    });
    return entry;
  } catch (err) {
    console.error("Failed to write audit log", err);
    return null;
  }
}

module.exports = { logAudit };
