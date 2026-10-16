import { Router } from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import auth from '../middleware/auth.js';
const router = Router();
router.use(auth);
router.get('/', async (req, res, next) => {
  try { res.json(await Student.find({ owner: req.userId }).sort({ name: 1 })); }
  catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const rollNumber = String(req.body.rollNumber || '').trim();
    const course = String(req.body.course || 'General').trim();
    if (!name || !rollNumber) return res.status(400).json({ message: 'Student name and roll number are required.' });
    const student = await Student.create({ name, rollNumber, course: course || 'General', owner: req.userId });
    res.status(201).json(student);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'That roll number already exists in your student list.' });
    next(e);
  }
});
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid student ID' });
    const student = await Student.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await Attendance.deleteMany({ student: student._id, owner: req.userId });
    res.json({ message: 'Student and their attendance records deleted.' });
  } catch (e) { next(e); }
});
export default router;
