// src/models/User.ts
import mongoose, { Schema, model, models } from "mongoose";

const ProfileSchema = new Schema({
  heightCm: { type: Number, default: null },
  weightKg: { type: Number, default: null },
  bmi: { type: Number, default: null },
  healthMarkers: { type: [String], default: [] }, // stored as array of strings
});

const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["superadmin","admin","member","trainer","nutritionist"], default: "member" },
    gym: { type: Schema.Types.ObjectId, ref: "Gym" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    profile: { type: ProfileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);
