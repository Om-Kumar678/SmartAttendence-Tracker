import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = Router();
const makeToken = userId => jwt.sign({ userId }, process.env.JWT_SECRET || 'development_only_change_me', { expiresIn: '7d' });
router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || password.length < 6)
      return res.status(400).json({ message: 'Name, valid email, and password (at least 6 characters) are required.' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: makeToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({ token: makeToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});
export default router;
