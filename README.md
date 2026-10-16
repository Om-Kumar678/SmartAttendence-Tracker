# Smart Attendance Tracker — MERN Full Stack

A full-stack attendance management application built with MongoDB, Express, React, and Node.js.

## Features
- Register and log in with JWT authentication
- Protected dashboard
- Add and manage students
- Mark attendance as Present, Absent, or Late by date
- View attendance records and summary percentages
- Responsive UI
- MongoDB persistence

## Requirements
- Node.js 18+
- MongoDB local installation or a MongoDB Atlas connection string

## 1. Configure the backend
```bash
cd backend
copy .env.example .env
```
On macOS/Linux use `cp .env.example .env`. Edit `.env` and set `MONGODB_URI`. You may keep the development JWT secret for a local demo, but replace it before deployment.

## 2. Start the backend
```bash
cd backend
npm install
npm run dev
```
The API runs at `http://localhost:5000`.

## 3. Start the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

## First use
Create an account on the Register screen, then add students and mark attendance. Each account sees only its own students and records.

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)
- `GET /api/students` (protected)
- `POST /api/students` (protected)
- `DELETE /api/students/:id` (protected)
- `GET /api/attendance?date=YYYY-MM-DD` (protected)
- `POST /api/attendance/bulk` (protected)
- `GET /api/attendance/summary` (protected)

## Notes
This is a functional starter project. Attendance is keyed by student and date; marking attendance again for the same student/date updates that record. It is not a biometric or GPS attendance system.
