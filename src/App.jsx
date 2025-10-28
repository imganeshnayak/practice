import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import Registration from "./Registration";
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
  const [showRegistration, setShowRegistration] = useState(false);

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
      // msg: { to, content, from, timestamp, fromName }
      const peerId = msg.from === socket.id ? msg.to : msg.from;
      const message = { senderId: msg.from, senderName: msg.fromName || 'User', text: msg.content, timestamp: msg.timestamp || Date.now() };
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

    const message = { senderId: from, senderName: fromName, text: content, timestamp };
    setChats(prev => {
      const next = prev.map(c => c.id === to ? { ...c, messages: [...c.messages, message] } : c);
      try { localStorage.setItem('practice_chats', JSON.stringify(next)); } catch(e) {}
      return next;
    });

    // emit to server
    socketRef.current?.emit('private_message', { to, content, from, timestamp, fromName });

    setInput('');
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleNewChat = () => {
    const id = `chat-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newChat = { id, title: 'New chat', createdAt: Date.now(), messages: [] };
    setChats(prev => { const next = [newChat, ...prev]; try { localStorage.setItem('practice_chats', JSON.stringify(next)); } catch(e) {} return next; });
    setActiveChatId(id);
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeIsSocket = usersList.some(u => u.id === activeChatId);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">Chats</div>
        <div className="sidebar-actions">
          <button onClick={handleNewChat} className="new-chat">+ New chat</button>
          <button onClick={() => setShowRegistration(s => !s)} className="register-btn">{showRegistration ? 'Close' : (currentUser?.name || 'Register')}</button>
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
          ) : (
            <div className="chat-box" ref={chatRef}>
              {activeChat ? (
                activeChat.messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.senderId === (socketRef.current?.id || 'local') ? 'user' : 'peer'}`}>
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>{msg.senderName}</div>
                    <div>{msg.text}</div>
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
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={!currentUser ? 'Register to start chatting' : (!activeChatId ? 'Select a conversation' : (activeIsSocket ? 'Type a message...' : 'Select an online user to message'))}
              disabled={!currentUser || !activeChatId || !activeIsSocket}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button onClick={handleSend} className="send-btn" disabled={!currentUser || !activeChatId || !activeIsSocket}>Send</button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
 
