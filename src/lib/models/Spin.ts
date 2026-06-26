import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISpin extends Document {
  sessionId: string
  discount: number
  billAmount: number
  promoCode: string
  phone?: string
  redeemed: boolean
  spunAt: Date
}

const spinSchema = new Schema<ISpin>({
  sessionId: { type: String, required: true, index: true },
  discount: { type: Number, required: true },
  billAmount: { type: Number, required: true },
  promoCode: { type: String, required: true },
  phone: { type: String, default: null },
  redeemed: { type: Boolean, default: false },
  spunAt: { type: Date, default: Date.now, index: true },
})

spinSchema.index({ sessionId: 1, spunAt: 1 })
spinSchema.index({ phone: 1, spunAt: 1 })

const Spin: Model<ISpin> = mongoose.models.Spin || mongoose.model<ISpin>('Spin', spinSchema)
export default Spin
