// routes/userRoutes.ts
import express from "express";
import User, { IUser } from "../models/User";

const router = express.Router();

/**
 * @route   POST /api/users
 * @desc    Create a new user
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const user = new User({ name, email, password, phone });
    await user.save();

    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users
 */
router.get("/", async (_req, res) => {
  try {
    const users = await User.find().select("-password"); // hide password
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 */
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 */
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
