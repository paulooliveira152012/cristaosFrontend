import React from "react";
import "../styles/reels.css";

const ReelInteractionComponent = ({ onOpen }) => {
  return (
    <div className="ReelInteractionComponentWrapper">
      <ul>
        <li>like</li>
        <li onClick={onOpen}>comment</li>
        <li>share</li>
      </ul>
      <li>save</li>
    </div>
  );
};

export default ReelInteractionComponent;
