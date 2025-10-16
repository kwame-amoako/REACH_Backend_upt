import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import transferRoutes from "./routes/transferRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transfer", transferRoutes);

app.get("/", (req, res) =>
  res.json({ ok: true, message: "Reach backend running" })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // fallback to * if not set
    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;

async function start() {
  const uri = process.env.MONGODB_URI || "";
  if (!uri) {
    console.warn(
      "MONGODB_URI not set — server will still start but DB operations will fail"
    );
  } else {
    await mongoose.connect(uri).then(() => console.log("Connected to MongoDB"));
  }
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
