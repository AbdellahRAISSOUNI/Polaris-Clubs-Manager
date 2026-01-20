import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const ClubSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String }, // legacy
    logo: { type: String },
    members: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    last_login: { type: Date },
    created_at: { type: Date, default: Date.now },
    color: { type: Number }, // used by BigCalendar when present
  },
  { collection: "clubs" }
)

export type ClubDoc = InferSchemaType<typeof ClubSchema>

export const Club: Model<ClubDoc> =
  (mongoose.models.Club as Model<ClubDoc>) || mongoose.model<ClubDoc>("Club", ClubSchema)

