import "../styles/newlisting.css";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import Header from "../components/Header";
import { uploadImageToS3 } from "../utils/s3Upload"; // mantém sua função
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { uploadReelToBackend } from "./functions/newListingFunctions"; // (se não usar diretamente, pode remover)
import { convertToMp4 } from "../utils/convertToMp4";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const NewListing = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [listingType, setListingType] = useState("blog");

  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [image, setImage] = useState(null);

  // Reel
  const [reelVideo, setReelVideo] = useState(null);
  const [reelDescription, setReelDescription] = useState("");
  const [reelTags, setReelTags] = useState("");
  const [reelError, setReelError] = useState(null);
  const [reelThumbnail, setReelThumbnail] = useState(null);

  // Link
  const [link, setLink] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  // Poll
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Tags gerais
  const [tags, setTags] = useState("");

  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // chips visuais (mantém envio como string para o backend)
  const tagChips = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tags]
  );

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const addPollOption = () => setPollOptions((prev) => [...prev, ""]);

  const handlePollOptionChange = (index, value) => {
    setPollOptions((opts) => {
      const next = [...opts];
      next[index] = value;
      return next;
    });
  };

  const onDropFile = (e, setter) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) setter(file);
  };

  const isYouTubeLink = (url) =>
    url.includes("youtube.com/watch") || url.includes("youtu.be/");

  const getYouTubeVideoId = (url) => {
    const youtubeRegex = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&#?\n]+)/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  const resetForm = () => {
    setBlogTitle("");
    setBlogContent("");
    setImage(null);
    setLink("");
    setLinkDescription("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setTags("");
    setReelVideo(null);
    setReelDescription("");
    setReelThumbnail(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validação
    if (listingType === "blog" && !blogContent.trim()) {
      setIsLoading(false);
      return setError("Please provide blog content.");
    }
    if (listingType === "image" && !image) {
      setIsLoading(false);
      return setError("Please select an image.");
    }
    if (listingType === "link" && !link.trim()) {
      setIsLoading(false);
      return setError("Please provide a valid link.");
    }
    if (
      listingType === "poll" &&
      (!pollQuestion.trim() || pollOptions.every((o) => !o.trim()))
    ) {
      setIsLoading(false);
      return setError("Please provide a poll question and at least one option.");
    }
    if (listingType === "reel" && (!reelVideo || !reelDescription.trim())) {
      setIsLoading(false);
      return setError("Por favor, envie vídeo, descrição e thumbnail para o reel.");
    }

    try {
      if (listingType === "reel") {
        let finalVideo = reelVideo;
        if (reelVideo.type !== "video/mp4") {
          finalVideo = await convertToMp4(reelVideo);
        }

        const formData = new FormData();
        formData.append("video", finalVideo);
        if (reelThumbnail) formData.append("thumbnail", reelThumbnail);
        formData.append("description", reelDescription);
        formData.append("userId", currentUser._id);

        const uploadRes = await fetch(`${baseUrl}/api/reels/upload-reel`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          setIsLoading(false);
          return setError(errorData.message || "Erro ao fazer upload do reel.");
        }

        setIsLoading(false);
        navigate("/");
        return;
      }

      // Outros tipos
      let imageUrl = null;
      if (listingType === "image" && image) {
        imageUrl = await uploadImageToS3(image);
      }

      const listingData = {
        userId: currentUser._id,
        type: listingType,
        blogTitle,
        blogContent,
        imageUrl,
        link,
        linkDescription,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      if (listingType === "poll") {
        listingData.poll = {
          question: pollQuestion,
          options: pollOptions.filter((o) => o.trim()),
        };
      }

      const response = await fetch(`${baseUrl}/api/listings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listingData),
      });

      const data = await response.json();

      if (response.ok) {
        resetForm();
        setIsLoading(false);
        navigate("/");
      } else {
        setIsLoading(false);
        setError(data.message || "Erro ao criar publicação.");
      }
    } catch (err) {
      console.error("Erro ao criar publicação:", err);
      setIsLoading(false);
      setError("Algo deu errado. Tente novamente.");
    }
  };

  return (
    <div className="screenWrapper" style={{ marginBottom: 60 }}>
      <AnimatePresence>
        {isLoading && (
          <div className="modal modern-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              className="modern-card modern-loading"
            >
              <motion.div
                className="spinnerRing"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <p>Publicando…</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="scrollable">
        <Header showProfileImage={false} navigate={navigate} />

        <div className="create-wrapper">
          <div className="create-header">
            <h2>Criar nova postagem</h2>
            <div className="segmented">
              {[
                { v: "blog", label: "Blog" },
                { v: "image", label: "Imagem" },
                { v: "link", label: "Link" },
                { v: "poll", label: "Enquete" },
                { v: "reel", label: "Reel" },
              ].map((opt, idx) => (
                <button
                  key={opt.v}
                  type="button"
                  className={`segmented-item ${listingType === opt.v ? "active" : ""}`}
                  onClick={() => setListingType(opt.v)}
                  style={{ width: `${100 / 5}%` }}
                >
                  {opt.label}
                </button>
              ))}
              <motion.span
                className="segmented-thumb"
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  width: `${100 / 5}%`,
                  left: `${["blog", "image", "link", "poll", "reel"].indexOf(listingType) * (100 / 5)}%`,
                }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="modern-card create-card">
            {/* BLOG */}
            {listingType === "blog" && (
              <div className="form-grid">
                <div className="field">
                  <label>Título</label>
                  <input
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="Um título que chame atenção…"
                    className="input"
                  />
                </div>

                <div className="field">
                  <label>Conteúdo</label>
                  <textarea
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="Escreva seu texto aqui…"
                    rows={8}
                    className="textarea"
                  />
                </div>

                <div className="field">
                  <label>Imagem (opcional)</label>
                  <div
                    className={`dropzone ${isDragging ? "dragging" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => onDropFile(e, setImage)}
                  >
                    <input
                      id="blogImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files[0])}
                    />
                    <span>Arraste uma imagem aqui ou clique para selecionar</span>
                  </div>

                  {image && (
                    <div className="preview">
                      <img src={URL.createObjectURL(image)} alt="Pré-visualização" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IMAGEM */}
            {listingType === "image" && (
              <div className="field">
                <label>Imagem</label>
                <div
                  className={`dropzone ${isDragging ? "dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => onDropFile(e, setImage)}
                >
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  <span>Arraste a imagem aqui ou clique para selecionar</span>
                </div>

                {image && (
                  <div className="preview">
                    <img src={URL.createObjectURL(image)} alt="Preview" />
                  </div>
                )}
              </div>
            )}

            {/* LINK */}
            {listingType === "link" && (
              <>
                <div className="field">
                  <label>URL</label>
                  <input
                    className="input"
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Cole o link (YouTube, etc.)"
                  />
                </div>

                {isYouTubeLink(link) && getYouTubeVideoId(link) && (
                  <div className="yt-preview">
                    <iframe
                      width="100%"
                      height="320"
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(link)}`}
                      title="YouTube preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="field">
                  <label>Comentário (opcional)</label>
                  <textarea
                    className="textarea"
                    value={linkDescription}
                    onChange={(e) => setLinkDescription(e.target.value)}
                    placeholder="O que você achou desse link/vídeo?"
                    rows={4}
                  />
                </div>
              </>
            )}

            {/* ENQUETE */}
            {listingType === "poll" && (
              <div className="form-grid">
                <div className="field">
                  <label>Pergunta</label>
                  <input
                    className="input"
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Qual é a sua opinião sobre…?"
                  />
                </div>

                {pollOptions.map((option, idx) => (
                  <div className="field" key={idx}>
                    <label>Opção {idx + 1}</label>
                    <input
                      className="input"
                      type="text"
                      value={option}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      placeholder={`Digite a opção ${idx + 1}`}
                    />
                  </div>
                ))}

                <div className="actions-row">
                  <button type="button" className="btn ghost" onClick={addPollOption}>
                    + Adicionar opção
                  </button>
                </div>
              </div>
            )}

            {/* REEL */}
            {listingType === "reel" && (
              <div className="form-grid">
                <div className="field">
                  <label>Vídeo</label>
                  <div
                    className={`dropzone ${isDragging ? "dragging" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => onDropFile(e, setReelVideo)}
                  >
                    <input type="file" accept="video/*" onChange={(e) => setReelVideo(e.target.files[0])} />
                    <span>Arraste o vídeo aqui ou clique para selecionar</span>
                  </div>
                  {reelVideo && <video controls src={URL.createObjectURL(reelVideo)} className="video-preview" />}
                </div>

                <div className="field">
                  <label>Descrição</label>
                  <textarea
                    className="textarea"
                    value={reelDescription}
                    onChange={(e) => setReelDescription(e.target.value)}
                    placeholder="Descreva seu reel…"
                    rows={4}
                  />
                </div>

                <div className="field">
                  <label>Thumbnail</label>
                  <div
                    className={`dropzone ${isDragging ? "dragging" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => onDropFile(e, setReelThumbnail)}
                  >
                    <input type="file" accept="image/*" onChange={(e) => setReelThumbnail(e.target.files[0])} />
                    <span>Arraste a imagem aqui ou clique para selecionar</span>
                  </div>
                  {reelThumbnail && (
                    <div className="preview">
                      <img src={URL.createObjectURL(reelThumbnail)} alt="Thumbnail" />
                    </div>
                  )}
                  {reelError && <p className="error">{reelError}</p>}
                </div>
              </div>
            )}

            {/* TAGS */}
            <div className="field">
              <label>Tags (separadas por vírgula)</label>
              <input
                className="input"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ex.: bíblia, jovens, estudo"
              />
              {!!tagChips.length && (
                <div className="chips">
                  {tagChips.map((t, i) => (
                    <span key={i} className="chip">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* ERROR */}
            {error && (
              <div className="error-box">
                <p>{error}</p>
              </div>
            )}

            <div className="actions-row">
              <button type="submit" className="btn primary">Publicar</button>
              <button type="button" className="btn ghost" onClick={resetForm}>
                Limpar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewListing;