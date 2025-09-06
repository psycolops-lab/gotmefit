// /models/Gym.ts
import mongoose, { Schema } from "mongoose";

const GymSchema = new Schema({
  name: { type: String, required: true },
  address: String,
  phone: String,
  admin: { type: Schema.Types.ObjectId, ref: "User" }, // admin user id
  createdBy: { type: Schema.Types.ObjectId, ref: "User" }, // superadmin id who created this gym
  createdAt: { type: Date, default: () => new Date() },
});

export default mongoose.models.Gym || mongoose.model("Gym", GymSchema);
