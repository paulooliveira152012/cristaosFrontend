// components/profile/TopActions.jsx
import FiMessageCircle from "../../assets/icons/FiMessageCircle";
import { FiMoreVertical } from "react-icons/fi";

export default function TopActions({ canChat, onChat, onToggleMore, showMore, MoreMenu }) {
  return (
    <div className="interactionButtons">
      {canChat && (
        <button className="chat-icon-button" onClick={onChat}>
          <FiMessageCircle size={20} />
        </button>
      )}
      <button className="more-icon-button" onClick={onToggleMore}>
        <FiMoreVertical size={20} className="more-icon-button" />
      </button>
      {showMore && MoreMenu}
    </div>
  );
}
