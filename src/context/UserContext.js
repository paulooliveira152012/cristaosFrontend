import { createContext, useContext, useState, useEffect } from 'react';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';

const UserContext = createContext();
const UsersContext = createContext();

export const useUser = () => useContext(UserContext);
export const useUsers = () => useContext(UsersContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pendingLoginUser, setPendingLoginUser] = useState(null); // 🆕
  const navigate = useNavigate();

  const emitLogin = (user) => {
    if (!user) return;
    socket.emit('userLoggedIn', {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage || 'https://via.placeholder.com/50',
    });
    console.log("📡 Emitindo login para socket:", user.username);
  };

  useEffect(() => {
    // Tenta restaurar usuário ao carregar
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      if (socket.connected) {
        emitLogin(user);
      } else {
        setPendingLoginUser(user); // salva pra emitir quando conectar
        socket.connect();
      }
    }

    // Quando socket conectar, se tiver login pendente, emite
    socket.on('connect', () => {
      if (pendingLoginUser) {
        emitLogin(pendingLoginUser);
        setPendingLoginUser(null); // limpa
      }
    });

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on('onlineUsers', handleOnlineUsers);

    return () => {
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('connect');
    };
  }, [pendingLoginUser]);

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    if (socket.connected) {
      emitLogin(user);
    } else {
      setPendingLoginUser(user);
      socket.connect();
    }
  };

  const logout = () => {
    if (currentUser) {
      socket.emit('userLoggedOut', {
        _id: currentUser._id,
        username: currentUser.username,
      }, () => {
        socket.disconnect();
        navigate('/');
      });
    } else {
      socket.disconnect();
      navigate('/');
    }

    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ currentUser, login, logout }}>
      <UsersContext.Provider value={{ onlineUsers }}>
        {children}
      </UsersContext.Provider>
    </UserContext.Provider>
  );
};
