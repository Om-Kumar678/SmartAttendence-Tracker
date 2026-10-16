import { Router } from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import auth from '../middleware/auth.js';
const router = Router();
router.use(auth);
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
router.get('/', async (req, res, next) => {
  try {
    const date = String(req.query.date || new Date().toISOString().slice(0, 10));
    if (!validDate(date)) return res.status(400).json({ message: 'Date must use YYYY-MM-DD format.' });
    const students = await Student.find({ owner: req.userId }).sort({ name: 1 }).lean();
    const records = await Attendance.find({ owner: req.userId, date }).lean();
    const byStudent = new Map(records.map(r => [String(r.student), r]));
    res.json(students.map(s => ({ ...s, attendance: byStudent.get(String(s._id))?.status || 'Not marked' })));
  } catch (e) { next(e); }
});
router.post('/bulk', async (req, res, next) => {
  try {
    const { date, records } = req.body;
    if (!validDate(date)) return res.status(400).json({ message: 'Date must use YYYY-MM-DD format.' });
    if (!Array.isArray(records) || records.length > 500) return res.status(400).json({ message: 'Records must be an array of up to 500 entries.' });
    const ids = records.map(r => String(r.studentId || ''));
    if (ids.some(id => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: 'One or more student IDs are invalid.' });
    const owned = await Student.find({ _id: { $in: ids }, owner: req.userId }).select('_id').lean();
    const ownedIds = new Set(owned.map(s => String(s._id)));
    if (ids.some(id => !ownedIds.has(id))) return res.status(403).json({ message: 'You can only mark attendance for your own students.' });
    const allowed = new Set(['Present', 'Absent', 'Late']);
    if (records.some(r => !allowed.has(r.status))) return res.status(400).json({ message: 'Status must be Present, Absent, or Late.' });
    const unique = new Map(records.map(r => [String(r.studentId), r.status]));
    const ops = [...unique].map(([studentId, status]) => ({
      updateOne: { filter: { student: studentId, date }, update: { $set: { student: studentId, owner: req.userId, date, status } }, upsert: true }
    }));
    if (ops.length) await Attendance.bulkWrite(ops);
    res.json({ message: `Attendance saved for ${ops.length} student(s).`, saved: ops.length });
  } catch (e) { next(e); }
});
router.get('/summary', async (req, res, next) => {
  try {
    const [students, records, dates] = await Promise.all([
      Student.countDocuments({ owner: req.userId }),
      Attendance.find({ owner: req.userId }).lean(),
      Attendance.distinct('date', { owner: req.userId })
    ]);
    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const marked = present + late + absent;
    res.json({ students, sessions: dates.length, present, absent, late, marked, attendanceRate: marked ? Math.round(((present + late) / marked) * 100) : 0 });
  } catch (e) { next(e); }
});
export default router;
