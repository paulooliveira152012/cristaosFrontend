// hooks/useGoBack.js
import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function useGoBack(defaultFallback = "/") {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (options = {}) => {
      const { fallbackPath = defaultFallback, beforeBack, onBack } = options;

      if (onBack) {
        onBack(); // sobrescreve tudo se for passado
        return;
      }

      if (beforeBack) {
        beforeBack(); // faz limpeza (socket, etc.)
      }

      if (location.key !== "default") {
        navigate(-1); // volta uma tela
      } else {
        navigate(fallbackPath); // sem histórico → vai pro fallback
      }
    },
    [navigate, location.key, defaultFallback]
  );
}
