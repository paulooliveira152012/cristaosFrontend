
const baseUrl = process.env.REACT_APP_API_BASE_URL

// Function to update room title using fetch
export const updateRoomTitle = async (roomId, newTitle, setRoomTitle) => {
  console.log("roomId:", roomId);
  console.log("newTitle:", newTitle);

  try {
    const response = await fetch(`${baseUrl}/api/rooms/update/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newTitle }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to update room title. Status: ${response.status}`
      );
    }

    const data = await response.json();
    setRoomTitle(data.room.roomTitle); // Update the room title locally
    console.log("Room title updated successfully:", data.room.roomTitle);
  } catch (error) {
    console.error("Error updating room title:", error.message || error);
  }
};

// Function to delete a room using fetch
// Function to delete a room using fetch
export const deleteRoom = async (roomId, navigate) => {
  try {
    const response = await fetch(`${baseUrl}/api/rooms/delete/${roomId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete room. Status: ${response.status}`);
    }

    console.log("Room deleted successfully");
    navigate("/"); // Navigate to the landing page after deletion
  } catch (error) {
    console.error("Error deleting room:", error.message || error);
  }
};

export const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302", // Google's public STUN server
    },
  ],
};

// Function to visualize microphone volume
export const visualizeVolume = (analyser) => {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    analyser.getByteFrequencyData(dataArray);

    // Calculate the average volume
    let values = 0;
    for (let i = 0; i < bufferLength; i++) {
      values += dataArray[i];
    }
    const averageVolume = values / bufferLength;

    // Update the visual feedback based on the average volume
    // For example, changing the height of a div or any other visual indication
    const volumeIndicator = document.getElementById("volume-indicator");
    if (volumeIndicator) {
      volumeIndicator.style.height = `${averageVolume}px`; // Scale it as needed
    }

    // Schedule the next frame
    requestAnimationFrame(draw);
  };

  draw(); // Start the drawing loop
};

let peerConnection = null; // Declare peerConnection at the top of the file

export const getPeerConnection = () => peerConnection; // Function to return peer connection if needed

// Initialize WebRTC connection
// Initialize WebRTC connection
export const initializePeerConnection = (socket, roomId, config) => {
  try {
    const peerConnection = new RTCPeerConnection(config);

    // Handle ICE candidates and emit them to the signaling server
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    // Handle receiving remote tracks (e.g., audio)
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const audioElement = document.getElementById("remote-audio");

      // Ensure the audio element exists and assign the remote stream
      if (audioElement) {
        audioElement.srcObject = remoteStream;
      } else {
        console.error("Audio element not found to play the remote stream.");
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "disconnected") {
        console.log("Peer connection disconnected");
      } else if (peerConnection.connectionState === "failed") {
        console.error("Peer connection failed");
      } else if (peerConnection.connectionState === "connected") {
        console.log("Peer connection established");
      }
    };

    // Return the initialized peer connection
    return peerConnection;
  } catch (error) {
    console.error("Error initializing peer connection:", error);
    return null; // Return null if peer connection initialization fails
  }
};

// Request microphone access
export const requestMicrophoneAccess = async (setStream, visualizeVolume) => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    if (setStream) {
      setStream(mediaStream); // Store the microphone stream
    }
    console.log("Microphone access granted");

    // Implement visual feedback for microphone volume
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    visualizeVolume(analyser); // Call the visualizeVolume function

    return mediaStream;
  } catch (err) {
    console.error("Error accessing microphone: ", err);
    alert("Microphone access is required to join the voice chat.");
    return null;
  }
};

// Start voice chat and initialize WebRTC connection
export const startVoiceChat = async (
  setIsInVoiceChat,
  initializePeerConnection,
  requestMicrophoneAccess,
  peerConnection,
  setPeerConnection,
  audioSender,
  setAudioSender,
  socket,
  roomId,
  setStream // Ensure setStream is passed here
) => {
  setIsInVoiceChat(true);

  // Initialize or reset the peer connection
  if (!peerConnection || peerConnection.connectionState === "closed") {
    peerConnection = initializePeerConnection(socket, roomId, config); // Initialize the peer connection here
    setPeerConnection(peerConnection); // Update the peer connection state
  }

  // Request microphone access
  const mediaStream = await requestMicrophoneAccess(setStream, visualizeVolume); // Ensure setStream is passed
  if (mediaStream) {
    const audioTrack = mediaStream.getAudioTracks()[0]; // Get the audio track

    // Check if an audio sender is already set
    if (!audioSender) {
      // Add the audio track to the peer connection and store the sender
      const newAudioSender = peerConnection.addTrack(audioTrack, mediaStream);
      setAudioSender(newAudioSender); // Store the audio sender
    } else {
      // Replace the existing audio sender's track with the new one
      console.log("Replacing the existing audio track with the new one.");
      if (audioSender.track !== audioTrack) {
        audioSender.replaceTrack(audioTrack);
      }
    }
  }

  // Create and send WebRTC offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("webrtc-offer", { roomId, offer }); // Send the offer to the server
  socket.emit("startVoiceChat", { roomId }); // Notify the server that the voice chat has started
};
