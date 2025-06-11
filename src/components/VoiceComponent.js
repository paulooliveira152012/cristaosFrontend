import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AudioContext from "../context/AudioContext";
import { useRoom } from "../context/RoomContext";

const VoiceComponent = ({ microphoneOn, isMinimized }) => {
  const { roomId } = useParams();
  const { currentUser } = useUser();
  const { minimizedRoom } = useRoom();
  const {
    joinChannel,
    leaveChannel,
    toggleMicrophone,
    remoteUsers,
    isInCall,
    agoraClient,
    micState, // Get microphone state from AudioContext
  } = useContext(AudioContext);
  const [localError, setLocalError] = useState("");

  // Automatically join the voice channel when the user enters the room
  useEffect(() => {
    if (!currentUser || !roomId || isInCall) return;

    const joinVoiceChannel = async () => {
      try {
        console.log("Joining voice channel for room:", roomId);
        await joinChannel(roomId, currentUser._id); // Join the voice channel
        setLocalError(""); // Clear any errors on success
      } catch (err) {
        console.error("Error joining Agora channel:", err);
        setLocalError("Error joining voice chat. Please try again.");
      }
    };

    if (!isMinimized && !isInCall) {
      // If room is not minimized and not already in a call, join the voice channel
      joinVoiceChannel();
    }
  }, [isMinimized, roomId, currentUser, isInCall, joinChannel]);

  // Toggle the microphone based on the context state
  useEffect(() => {
    const toggleMic = async () => {
      if (!agoraClient || agoraClient.connectionState !== "CONNECTED") {
        console.warn("Agora client is not connected. Skipping microphone toggle.");
        return;
      }

      try {
        // Only toggle if microphone state in context changes (explicitly by user)
        await toggleMicrophone(micState);
      } catch (err) {
        console.error("Error toggling microphone:", err);
        setLocalError("Error with microphone. Please try again.");
      }
    };

    // Toggle microphone based on micState when changed
    toggleMic();
  }, [micState, agoraClient, toggleMicrophone]);

  return (
    <div id="container">
      {/* Display errors if any */}
      {localError && <div>{localError}</div>}

      {/* Show remote users in the room */}
      {remoteUsers.length > 0 && (
        <div>
          <h4>Remote Users in the Room:</h4>
          {remoteUsers.map((user) => (
            <div key={user.uid}>User {user.uid} is speaking</div>
          ))}
        </div>
      )}

      {/* Indicate if the user is not in a call */}
      {!isInCall && <p>Not in a call</p>}
    </div>
  );
};

export default VoiceComponent;
