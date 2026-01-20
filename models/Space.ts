import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const SpaceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    features: { type: [String], default: [] },
    image: { type: String },
    description: { type: String }, // used in BigCalendar types
    is_active: { type: Boolean, default: true }, // used in BigCalendar types
    created_at: { type: Date, default: Date.now },
  },
  { collection: "spaces" }
)

export type SpaceDoc = InferSchemaType<typeof SpaceSchema>

export const Space: Model<SpaceDoc> =
  (mongoose.models.Space as Model<SpaceDoc>) || mongoose.model<SpaceDoc>("Space", SpaceSchema)

