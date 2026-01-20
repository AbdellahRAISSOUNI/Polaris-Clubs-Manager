import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const ReservationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    space_id: { type: String, required: true, index: true },
    club_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    start_time: { type: Date, required: true, index: true },
    end_time: { type: Date, required: true, index: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    is_full_day: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    // Note: admin_message exists in some UI code but not in Supabase schema.
    // We'll add it now for forward compatibility.
    admin_message: { type: String },
  },
  { collection: "reservations" }
)

ReservationSchema.pre("save", function (next) {
  this.updated_at = new Date()
  next()
})

export type ReservationDoc = InferSchemaType<typeof ReservationSchema>

export const Reservation: Model<ReservationDoc> =
  (mongoose.models.Reservation as Model<ReservationDoc>) ||
  mongoose.model<ReservationDoc>("Reservation", ReservationSchema)

