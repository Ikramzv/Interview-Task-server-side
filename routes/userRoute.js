import express from "express";
import User from "../models/user.js";

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(403).send(error.message);
  }
});

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(403).send(error.message);
  }
});

export default router;
