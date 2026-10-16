import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Activity, Users, CalendarCheck, LogOut, Plus, Trash2, Check, X, Clock3, Search, GraduationCap, LayoutDashboard, ClipboardList } from 'lucide-react';
import api, { errorMessage } from './api';

function AuthPage({ mode, onAuth }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const navigate = useNavigate();
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem('sat_token', data.token); onAuth(data.user); navigate('/');
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return <main className="auth-wrap"><section className="auth-card">
    <div className="brand-mark"><GraduationCap size={26}/></div><p className="eyebrow">SMART ATTENDANCE</p>
    <h1>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h1>
    <p className="muted">{mode === 'login' ? 'Sign in to manage your attendance.' : 'Set up your account to get started.'}</p>
    <form onSubmit={submit} className="stack">
      {mode === 'register' && <label>Full name<input required maxLength="80" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
      <label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
      <label>Password<input type="password" minLength="6" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 6 characters"/></label>
      {error && <div className="alert">{error}</div>}
      <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <p className="switch-auth">{mode === 'login' ? 'New here?' : 'Already have an account?'} <a href={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create account' : 'Sign in'}</a></p>
  </section></main>;
}

function App() {
  const [user, setUser] = useState(null); const [checking, setChecking] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('sat_token');
    if (!token) { setChecking(false); return; }
    api.get('/auth/me').then(r=>setUser(r.data.user)).catch(()=>localStorage.removeItem('sat_token')).finally(()=>setChecking(false));
  }, []);
  if (checking) return <div className="loading">Loading your workspace…</div>;
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace/> : <AuthPage mode="login" onAuth={setUser}/>}/>
    <Route path="/register" element={user ? <Navigate to="/" replace/> : <AuthPage mode="register" onAuth={setUser}/>}/>
    <Route path="/*" element={user ? <Dashboard user={user} onLogout={()=>{localStorage.removeItem('sat_token');setUser(null);}}/> : <Navigate to="/login" replace/>}/>
  </Routes>;
}

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('Overview');
  const [summary, setSummary] = useState(null); const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [attendance, setAttendance] = useState([]); const [search, setSearch] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', rollNumber: '', course: 'MCA' });
  const [showAdd, setShowAdd] = useState(false); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const [s, a, sum] = await Promise.all([api.get('/students'), api.get('/attendance', { params: { date } }), api.get('/attendance/summary')]);
      setStudents(s.data); setAttendance(a.data); setSummary(sum.data); setError('');
    } catch (e) { setError(errorMessage(e)); }
  };
  useEffect(()=>{load();},[date]);
  const filtered = useMemo(()=>attendance.filter(s=>`${s.name} ${s.rollNumber} ${s.course}`.toLowerCase().includes(search.toLowerCase())),[attendance,search]);
  const setStatus = (id,status) => setAttendance(prev=>prev.map(s=>s._id===id?{...s,attendance:status}:s));
  const saveAttendance = async () => {
    setBusy(true);setNotice('');setError('');
    try {
      const records=attendance.filter(s=>['Present','Absent','Late'].includes(s.attendance)).map(s=>({studentId:s._id,status:s.attendance}));
      const {data}=await api.post('/attendance/bulk',{date,records});
      setNotice(data.message);await load();
    } catch(e){setError(errorMessage(e));} finally{setBusy(false);}
  };
  const addStudent = async e => {
    e.preventDefault();setError('');setNotice('');
    try { await api.post('/students',newStudent);setNewStudent({name:'',rollNumber:'',course:'MCA'});setShowAdd(false);setNotice('Student added successfully.');await load(); }
    catch(e){setError(errorMessage(e));}
  };
  const deleteStudent = async s => {
    if(!confirm(`Delete ${s.name} and all attendance records?`)) return;
    try {await api.delete(`/students/${s._id}`);setNotice('Student deleted.');await load();}
    catch(e){setError(errorMessage(e));}
  };
  const present = attendance.filter(s=>s.attendance==='Present').length;
  const absent = attendance.filter(s=>s.attendance==='Absent').length;
  const late = attendance.filter(s=>s.attendance==='Late').length;
  const unmarked = attendance.filter(s=>s.attendance==='Not marked').length;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="logo-row"><div className="logo-icon"><GraduationCap/></div><div><strong>AttendWise</strong><small>SMART TRACKER</small></div></div>
      <p className="nav-label">WORKSPACE</p>
      {[['Overview',LayoutDashboard],['Attendance',CalendarCheck],['Students',Users]].map(([name,Icon])=><button key={name} onClick={()=>setTab(name)} className={`nav-item ${tab===name?'active':''}`}><Icon size={18}/>{name}</button>)}
      <div className="sidebar-bottom"><div className="user-chip"><div className="avatar">{user.name?.[0]?.toUpperCase()||'U'}</div><div className="user-meta"><strong>{user.name}</strong><small>{user.email}</small></div></div><button className="logout" onClick={onLogout}><LogOut size={17}/> Sign out</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><p className="eyebrow">YOUR CLASSROOM, ORGANIZED</p><h1>{tab==='Overview'?'Dashboard':tab==='Attendance'?'Attendance register':'Student directory'}</h1></div><div className="today-pill"><span className="online-dot"/><span>Workspace active</span></div></header>
      <div className="content">
        {notice && <div className="notice"><Check size={16}/>{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></div>}
        {error && <div className="alert inline-alert">{error}<button onClick={()=>setError('')}>×</button></div>}
        {tab==='Overview' && <>
          <div className="welcome-row"><div><h2>Good to see you, {user.name.split(' ')[0]} <span>✦</span></h2><p className="muted">Here’s your attendance snapshot for today.</p></div><button className="primary" onClick={()=>setTab('Attendance')}><ClipboardList size={17}/> Take attendance</button></div>
          <div className="stat-grid">
            <Stat icon={<Users/>} label="Total students" value={summary?.students??'—'} tone="purple" foot="In your directory"/>
            <Stat icon={<CalendarCheck/>} label="Attendance rate" value={`${summary?.attendanceRate??0}%`} tone="green" foot="Across marked records"/>
            <Stat icon={<Activity/>} label="Sessions tracked" value={summary?.sessions??0} tone="orange" foot="Unique dates recorded"/>
            <Stat icon={<ClipboardList/>} label="Records saved" value={summary?.marked??0} tone="blue" foot="Present, absent and late"/>
          </div>
          <section className="panel"><div className="panel-heading"><div><h3>Today’s attendance</h3><p className="muted">Quick view of your class register</p></div><button className="text-button" onClick={()=>setTab('Attendance')}>Open register →</button></div>
            <div className="today-stats"><div className="mini-stat"><span className="status-dot present-dot"/><div><strong>{present}</strong><small>Present</small></div></div><div className="mini-stat"><span className="status-dot absent-dot"/><div><strong>{absent}</strong><small>Absent</small></div></div><div className="mini-stat"><span className="status-dot late-dot"/><div><strong>{late}</strong><small>Late</small></div></div><div className="mini-stat"><span className="status-dot neutral-dot"/><div><strong>{unmarked}</strong><small>Unmarked</small></div></div></div>
            {attendance.length===0?<Empty title="No students yet" text="Add students to begin tracking attendance." action={()=>{setTab('Students');setShowAdd(true);}}/>:<div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>COURSE</th><th>STATUS</th></tr></thead><tbody>{attendance.slice(0,5).map(s=><tr key={s._id}><td><div className="student-cell"><span className="student-avatar">{s.name[0]?.toUpperCase()}</span><strong>{s.name}</strong></div></td><td>{s.rollNumber}</td><td>{s.course}</td><td><Status status={s.attendance}/></td></tr>)}</tbody></table></div>}
          </section>
          <p className="footer-note">AttendWise · Keep every class accounted for.</p>
        </>}
        {tab==='Attendance' && <><div className="section-intro"><div><h2>Daily register</h2><p className="muted">Choose a date and mark each student’s status.</p></div><label className="date-label">Attendance date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students…"/></div><div className="toolbar-actions"><button className="soft-button" onClick={()=>setAttendance(prev=>prev.map(s=>({...s,attendance:'Present'})))}>Mark all present</button><button className="primary" onClick={saveAttendance} disabled={busy||attendance.length===0}><Check size={17}/>{busy?'Saving…':'Save attendance'}</button></div></div>
          <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>COURSE</th><th>MARK STATUS</th></tr></thead><tbody>{filtered.map(s=><tr key={s._id}><td><div className="student-cell"><span className="student-avatar">{s.name[0]?.toUpperCase()}</span><strong>{s.name}</strong></div></td><td>{s.rollNumber}</td><td>{s.course}</td><td><div className="status-buttons">{[['Present','P'],['Absent','A'],['Late','L']].map(([status,letter])=><button key={status} onClick={()=>setStatus(s._id,status)} className={`status-choice ${s.attendance===status?'selected '+status.toLowerCase():''}`} title={status}><span>{letter}</span>{status}</button>)}</div></td></tr>)}</tbody></table>{filtered.length===0&&<Empty title="No matching students" text="Try another search, or add students to your directory." action={()=>setTab('Students')}/>}</div><div className="table-foot"><span>{filtered.length} students shown · {date}</span><span>{present} present · {absent} absent · {late} late</span></div></div></>}
        {tab==='Students' && <><div className="section-intro"><div><h2>Student directory</h2><p className="muted">Manage the students in your attendance register.</p></div><button className="primary" onClick={()=>setShowAdd(!showAdd)}><Plus size={17}/> Add student</button></div>
          {showAdd&&<form className="panel add-form" onSubmit={addStudent}><h3>Add a student</h3><div className="form-grid"><label>Full name<input required maxLength="100" value={newStudent.name} onChange={e=>setNewStudent({...newStudent,name:e.target.value})} placeholder="e.g. Aditi Sharma"/></label><label>Roll number<input required maxLength="40" value={newStudent.rollNumber} onChange={e=>setNewStudent({...newStudent,rollNumber:e.target.value})} placeholder="e.g. MCA-001"/></label><label>Course / class<input maxLength="80" value={newStudent.course} onChange={e=>setNewStudent({...newStudent,course:e.target.value})} placeholder="e.g. MCA"/></label></div><div className="form-actions"><button type="button" className="soft-button" onClick={()=>setShowAdd(false)}>Cancel</button><button className="primary"><Plus size={16}/> Save student</button></div></form>}
          <div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, roll number or course…"/></div><span className="muted small">{students.filter(s=>`${s.name} ${s.rollNumber} ${s.course}`.toLowerCase().includes(search.toLowerCase())).length} students</span></div>
          <div className="student-grid">{students.filter(s=>`${s.name} ${s.rollNumber} ${s.course}`.toLowerCase().includes(search.toLowerCase())).map(s=><article className="student-card" key={s._id}><div className="card-top"><span className="student-avatar large">{s.name[0]?.toUpperCase()}</span><button className="icon-button danger" onClick={()=>deleteStudent(s)} title="Delete student"><Trash2 size={17}/></button></div><h3>{s.name}</h3><p className="muted">{s.course}</p><div className="student-card-foot"><span>ROLL NUMBER</span><strong>{s.rollNumber}</strong></div></article>)}</div>
          {students.length===0&&<div className="panel"><Empty title="Your directory is empty" text="Add your first student to start tracking attendance." action={()=>setShowAdd(true)}/></div>}
        </>}
      </div>
    </main>
  </div>;
}

function Stat({icon,label,value,tone,foot}){return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><p>{label}</p><strong className="stat-value">{value}</strong><small>{foot}</small></div>}
function Status({status}){const cls=status==='Present'?'present':status==='Absent'?'absent':status==='Late'?'late':'neutral';return <span className={`status-badge ${cls}`}><span/> {status}</span>}
function Empty({title,text,action}){return <div className="empty-state"><div className="empty-icon"><ClipboardList size={22}/></div><h3>{title}</h3><p>{text}</p>{action&&<button className="soft-button" onClick={action}>Get started</button>}</div>}
export default App;
