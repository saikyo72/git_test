const prisma = require("../config/prisma");
const { v4: uuidv4 } = require("uuid");

function makeJoinCode() {
  return uuidv4().split("-")[0];
}

exports.createRoom = async (req, res) => {
  try {
    const { name, description, purpose, amount } = req.body;
    if (!name || !amount)
      return res.status(400).json({ error: "name and amount are required" });

    const numericAmount = parseInt(amount, 10);
    if (Number.isNaN(numericAmount) || numericAmount <= 0)
      return res
        .status(400)
        .json({ error: "amount must be a positive integer" });

    const joinCode = makeJoinCode();

    const room = await prisma.room.create({
      data: {
        name,
        description,
        purpose,
        amount: numericAmount,
        joinCode,
        ownerId: req.user.userId,
      },
    });

    // add owner as a membership
    await prisma.membership.create({
      data: { userId: req.user.userId, roomId: room.id },
    });

    res.status(201).json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ error: "joinCode required" });

    const room = await prisma.room.findUnique({ where: { joinCode } });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const existing = await prisma.membership.findFirst({
      where: { userId: req.user.userId, roomId: room.id },
    });
    if (existing)
      return res
        .status(200)
        .json({ message: "Already joined", roomId: room.id });

    await prisma.membership.create({
      data: { userId: req.user.userId, roomId: room.id },
    });
    res.status(201).json({ message: "Joined room", roomId: room.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res.status(400).json({ error: "invalid room id" });

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        payments: true,
      },
    });

    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMyRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { ownerId: req.user.userId },
    });
    res.json({ rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getJoinedRooms = async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user.userId },
      include: {
        room: {
          include: { owner: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    const rooms = memberships.map((m) => {
      const room = m.room;
      return {
        ...room,
        isOwner: room.ownerId === req.user.userId,
        owner: room.owner,
      };
    });
    res.json({ rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
