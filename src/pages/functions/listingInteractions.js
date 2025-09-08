

export const handleVote = async (
    listingId, 
    optionIndex,
    currentUser,
    baseURL,
    setItems,
    setVotedPolls,
    
) => {

    if (!currentUser) {
      alert("Você precisa estar logado para votar.");
      return;
    }

    try {
      const res = await fetch(`${baseURL}/api/listings/${listingId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: currentUser._id,
          optionIndex,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Erro ao votar.");

      // Atualiza o estado local com o novo resultado da enquete
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId ? { ...item, poll: data.updatedPoll } : item
        )
      );

      // Marca que o usuário votou
      setVotedPolls((prev) => ({
        ...prev,
        [listingId]: optionIndex,
      }));
    } catch (err) {
      console.error("Erro ao votar:", err);
      alert(err.message || "Erro ao votar");
    }
  };