// PrivateMessageSettings.js
const PrivateMessageSettings = ({ onClose, onLeave }) => {
  return (
    <div className="privateMessageSettings">
      <div className="leaveDMContainer" >
        <span onClick={onClose}>
        X
        </span>
      </div>
      <ul>
        <li onClick={onLeave}>Deletar conversa</li>{" "}
        {/* <-- não precisa passar nada aqui */}
      </ul>
    </div>
  );
};

export default PrivateMessageSettings;
