import React, { useState, useRef, useEffect } from 'react'
import { LayoutDashboard, ClipboardList, Code2, Bot, ChartNoAxesColumnIncreasing, Award, ShieldCheck, UserRoundCheck, Settings, ChevronRight, Search, Bell, ArrowUpRight, ArrowRight, Clock3, CheckCircle2, Play, Database, Sparkles, Menu, X, BookOpen, Fingerprint, LockKeyhole, Check, AlertTriangle, LogOut, Terminal, ChevronLeft, RotateCcw, Eye, Copy, Info, Mic, Square, Trash2, Volume2 } from 'lucide-react'

const initialQuestions = [
  { title: 'Retrieve high-value orders', difficulty: 'Beginner', question: 'Return order_id, customer_id, and total_amount for orders greater than 500. Sort by total_amount from highest to lowest.', solution: 'SELECT order_id, customer_id, total_amount\nFROM orders\nWHERE total_amount > 500\nORDER BY total_amount DESC;', tip: 'Use SELECT, WHERE and ORDER BY.', columns: 'orders(order_id, customer_id, total_amount, order_date)' },
  { title: 'Sales by customer', difficulty: 'Intermediate', question: 'Return each customer_id and their total spend, named total_spent. Group by customer_id, with highest total_spent first.', solution: 'SELECT customer_id, SUM(total_amount) AS total_spent\nFROM orders\nGROUP BY customer_id\nORDER BY total_spent DESC;', tip: 'Use SUM and GROUP BY.', columns: 'orders(order_id, customer_id, total_amount, order_date)' },
  { title: 'Customers and order counts', difficulty: 'Intermediate', question: 'Show each customer name and number of orders, named order_count. Include customers who have no orders.', solution: 'SELECT c.name, COUNT(o.order_id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nGROUP BY c.customer_id, c.name;', tip: 'Consider a LEFT JOIN and COUNT.', columns: 'customers(customer_id, name, email) · orders(order_id, customer_id, total_amount, order_date)' }
]
// MVP policy: level and time limits are prototype settings, not an accredited standard.
const LEVELS = {
  Easy: { seconds: 60, description: 'SQL fundamentals: filtering, sorting and simple totals.', questions: [
    initialQuestions[0],
    { title: 'Count all orders', difficulty: 'Easy', question: 'Return the number of orders in the orders table, named order_count.', solution: 'SELECT COUNT(*) AS order_count FROM orders;', tip: 'Use COUNT(*).', columns: 'orders(order_id, customer_id, total_amount, order_date)' },
    { title: 'Find recent orders', difficulty: 'Easy', question: 'Return order_id and order_date for orders from 2026-01-01 onward, ordered from most recent to oldest.', solution: "SELECT order_id, order_date FROM orders WHERE order_date >= '2026-01-01' ORDER BY order_date DESC;", tip: 'Combine WHERE and ORDER BY.', columns: 'orders(order_id, customer_id, total_amount, order_date)' }
  ], interview: [
    'What does your WHERE clause do, and why did you choose that condition?',
    'Explain how COUNT or ORDER BY changes the business information returned by your query.'
  ] },
  Intermediate: { seconds: 90, description: 'Grouping, aggregations and joining retail data.', questions: initialQuestions, interview: [
    'Explain how you decided which SQL clauses to use in your first challenge. What would change if the dataset were larger?',
    'How would you check that your aggregated or joined results are correct, including customers with no orders?'
  ] },
  Advanced: { seconds: 120, description: 'Multi-table analysis, subqueries and advanced SQL reasoning.', questions: [
    { title: 'Top customers by revenue', difficulty: 'Advanced', question: 'Return the five customers with the highest total order revenue, including their names and total_spent. Include only customers with at least two orders.', solution: 'SELECT c.name, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name HAVING COUNT(o.order_id) >= 2 ORDER BY total_spent DESC LIMIT 5;', tip: 'Combine JOIN, GROUP BY, HAVING and LIMIT.', columns: 'customers(customer_id, name, email) · orders(order_id, customer_id, total_amount, order_date)' },
    { title: 'Above-average orders', difficulty: 'Advanced', question: 'Find orders whose total_amount exceeds the average total_amount across all orders. Return order_id and total_amount, largest first.', solution: 'SELECT order_id, total_amount FROM orders WHERE total_amount > (SELECT AVG(total_amount) FROM orders) ORDER BY total_amount DESC;', tip: 'A scalar subquery can calculate the overall average.', columns: 'orders(order_id, customer_id, total_amount, order_date)' },
    { title: 'Customers with no orders', difficulty: 'Advanced', question: 'Find all customer names for customers who have never placed an order, using NOT EXISTS.', solution: 'SELECT c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);', tip: 'Use a correlated NOT EXISTS subquery.', columns: 'customers(customer_id, name, email) · orders(order_id, customer_id, total_amount, order_date)' }
  ], interview: [
    'Compare a correlated subquery with a JOIN for your SQL analysis. Explain correctness, null handling and performance trade-offs.',
    'How would you validate an aggregation over multiple tables and prevent duplicate rows from inflating revenue totals?'
  ] }
}
const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Assessments', icon: ClipboardList },
  { label: 'SQL Workspace', icon: Code2 },
  { label: 'AI Interview', icon: Bot },
  { label: 'My Results', icon: ChartNoAxesColumnIncreasing },
  { label: 'Credentials', icon: Award },
  { label: 'Verify Credential', icon: ShieldCheck },
]
const states = ['Not started', 'In progress', 'Awaiting review', 'Approved', 'Rejected']
function Pill({ children, tone='mint' }) { return <span className={`pill pill-${tone}`}>{children}</span> }
function IconButton({children, onClick, title}) {return <button onClick={onClick} className="icon-button" title={title}>{children}</button>}

