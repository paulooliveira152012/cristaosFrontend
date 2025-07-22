// src/components/SupportUs.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/supportUs.css'; // ⬅️ Importa o CSS externo

const SupportUs = () => {
  return (
    <div className="supportUsContainer">
      <Link to="/donate" className="shinyButton">
        Apoie-nos
      </Link>
    </div>
  );
};

export default SupportUs;
