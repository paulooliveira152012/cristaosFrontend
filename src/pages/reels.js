// reels page
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";



const Reels = () => {
  const [reels, setReels] = useState([]);
  const location = useLocation();

  useEffect(() => {
    // Fetch reels from the server
    const fetchReels = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/reels`);
        const data = await response.json();
        setReels(data);
      } catch (error) {
        console.error("Error fetching reels:", error);
      }
    };

    fetchReels();
  }, []);

  return (
    <div className="reels-container">
      <h1>Reels</h1>
      <div className="reels-list">
        {reels.map((reel) => (
          <div key={reel._id} className="reel-item">
            <Link to={`/reel/${reel._id}`}>
              <img src={reel.thumbnail} alt={reel.title} />
              <h2>{reel.title}</h2>
            </Link>
          </div>
        ))}
      </div>
      </div>
  );
}

export default Reels;