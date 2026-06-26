import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IVisit {
  date: Date
  bill: number
  discount: number
  finalAmount: string
  promoCode?: string
}

export interface IUser extends Document {
  phone: string
  name: string
  loyaltyPoints: number
  totalVisits: number
  visitHistory: IVisit[]
  lastSpinDate?: Date
  completedTasks: {
    phone: boolean
    instagram: boolean
    review: boolean
  }
  createdAt: Date
}

const visitSchema = new Schema<IVisit>({
  date: { type: Date, default: Date.now },
  bill: { type: Number, required: true },
  discount: { type: Number, required: true },
  finalAmount: { type: String, required: true },
  promoCode: { type: String },
}, { _id: false })

const userSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  loyaltyPoints: { type: Number, default: 0 },
  totalVisits: { type: Number, default: 0 },
  visitHistory: { type: [visitSchema], default: [] },
  lastSpinDate: { type: Date },
  completedTasks: {
    phone: { type: Boolean, default: false },
    instagram: { type: Boolean, default: false },
    review: { type: Boolean, default: false },
  },
}, { timestamps: true })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
export default User
