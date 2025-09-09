import mongoose, { Schema, Document } from "mongoose";

export interface IRequest extends Document {
  email: string;
  name: string;
  role: "member" | "trainer" | "nutritionist";
  gym?: mongoose.Types.ObjectId;
  hashedPassword?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>({
  email: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ["member", "trainer", "nutritionist"] },
  gym: { type: Schema.Types.ObjectId, ref: "Gym" },
  hashedPassword: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

export default mongoose.models.Request || mongoose.model<IRequest>("Request", RequestSchema);
