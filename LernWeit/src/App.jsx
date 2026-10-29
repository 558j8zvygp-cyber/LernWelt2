import { useEffect, useMemo, useState } from 'react'
import LiveKitTrack from './LiveKitTrack.jsx'
import { useLiveKitRoom } from './useLiveKitRoom.jsx'
import './App.css'

const friends = [
  { id: 'maya', name: 'Maya Chen', flag: '🇯🇵', color: 'violet', initials: 'MC', online: true },
  { id: 'leo', name: 'Leo Fischer', flag: '🇩🇪', color: 'lime', initials: 'LF', online: true },
  { id: 'ines', name: 'Inês Costa', flag: '🇵🇹', color: 'coral', initials: 'IC', online: false },
  { id: 'sam', name: 'Sam Rivera', flag: '🇲🇽', color: 'blue', initials: 'SR', online: true },
  { id: 'yuki', name: 'Yuki Tanaka', flag: '🇯🇵', color: 'pink', initials: 'YT', online: false },
]

const initialRooms = [
  { id: 'german', name: 'German beginners', language: 'German', level: 'A1–A2', flag: '🇩🇪', topic: 'Say hello & break the ice', people: 12, online: 4, color: 'green', joined: true, avatars: ['LF', 'MC', 'SR'] },
  { id: 'spanish', name: 'Café español', language: 'Spanish', level: 'A1–B1', flag: '🇪🇸', topic: 'Weekend plans & good food', people: 8, online: 3, color: 'orange', joined: true, avatars: ['IC', 'YT', 'MC'] },
  { id: 'japanese', name: 'Japanese chat club', language: 'Japanese', level: 'A1–B2', flag: '🇯🇵', topic: 'Everyday phrases, no pressure', people: 16, online: 6, color: 'purple', joined: false, avatars: ['YT', 'MC', 'LF'] },
  { id: 'english', name: 'English around the world', language: 'English', level: 'A2–C1', flag: '🌍', topic: 'Travel stories & new friends', people: 21, online: 7, color: 'blue', joined: false, avatars: ['SR', 'IC', 'YT'] },
]

const navigationItems = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'discover', label: 'Discover', icon: '⌕' },
  { id: 'rooms', label: 'Live Rooms', icon: '◉' },
  { id: 'teachers', label: 'Teachers', icon: '✳' },
  { id: 'messages', label: 'Messages', icon: '◇' },
  { id: 'progress', label: 'My Progress', icon: '↗' },
  { id: 'profile', label: 'Profile', icon: '○' },
]

const proficiencyLevels = ['A1', 'A2', 'B1', 'B2', 'C1']

const sampleTeachers = [
  {
    id: 'sofia',
    name: 'Sofia R.',
    language: 'Spanish',
    levels: 'A1–B2',
    style: 'Conversation-first',
    specialty: 'Everyday conversation · Travel',
    intro: 'A sample teacher profile focused on finding your words in relaxed, real-life conversations.',
  },
  {
    id: 'jonas',
    name: 'Jonas K.',
    language: 'German',
    levels: 'A1–C1',
    style: 'Structured',
    specialty: 'Pronunciation · Everyday German',
    intro: 'A sample teacher profile combining clear structure with plenty of speaking practice.',
  },
  {
    id: 'mei',
    name: 'Mei T.',
    language: 'Japanese',
    levels: 'Beginner–B2',
    style: 'Culture & conversation',
    specialty: 'Travel · Culture · Speaking confidence',
    intro: 'A sample teacher profile for learners who want to explore language and culture together.',
  },
]

const startingMessages = {
  german: [
    { id: 1, author: 'Leo Fischer', initials: 'LF', color: 'lime', time: '10:32', text: 'Hallo zusammen! What did everyone do this weekend?', translation: 'Hi everyone! What did everyone do this weekend?', mine: false },
    { id: 2, author: 'Maya Chen', initials: 'MC', color: 'violet', time: '10:34', text: 'Ich habe einen Kuchen gebacken 🍰', translation: 'I baked a cake 🍰', mine: false },
    { id: 3, author: 'You', initials: 'A', color: 'you', time: '10:35', text: 'Das klingt sehr lecker!', translation: 'That sounds very delicious!', mine: true },
  ],
  spanish: [
    { id: 1, author: 'Inês Costa', initials: 'IC', color: 'coral', time: '09:48', text: '¡Buenos días! ¿Cuál es tu comida favorita?', translation: 'Good morning! What is your favorite food?', mine: false },
    { id: 2, author: 'Sam Rivera', initials: 'SR', color: 'blue', time: '09:52', text: 'Me encanta hacer tacos con mis amigos 🌮', translation: 'I love making tacos with my friends 🌮', mine: false },
  ],
  japanese: [
    { id: 1, author: 'Yuki Tanaka', initials: 'YT', color: 'pink', time: '11:06', text: 'みなさん、こんにちは！今日は何をしますか？', translation: 'Hello everyone! What are you doing today?', mine: false },
  ],
  english: [
    { id: 1, author: 'Sam Rivera', initials: 'SR', color: 'blue', time: '08:16', text: 'If you could visit anywhere this year, where would you go?', mine: false },
  ],
}

const chatModes = ['Free conversation', 'Travel & culture', 'Everyday phrases', 'Correct my sentences']

const roomReplySuggestions = {
  German: [
    { label: 'Answer & ask back', text: 'Ich mag Musik und neue Sprachen. Und du?', translation: 'I like music and new languages. How about you?' },
    { label: 'Show interest', text: 'Das klingt sehr interessant! Erzähl mir mehr.', translation: 'That sounds really interesting! Tell me more.' },
    { label: 'Keep it simple', text: 'Danke fürs Teilen! 😊', translation: 'Thanks for sharing! 😊' },
  ],
  Spanish: [
    { label: 'Answer & ask back', text: 'Me gusta la música y aprender idiomas. ¿Y a ti?', translation: 'I like music and learning languages. How about you?' },
    { label: 'Show interest', text: '¡Qué interesante! Cuéntame más.', translation: 'How interesting! Tell me more.' },
    { label: 'Keep it simple', text: '¡Gracias por compartir! 😊', translation: 'Thanks for sharing! 😊' },
  ],
  Japanese: [
    { label: 'Answer & ask back', text: '音楽と新しい言語が好きです。あなたは？', translation: 'I like music and new languages. How about you?' },
    { label: 'Show interest', text: 'とても面白いですね！もっと聞かせてください。', translation: 'That is very interesting! Tell me more.' },
    { label: 'Keep it simple', text: '教えてくれてありがとう！😊', translation: 'Thanks for telling me! 😊' },
  ],
  English: [
    { label: 'Answer & ask back', text: 'I love discovering new places and learning languages. What about you?', translation: 'A friendly answer that keeps the conversation going.' },
    { label: 'Show interest', text: 'That sounds really interesting! Tell me more.', translation: 'Show interest and invite them to continue.' },
    { label: 'Keep it simple', text: 'Thanks for sharing that! 😊', translation: 'A warm, simple way to respond.' },
  ],
}

