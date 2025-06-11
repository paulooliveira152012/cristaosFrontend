import React, { createContext, useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [agoraClient, setAgoraClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isInCall, setIsInCall] = useState(false); // Whether the user is in a call
  const [micState, setMicState] = useState(false); // Global microphone state

  // Agora configuration
  const APP_ID = "22d2fe11bf654e1a8f4c3c7d8d6d4c98"; // Replace with your Agora App ID
  // 22d2fe11bf654e1a8f4c3c7d8d6d4c98 Cristaos account
  // f0566be1e8b04ecfa4099ed9f54ff0d9 paulo account
  const TOKEN = null; // Replace with your generated token (if required)

  // Initialize Agora client when the component mounts
  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setAgoraClient(client);

    // Handle remote user publishing their audio
    client.on("user-published", async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.subscribe(user, mediaType);
        const remoteAudioTrack = user.audioTrack;
        remoteAudioTrack.play();
        setRemoteUsers((prev) => [...prev, user]);
      }
    });

    // Handle remote user unpublishing their audio
    client.on("user-unpublished", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    return () => {
      client.removeAllListeners();
      client.leave(); // Ensure the client leaves the channel on cleanup
    };
  }, []);

  const joinChannel = async (channel, userId) => {
    if (!agoraClient || isInCall) {
      console.warn("Client is already in call or not initialized.");
      return;
    }
    try {
      console.log("Joining Agora channel...");
      await agoraClient.join(APP_ID, channel, TOKEN, userId);
      setIsInCall(true); // Set isInCall to true after successfully joining
      console.log("Joined Agora channel successfully.");
    } catch (error) {
      console.error("Error joining Agora channel:", error);
    }
  };

  const leaveChannel = async () => {
    if (!agoraClient || !isInCall) return;
    try {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      await agoraClient.leave();
      setIsInCall(false); // Set isInCall to false after leaving
      setRemoteUsers([]);
    } catch (error) {
      console.error("Error leaving Agora channel:", error);
    }
  };

  const toggleMicrophone = async (micOn) => {
    if (!agoraClient || agoraClient.connectionState !== "CONNECTED") {
      console.warn("Agora client is not connected. Cannot toggle microphone.");
      return;
    }

    try {
      if (micOn && !localAudioTrack) {
        // Create and publish the microphone track if it doesn't exist
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);
        await agoraClient.publish([audioTrack]);
        console.log("Microphone is now on");
      } else if (micOn && localAudioTrack) {
        // If already created, just enable it
        await localAudioTrack.setEnabled(true);
        console.log("Microphone is unmuted");
      } else if (!micOn && localAudioTrack) {
        // If the microphone is off, disable the track
        await localAudioTrack.setEnabled(false);
        console.log("Microphone is muted");
      }
      setMicState(micOn); // Update microphone state in context
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        joinChannel,
        leaveChannel,
        toggleMicrophone,
        remoteUsers,
        isInCall,
        agoraClient,
        micState,
        setMicState,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export default AudioContext;





