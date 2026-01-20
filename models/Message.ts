import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const MessageSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    sender_id: { type: String, required: true, index: true },
    sender_type: { type: String, required: true, enum: ["admin", "club"], index: true },
    recipient_id: { type: String, required: true, index: true },
    recipient_type: { type: String, required: true, enum: ["admin", "club"], index: true },
    content: { type: String, required: true },
    is_read: { type: Boolean, default: false, index: true },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
    last_read_update: { type: Date },
    reply_to_id: { type: String },
    reactions: { type: Schema.Types.Mixed }, // JSON-like
    is_deleted: { type: Boolean, default: false },
  },
  { collection: "messages" }
)

MessageSchema.pre("save", function (next) {
  this.updated_at = new Date()
  next()
})

export type MessageDoc = InferSchemaType<typeof MessageSchema>

export const Message: Model<MessageDoc> =
  (mongoose.models.Message as Model<MessageDoc>) || mongoose.model<MessageDoc>("Message", MessageSchema)

