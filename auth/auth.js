import jwt from "jsonwebtoken";
import { existingAccessToken } from "./login.js";

export default function (req, res, next) {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!existingAccessToken) return res.status(401).send("User logged out");
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}
