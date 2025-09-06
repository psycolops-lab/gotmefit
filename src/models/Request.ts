import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  role: { type: String, enum: ["member","trainer","nutritionist"], required: true },
  gym: { type: mongoose.Schema.Types.ObjectId, ref: "Gym" }, // gym they want to join (optional)
  message: String, // optional note from requester
  hashedPassword: String, // if the requester gives password we hash it; else admin will set password on approve
  status: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  createdAt: { type: Date, default: () => new Date() },
  requestedByIp: String,
}, { timestamps: true });

export default mongoose.models.Request || mongoose.model("Request", RequestSchema);
