import React, { createContext, useState, useContext } from 'react';

// Create the context
const RoomContext = createContext();

// Custom hook to use the RoomContext
export const useRoom = () => useContext(RoomContext);

// RoomProvider component to wrap around the app
export const RoomProvider = ({ children }) => {
  const [minimizedRoom, setMinimizedRoom] = useState(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false); // Track if user has joined before
  const [micOpen, setMicOpen] = useState(false); // Track the microphone state

  // Function to minimize a room
  const minimizeRoom = (room, microphoneOn) => {
    if (!room) {
      console.warn("Cannot minimize a room. Room data is missing.");
      return;
    }

    // Check if the room is a valid object before trying to spread it
    if (typeof room === 'object') {
      setMinimizedRoom({ ...room, microphoneOn }); // Store room and mic state
      setMicOpen(microphoneOn); // Store the mic state in context
      console.log(`Room "${room.roomTitle}" has been minimized with microphone state: ${microphoneOn}`);
    } else {
      console.error("Room data is not a valid object:", room);
    }
  };

  // Function to clear the minimized room
  const clearMinimizedRoom = () => {
    if (!minimizedRoom) {
      console.warn("No minimized room to clear.");
      return;
    }

    console.log(`Minimized room "${minimizedRoom.roomTitle}" has been cleared.`);
    setMinimizedRoom(null); // Clear the minimized room
    setMicOpen(false); // Reset mic state
  };

  // Function to leave a room and clear minimized state
  const leaveRoom = () => {
    if (!minimizedRoom) {
      console.warn("No minimized room to leave.");
      return;
    }

    clearMinimizedRoom(); // Call clearMinimizedRoom to reset the state
    console.log("Left the room and cleared minimized state.");
    setHasJoinedBefore(false); // Reset the joined state when the room is left
  };

  // Function to handle rejoining a room
  const joinRoom = (room) => {
    if (!room) {
      console.warn("Cannot join a room. Room data is missing.");
      return;
    }

    if (!hasJoinedBefore) {
      console.log("First time joining the room, microphone will be off.");
      setMicOpen(false); // Turn off mic for the first-time join
      setHasJoinedBefore(true); // Mark as joined for future reentries
    } else {
      console.log("Rejoining the room, preserving microphone state:", micOpen);
    }

    // Store the room data for rejoining
    setMinimizedRoom(room);
  };

  return (
    <RoomContext.Provider value={{ 
      minimizedRoom, 
      micOpen, 
      hasJoinedBefore, 
      minimizeRoom, 
      clearMinimizedRoom, 
      leaveRoom, 
      joinRoom 
    }}>
      {children}
    </RoomContext.Provider>
  );
};
