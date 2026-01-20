import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const NotificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    recipient_id: { type: String, required: true, index: true },
    recipient_type: { type: String, required: true, enum: ["admin", "club"], index: true },
    sender_id: { type: String }, // keep string for compatibility
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true, enum: ["success", "error", "warning", "info"] },
    is_read: { type: Boolean, default: false, index: true },
    link: { type: String },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "notifications" }
)

NotificationSchema.pre("save", function (next) {
  this.updated_at = new Date()
  next()
})

export type NotificationDoc = InferSchemaType<typeof NotificationSchema>

export const Notification: Model<NotificationDoc> =
  (mongoose.models.Notification as Model<NotificationDoc>) ||
  mongoose.model<NotificationDoc>("Notification", NotificationSchema)

