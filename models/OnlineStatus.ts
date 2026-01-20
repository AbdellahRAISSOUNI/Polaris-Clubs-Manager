import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const OnlineStatusSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    user_type: { type: String, required: true, enum: ["admin", "club"], index: true },
    is_online: { type: Boolean, default: false, index: true },
    last_active: { type: Date, default: Date.now },
  },
  { collection: "online_status" }
)

OnlineStatusSchema.index({ user_id: 1, user_type: 1 }, { unique: true })

export type OnlineStatusDoc = InferSchemaType<typeof OnlineStatusSchema>

export const OnlineStatus: Model<OnlineStatusDoc> =
  (mongoose.models.OnlineStatus as Model<OnlineStatusDoc>) ||
  mongoose.model<OnlineStatusDoc>("OnlineStatus", OnlineStatusSchema)

