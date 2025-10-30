import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import Registration from "./Registration";
import Login from "./Login";
import { io } from "socket.io-client";

function App() {
  const initialSystemMessage = { senderId: "system", senderName: "System", text: "Welcome to Practice Chat", timestamp: Date.now() };

  // load chats and current user from localStorage
  const [chats, setChats] = useState(() => {
    try {
      const raw = localStorage.getItem("practice_chats");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("practice_current_user")); } catch (e) { return null; }
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    try { const raw = localStorage.getItem("practice_chats"); if (raw) { const arr = JSON.parse(raw); return arr[0]?.id || null; } } catch(e) {}
    return null;
  });

  const [usersList, setUsersList] = useState([]); // online users from server
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const socketRef = useRef(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // connect to socket.io server
  useEffect(() => {
  const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("socket connected", socket.id);
      if (currentUser?.name) {
        socket.emit("register", { name: currentUser.name });
      }
    });

    socket.on("users", (list) => {
      setUsersList(list.filter(u => u.id !== socket.id));
    });

    socket.on("private_message", (msg) => {
      // msg: { to, content, from, timestamp, fromName, type }
      const peerId = msg.from === socket.id ? msg.to : msg.from;
      const messageBase = { senderId: msg.from, senderName: msg.fromName || 'User', timestamp: msg.timestamp || Date.now() };
      let message;
      if (msg.type === 'image') {
        message = { ...messageBase, type: 'image', content: msg.content };
      } else if (msg.type === 'audio') {
        message = { ...messageBase, type: 'audio', content: msg.content };
      } else {
        message = { ...messageBase, type: 'text', text: msg.content };
      }
      const chatId = peerId;
      setChats(prev => {
        const idx = prev.findIndex(c => c.id === chatId);
        let next;
        if (idx === -1) {
          const newChat = { id: chatId, title: msg.fromName || 'Chat', createdAt: Date.now(), messages: [message] };
          next = [newChat, ...prev];
        } else {
          next = prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, message] } : c);
        }
        try { localStorage.setItem("practice_chats", JSON.stringify(next)); } catch (e) {}
        return next;
      });
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist currentUser when it changes
  useEffect(() => {
    try { localStorage.setItem("practice_current_user", JSON.stringify(currentUser)); } catch (e) {}
    if (socketRef.current && socketRef.current.connected && currentUser?.name) {
      socketRef.current.emit("register", { name: currentUser.name });
    }
  }, [currentUser]);

  // keep activeChatId valid
  useEffect(() => {
    if (!activeChatId && chats[0]) setActiveChatId(chats[0].id);
  }, [chats, activeChatId]);

  // scroll to bottom when messages update
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [activeChatId, chats]);

  useEffect(() => { inputRef.current?.focus(); }, [activeChatId]);

  const handleRegister = (user) => {
    const socketId = socketRef.current?.id || null;
    const cu = { id: socketId, name: user.name, email: user.email };
    setCurrentUser(cu);
    setShowRegistration(false);
    // immediately register with server if socket connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("register", { name: user.name });
    }
  };

  const handleLogin = (user) => {
    // user: { id, name, email }
    const socketId = socketRef.current?.id || null;
    const cu = { id: socketId || user.id, name: user.name, email: user.email };
    setCurrentUser(cu);
    setShowLogin(false);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("register", { name: user.name });
    }
  };

  const handleLogout = () => {
    try { localStorage.removeItem('practice_current_user'); } catch (e) {}
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('logout');
    }
    setCurrentUser(null);
  };

  const startChatWith = (user) => {
    // user: { id, name }
    const chatId = user.id;
    const exists = chats.find(c => c.id === chatId);
    if (!exists) {
      const newChat = { id: chatId, title: user.name, createdAt: Date.now(), messages: [] };
      setChats(prev => { const next = [newChat, ...prev]; try { localStorage.setItem('practice_chats', JSON.stringify(next)); } catch(e) {} return next; });
    }
    setActiveChatId(chatId);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = () => {
    if (!input.trim() || !activeChatId || !currentUser) return;
    const to = activeChatId;
    const from = socketRef.current?.id || 'local';
    const fromName = currentUser.name || 'Me';
    const timestamp = Date.now();
    const content = input.trim();

    const message = { senderId: from, senderName: fromName, text: content, timestamp, type: 'text' };
    setChats(prev => {
      const next = prev.map(c => c.id === to ? { ...c, messages: [...c.messages, message] } : c);
      try { localStorage.setItem('practice_chats', JSON.stringify(next)); } catch(e) {}
      return next;
    });

    // only emit to socket when the recipient is an online socket peer
    if (activeIsSocket) {
      socketRef.current?.emit('private_message', { to, content, from, timestamp, fromName, type: 'text' });
    }

    setInput('');
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  // image upload support
  const fileInputRef = useRef(null);
  const handlePickImage = () => fileInputRef.current?.click();
  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !currentUser) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const to = activeChatId;
      const from = socketRef.current?.id || 'local';
      const fromName = currentUser.name || 'Me';
      const timestamp = Date.now();
      const message = { senderId: from, senderName: fromName, timestamp, type: 'image', content: dataUrl };
      setChats(prev => {
        const next = prev.map(c => c.id === to ? { ...c, messages: [...c.messages, message] } : c);
        try { localStorage.setItem('practice_chats', JSON.stringify(next)); } catch(e) {}
        return next;
      });
      socketRef.current?.emit('private_message', { to, content: dataUrl, from, timestamp, fromName, type: 'image' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // voice recording support
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Audio recording not supported.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data && ev.data.size) audioChunksRef.current.push(ev.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          const to = activeChatId;
          const from = socketRef.current?.id || 'local';
          const fromName = currentUser.name || 'Me';
          const timestamp = Date.now();
          const message = { senderId: from, senderName: fromName, timestamp, type: 'audio', content: dataUrl };
          setChats(prev => {
            const next = prev.map(c => c.id === to ? { ...c, messages: [...c.messages, message] } : c);
            try { localStorage.setItem('practice_chats', JSON.stringify(next)); } catch(e) {}
            return next;
          });
          socketRef.current?.emit('private_message', { to, content: dataUrl, from, timestamp, fromName, type: 'audio' });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error('record error', err);
      alert('Could not start audio recording.');
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
  };

  const handleNewChat = () => {
    const id = `chat-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newChat = { id, title: 'New chat', createdAt: Date.now(), messages: [] };
    setChats(prev => { const next = [newChat, ...prev]; try { localStorage.setItem('practice_chats', JSON.stringify(next)); } catch(e) {} return next; });
    setActiveChatId(id);
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeIsSocket = usersList.some(u => u.id === activeChatId);

  const getTitleForId = (id) => {
    if (!id) return '';
    const fromChats = chats.find(c => c.id === id);
    if (fromChats) return fromChats.title || fromChats.id;
    const fromUsers = usersList.find(u => u.id === id);
    if (fromUsers) return fromUsers.name || fromUsers.id;
    return id;
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">Chats</div>
        <div className="sidebar-actions">
          <button onClick={handleNewChat} className="new-chat">+ New chat</button>
          {!currentUser ? (
            <>
              <button onClick={() => setShowRegistration(s => !s)} className="register-btn">{showRegistration ? 'Close' : 'Register'}</button>
              <button onClick={() => setShowLogin(s => !s)} className="register-btn">{showLogin ? 'Close' : 'Login'}</button>
            </>
          ) : (
            <div style={{display:'flex',gap:8}}>
              <div style={{alignSelf:'center',color:'var(--muted)',fontSize:13}}>{currentUser.name}</div>
              <button onClick={handleLogout} className="register-btn">Logout</button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 6, marginBottom: 8, color: 'var(--muted)', fontSize: 12 }}>Online</div>
        <nav className="chat-list">
          {usersList.map(u => (
            <div key={u.id} className={`chat-list-item ${u.id === activeChatId ? 'active' : ''}`} onClick={() => startChatWith(u)}>
              <div className="chat-avatar">{u.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div className="chat-body">
                <div className="chat-title">{u.name}</div>
                <div className="chat-preview">Tap to chat</div>
              </div>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 14, marginBottom: 6, color: 'var(--muted)', fontSize: 12 }}>Conversations</div>
        <nav className="chat-list">
          {chats.map(c => (
            <div key={c.id} className={`chat-list-item ${c.id === activeChatId ? 'active' : ''}`} onClick={() => setActiveChatId(c.id)}>
              <div className="chat-avatar">{c.title?.charAt(0)?.toUpperCase() || 'C'}</div>
              <div className="chat-body">
                <div className="chat-title">{c.title || 'Chat'}</div>
                <div className="chat-preview">{c.messages[c.messages.length-1]?.text?.slice(0,40) || 'No messages yet'}</div>
              </div>
              <div className="chat-side">
                <div className="chat-time">{new Date(c.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
                <button className="delete-chat" onClick={(e) => { e.stopPropagation(); setChats(prev => { const next = prev.filter(x => x.id !== c.id); try { localStorage.setItem('practice_chats', JSON.stringify(next)); } catch(e) {}; if(activeChatId === c.id) setActiveChatId(next[0]?.id || null); return next; }); }}>✕</button>
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-area">
        <header className="main-header"><h2 className="title">Practice Chat</h2></header>
        <section className="main-body">
          {showRegistration ? (
            <Registration onRegister={handleRegister} onClose={() => setShowRegistration(false)} />
          ) : showLogin ? (
            <Login onLogin={handleLogin} onClose={() => setShowLogin(false)} />
          ) : (
            <div className="chat-box" ref={chatRef}>
              {activeChat ? (
                activeChat.messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.senderId === (socketRef.current?.id || 'local') ? 'user' : 'peer'}`}>
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>{msg.senderName}</div>
                    <div>
                      {msg.type === 'image' ? (
                        <img src={msg.content} alt="sent" className="message-image" />
                      ) : msg.type === 'audio' ? (
                        <audio controls src={msg.content} className="message-audio" />
                      ) : (
                        <div>{msg.text}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color:'var(--muted)' }}>Select a conversation or start a new one.</div>
              )}
            </div>
          )}
        </section>

        <footer className="main-footer">
          <div className="input-box">
            <div className="recipient-wrap">
              <label htmlFor="recipient" className="sr-only">Recipient</label>
              <select id="recipient" className="recipient-select" value={activeChatId || ''} onChange={e => setActiveChatId(e.target.value)}>
                <option value="" disabled>Choose recipient...</option>
                {usersList.map(u => (
                  <option key={`u-${u.id}`} value={u.id}>{u.name || `User ${u.id}`}</option>
                ))}
                {chats.map(c => (
                  <option key={`c-${c.id}`} value={c.id}>{c.title || `Chat ${c.id}`}</option>
                ))}
              </select>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageSelected} />
            <div className="input-controls">
              <button title="Upload image" className="media-btn" onClick={handlePickImage} disabled={!currentUser || !activeChatId || !activeIsSocket}>📷</button>
              <button title={isRecording ? 'Stop recording' : 'Record voice'} className={`media-btn record ${isRecording ? 'recording' : ''}`} onClick={() => { if (isRecording) stopRecording(); else startRecording(); }} disabled={!currentUser || !activeChatId || !activeIsSocket}>{isRecording ? '■' : '🎤'}</button>
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={!currentUser ? 'Register to start chatting' : (!activeChatId ? 'Select a conversation' : (activeIsSocket ? 'Type a message...' : 'Type a message (will be saved locally)'))}
              disabled={!currentUser || !activeChatId}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button onClick={handleSend} className="send-btn" disabled={!currentUser || !activeChatId}>Send</button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
 
