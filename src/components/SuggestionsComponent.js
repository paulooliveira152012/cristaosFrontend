import React from 'react'
import "../styles/components/general.css"
import "react-icons"
import { useNavigate } from 'react-router-dom'

 const SuggestionsComponent = () => {
  const navigate = useNavigate()
  return (
    <button 
      className='suggestionBlock'
      onClick={() => navigate('/suggestions')}
    >
      Sugestões - Interação direto com o desenvolvimento
    </button>
  )
}

export default SuggestionsComponent