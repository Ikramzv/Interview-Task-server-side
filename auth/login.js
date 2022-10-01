import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import auth from "./auth.js";

const router = express.Router();

let refreshTokens = [];

// To store accessToken I just use a variable. For other projects Redis can be used

export let existingAccessToken = "";
// User login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(403).send("Username or password is invalid");
  }

  try {
    const validPassword = await bcrypt.compare(password, user?.password);
    if (!validPassword) {
      return res.status(403).send("Username or password is invalid");
    }
    const accessToken = generateAccessToken({
      username: user.username,
      id: user._id,
      admin: user.admin,
    });
    existingAccessToken = accessToken;
    const refreshToken = jwt.sign(
      { username: user.username, id: user._id, admin: user.admin },
      process.env.JWT_REFRESH_SECRET
    );
    refreshTokens.push(refreshToken);
    return res.status(200).json({ user, accessToken, refreshToken });
  } catch (error) {
    return res.status(401).json(error.message);
  }
});

// Refresh the access token when it is expired

router.post("/refresh_token", async (req, res) => {
  const { token } = req.body;
  if (refreshTokens.length === 0)
    return res.status(401).send("refreshTokens.length equal to 0");
  if (!refreshTokens.includes(token))
    return res
      .status(401)
      .send("refreshToken does not include user's refreshToken");

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    refreshTokens = refreshTokens.filter(
      (refreshToken) => refreshToken !== token
    );
    const newAccessToken = generateAccessToken({
      username: user.username,
      id: user.id,
      admin: user.admin,
    });
    existingAccessToken = newAccessToken;
    const newRefreshToken = jwt.sign(
      { username: user.username, id: user.id, admin: user.admin },
      process.env.JWT_REFRESH_SECRET
    );
    refreshTokens.push(newRefreshToken);
    return res
      .status(200)
      .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  });
});

// Logout
router.post("/logout", auth, async (req, res) => {
  existingAccessToken = "";
  refreshTokens.splice(0, Infinity);

  return res.status(200).send("Successfully logged out");
});

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "5m",
  });
}

export default router;
