 {openLeaderMenuId === listing._id && (
                      <div
                        className="modal"
                        onClick={() => {
                          setLeaderMenuLevel("1");
                          setOpenLeaderMenuId(false);
                        }}
                      >
                        <div
                          className="modal-content"
                          onClick={(e) => e.stopPropagation()} // 👈 impede o clique no fundo
                        >
                          {/* ======= nivel 1 -> deletar ou dar strike ======== */}
                          {leaderMenuLevel === "1" && (
                            <ul>
                              <li>
                                <button
                                  onClick={() =>
                                    handleDeleteListing(listing._id)
                                  }
                                >
                                  delete
                                </button>
                              </li>
                              <li>
                                <button
                                  // onClick={() =>
                                  //   strike({ listingId: listing._id, userId })
                                  // }

                                  onClick={() =>
                                    // handleStrike({
                                    //   listingId: listing._id,
                                    //   userId,
                                    // })
                                    setLeaderMenuLevel("2")
                                  }
                                >
                                  Strike
                                </button>
                              </li>
                            </ul>
                          )}

                          {/* ======= nivel 2 -> dar strike ======== */}
                          {leaderMenuLevel === "2" && (
                            // dar opcao para lider escrever a razao do strike
                            <>
                              <p>Dando um strike...</p>

                              <textarea
                                className="strikeTextArea"
                                onChange={(e) =>
                                  setStrikeReason(e.target.value)
                                }
                              />

                              <button
                                onClick={() =>
                                  handleStrike({
                                    listingId: listing._id,
                                    userId,
                                    strikeReason,
                                  })
                                }
                              >
                                submeter strike
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}