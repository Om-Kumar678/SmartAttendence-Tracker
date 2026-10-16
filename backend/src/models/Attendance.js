import mongoose from 'mongoose';
const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD, avoids timezone date shifts
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true }
}, { timestamps: true });
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ owner: 1, date: 1 });
export default mongoose.model('Attendance', attendanceSchema);
