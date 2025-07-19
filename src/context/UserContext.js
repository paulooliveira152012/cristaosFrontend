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
  const [pendingLoginUser, setPendingLoginUser] = useState(null);
  const navigate = useNavigate();

  // verificar se o usuario ainda existe no backend
  const validateUserExists = async (userId) => {
  try {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}`, {
      credentials: 'include',
    });

    if (res.status === 404 || res.status === 401) {
      console.warn("🚨 Usuário não existe mais. Fazendo logout...");
      logout(); // força o logout se não encontrado
    }
  } catch (error) {
    console.error("Erro ao validar usuário:", error);
    logout(); // fallback: se erro de rede, desloga também
  }
};


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
    // Restaurar usuário ao carregar
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      validateUserExists(user._id)

      if (socket.connected) {
        emitLogin(user);
      } else {
        setPendingLoginUser(user);
        socket.connect();
      }
    }

    // Emitir login pendente após reconexão
    socket.on('connect', () => {
      if (pendingLoginUser) {
        emitLogin(pendingLoginUser);
        setPendingLoginUser(null);
      }
    });

    // Atualiza lista de usuários online
    const handleOnlineUsers = (users) => {
      console.log("📶 Lista de online atualizada:", users);
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
    const userId = currentUser._id;

    // 1. Emite logout para backend
    socket.emit('userLoggedOut', {
      _id: userId,
      username: currentUser.username,
    });

    // 2. Remove currentUser imediatamente
    setCurrentUser(null);
    localStorage.removeItem('user');

    // 3. Escuta uma única atualização de onlineUsers antes de desconectar
    const handleUpdatedOnlineUsers = (users) => {
      console.log("✅ Lista de online recebida após logout:", users);
      setOnlineUsers(users.filter(u => u._id !== userId));


      console.log("✅✅✅ onlineUsers after logout:", onlineUsers)

      socket.off('onlineUsers', handleUpdatedOnlineUsers); // limpa listener

      // 4. Agora pode desconectar e navegar
      socket.disconnect();
      navigate('/');
    };

    socket.once('onlineUsers', handleUpdatedOnlineUsers);

    // ⏱ Segurança: se em 1s não receber, segue com o fluxo
    setTimeout(() => {
      socket.off('onlineUsers', handleUpdatedOnlineUsers);
      navigate('/');
    }, 1000);
  } else {
    socket.disconnect();
    navigate('/');
  }
};


  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
      <UsersContext.Provider value={{ onlineUsers }}>
        {children}
      </UsersContext.Provider>
    </UserContext.Provider>
  );
};