// Browser-native recording. Audio remains local until a backend upload endpoint exists.
function VoiceAnswer({ number, value, onChange, busy, onRecordingChange, seconds, enabled }) {
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timeoutRef = useRef(null)
  const intervalRef = useRef(null)
  const [recording, setRecording] = useState(false)
  const [remaining, setRemaining] = useState(seconds)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const cleanupTimer = () => { clearTimeout(timeoutRef.current); clearInterval(intervalRef.current) }

  useEffect(() => () => {
    cleanupTimer()
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.ondataavailable = null
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(track => track.stop())
  }, [])

  async function startRecording() {
    if (value || recording || busy || !enabled || starting) return
    setStarting(true)
    setError('')
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Recording requires a supported browser on HTTPS or localhost.')
      setStarting(false)
      return
    }
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      const mime = preferred.find(type => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        cleanupTimer()
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setRecording(false)
        onRecordingChange(false)
        if (blob.size > 0) onChange(blob)
        else { setRemaining(seconds); setError('No audio was captured. Please retry.') }
      }
      recorder.onerror = () => {
        cleanupTimer()
        setError('Microphone recording failed; try again.')
        stream.getTracks().forEach(t => t.stop())
        setRecording(false)
        onRecordingChange(false)
      }
      recorder.start(250)
      setRecording(true)
      onRecordingChange(true)
      setRemaining(seconds)
      const deadline = Date.now() + seconds * 1000
      intervalRef.current = setInterval(() => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 200)
      timeoutRef.current = setTimeout(() => {
        setRemaining(0)
        if (recorder.state === 'recording') recorder.stop()
      }, seconds * 1000)
    } catch (err) {
      stream?.getTracks().forEach(t => t.stop())
      setError(err.name === 'NotAllowedError' ? 'Microphone permission denied. Enable it in browser settings.' : 'Could not access microphone. Check your device settings.')
    } finally { setStarting(false) }
  }
  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }
  const clock = `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`
  return <div className="voice-answer">
    <div className="voice-heading"><Mic size={17}/><strong>Spoken answer {number}</strong><Pill tone={recording?'neutral':value?'mint':'neutral'}>{recording?'Recording…':value?'Answer saved':'Not started'}</Pill></div>
    <div className={`interview-timer ${recording && remaining <= 15 ? 'timer-warning' : ''}`} aria-live="off"><Clock3 size={20}/><strong>{clock}</strong><span>{recording?'Time remaining':`Maximum answer time: ${seconds / 60} min${seconds===60?'':' (or less)'}`}</span></div>
    <div className="timer-track"><div style={{width:`${remaining/seconds*100}%`}}/></div>
    <p>Voice only. The timer begins when recording starts and recording automatically stops at 00:00. One recorded attempt per question.</p>
    {recording ? <button className="button stop-recording" onClick={stopRecording}><Square size={17}/> Finish answer</button>
      : <button className="button primary" disabled={!enabled || busy || starting || !!value} onClick={startRecording}><Mic size={17}/> {value?'Answer recorded':starting?'Opening microphone…':'Start recording'}</button>}
    {value && !recording && <div className="voice-playback"><audio controls controlsList="nodownload" src={value.url} aria-label={`Play answer ${number}`}/></div>}
    {!enabled && !value && <p>Complete the previous question before recording this one.</p>}
    {error && <p className="voice-error" role="alert">{error}</p>}
    <p className="voice-privacy"><LockKeyhole size={14}/> Prototype: recordings remain in browser memory and are not uploaded, transcribed or graded yet.</p>
  </div>
}