function Avatar({ initials, color = 'green', flag, online, small = false }) {
  return <span className={`avatar avatar-${color} ${small ? 'avatar-small' : ''}`} aria-label={flag ? `${initials} ${flag}` : initials}>
    {initials}{flag && <i>{flag}</i>}{online && <b />}
  </span>
}

function App() {
  const [activeView, setActiveView] = useState('home')
  const [activeRoom, setActiveRoom] = useState('german')
  const [rooms, setRooms] = useState(initialRooms)
  const [roomMessages, setRoomMessages] = useState(startingMessages)
  const [chatMessages, setChatMessages] = useState([
    { id: 1, who: 'ai', text: 'Hallo Alex! 👋 I’m your AI language partner. Let’s practise German together. We can chat about anything, and I’ll gently help when you need it.', translation: 'Hello Alex!' },
    { id: 2, who: 'ai', text: 'Wie war dein Tag?', translation: 'How was your day?' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [roomInput, setRoomInput] = useState('')
  const [roomHelperOpen, setRoomHelperOpen] = useState(false)
  const [roomSearch, setRoomSearch] = useState('')
  const [chatMode, setChatMode] = useState(chatModes[0])
  const [aiLanguage, setAiLanguage] = useState('German')
  const [showTranslation, setShowTranslation] = useState(true)
  const [toast, setToast] = useState('')
  const [invitesOpen, setInvitesOpen] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState(['maya', 'leo'])
  const liveKit = useLiveKitRoom()
  const [teacherLanguage, setTeacherLanguage] = useState('All languages')
  const [teacherLevel, setTeacherLevel] = useState('All levels')
  const [teacherStyle, setTeacherStyle] = useState('All styles')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [profileLevel, setProfileLevel] = useState('A2')
  const [roomLanguageFilter, setRoomLanguageFilter] = useState('All languages')
  const [roomLevelFilter, setRoomLevelFilter] = useState('All levels')
  const [roomSizeFilter, setRoomSizeFilter] = useState('Any group size')
  const [roomTranslationsOn, setRoomTranslationsOn] = useState(true)

  const currentRoom = rooms.find((room) => room.id === activeRoom) || rooms[0]
  const visibleRooms = useMemo(() => rooms.filter((room) => {
    const [fromLevel, toLevel] = room.level.split(/[–-]/)
    const requestedLevel = proficiencyLevels.indexOf(roomLevelFilter)
    const matchesLevel = roomLevelFilter === 'All levels' || (requestedLevel >= proficiencyLevels.indexOf(fromLevel) && requestedLevel <= proficiencyLevels.indexOf(toLevel))
    return `${room.name} ${room.language} ${room.topic}`.toLowerCase().includes(roomSearch.trim().toLowerCase()) && (roomLanguageFilter === 'All languages' || room.language === roomLanguageFilter) && matchesLevel && (roomSizeFilter === 'Any group size' || (roomSizeFilter === 'Small · up to 4' ? room.online <= 4 : room.online >= 5))
  }), [roomLanguageFilter, roomLevelFilter, roomSearch, roomSizeFilter, rooms])
  const visibleTeachers = sampleTeachers.filter((teacher) => (teacherLanguage === 'All languages' || teacher.language === teacherLanguage) && (teacherLevel === 'All levels' || (teacherLevel === 'Beginner' ? /A1|Beginner/.test(teacher.levels) : teacherLevel === 'Intermediate' ? /B1|B2/.test(teacher.levels) : /C1/.test(teacher.levels))) && (teacherStyle === 'All styles' || teacher.style === teacherStyle))
  const currentTeacher = sampleTeachers.find((teacher) => teacher.id === selectedTeacher)
  const currentMessages = roomMessages[activeRoom] || []
  const latestRoomMessage = [...currentMessages].reverse().find((message) => !message.mine)
  const currentReplySuggestions = roomReplySuggestions[currentRoom.language] || roomReplySuggestions.English

  const liveKitStatus = liveKit.status
  const leaveLiveKitRoom = liveKit.leaveRoom

  useEffect(() => {
    if (activeView !== 'room' && activeView !== 'call' && liveKitStatus !== 'disconnected') {
      leaveLiveKitRoom()
    }
  }, [activeView, liveKitStatus, leaveLiveKitRoom])

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  function joinRoom(room) {
    if (liveKit.roomName && liveKit.roomName !== `lernwelt-${room.id}`) liveKit.leaveRoom()
    setRooms((current) => current.map((item) => item.id === room.id && !item.joined ? { ...item, joined: true } : item))
    setActiveRoom(room.id)
    setActiveView('room')
  }

  function leaveRoom() {
    liveKit.leaveRoom()
    setRooms((current) => current.map((room) => room.id === activeRoom && room.joined ? { ...room, joined: false } : room))
    setActiveView('rooms')
    notify(`You left ${currentRoom.name}.`)
  }

  async function sendRoomMessage(event) {
    event.preventDefault()
    const text = roomInput.trim()
    if (!text) return
    liveKit.setTyping(false)
    if (liveKit.status === 'connected') {
      try {
        await liveKit.sendChat(text)
      } catch (sendError) {
        notify(sendError.message || 'Could not send this message.')
        return
      }
    } else {
      const message = { id: Date.now(), author: 'You', initials: 'A', color: 'you', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text, mine: true }
      setRoomMessages((current) => ({ ...current, [activeRoom]: [...(current[activeRoom] || []), message] }))
      notify('This message is only saved in this browser. Join live audio to chat with other participants.')
    }
    setRoomInput('')
  }

  function sendAiMessage(event) {
    event.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    setChatMessages((current) => [...current, { id: Date.now(), who: 'you', text }])
    setChatInput('')
    window.setTimeout(() => {
      const lower = text.toLowerCase()
      let response
      if (lower.includes('hallo') || lower.includes('hello') || lower.includes('hi')) {
        response = { text: aiLanguage === 'German' ? 'Hallo! Schön, dass du da bist 😊 What do you like to do in your free time?' : '¡Hola! Qué bueno verte 😊 What do you like to do in your free time?', translation: 'Hello! Nice to see you. What do you like to do in your free time?' }
      } else if (lower.includes('danke') || lower.includes('thank')) {
        response = { text: aiLanguage === 'German' ? 'Sehr gern! You can also say “Vielen Dank” for a warmer, more emphatic thank you. Was machst du gern am Wochenende?' : '¡De nada! That’s a lovely phrase. Tell me, ¿qué te gusta hacer los fines de semana?', translation: aiLanguage === 'German' ? 'You’re very welcome! You can also say “Many thanks.” What do you like to do on weekends?' : 'You’re welcome! What do you like to do on weekends?' }
      } else {
        response = { text: aiLanguage === 'German' ? `Schön gesagt! ✨ A natural way to keep going is to add a little detail. Can you tell me more about “${text.slice(0, 60)}${text.length > 60 ? '…' : ''}”?` : `¡Muy bien! ✨ I understood you. Can you tell me a little more about that?`, translation: 'Nicely said! A natural way to keep going is to add a little detail. Can you tell me more?' }
      }
      setChatMessages((current) => [...current, { id: Date.now() + 1, who: 'ai', ...response }])
    }, 650)
  }

  function startCall() {
    setInvitesOpen(false)
  }

  function toggleFriend(id) {
    setSelectedFriends((current) => current.includes(id) ? current.filter((friendId) => friendId !== id) : [...current, id])
  }

  function addSuggestedMessage(text) {
    setChatInput(text)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setActiveView('home') }}>
          <span className="brand-mark"><span>l</span><i>✳</i></span>
          <span className="brand-name">lernwelt<span>.</span><small>LEARN · SHARE · CONNECT</small></span>
        </a>
        <div className="nav-caption">YOUR LEARNING SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigationItems.map((item) => <button key={item.id} className={`nav-item ${activeView === item.id || (item.id === 'rooms' && (activeView === 'room' || activeView === 'call')) ? 'active' : ''}`} aria-current={activeView === item.id ? 'page' : undefined} onClick={() => setActiveView(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
        </nav>
        <div className="nav-caption rooms-caption">YOUR ROOMS <button aria-label="Browse all rooms" onClick={() => setActiveView('rooms')}>＋</button></div>
        <div className="room-nav-list">{rooms.filter((room) => room.joined).map((room) => <button key={room.id} className={`room-nav-item ${activeView === 'room' && activeRoom === room.id ? 'room-active' : ''}`} onClick={() => { setActiveRoom(room.id); setActiveView('room') }}><span className={`room-dot dot-${room.color}`} />{room.flag} {room.name}<i>{room.online}</i></button>)}</div>
        <div className="nav-caption friends-caption">FRIENDS <span className="online-count">SAMPLE USERS</span></div>
        <div className="friend-list">{friends.map((friend) => <button className="friend-row" key={friend.id} onClick={() => notify(`${friend.name} is ${friend.online ? 'online and ready to practise' : 'offline right now'}.`)}><Avatar initials={friend.initials} color={friend.color} flag={friend.flag} online={friend.online} small /><span>{friend.name}</span></button>)}</div>
        <div className="sidebar-bottom">
          <div className="demo-card"><span className="demo-icon">✦</span><strong>Learning together<br />starts with hello.</strong><p>Invite a friend and make this space yours.</p><button onClick={() => setInvitesOpen(true)}>＋ Add your friends</button></div>
          <button className="profile-row" onClick={() => setActiveView('profile')}><Avatar initials="A" color="you" /><span><strong>Alex Morgan</strong><small>German learner · {profileLevel}</small></span><i aria-hidden="true">↗</i></button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="crumb"><span>My learning</span><b>/</b><strong>{activeView === 'room' ? currentRoom.name : activeView === 'ai' ? 'AI practice partner' : activeView === 'call' ? 'Group call' : navigationItems.find((item) => item.id === activeView)?.label || 'Overview'}</strong></div>
          <div className="topbar-right"><span className="demo-pill"><i /> DEMO SPACE</span><button className="top-icon" aria-label="Notifications" onClick={() => notify('Notifications are not connected in this demo.')}>♧</button><Avatar initials="A" color="you" /></div>
        </header>
        <nav className="mobile-nav" aria-label="Quick navigation">
          {navigationItems.map((item) => <button key={item.id} className={activeView === item.id || (item.id === 'rooms' && (activeView === 'room' || activeView === 'call')) ? 'mobile-nav-active' : ''} aria-current={activeView === item.id ? 'page' : undefined} onClick={() => setActiveView(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
        </nav>

        {activeView === 'discover' && <div className="page-content discover-page">
          <section className="discover-hero">
            <div className="discover-copy"><div className="eyebrow"><span /> A MORE HUMAN WAY TO LEARN</div><h1>Stop studying alone.<br />Start <em>speaking for real.</em></h1><p>Meet language partners, join live conversations, learn with teachers, and build confidence one conversation at a time.</p><div className="discover-actions"><button className="primary-button" onClick={() => setActiveView('rooms')}>Start Speaking <span>↗</span></button><button className="secondary-button" onClick={() => setActiveView('rooms')}>Explore Live Rooms</button></div><small>Rooms and profiles in this preview use sample data.</small></div>
            <div className="preview-card"><div className="preview-card-top"><span><i /> LIVE PRACTICE</span><span>DEMO PREVIEW</span></div><div className="preview-language">🇩🇪 <span>German · A2</span></div><h2>Small talk, no pressure.</h2><p>What’s a song you’ve had on repeat lately?</p><div className="preview-people"><Avatar initials="LF" color="lime" /><Avatar initials="MC" color="violet" /><Avatar initials="A" color="you" /><span>Real practice starts with one hello.</span></div><button onClick={() => joinRoom(rooms[0])}>Step into a room <span>↗</span></button></div>
          </section>
          <section className="how-it-works" id="how-it-works"><div className="eyebrow">HOW LERNWELT WORKS</div><h2>Less swiping. More <em>speaking.</em></h2><div className="steps-grid"><article><span>01</span><h3>Find your people</h3><p>Choose a language, a level, and the kind of conversation you’re in the mood for.</p></article><article><span>02</span><h3>Join the conversation</h3><p>Meet learners in a welcoming room. Listen in, take a turn, and ask for help when you need it.</p></article><article><span>03</span><h3>Keep the momentum</h3><p>Come back to your goals, revisit new words, and book a teacher when you want more structure.</p></article></div></section>
          <section className="section-block discover-rooms"><div className="section-title"><div><div className="eyebrow">HAPPENING IN THE DEMO</div><h2>Rooms made for a first hello.</h2><p>Example topics and participant counts—not live activity.</p></div><button className="subtle-link" onClick={() => setActiveView('rooms')}>Browse all rooms <span>↗</span></button></div><div className="room-grid">{rooms.slice(0, 3).map((room) => <RoomCard key={room.id} room={room} onEnter={joinRoom} />)}</div></section>
          <section className="discover-bottom"><div><div className="eyebrow">PRACTICE, WITH PEOPLE</div><h2>A little more human.<br /><em>A lot more you.</em></h2><p>Apps can help you study words. Here, you get to use them with people.</p></div><div className="discover-bottom-actions"><button className="secondary-button" onClick={() => setActiveView('teachers')}>Meet the teachers <span>↗</span></button><button className="primary-button" onClick={() => setActiveView('rooms')}>Find a live room <span>↗</span></button></div></section>
        </div>}

        {activeView === 'home' && <div className="page-content">
          <section className="welcome">
            <div><div className="eyebrow"><span /> YOUR GERMAN, YOUR WAY</div><h1>Your world gets bigger<br />with every <em>hello.</em></h1><p>Find your people. Practise a language. Make a little progress today.</p></div>
            <button className="primary-button" onClick={() => setActiveView('rooms')}>Explore language rooms <span>↗</span></button>
          </section>
          <section className="streak-banner"><div className="streak-symbol">✳</div><div className="streak-copy"><span>YOUR LANGUAGE JOURNEY</span><h2>Hallo, Alex! Ready for a little practice?</h2><p>German · A2 (self-reported) · 15 of 20 sample minutes today.</p><div className="daily-goal-meter" role="progressbar" aria-label="Sample daily practice goal" aria-valuemin="0" aria-valuemax="20" aria-valuenow="15"><span /></div></div><div className="week-streak"><span>4 DAY STREAK · DEMO</span><div>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <i key={`${day}-${i}`} className={i < 4 ? 'day-done' : ''}>{i < 4 ? '✓' : day}</i>)}</div></div></section>
          <section className="section-block">
            <div className="section-title"><div><div className="eyebrow">YOUR LITTLE CORNER OF THE WORLD</div><h2>Rooms with people in them.</h2><p>Join a conversation, listen in, or just say hello.</p></div><button className="subtle-link" onClick={() => setActiveView('rooms')}>Explore all rooms <span>↗</span></button></div>
            <div className="room-grid">{rooms.slice(0, 3).map((room) => <RoomCard key={room.id} room={room} onEnter={joinRoom} />)}</div>
          </section>
          <section className="upcoming-session"><div><div className="eyebrow">TEACHER-LED LEARNING</div><h2>No sessions on your schedule yet.</h2><p>Explore sample teacher profiles. Booking and availability aren’t connected in this demo.</p></div><button className="secondary-button" onClick={() => setActiveView('teachers')}>Explore teachers <span>↗</span></button></section>
          <section className="home-bottom-grid">
            <div className="ai-promo"><div className="ai-promo-top"><span className="ai-icon">✳</span><span className="ai-badge">HERE WHEN YOU ARE</span></div><div className="eyebrow">NO PRESSURE. JUST PRACTICE.</div><h2>Meet your AI<br /><em>language buddy.</em></h2><p>Practise at your own pace. Make mistakes, ask for help, and try again.</p><button onClick={() => setActiveView('ai')}>Start a conversation <span>↗</span></button><span className="promo-orbit">✳</span></div>
            <div className="friends-promo"><div className="eyebrow">LEARNING IS BETTER TOGETHER</div><h2>Your friends,<br />your next conversation.</h2><p>Start a little group call and practise as a team.</p><div className="friend-stack">{friends.slice(0, 4).map((friend) => <Avatar key={friend.id} initials={friend.initials} color={friend.color} flag={friend.flag} />)}<span className="more-friends">+2</span></div><button onClick={() => { setActiveView('call'); startCall() }}>Start a group call <span>↗</span></button></div>
          </section>
          <div className="demo-notice"><span>✦</span> LernWelt is a showcase demo. Rooms, messages, and calls are simulated in this browser.</div>
        </div>}

        {activeView === 'teachers' && <div className="page-content">
          <section className="page-heading"><div className="eyebrow"><span /> LEARN WITH A HUMAN GUIDE</div><h1>Find a teacher<br />who gets <em>your goals.</em></h1><p>Explore teaching styles and language specialties. Teacher profiles are sample previews; booking is not connected.</p></section>
          <section className="teacher-filters" aria-label="Filter teacher profiles"><label>Language<select value={teacherLanguage} onChange={(event) => setTeacherLanguage(event.target.value)}><option>All languages</option><option>Spanish</option><option>German</option><option>Japanese</option></select></label><label>Proficiency<select value={teacherLevel} onChange={(event) => setTeacherLevel(event.target.value)}><option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Teaching style<select value={teacherStyle} onChange={(event) => setTeacherStyle(event.target.value)}><option>All styles</option><option>Conversation-first</option><option>Structured</option><option>Culture &amp; conversation</option></select></label><label className="unavailable-filter">Price<select disabled aria-label="Price filter unavailable"><option>Not available in demo</option></select></label><label className="unavailable-filter">Availability<select disabled aria-label="Availability filter unavailable"><option>Not connected</option></select></label><span>Price and schedule filters need verified teacher data.</span></section>
          {visibleTeachers.length ? <section className="teacher-grid" aria-label="Sample teacher profiles">{visibleTeachers.map((teacher, index) => <article className={`teacher-card teacher-card-${index}`} key={teacher.id}><div className="teacher-card-heading"><div className={`teacher-avatar teacher-avatar-${index}`} aria-hidden="true">{teacher.name.split(' ').map((part) => part[0]).join('')}</div><span className="sample-label">SAMPLE PROFILE</span></div><p className="teacher-language">{teacher.language} <span>·</span> {teacher.levels}</p><h2>{teacher.name}</h2><p>{teacher.intro}</p><div className="teacher-specialty"><strong>Focus</strong><span>{teacher.specialty}</span></div><div className="teacher-style"><strong>Teaching style</strong><span>{teacher.style}</span></div><small className="teacher-disclaimer">Illustrative profile only · pricing and availability not connected</small><button className="secondary-button" onClick={() => setSelectedTeacher(selectedTeacher === teacher.id ? '' : teacher.id)} aria-expanded={selectedTeacher === teacher.id}>{selectedTeacher === teacher.id ? 'Hide profile' : 'View profile'} <span>↗</span></button></article>)}</section> : <div className="empty-state">No sample profiles match those filters. Try another language or teaching style.</div>}
          {currentTeacher && <section className="teacher-profile" aria-live="polite"><div><div className="eyebrow">SAMPLE PROFILE · {currentTeacher.language.toUpperCase()}</div><h2>Meet {currentTeacher.name}</h2><p>{currentTeacher.intro} Sessions would include a friendly introduction, a shared topic, and time for your questions.</p><div className="teacher-profile-details"><span><strong>Levels</strong>{currentTeacher.levels}</span><span><strong>Session format</strong>To be confirmed by teacher</span><span><strong>Pricing</strong>Not configured in this demo</span><span><strong>Availability</strong>Not connected</span></div></div><button className="primary-button" disabled title="Teacher booking is not connected in this demo">Booking unavailable <span>·</span></button></section>}
          <div className="demo-notice"><span>✦</span> No real teachers, reviews, prices, availability, or bookings are represented in this prototype.</div>
        </div>}

        {activeView === 'messages' && <div className="page-content">
          <section className="page-heading"><div className="eyebrow"><span /> YOUR LEARNING COMMUNITY</div><h1>Good conversations<br />start with <em>hello.</em></h1><p>Keep in touch with your learning partners and find your next chance to practise.</p></section>
          <section className="messages-panel"><div className="section-title"><div><div className="eyebrow">LEARNING PARTNERS</div><h2>Your people</h2><p>Sample community profiles for this demo.</p></div><button className="secondary-button" onClick={() => setInvitesOpen(true)}>＋ Invite friends</button></div><div className="message-partner-list">{friends.map((friend) => <article className="message-partner" key={friend.id}><Avatar initials={friend.initials} color={friend.color} flag={friend.flag} online={friend.online} /><div><strong>{friend.name}</strong><span>{friend.online ? 'Online now · up for a conversation' : 'Learning partner · check back later'}</span></div><button className="secondary-button" onClick={() => { const matchingRoom = rooms.find((room) => room.language === (friend.flag === '🇩🇪' ? 'German' : friend.flag === '🇪🇸' ? 'Spanish' : friend.flag === '🇯🇵' ? 'Japanese' : 'English')) || rooms[0]; joinRoom(matchingRoom) }}>Practise together <span>↗</span></button></article>)}</div><div className="messages-notice"><strong>Direct messages are not connected.</strong><span>This preview won’t send or store private messages. Join a language room to practise in the demo instead.</span><button className="text-button" onClick={() => setActiveView('rooms')}>Explore live rooms <span>↗</span></button></div></section>
        </div>}

        {activeView === 'progress' && <div className="page-content">
          <section className="page-heading"><div className="eyebrow"><span /> SMALL STEPS ADD UP</div><h1>Progress that’s<br />more than <em>a number.</em></h1><p>Your practice history can help you choose what to try next. Speaking time alone doesn’t measure proficiency.</p></section>
          <div className="progress-demo-banner"><span>DEMO DATA</span> Every count below is illustrative—not measured activity from a real learner account.</div>
          <section className="progress-overview"><article><span>Language in focus</span><strong>🇩🇪 German</strong><small>Level A2 · self-reported demo value</small></article><article><span>Speaking sessions</span><strong>3</strong><small>Sample completed sessions</small></article><article><span>Practice time</span><strong>~75 min</strong><small>Estimated demo total</small></article><article><span>Words reviewed</span><strong>24</strong><small>Sample vocabulary activity</small></article></section>
          <section className="progress-lower"><article className="goal-card"><div className="eyebrow">WEEKLY SPEAKING GOAL</div><h2>One conversation at a time.</h2><p>2 of 3 sample practice sessions this week</p><div className="goal-track" role="progressbar" aria-label="Sample weekly goal progress" aria-valuemin="0" aria-valuemax="3" aria-valuenow="2"><span /></div><small>Example progress only · connect an account to track your own practice</small></article><article className="next-step-card"><div className="eyebrow">A GENTLE NEXT STEP</div><h2>Try a room where you can take your time.</h2><p>Beginner-friendly conversations make it easier to build confidence at your own pace.</p><button className="primary-button" onClick={() => setActiveView('rooms')}>Find a conversation <span>↗</span></button></article></section>
          <div className="demo-notice"><span>✦</span> Proficiency in this preview is self-reported. No assessment, teacher feedback, or personal practice history is connected.</div>
        </div>}

        {activeView === 'profile' && <div className="page-content">
          <section className="page-heading"><div className="eyebrow"><span /> YOUR SPACE, YOUR PACE</div><h1>Make learning<br />feel like <em>you.</em></h1><p>Set a language and level for your demo learner profile.</p></section>
          <form className="profile-settings" onSubmit={(event) => { event.preventDefault(); notify(`Demo profile updated: German · ${profileLevel}. This change is stored only in this page.`) }}><div className="profile-settings-heading"><Avatar initials="A" color="you" /><div><h2>Alex Morgan</h2><span>Demo learner profile</span></div></div><label>Language you’re practising<select defaultValue="German"><option>German</option><option>Spanish</option><option>Japanese</option></select></label><label>Current level<select value={profileLevel} onChange={(event) => setProfileLevel(event.target.value)}><option>A1 · Beginner</option><option value="A2">A2 · Elementary</option><option>B1 · Intermediate</option><option>B2 · Upper intermediate</option></select></label><button className="primary-button" type="submit">Save demo preferences <span>↗</span></button><p>Changes stay in this browser session and are not saved to an account.</p></form>
          <div className="community-safety"><div className="eyebrow">COMMUNITY GUIDELINES</div><h2>Make room for every voice.</h2><p>Be kind, take turns, respect boundaries, and use the room’s report controls if someone makes you feel unsafe.</p><button className="text-button" onClick={() => notify('Safety tools are a prototype in this demo. No report was sent.')}>Safety and reporting tools <span>↗</span></button></div>
        </div>}

        {activeView === 'rooms' && <div className="page-content">
          <section className="page-heading"><div className="eyebrow"><span /> FIND YOUR CONVERSATION</div><h1>There’s room for<br />your <em>voice here.</em></h1><p>Join a language room, meet learners from around the world, and practise together.</p><label className="room-search"><span>⌕</span><input aria-label="Search language rooms" placeholder="Search a language, topic, or room..." value={roomSearch} onChange={(event) => setRoomSearch(event.target.value)} /><kbd>⌘ K</kbd></label></section>
          <section className="section-block rooms-directory"><div className="section-title"><div><div className="eyebrow">OPEN CONVERSATIONS</div><h2>Find your room.</h2><p>Sample rooms, topics, levels, and participant counts for this demo.</p></div><span className="live-total"><i /> {rooms.reduce((sum, room) => sum + room.online, 0)} sample learners online</span></div><div className="room-directory-filters" aria-label="Filter live rooms"><label>Language<select value={roomLanguageFilter} onChange={(event) => setRoomLanguageFilter(event.target.value)}><option>All languages</option><option>German</option><option>Spanish</option><option>Japanese</option><option>English</option></select></label><label>Level<select value={roomLevelFilter} onChange={(event) => setRoomLevelFilter(event.target.value)}><option>All levels</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select></label><label>Group size<select value={roomSizeFilter} onChange={(event) => setRoomSizeFilter(event.target.value)}><option>Any group size</option><option>Small · up to 4</option><option>Large · 5 or more</option></select></label></div><div className="room-grid room-grid-four">{visibleRooms.map((room) => <RoomCard key={room.id} room={room} onEnter={joinRoom} />)}</div>{visibleRooms.length === 0 && <div className="empty-state">No rooms match those filters. Try another language, level, group size, or search term.</div>}</section>
          <div className="demo-notice"><span>✦</span> Room members and activity are sample data for this demo experience.</div>
        </div>}

        {activeView === 'room' && <div className="room-view">
          <div className="room-main">
            <div className="room-header"><div className={`room-large-icon room-${currentRoom.color}`}>{currentRoom.flag}</div><div><div className={`room-live ${liveKit.status === 'connected' ? 'room-connected' : ''}`}><i /> {liveKit.status === 'connected' ? 'LIVE AUDIO CONNECTED' : 'TEXT ROOM'} <span>·</span> {currentRoom.level}</div><h1>{currentRoom.name}</h1><p>{currentRoom.topic}</p></div><button className="room-call-button" onClick={() => { setActiveView('call'); startCall() }}><span>▣</span> Audio &amp; video</button></div>
            <div className="room-topic"><span>✦ TODAY’S CONVERSATION</span><strong>{currentRoom.topic}</strong><button onClick={() => notify('Prompt saved to your practice notes.')}>Save prompt ♡</button><button onClick={() => setRoomTranslationsOn(!roomTranslationsOn)} aria-pressed={roomTranslationsOn}>{roomTranslationsOn ? 'Hide translations' : 'Show translations'}</button><button className={`room-ai-trigger ${roomHelperOpen ? 'helper-active' : ''}`} onClick={() => setRoomHelperOpen(!roomHelperOpen)} aria-expanded={roomHelperOpen}>✳ Help me reply</button></div>
            <LiveRoomConnectionPanel liveKit={liveKit} roomId={activeRoom} onOpenCall={() => setActiveView('call')} onLeave={liveKit.leaveRoom} />
            {roomHelperOpen && <section className="room-ai-helper" aria-label="AI chat helper">
              <div className="room-ai-heading"><span className="room-ai-mark">✳</span><div><strong>AI conversation helper</strong><small>{latestRoomMessage ? `A little help replying to ${latestRoomMessage.author}` : 'A few ideas to get the chat flowing'}</small></div><span className="helper-demo-label">DEMO</span></div>
              <p>Pick a reply to add to your message. You can edit it before sending.</p>
              <div className="room-ai-suggestions">{currentReplySuggestions.map((suggestion) => <button key={suggestion.label} onClick={() => { setRoomInput(suggestion.text); setRoomHelperOpen(false) }}><span>{suggestion.label}</span><strong>{suggestion.text}</strong><small>↳ {suggestion.translation}</small></button>)}</div>
              <small className="room-ai-disclaimer">Sample suggestions for this demo—not a live AI service.</small>
            </section>}
            <RoomChatPanel demoMessages={currentMessages} liveMessages={liveKit.messages} input={roomInput} onInputChange={(value) => { setRoomInput(value); liveKit.setTyping(Boolean(value.trim())) }} onInputBlur={() => liveKit.setTyping(false)} onSubmit={sendRoomMessage} typingParticipants={liveKit.typingParticipants} connected={liveKit.status === 'connected'} showTranslation={roomTranslationsOn} onEmoji={() => notify('Emoji picker · Try adding a little ✨ to your message!')} />
            <div className="message-footnote">Be kind, be curious. Mistakes are welcome here. <span>✳</span></div>
          </div>
          <aside className="room-aside"><LiveParticipantList liveKit={liveKit} /><div className="aside-divider" /><div className="aside-heading"><h3>Room language</h3></div><div className="room-language-detail"><span>{currentRoom.flag}</span><div><strong>{currentRoom.language}</strong><small>{currentRoom.level} · sample room</small></div></div><div className="room-guidelines"><span>✦ A KIND REMINDER</span><p>Take turns, be patient, and help each other find the words. That’s what language exchange is all about.</p></div><button className="invite-room-button" onClick={() => setInvitesOpen(true)}>＋ Invite friends</button><button className="room-safety-button" onClick={() => notify('Reporting is not connected in this demo. No report was sent.')}>Report a concern</button><button className="room-leave-button" onClick={leaveRoom}>Leave room</button><small className="room-prototype-note">Audio/video uses LiveKit. Invitations and safety reports are not connected.</small></aside>
        </div>}

        {activeView === 'ai' && <div className="ai-view">
          <section className="ai-chat-panel"><div className="ai-chat-header"><div className="ai-avatar">✳<i /></div><div><div className="ai-status"><i /> YOUR AI LANGUAGE PARTNER</div><h1>Practice without<br /><em>the pressure.</em></h1></div><span className="demo-pill">DEMO AI</span></div>
            <div className="chat-settings"><label>LET’S PRACTISE<select value={aiLanguage} onChange={(event) => setAiLanguage(event.target.value)}><option>German</option><option>Spanish</option></select></label><label>CONVERSATION STYLE<select value={chatMode} onChange={(event) => setChatMode(event.target.value)}>{chatModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label><button className={`translation-toggle ${showTranslation ? 'toggle-on' : ''}`} onClick={() => setShowTranslation(!showTranslation)}><span>文</span> Translations {showTranslation ? 'on' : 'off'}</button></div>
            <div className="ai-messages">{chatMessages.map((message) => <div key={message.id} className={`ai-message ${message.who === 'you' ? 'message-you' : ''}`}><div className="message-avatar">{message.who === 'ai' ? '✳' : 'A'}</div><div className="ai-message-body"><span>{message.who === 'ai' ? 'LERNWELT AI · YOUR PRACTICE PARTNER' : 'YOU · JUST NOW'}</span><p>{message.text}</p>{message.who === 'ai' && showTranslation && message.translation && <small>↳ {message.translation}</small>}{message.who === 'ai' && message.id !== 1 && <button onClick={() => notify('Nice work! Keep building on that sentence.')}>♡ Helpful feedback</button>}</div></div>)}<div className="ai-tip"><span>✦</span> {chatMode === 'Correct my sentences' ? 'Try writing a sentence. I’ll help you make it sound natural.' : 'No need to be perfect. Try a short answer in ' + aiLanguage + '.'}</div></div>
            <div className="suggestions"><span>NOT SURE WHAT TO SAY?</span><div><button onClick={() => addSuggestedMessage(aiLanguage === 'German' ? 'Hallo! Ich heiße Alex.' : '¡Hola! Me llamo Alex.')}>Introduce yourself</button><button onClick={() => addSuggestedMessage(aiLanguage === 'German' ? 'Was machst du gern am Wochenende?' : '¿Qué te gusta hacer los fines de semana?')}>Ask a question</button><button onClick={() => addSuggestedMessage('Can you help me say that another way?')}>Ask for help</button></div></div>
            <form className="ai-input-form" onSubmit={sendAiMessage}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder={`Write something in ${aiLanguage}...`} aria-label={`Write something in ${aiLanguage}`} /><button type="button" onClick={() => notify('Voice practice is a visual demo control.')} aria-label="Voice input">⌁</button><button type="submit" aria-label="Send message" disabled={!chatInput.trim()}>↑</button></form><div className="ai-demo-note">AI replies in this showcase are scripted examples. No external AI service is connected.</div>
          </section>
          <aside className="ai-aside"><div className="aside-illustration"><div className="ai-orbit">✳</div><span className="orbit-word word-one">sprechen</span><span className="orbit-word word-two">parler</span><span className="orbit-word word-three">hablar</span></div><div className="eyebrow">A GENTLE SPACE TO TRY</div><h2>Your pace.<br />Your <em>words.</em></h2><p>Practise whenever you like. Ask questions, try new phrases, and get friendly prompts to keep the conversation going.</p><div className="ai-benefit"><span>01</span> Make mistakes without the nerves</div><div className="ai-benefit"><span>02</span> See a translation when you need it</div><div className="ai-benefit"><span>03</span> Try another way to say it</div><div className="ai-aside-note"><span>✦</span> A practice buddy, not a replacement for people. The best exchanges are human.</div></aside>
        </div>}

        {activeView === 'call' && <div className="call-page">
          <div className="call-heading"><div><div className="eyebrow"><span /> LIVE LANGUAGE ROOM · {currentRoom.language.toUpperCase()}</div><h1>More voices,<br /><em>more ways to learn.</em></h1><p>Join with your microphone on and camera off. Turn your camera on any time.</p></div><button className="secondary-button" onClick={() => setActiveView('room')}>Back to room chat</button></div>
          <div className="call-stage">
            <div className="call-stage-top"><span className={`connection-indicator connection-${liveKit.status}`}><i /> {connectionLabel(liveKit.status)}</span><span>{liveKit.status === 'connected' ? `${liveKit.participants.length} connected` : liveKit.status === 'connecting' || liveKit.status === 'reconnecting' ? 'Updating live participants…' : 'Not connected'}</span><span className="call-room-name">{currentRoom.name}</span></div>
            {liveKit.status === 'disconnected' || liveKit.status === 'error' ? <div className="livekit-join"><div className="livekit-audio-symbol">♬</div><h2>Join the conversation</h2><p>Your microphone will be on. Your camera stays off until you choose to enable it.</p><button className="primary-button" onClick={() => liveKit.joinRoom(`lernwelt-${activeRoom}`, 'Alex Morgan')}>Join live audio <span>↗</span></button><small>Use headphones for the clearest conversation.</small></div> : null}
            {liveKit.status === 'connecting' || liveKit.status === 'reconnecting' ? <div className="livekit-connecting" role="status">{liveKit.status === 'connecting' ? 'Connecting to the room and starting your microphone…' : 'Reconnecting to the live room…'}</div> : null}
            {liveKit.status === 'connected' && <div className="participant-grid livekit-participant-grid">{liveKit.participants.map((participant) => <LiveParticipantTile key={participant.identity} participant={participant} typing={Boolean(liveKit.typingParticipants[participant.identity])} onPlaybackBlocked={liveKit.setAudioPlaybackBlocked} />)}</div>}
            {liveKit.audioPlaybackBlocked && <div className="livekit-error" role="status"><span>Remote audio is ready but browser playback is blocked.</span><button className="secondary-button" onClick={() => liveKit.resumeAudioPlayback()}>Enable audio</button></div>}
            {liveKit.error && <div className="livekit-error" role="alert">{liveKit.error}</div>}
            <div className="call-controls livekit-call-controls">
              {liveKit.status !== 'connected' ? <button className="leave-call" onClick={() => { liveKit.leaveRoom(); setActiveView('room') }}><span>↗</span>Back to room</button> : <>
                <button className={liveKit.participants.find((participant) => participant.isLocal)?.isMicrophoneEnabled ? '' : 'control-off'} onClick={() => liveKit.setMicrophoneEnabled(!liveKit.participants.find((participant) => participant.isLocal)?.isMicrophoneEnabled)}><span>{liveKit.participants.find((participant) => participant.isLocal)?.isMicrophoneEnabled ? '♬' : '⊘'}</span>{liveKit.participants.find((participant) => participant.isLocal)?.isMicrophoneEnabled ? 'Mute mic' : 'Unmute mic'}</button>
                <button className={liveKit.participants.find((participant) => participant.isLocal)?.isCameraEnabled ? '' : 'control-off'} onClick={() => liveKit.setCameraEnabled(!liveKit.participants.find((participant) => participant.isLocal)?.isCameraEnabled)}><span>{liveKit.participants.find((participant) => participant.isLocal)?.isCameraEnabled ? '▣' : '◉'}</span>{liveKit.participants.find((participant) => participant.isLocal)?.isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}</button>
                <button className="leave-call" onClick={() => { liveKit.leaveRoom(); setActiveView('room'); notify('You left the live audio room.') }}><span>↗</span>Leave audio</button>
              </>}
              <button onClick={() => setInvitesOpen(true)}><span>＋</span>Invite friends</button>
            </div>
          </div>
          <RoomChatPanel demoMessages={currentMessages} liveMessages={liveKit.messages} input={roomInput} onInputChange={(value) => { setRoomInput(value); liveKit.setTyping(Boolean(value.trim())) }} onInputBlur={() => liveKit.setTyping(false)} onSubmit={sendRoomMessage} typingParticipants={liveKit.typingParticipants} connected={liveKit.status === 'connected'} showTranslation={roomTranslationsOn} onEmoji={() => notify('Emoji picker · Try adding a little ✨ to your message!')} />
          <div className="call-footer"><span>✦ Take turns, be kind, and make room for every voice.</span><span>Live audio/video is provided by LiveKit.</span></div>
        </div>}
      </main>

      {invitesOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setInvitesOpen(false) }}><section className="invite-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-title"><button className="close-dialog" onClick={() => setInvitesOpen(false)} aria-label="Close dialog">×</button><div className="eyebrow"><span /> YOUR PEOPLE, YOUR PRACTICE</div><h2 id="invite-title">Bring your friends<br /><em>into the conversation.</em></h2><p>Choose sample profiles to preview invitations.</p><div className="invite-list">{friends.map((friend) => <button className={`invite-friend ${selectedFriends.includes(friend.id) ? 'friend-selected' : ''}`} key={friend.id} onClick={() => toggleFriend(friend.id)}><Avatar initials={friend.initials} color={friend.color} flag={friend.flag} online={friend.online} /><span><strong>{friend.name}</strong><small>{friend.online ? 'Online now' : 'Available later'} · {friend.flag}</small></span><i>{selectedFriends.includes(friend.id) ? '✓' : '+'}</i></button>)}</div><button className="primary-button invite-submit" onClick={() => { setInvitesOpen(false); notify('Friend invitations are not connected. Share the room name with participants who have LiveKit access.') }}>Select {selectedFriends.length} friend{selectedFriends.length === 1 ? '' : 's'} <span>↗</span></button><small className="invite-footnote">Sample profiles only · this does not send invitations.</small></section></div>}
      {toast && <div className="toast" role="status"><span>✳</span>{toast}</div>}
    </div>
  )
}

function RoomCard({ room, onEnter }) {
  return <article className={`room-card room-card-${room.color}`}><div className="room-card-top"><span className="room-flag">{room.flag}</span><span className="room-live-count"><i /> {room.online} sample here now</span></div><h3>{room.name}</h3><p className="room-topic-text">{room.topic}</p><div className="room-level-label">Sample level · {room.level}</div><div className="room-card-bottom"><div className="room-people">{room.avatars.map((avatar, index) => <Avatar key={`${avatar}-${index}`} initials={avatar} color={['violet', 'lime', 'coral'][index]} small />)}<span>{room.people} sample learners</span></div><button onClick={() => onEnter(room)}>{room.joined ? 'Open room' : 'Join room'} <span>↗</span></button></div></article>
}

function connectionLabel(status) {
  if (status === 'connected') return 'CONNECTED'
  if (status === 'connecting') return 'CONNECTING'
  if (status === 'reconnecting') return 'RECONNECTING'
  if (status === 'error') return 'CONNECTION ERROR'
  return 'NOT CONNECTED'
}

function initialsFor(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function LiveRoomConnectionPanel({ liveKit, roomId, onOpenCall, onLeave }) {
  const isConnected = liveKit.status === 'connected' && liveKit.roomName === `lernwelt-${roomId}`
  const localParticipant = liveKit.participants.find((participant) => participant.isLocal)
  return <section className={`live-room-panel ${isConnected ? 'live-room-panel-connected' : ''}`}>
    <div><span className={`connection-indicator connection-${liveKit.status}`}><i /> {connectionLabel(liveKit.status)}</span><strong>{isConnected ? `${liveKit.participants.length} connected in voice` : 'Voice room'}</strong><small>Audio starts on join · camera remains off</small></div>
    {isConnected ? <div className="live-room-actions"><button className="secondary-button" onClick={() => liveKit.setMicrophoneEnabled(!localParticipant?.isMicrophoneEnabled)}>{localParticipant?.isMicrophoneEnabled ? 'Mute mic' : 'Unmute mic'}</button><button className="secondary-button" onClick={() => liveKit.setCameraEnabled(!localParticipant?.isCameraEnabled)}>{localParticipant?.isCameraEnabled ? 'Camera off' : 'Camera on'}</button><button className="secondary-button" onClick={onOpenCall}>Open voice room <span>↗</span></button><button className="room-leave-button" onClick={onLeave}>Leave audio</button></div> : <button className="primary-button" disabled={liveKit.status === 'connecting' || liveKit.status === 'reconnecting'} onClick={() => liveKit.joinRoom(`lernwelt-${roomId}`, 'Alex Morgan')}>{liveKit.status === 'connecting' ? 'Connecting…' : 'Join live audio'} <span>↗</span></button>}
    {liveKit.status === 'error' && <p className="livekit-inline-error" role="alert">{liveKit.error}</p>}
    {liveKit.audioPlaybackBlocked && <p className="livekit-inline-error" role="status">Remote audio is blocked by the browser. <button className="text-button" onClick={() => liveKit.resumeAudioPlayback()}>Enable audio</button></p>}
  </section>
}

function LiveParticipantList({ liveKit }) {
  if (liveKit.status !== 'connected') {
    return <><div className="aside-heading"><h3>Voice participants</h3></div><p className="live-room-empty">{liveKit.status === 'error' ? 'Could not join voice.' : 'Join live audio to see connected participants.'}</p>{liveKit.error && <p className="livekit-inline-error" role="alert">{liveKit.error}</p>}</>
  }
  return <><div className="aside-heading"><h3>Voice participants</h3><span>{liveKit.participants.length} connected</span></div>{liveKit.participants.map((participant) => <div className="live-participant-row" key={participant.identity}><Avatar initials={initialsFor(participant.name)} color={participant.isLocal ? 'you' : 'violet'} small /><span><strong>{participant.name}{participant.isLocal ? ' (you)' : ''}</strong><small>{participant.isSpeaking ? 'Speaking' : 'Connected'} · {participant.isMicrophoneEnabled ? 'Mic on' : 'Muted'}</small></span><i className={`participant-state-dot ${participant.isSpeaking ? 'participant-speaking' : ''}`} />{!participant.isLocal && participant.audioTrack && <LiveKitTrack track={participant.audioTrack} onPlaybackBlocked={liveKit.setAudioPlaybackBlocked} />}</div>)}</>
}

function LiveParticipantTile({ participant, typing, onPlaybackBlocked }) {
  return <article className={`participant-tile live-participant-tile ${participant.isSpeaking ? 'participant-is-speaking' : ''}`}>
    {participant.isCameraEnabled && participant.videoTrack
      ? <LiveKitTrack track={participant.videoTrack} video />
      : <div className={`participant-art participant-avatar-art ${participant.isLocal ? 'avatar-you-art' : ''}`}><Avatar initials={initialsFor(participant.name)} color={participant.isLocal ? 'you' : 'violet'} /><span>{participant.isLocal ? 'You' : participant.name}</span></div>}
    {!participant.isLocal && participant.audioTrack && <LiveKitTrack track={participant.audioTrack} onPlaybackBlocked={onPlaybackBlocked} />}
    <div className="participant-name"><Avatar initials={initialsFor(participant.name)} color={participant.isLocal ? 'you' : 'violet'} small /><strong>{participant.name}{participant.isLocal ? ' (you)' : ''}</strong><span className="participant-mic-state" aria-label={participant.isMicrophoneEnabled ? 'Microphone on' : 'Microphone muted'}>{participant.isMicrophoneEnabled ? '♬' : '⊘'}</span></div>
    <div className="participant-state-list"><span className="participant-state connected-state">Connected</span>{participant.isSpeaking && <span className="participant-state speaking-state">Speaking</span>}{!participant.isMicrophoneEnabled && <span className="participant-state muted-state">Muted</span>}{typing && <span className="participant-state typing-state">Typing</span>}{!participant.isCameraEnabled && <span className="participant-state camera-state">Camera off</span>}</div>
  </article>
}

function RoomChatPanel({ demoMessages, liveMessages, input, onInputChange, onInputBlur, onSubmit, typingParticipants, connected, showTranslation, onEmoji }) {
  const messages = connected ? liveMessages : demoMessages
  const typingNames = Object.values(typingParticipants)
  return <section className="live-chat-panel" aria-label="Room text chat">
    <div className="live-chat-heading"><div><strong>Room chat</strong><small>{connected ? 'Messages are shared with connected room participants.' : 'Preview messages are local to this browser.'}</small></div><span className={connected ? 'chat-connection-on' : 'chat-connection-off'}>{connected ? 'LIVE CHAT' : 'DEMO CHAT'}</span></div>
    {!connected && <div className="live-chat-notice">Join live audio to send messages and typing status to other participants.</div>}
    <div className="chat-log">{messages.map((message) => message.mine !== undefined && message.author
      ? <ChatBubble key={message.id} message={message} showTranslation={showTranslation} />
      : <div className={`room-message ${message.mine ? 'own-message' : ''}`} key={message.id}><Avatar initials={initialsFor(message.name)} color={message.mine ? 'you' : 'violet'} small /><div className="room-message-content"><div className="room-message-meta"><strong>{message.name}{message.mine ? ' (you)' : ''}</strong><span>{new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div className="room-message-text">{message.text}</div></div></div>)}
      {typingNames.map((name) => <div className="live-typing-indicator" key={name}><span className="typing-dots" aria-hidden="true"><i /><i /><i /></span><span>{name} is typing…</span></div>)}
      {messages.length === 0 && connected && <div className="live-chat-empty">You’re connected. Say hello to start the chat.</div>}
    </div>
    <form className="message-form" onSubmit={onSubmit}><button type="button" className="attach-button" onClick={onEmoji} aria-label="Emoji suggestions">＋</button><input value={input} maxLength={2000} onChange={(event) => onInputChange(event.target.value)} onBlur={onInputBlur} aria-label="Write a message" placeholder="Write a message…" /><button className="send-button" type="submit" aria-label="Send message" disabled={!input.trim()}>↑</button></form>
  </section>
}

function ChatBubble({ message, showTranslation }) {
  return <div className={`room-message ${message.mine ? 'own-message' : ''}`}><Avatar initials={message.initials} color={message.color} small /><div className="room-message-content"><div className="room-message-meta"><strong>{message.author}</strong><span>{message.time}</span></div><div className="room-message-text">{message.text}</div>{showTranslation && message.translation && <div className="room-translation"><span>↳</span> {message.translation}</div>}</div></div>
}

export default App
