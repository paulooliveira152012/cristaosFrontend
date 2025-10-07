// src/context/functions.js/audioContextFunctions.js

// joinChannel: cria/usa um client e entra no canal
export async function joinChannelFn({
  clientRef,           // useRef do client do Agora
  AgoraRTC,            // lib importada (window.AgoraRTC ou import)
  appId,               // process.env.REACT_APP_AGORA_APP_ID
  token,               // token (pode ser null se o canal for sem token)
  channel,             // roomId
  uid,                 // currentUser._id
  setIsInCall,         // setter do estado no AudioContext
}) {
  if (!clientRef) throw new Error("clientRef ausente");
  if (!AgoraRTC) throw new Error("AgoraRTC ausente");
  if (!appId) throw new Error("appId ausente");
  if (!channel) throw new Error("channel ausente");
  if (!uid) throw new Error("uid ausente");

  // cria client uma única vez
  if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  }

  const client = clientRef.current;

  // já está dentro?
  if (client._joined) return;

  await client.join(appId, channel, token ?? null, uid);
  client._joined = true;

  // microfone local (opcional – se quiser já criar)
  // const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
  // await client.publish([micTrack]);

  setIsInCall?.(true);
  return { ok: true };
}

// leaveChannel: sai e limpa
export async function leaveChannelFn({
  clientRef,
  setIsInCall,
}) {
  const client = clientRef?.current;
  if (!client) return { ok: true };

  try {
    const localTracks = client.localTracks || [];
    await Promise.all(localTracks.map((t) => {
      try { t.stop(); } catch {}
      try { t.close(); } catch {}
    }));
    await client.leave();
    client._joined = false;
  } finally {
    setIsInCall?.(false);
  }

  return { ok: true };
}
