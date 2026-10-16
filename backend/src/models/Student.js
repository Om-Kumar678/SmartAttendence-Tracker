import mongoose from 'mongoose';
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  rollNumber: { type: String, required: true, trim: true, maxlength: 40 },
  course: { type: String, default: 'General', trim: true, maxlength: 80 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
studentSchema.index({ owner: 1, rollNumber: 1 }, { unique: true });
export default mongoose.model('Student', studentSchema);
