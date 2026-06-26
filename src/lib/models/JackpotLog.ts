import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IJackpotLog extends Document {
  month: string
  date: Date
  phone?: string
}

const jackpotLogSchema = new Schema<IJackpotLog>({
  month: { type: String, required: true, index: true },
  date: { type: Date, default: Date.now },
  phone: { type: String },
})

const JackpotLog: Model<IJackpotLog> = mongoose.models.JackpotLog || mongoose.model<IJackpotLog>('JackpotLog', jackpotLogSchema)
export default JackpotLog
