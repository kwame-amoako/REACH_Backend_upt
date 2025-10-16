import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { sendOtp, verifyOtp } from "../services/otpService";

const router = express.Router();

// Helper: JWT generator
const generateToken = (userId: string, email: string) => {
  return jwt.sign({ id: userId, email }, process.env.JWT_SECRET || "secret", {
    expiresIn: "7d",
  });
};

// ======================= REGISTER =======================
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hash,
      phone,
      isVerified: false,
    });
    await user.save();

    // Send OTP to phone via BulkClix
    const otpResponse = await sendOtp(phone);

    return res.json({
      message: "User registered. OTP sent to phone for verification.",
      requestId: otpResponse.requestId, // frontend must keep this
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ======================= VERIFY OTP =======================
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { email, phone, requestId, code } = req.body;
    if (!email || !phone || !requestId || !code)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ email, phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    const verification = await verifyOtp(requestId, phone, code);

    if (verification.status !== "success") {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    await user.save();

    return res.json({
      message: "OTP verified successfully. You can now log in.",
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ======================= LOGIN =======================
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Account not verified. Please complete OTP verification first.",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user._id.toString(), user.email);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ======================= GET CURRENT USER =======================
router.get("/me", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    const token = auth.split(" ")[1];
    const payload: any = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ user });
  } catch (err) {
    console.error("Auth check error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
