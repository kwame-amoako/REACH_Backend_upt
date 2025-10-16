import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Transaction from "../models/transfer";

const router = express.Router();

function authMiddleware(req: Request) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(" ")[1];
  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return payload;
  } catch {
    return null;
  }
}

// POST /transfers - Create a transfer
router.post("/", async (req: Request, res: Response) => {
  try {
    const payload = authMiddleware(req);
    if (!payload) return res.status(401).json({ error: "Unauthorized" });

    const { toEmail, amount, narration } = req.body;
    if (!toEmail || !amount)
      return res.status(400).json({ error: "Missing fields" });

    const fromUser = await User.findById(payload.id);
    if (!fromUser) return res.status(404).json({ error: "Sender not found" });
    if (fromUser.balance < amount)
      return res.status(400).json({ error: "Insufficient balance" });

    const toUser = await User.findOne({ email: toEmail });
    if (!toUser) return res.status(404).json({ error: "Recipient not found" });

    // Update balances
    fromUser.balance -= amount;
    toUser.balance += amount;
    await fromUser.save();
    await toUser.save();

    // Create transaction record
    const transaction = await Transaction.create({
      from: fromUser._id,
      to: toUser._id,
      amount,
      narration,
      status: "success",
    });

    res.json({
      ok: true,
      transaction,
      from: { id: fromUser._id, balance: fromUser.balance },
      to: { id: toUser._id, balance: toUser.balance },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /transfers/history - Get user's transactions
router.get("/history", async (req: Request, res: Response) => {
  try {
    const payload = authMiddleware(req);
    if (!payload) return res.status(401).json({ error: "Unauthorized" });

    const userId = payload.id;

    const transactions = await Transaction.find({
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ createdAt: -1 });

    res.json({ ok: true, transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
