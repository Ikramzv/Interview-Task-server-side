import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    // required: true,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
    default: 0,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password"))
    return next(() => new Error("Password must be recorded"));
  const hashed = await bcrypt.hash(this.password, 12);
  this.password = hashed;
  return next();
});

export default mongoose.model("User", userSchema, "users");