function App() {
  const [page,setPage] = useState('Overview')
  const [mobile,setMobile] = useState(false)
  const [status,setStatus] = useState('Not started')
  const [level,setLevel] = useState('Easy')
  const levelConfig = LEVELS[level]
  const [question,setQuestion] = useState(0)
  const [answers,setAnswers] = useState(['','',''])
  const [interview,setInterview] = useState([null,null])
  const [recordingQuestion,setRecordingQuestion] = useState(null)
  function updateInterview(i, blob) {
    setInterview(prev => prev.map((old, j) => {
      if (j !== i) return old
      if (old?.url) URL.revokeObjectURL(old.url)
      return blob ? { blob, url: URL.createObjectURL(blob) } : null
    }))
  }
  const [notice,setNotice] = useState('')
  const [verifyInput,setVerifyInput] = useState('')
  const [activeRole,setActiveRole] = useState('Candidate')
  const [reviewReason,setReviewReason] = useState('')
  const [showSchema,setShowSchema] = useState(true)
  const notify=(t)=>{setNotice(t);setTimeout(()=>setNotice(''),4200)}
  const go=(p)=>{setRecordingQuestion(null);setPage(p);setMobile(false);window.scrollTo(0,0)}
  const submitted = ['Awaiting review','Approved','Rejected'].includes(status)
  const answered = answers.filter(x=>x.trim()).length
  function start(){if(status==='Not started'||status==='Rejected'){setStatus('In progress')} go('SQL Workspace')}
  function submit(){if(answered!==3){notify('Complete all 3 SQL questions before submitting.');return}setStatus('In progress');go('AI Interview');notify('SQL responses saved in this demo. Continue to the AI interview.')}
  function finishInterview(){if(interview.some(x=>!x?.blob)){notify('Answer both interview questions to finish.');return}setStatus('Awaiting review');go('My Results');notify('Demo assessment submitted for human review.')}
  function reset(){setAnswers(['','','']);interview.forEach(v=>{if(v?.url)URL.revokeObjectURL(v.url)});setInterview([null,null]);setQuestion(0);setLevel('Easy');setStatus('Not started');go('Overview');notify('Demo assessment reset.')}
  function approve(v){setStatus(v);go('Assessor Review');notify(v==='Approved'?'Demo credential approved. Blockchain issuance is not connected.':'Demo assessment rejected. No credential issued.')}
  function topTitle(){return ({'Overview':'Dashboard','Assessments':'Explore assessments','SQL Workspace':'SQL assessment workspace','AI Interview':'Technical interview','My Results':'Assessment results','Credentials':'My credentials','Verify Credential':'Verify a credential','Assessor Review':'Assessor review'})[page]||page}
  return <div className="app-shell">
    {mobile&&<div className="scrim" onClick={()=>setMobile(false)} />}
    <aside className={`sidebar ${mobile?'open':''}`}>
      <div className="brand"><div className="brand-mark"><ShieldCheck size={23}/></div><div><strong>SkillsProof</strong><small>Prove your potential.</small></div><button className="sidebar-close" onClick={()=>setMobile(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="nav-list">{nav.map(({label,icon:Icon})=><button key={label} onClick={()=>go(label)} className={`nav-item ${page===label?'active':''}`}><Icon size={18}/><span>{label}</span>{page===label&&<span className="nav-dot"/>}</button>)}</div>
      <div className="workspace-label lower">TEAM TOOLS</div>
      <button className={`nav-item ${page==='Assessor Review'?'active':''}`} onClick={()=>{setActiveRole('Assessor');go('Assessor Review')}}><UserRoundCheck size={18}/>Assessor review</button>
      <div className="sidebar-bottom"><div className="sidebar-info"><Sparkles size={19}/><strong>Your skills deserve to be seen.</strong><p>Build evidence of what you can do, one assessment at a time.</p></div><div className="sidebar-user"><div className="avatar">JD</div><div><strong>Jordan Demo</strong><small>{activeRole} · Demo account</small></div><Settings size={17}/></div></div>
    </aside>
    <main className="main-pane">
      <header className="topbar"><div className="top-left"><button className="hamburger" onClick={()=>setMobile(true)}><Menu size={22}/></button><div className="crumb">Workspace <ChevronRight size={14}/> <b>{topTitle()}</b></div></div><div className="top-right"><span className="env-label"><span className="live-dot"/> BACISS MVP DEMO</span><IconButton title="Notifications" onClick={()=>notify('No new notifications')}><Bell size={18}/></IconButton><div className="avatar small">JD</div></div></header>
      <div className="content">
      {page==='Overview'&&<>
        <section className="welcome"><div className="welcome-copy"><Pill tone="white"><Sparkles size={12}/> YOUR LEARNING JOURNEY</Pill><h1>Skills that speak<br/><em>for themselves.</em></h1><p>Validate your abilities with practical challenges, thoughtful feedback and verifiable credentials.</p><button className="button white-button" onClick={()=>go('Assessments')}>Explore assessments <ArrowUpRight size={17}/></button></div><div className="welcome-art"><span className="orbit orbit-1"/><span className="orbit orbit-2"/><div className="art-token"><ShieldCheck size={62} strokeWidth={1.4}/></div><span className="art-spark star-one">✦</span><span className="art-spark star-two">✧</span></div></section>
        <div className="section-heading"><div><h2>Your overview</h2><p>Track your progress from learning to proof.</p></div><span className="date-label">2026 · BACISS prototype</span></div>
        <div className="stat-grid"><Stat icon={ClipboardList} label="Assessments available" value="01" note="SQL assessment pathway" color="blue"/><Stat icon={Clock3} label="Assessment status" value={status==='Not started'?'Ready':status==='Awaiting review'?'In review':status} note="Junior Data Analyst" color="violet"/><Stat icon={Award} label="Verified credentials" value="00" note="Blockchain not connected" color="orange"/></div>
        <div className="section-heading mt"><div><h2>Continue your journey</h2><p>A practical step towards proving your technical skills.</p></div><button className="text-link" onClick={()=>go('Assessments')}>View all <ArrowRight size={16}/></button></div>
        <div className="feature-course"><div className="course-art"><Database size={54}/><span>SQL</span></div><div className="course-copy"><div className="course-tags"><Pill>DATA ANALYTICS</Pill><Pill tone="neutral">{level} level</Pill></div><h3>SQL Essentials — Junior Data Analyst</h3><p>Put your data skills to the test through three practical SQL challenges, followed by a contextual technical interview.</p><div className="course-meta"><span><Code2 size={15}/> 3 SQL challenges</span><span><Bot size={15}/> AI interview</span><span><ShieldCheck size={15}/> Human review</span></div></div><button className="button primary" onClick={()=>go('Assessments')}>{status==='Not started'?'Choose level':'Open assessment'} <ArrowRight size={17}/></button></div>
        <div className="two-col"><div className="panel"><div className="panel-header"><h3>How SkillsProof works</h3><Pill tone="neutral">4 steps</Pill></div><div className="steps">{[['01','Take a practical assessment','Demonstrate your SQL knowledge through realistic tasks.'],['02','Explain your thinking','Answer two contextual AI-assisted interview questions.'],['03','Get human-reviewed results','An assessor reviews the evidence before approval.'],['04','Share your proof','Approved credentials can be independently verified once blockchain is integrated.']].map(([n,t,d])=><div className="step" key={n}><span className="step-number">{n}</span><div><strong>{t}</strong><p>{d}</p></div></div>)}</div></div><div className="panel insight"><div className="panel-header"><h3>Built for your potential</h3><Sparkles size={18}/></div><div className="insight-graphic"><div className="graphic-ring"><Fingerprint size={54}/></div></div><h3>Go beyond your CV.</h3><p>Your learning journey deserves more than a line on a résumé. Show evidence of what you've actually accomplished.</p><button className="text-link" onClick={()=>go('Credentials')}>Explore credentials <ArrowRight size={16}/></button></div></div>
      </>}
      {page==='Assessments'&&<><PageIntro eyebrow="ASSESSMENT LIBRARY" title="Explore your next challenge" sub="Job-relevant, practical assessments that measure what you can do."/><div className="level-picker"><div><h3>Select your technical assessment level</h3><p>Choose a level before beginning. Your choice controls SQL challenges and the speaking time for each AI question.</p></div><div className="level-grid">{Object.entries(LEVELS).map(([name,config])=><button key={name} type="button" className={`level-card ${level===name?'chosen':''}`} disabled={status!=='Not started'} onClick={()=>setLevel(name)}><span className="level-name">{name}</span><span>{config.description}</span><strong><Clock3 size={14}/> {config.seconds} seconds / interview answer</strong></button>)}</div>{status!=='Not started'&&<p className="level-locked"><LockKeyhole size={14}/> Level locked after beginning. Reset the demo to choose another level.</p>}</div><div className="assessment-grid"><div className="assessment-card"><div className="assessment-icon"><Database size={30}/></div><div className="course-tags"><Pill>AVAILABLE NOW</Pill><Pill tone="neutral">Data & Analytics</Pill></div><h2>SQL Essentials · {level}</h2><p>For aspiring Junior Data Analysts. Query a fictional retail database and explain your approach.</p><div className="assessment-facts"><span><Code2 size={16}/> 3 {level.toLowerCase()} questions</span><span><Bot size={16}/> 2 timed voice prompts</span><span><UserRoundCheck size={16}/> Human review</span></div><div className="assessment-bottom"><Pill tone={status==='Approved'?'mint':'neutral'}>{status}</Pill><button className="button primary" onClick={start}>{status==='Not started'?'Start now':'Open'} <ArrowRight size={16}/></button></div></div><div className="assessment-card disabled-card"><div className="assessment-icon purple"><Code2 size={30}/></div><Pill tone="neutral">FUTURE PATHWAY</Pill><h2>Python Fundamentals</h2><p>Demonstrate your ability to solve practical programming challenges with Python.</p><div className="assessment-bottom"><span>Coming later</span><LockKeyhole size={20}/></div></div><div className="assessment-card disabled-card"><div className="assessment-icon amber"><Terminal size={30}/></div><Pill tone="neutral">FUTURE PATHWAY</Pill><h2>JavaScript Essentials</h2><p>Show your frontend problem-solving skills with hands-on JavaScript assessments.</p><div className="assessment-bottom"><span>Coming later</span><LockKeyhole size={20}/></div></div></div></>}
      {page==='SQL Workspace'&&<><PageIntro eyebrow="PRACTICAL ASSESSMENT" title="SQL assessment workspace" sub={`Selected level: ${level}. Solve three business-related SQL challenges. This frontend demo does not execute SQL or assign grades.`}/><div className="workspace-progress"><div><strong>SQL Essentials · {level}</strong><span>Question {question+1} of 3</span></div><div className="progress-bar"><div style={{width:`${answered/3*100}%`}}/></div><span>{answered}/3 answered</span></div><div className="editor-layout"><div className="panel question-panel"><div className="panel-header"><h3>Challenge {String(question+1).padStart(2,'0')}</h3><Pill tone="neutral">{levelConfig.questions[question].difficulty}</Pill></div><h2>{levelConfig.questions[question].title}</h2><p>{levelConfig.questions[question].question}</p><div className="hint"><Info size={17}/><span>{levelConfig.questions[question].tip}</span></div><div className="panel-header schema-heading"><h3>Database schema</h3><button className="text-link" onClick={()=>setShowSchema(!showSchema)}>{showSchema?'Hide':'Show'}</button></div>{showSchema&&<div className="schema"><Database size={17}/><code>{levelConfig.questions[question].columns}</code></div>}<p className="demo-warning"><AlertTriangle size={16}/> Your work is held in browser memory during this demo.</p></div><div className="panel editor-panel"><div className="editor-bar"><div><Code2 size={17}/> SQL query editor</div><span>SQLite</span></div><textarea spellCheck={false} aria-label="SQL query" placeholder={'-- Write your SQL query here...\nSELECT'} value={answers[question]} onChange={e=>setAnswers(prev=>prev.map((v,i)=>i===question?e.target.value:v))} /><div className="editor-footer"><span><span className="green-dot"/> Ready to edit</span><button className="button secondary" onClick={()=>notify('SQL execution requires the FastAPI grading backend. This is a frontend-only demo.')}><Play size={15}/> Run query (demo)</button></div></div></div><div className="workspace-actions"><button className="button secondary" disabled={question===0} onClick={()=>setQuestion(x=>x-1)}><ChevronLeft size={17}/> Previous</button><div className="question-pips">{levelConfig.questions.map((q,i)=><button title={`Question ${i+1}`} key={i} className={`${i===question?'selected':''} ${answers[i].trim()?'complete':''}`} onClick={()=>setQuestion(i)}>{i+1}</button>)}</div>{question<2?<button className="button primary" onClick={()=>setQuestion(x=>x+1)}>Next challenge <ArrowRight size={17}/></button>:<button className="button primary" onClick={submit}>Continue to interview <ArrowRight size={17}/></button>}</div></>}
      {page==='AI Interview'&&<><PageIntro eyebrow="TIMED VOICE-ONLY INTERVIEW" title="Explain your thinking aloud" sub={`Assessment level: ${level}. Answer two contextual SQL questions by microphone only. No typing or pasting.`}/><div className="interview-layout"><div className="panel"><div className="ai-header"><div className="ai-icon"><Bot size={23}/></div><div><strong>Technical interview · {level}</strong><p>2 questions · {levelConfig.seconds} seconds per answer · one attempt each</p></div><Pill>Voice only</Pill></div>{levelConfig.interview.map((prompt,i)=><div className="interview-question" key={`${level}-${i}`}><div className="question-label">QUESTION {i+1} OF 2 · {level.toUpperCase()}</div><h3>{prompt}</h3><VoiceAnswer number={i+1} value={interview[i]} onChange={blob=>updateInterview(i,blob)} seconds={levelConfig.seconds} enabled={i===0 || !!interview[i-1]?.blob} busy={recordingQuestion!==null && recordingQuestion!==i} onRecordingChange={active=>setRecordingQuestion(active?i:null)}/></div>)}<div className="interview-footer"><button className="button secondary" disabled={recordingQuestion!==null || interview.some(x=>x?.blob)} onClick={()=>go('SQL Workspace')}><ChevronLeft size={17}/> Review SQL</button><button className="button primary" disabled={recordingQuestion!==null || interview.some(x=>!x?.blob)} onClick={finishInterview}>Submit demo for review <ArrowRight size={17}/></button></div></div><div className="panel guidance"><Mic size={25}/><h3>{level} interview rules</h3><p>Each question has a fixed response window of <strong>{levelConfig.seconds} seconds</strong>. Recording ends automatically at the time limit.</p><ul><li>Microphone responses only; no typed answer field.</li><li>The clock starts when the candidate starts recording.</li><li>Complete question 1 before question 2.</li><li>Once recorded, an answer cannot be replaced in this demo.</li></ul><p className="small-note">These are browser-only controls. A secure production exam will require server-enforced time windows and submission rules. Voice-only controls do not prove that an answer is unaided.</p></div></div></>}
      {page==='My Results'&&<><PageIntro eyebrow="ASSESSMENT REPORT" title="Your assessment status" sub="Results and feedback appear here when the grading backend and authorised assessor are integrated."/><div className="results-banner"><div className="results-icon"><ClipboardList size={34}/></div><div><Pill tone="neutral">{status.toUpperCase()}</Pill><h2>{status==='Not started'?'Your assessment journey starts here':status==='In progress'?'Assessment in progress':status==='Awaiting review'?'Your submission is awaiting review':status==='Approved'?'Assessor approved this demo record':'Assessor rejected this demo record'}</h2><p>Actual SQL grading, competency scores and assessor evidence will come from the backend. No real scores have been calculated.</p></div></div><div className="two-col"><div className="panel"><h3>Assessment completion</h3><div className="result-row"><span>SQL challenges answered</span><strong>{answered} / 3</strong></div><div className="progress-bar"><div style={{width:`${answered/3*100}%`}}/></div><div className="result-row"><span>Interview answers</span><strong>{interview.filter(x=>x?.blob).length} / 2</strong></div><div className="progress-bar"><div style={{width:`${interview.filter(x=>x?.blob).length/2*100}%`}}/></div><div className="result-row"><span>Human review</span><Pill tone="neutral">{status==='Approved'?'Approved':status==='Rejected'?'Rejected':status==='Awaiting review'?'Pending':'Not submitted'}</Pill></div></div><div className="panel"><h3>Proposed assessment rubric</h3>{[['SQL correctness',50],['Analytical problem-solving',25],['Technical explanation',15],['Business interpretation',10]].map(([s,n])=><div className="rubric-row" key={s}><span>{s}</span><strong>{n}%</strong></div>)}<div className="hint"><Info size={16}/> These are grading weights, not achieved scores.</div></div></div></>}
      {page==='Credentials'&&<><PageIntro eyebrow="YOUR ACHIEVEMENTS" title="My credentials" sub="Portable evidence of verified technical skills. Issuance requires assessor approval and blockchain integration."/><div className="credential-empty"><div className="credential-art"><Award size={58}/></div><Pill tone="neutral">NO ON-CHAIN CREDENTIALS YET</Pill><h2>Proof of your potential, coming soon.</h2><p>{status==='Approved'?'The demo assessor approved your submission, but blockchain credential issuance is not yet connected.':'Complete the SQL assessment and receive human approval to become eligible for a SkillsProof credential.'}</p><button className="button primary" onClick={()=>go(status==='Approved'?'Verify Credential':'Assessments')}>{status==='Approved'?'Learn about verification':'Explore assessments'} <ArrowRight size={17}/></button></div></>}
      {page==='Verify Credential'&&<><PageIntro eyebrow="PUBLIC VERIFICATION" title="Verify a credential" sub="Employers will be able to check credential authenticity using an ID or QR code once the verification backend is connected."/><div className="verify-box panel"><div className="verify-symbol"><ShieldCheck size={36}/></div><h2>Check a SkillsProof credential</h2><p>Enter a credential ID or verification URL. Blockchain verification is not connected in this frontend prototype.</p><div className="verify-form"><input placeholder="Credential ID or verification URL" value={verifyInput} onChange={e=>setVerifyInput(e.target.value)}/><button className="button primary" onClick={()=>notify('Verification is unavailable until the backend and Avalanche integration are deployed.')}><Search size={17}/> Verify</button></div><div className="hint"><LockKeyhole size={16}/> Never interpret this demo as evidence of a valid credential.</div></div></>}
      {page==='Assessor Review'&&<><PageIntro eyebrow="HUMAN IN THE LOOP" title="Assessor review" sub="Demonstration interface only. Real approval must be secured and enforced by FastAPI, not by frontend controls."/><div className="panel assessor-panel"><div className="panel-header"><div><h3>SQL Essentials ({level}) — Demo candidate</h3><p>Jordan Demo · Junior Data Analyst pathway</p></div><Pill tone="neutral">{status}</Pill></div><div className="assessor-summary"><div><span>SQL answers submitted</span><strong>{answered}/3</strong></div><div><span>Interview responses</span><strong>{interview.filter(x=>x?.blob).length}/2</strong></div><div><span>Assessment score</span><strong>Not graded</strong></div></div>{levelConfig.questions.map((q,i)=><div className="review-item" key={i}><div><strong>Challenge {i+1}: {q.title}</strong><Pill tone={answers[i].trim()?'mint':'neutral'}>{answers[i].trim()?'Response available':'Not answered'}</Pill></div><pre>{answers[i]||'No answer submitted.'}</pre></div>)}{interview.map((r,i)=><div className="review-item" key={`interview${i}`}><strong>Interview response {i+1}</strong>{r?.url ? <audio controls src={r.url} aria-label={`Candidate voice answer ${i+1}`}/> : <p>No voice response submitted.</p>}</div>)}<label className="review-label">Assessor notes (demo only)<textarea value={reviewReason} onChange={e=>setReviewReason(e.target.value)} placeholder="Add review notes..." rows={3}/></label><div className="review-actions"><button className="button secondary" onClick={()=>approve('Rejected')}>Reject demo record</button><button className="button primary" disabled={answered<3||interview.some(x=>!x?.blob)} onClick={()=>approve('Approved')}><Check size={17}/> Approve demo record</button></div><div className="hint"><AlertTriangle size={16}/> This is an insecure local demonstration. It cannot issue credentials. Production must use authenticated, authorised backend approvals.</div></div><button className="text-link reset" onClick={reset}><RotateCcw size={16}/> Reset demo state</button></>}
      </div>
    </main>
    {notice&&<div className="toast"><Info size={18}/>{notice}<button onClick={()=>setNotice('')}><X size={16}/></button></div>}
  </div>
}
function Stat({icon:Icon,label,value,note,color}){return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={21}/></div><div className="stat-name">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>}
function PageIntro({eyebrow,title,sub}){return <div className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{sub}</p></div>}
export default App
