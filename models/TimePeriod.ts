import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

export type TimePeriodType = "mandate" | "academicYear"

const TimePeriodSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ["mandate", "academicYear"], index: true },
    name: { type: String, required: true },
    start_date: { type: Date, required: true, index: true },
    end_date: { type: Date, required: true, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "time_periods" }
)

TimePeriodSchema.index({ type: 1, start_date: 1, end_date: 1 })

TimePeriodSchema.pre("save", function (next) {
  this.updated_at = new Date()
  next()
})

export type TimePeriodDoc = InferSchemaType<typeof TimePeriodSchema>

export const TimePeriod: Model<TimePeriodDoc> =
  (mongoose.models.TimePeriod as Model<TimePeriodDoc>) ||
  mongoose.model<TimePeriodDoc>("TimePeriod", TimePeriodSchema)

