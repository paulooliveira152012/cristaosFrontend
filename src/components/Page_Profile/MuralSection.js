// components/profile/MuralSection.jsx
import React, { useState } from "react";

export default function MuralSection({
  canPost,              // boolean (currentUser && currentUser._id !== user._id)
  onPost,               // (text) => Promise|void
  messages = [],        // array [{ _id, sender: { username, profileImage }, text }]
  imagePlaceholder,     // fallback p/ avatar
}) {
  const [text, setText] = useState("");

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    await onPost(t);
    setText("");
  };

  return (
    <div className="mural-section">
      {canPost && (
        <div className="mural-input">
          <textarea
            placeholder="Deixe uma mensagem no mural..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          <button onClick={submit}>Enviar</button>
        </div>
      )}

      <div className="mural-messages">
        {messages.length === 0 ? (
          <p>Este mural ainda não tem mensagens.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="mural-message">
              <div className="sender-info">
                <img
                  src={msg.sender?.profileImage || imagePlaceholder}
                  alt="sender"
                  style={{ width: 30, height: 30, borderRadius: "50%" }}
                />
                <strong style={{ marginLeft: 8 }}>
                  {msg.sender?.username}
                </strong>
              </div>
              <p style={{ marginLeft: 38 }}>{msg.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
