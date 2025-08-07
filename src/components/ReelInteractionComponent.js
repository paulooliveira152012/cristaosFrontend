import React from "react";
import "../styles/reels.css";

const ReelInteractionComponent = ({ toggleShowMessages }) => {
    

  return (
    <>
    <div className="ReelInteractionComponentWrapper">
      
        <ul>
          <li>like</li>
          <li onClick={toggleShowMessages}>comment</li>
          <li>share</li>
        </ul>

        <li>save</li>
    </div>

    
    </>
  );
};

export default ReelInteractionComponent;
