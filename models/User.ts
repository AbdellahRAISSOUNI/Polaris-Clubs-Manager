import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // keep string IDs compatible
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    password: { type: String }, // legacy (matches current project behavior)
    role: { type: String, required: true, enum: ["admin", "club"], index: true },
    avatar_url: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "users" }
)

export type UserDoc = InferSchemaType<typeof UserSchema>

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema)

