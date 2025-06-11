import { createContext, useContext, useState, useEffect } from 'react';
import socket from '../socket'; // Assuming you have a socket instance set up
import { useNavigate } from 'react-router-dom'; // Import navigate

const UserContext = createContext();
const UsersContext = createContext(); // Create a new context for online users

export const useUser = () => useContext(UserContext);
export const useUsers = () => useContext(UsersContext); // Hook to access online users

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // State to manage online users
  const navigate = useNavigate(); // Use navigate

  // Function to handle user login and socket emission
  const handleLogin = (user) => {
    socket.emit('userLoggedIn', {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage || 'https://via.placeholder.com/50',
    });
  };

  // Function to handle user logout and socket emission
  const handleLogout = (user) => {
    socket.emit('userLoggedOut', {
      _id: user._id,
      username: user.username,
    });
  };

  // Check localStorage for user data when the app loads
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user); // Restore user from localStorage

      // Ensure the socket is connected, then emit the login event
      socket.on('connect', () => {
        handleLogin(user); // Emit userLoggedIn only after socket is connected
      });
    }

  
  // Set up Socket.IO listeners for online users
  socket.on('onlineUsers', (users) => {
    setOnlineUsers(users); // Update the online users state when received from the server
  });


   // Handle disconnect (e.g., page refresh)
   socket.on('disconnect', () => {
    if (currentUser) {
      handleLogout(currentUser); // Ensure user is logged out properly
    }
  });

  return () => {
    socket.off('onlineUsers'); // Clean up the event listener on unmount
    socket.off('disconnect'); // Clean up disconnect listener
  };
}, []);

  const login = (user) => {
    setCurrentUser(user); // Set user in state
    localStorage.setItem('user', JSON.stringify(user)); // Save user to localStorage

    // Emit the login event to the server when the user logs in
    socket.connect(); // Ensure socket is connected
    handleLogin(user); // Emit userLoggedIn after connection
  };

  const logout = () => {
    // Ensure the user is logged out from the server before disconnecting
    if (currentUser) {
      // socket.emit('userLoggedOut', { _id: currentUser._id }); // Emit userLoggedOut event
      // Call handleLogout to emit the userLoggedOut event
      handleLogout(currentUser);  
    }
  
    // Clear user from state and localStorage
    setCurrentUser(null);
    localStorage.removeItem('user');
  
    // Delay disconnect to ensure the server processes the logout event
    setTimeout(() => {
      socket.disconnect(); // Disconnect the socket after logging out
    }, 500);
  
    // Navigate to the landing page
    navigate('/');
  
    // No need for page reload if everything works fine
    // window.location.reload(); // Optional, but not recommended
  };
  

  return (
    <UserContext.Provider value={{ currentUser, login, logout }}>
      <UsersContext.Provider value={{ onlineUsers }}>
        {children}
      </UsersContext.Provider>
    </UserContext.Provider>
  );
};
