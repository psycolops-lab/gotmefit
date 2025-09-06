import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    // Do NOT force unique on username that can be null. Use sparse unique if you want uniqueness when present.
    username: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "member", "trainer", "nutritionist"],
      default: "member",
    },
    gym: { type: Schema.Types.ObjectId, ref: "Gym" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    profile: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
