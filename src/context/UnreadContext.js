import React, {createContext, useContext, useMemo, useState, useCallback} from "react";
const MAIN_ROOM_ID = "mainChatRoom";

const Ctx = createContext(null);
export const UnreadProvider = ({ children }) => {
  const [counts, setCounts] = useState({}); // { [id]: number }

  const increment = useCallback((id, by=1) => {
    if (!id) return;
    setCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id]||0)+by) }));
  }, []);
  const reset = useCallback((id) => {
    if (!id) return;
    setCounts(prev => (prev[id] ? { ...prev, [id]: 0 } : prev));
  }, []);
  const setMany = useCallback((entries) => {
    setCounts(prev => {
      const next = { ...prev };
      for (const [id, n] of entries) next[id] = Math.max(0, n||0);
      return next;
    });
  }, []);

  const total = useMemo(() => Object.values(counts).reduce((a,b)=>a+(b||0),0), [counts]);
  const value = useMemo(() => ({ counts, total, increment, reset, setMany, MAIN_ROOM_ID }), [counts, total, increment, reset, setMany]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
export const useUnread = () => useContext(Ctx);
