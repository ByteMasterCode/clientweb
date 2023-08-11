import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function App() {
  const [room, setRoom] = useState('default');
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [toUser, setToUser] = useState('');
  const [users, setUsers] = useState({});
  const [socketId, setSocketId] = useState('');
  const [menuVisible, setMenuVisible] = useState(true);
  const [profileVisible, setProfileVisible] = useState(false);
  const chatBoxRef = useRef(null);

  const getUsers = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'getUsers' }));
    }
  };

  const handleUserUpdate = (usersData) => {
    setUsers(usersData);
  };

  const handleUserClick = (userId) => {
    setToUser(userId);
  };

  useEffect(() => {
    const newSocket = new WebSocket('ws://143.198.224.206:8080');

    newSocket.onopen = () => {
      console.log('Connected to server');
      newSocket.send(JSON.stringify({ type: 'join', username }));
    };

    newSocket.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      console.log('Received message from server:', messageData);

      if (messageData.type === 'socketId') {
        setSocketId(messageData.socketId);
      } else if (messageData.type === 'users') {
        const { users, userId } = messageData;
        handleUserUpdate(users);
        setSocketId(userId);
      } else if (messageData.type === 'chat') {
        console.log(messageData.from);
        setMessages((prevMessages) => [...prevMessages, messageData]);

        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    };

    newSocket.onclose = () => {
      console.log('Disconnected from server');
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [room, username]);

  const sendMessage = () => {
    if (socket && message.trim() !== '' && toUser.trim() !== '') {
      const messageData = {
        type: 'chat',
        text: message,
        to: toUser,
        from: username,
      };
      socket.send(JSON.stringify(messageData));
      setMessage('');
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const toggleProfile = () => {
    setProfileVisible(!profileVisible);
  };

  const changeUsername = () => {
    if (newUsername.trim() !== '') {
      setUsername(newUsername);
      toggleProfile();
    }
  };

  return (
      <div className="container">
        <div className="header">Telegram-Style Chat</div>
        <div className="chat-wrapper">
          <div className={`user-list ${menuVisible ? '' : 'hidden'}`}>
            <h3>Users</h3>
            <ul>
              {Object.keys(users).map((userId) => (
                  <li
                      key={userId}
                      onClick={() => handleUserClick(userId)}
                      className={toUser === userId ? 'selected' : ''}
                  >
                    {users[userId]}
                  </li>
              ))}
            </ul>
            <button className="refresh-button" onClick={getUsers}>
              Refresh Users
            </button>
          </div>
          <div className="chat">
            <div className="messages" ref={chatBoxRef}>
              {messages.map((msg, index) => (
                  <div
                      key={index}
                      className={`message ${msg.from === socketId ? 'own' : 'other'}`}
                  >
                    <div className={`message-content ${msg.text.startsWith('```') ?'dark' : ''} `}>
                      {msg.text.startsWith('```') ? (
                          <SyntaxHighlighter language="html" style={atomDark}>
                            {msg.text.slice(3, -3)}
                          </SyntaxHighlighter>
                      ) : (
                          <div className="message-text">{msg.text}</div>
                      )}
                      <div className="message-sender">
                        {msg.from === socketId ? 'You' : users[msg.from]}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
            <div className="input-box">
              <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
          <div className={`profile ${profileVisible ? 'visible' : ''}`}>
            <h3>Your Profile</h3>
            <div className="profile-details">
              <p>Username: {username}</p>
              <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username..."
              />
              <button onClick={changeUsername}>Change Username</button>
              <button onClick={toggleProfile}>Close</button>
            </div>
          </div>
        </div>
        <button className="toggle-menu-button" onClick={toggleMenu}>
          {menuVisible ? 'Hide Users' : 'Show Users'}
        </button>
        <button className="profile-button" onClick={toggleProfile}>
          Your Profile
        </button>
      </div>
  );
}

export default App;
