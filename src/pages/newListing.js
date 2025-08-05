import "../styles/newlisting.css";
import { useState } from "react";
import Header from "../components/Header";
import { uploadImageToS3 } from "../utils/s3Upload"; // Assuming you have a function to handle S3 upload
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { uploadReelToBackend } from "./functions/newListingFunctions"; // Import the function to handle reel uploads
import { convertToMp4 } from "../utils/convertToMp4";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const NewListing = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [listingType, setListingType] = useState("blog");
  const [sections, setSections] = useState([]);

  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [image, setImage] = useState(null);

  // Reel related states
  const [reelVideo, setReelVideo] = useState(null);
  const [reelDescription, setReelDescription] = useState("");
  const [reelTags, setReelTags] = useState("");
  const [reelError, setReelError] = useState(null);
  const [reelThumbnail, setReelThumbnail] = useState(null);

  // Link related states
  const [link, setLink] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [tags, setTags] = useState("");
  const [error, setError] = useState(null);

  console.log("in listing page");
  console.log("current user in the listing page", currentUser);

  // Handle file upload
  const handleImageUpload = (e) => {
    // cria uma variavel para a foto, e atribua o valor selecionado a foto
    const file = e.target.files[0];
    setImage(file);
  };

  // Add a new option to the poll
  const addPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  // Handle change in poll options
  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // ...outros hooks e estados...

  const handleSubmit = async (e) => {
    console.log("submitting listing");
    e.preventDefault();
    setError(null);

    // Validação
    if (listingType === "blog" && !blogContent.trim()) {
      setError("Please provide blog content.");
      return;
    }
    if (listingType === "image" && !image) {
      setError("Please select an image.");
      return;
    }
    if (listingType === "link" && !link.trim()) {
      setError("Please provide a valid link.");
      return;
    }
    if (
      listingType === "poll" &&
      (!pollQuestion.trim() || pollOptions.every((option) => !option.trim()))
    ) {
      setError("Please provide a poll question and at least one option.");
      return;
    }
    if (listingType === "reel" && (!reelVideo || !reelDescription.trim())) {
      setError("Por favor, envie vídeo, descrição e thumbnail para o reel.");
      return;
    }

    console.log("listingType", listingType);

    try {
      // Se for REEL → fazer upload do vídeo e depois criar o listing
      if (listingType === "reel") {
        let finalVideo = reelVideo;

        // Converte para MP4 se não for
        if (reelVideo.type !== "video/mp4") {
          finalVideo = await convertToMp4(reelVideo);
          console.log("Converted reel video to MP4");
        }

        const formData = new FormData();
        formData.append("video", finalVideo);
        if (reelThumbnail) {
          formData.append("thumbnail", reelThumbnail);
        }
        formData.append("description", reelDescription);
        formData.append("userId", currentUser._id);

        console.log("formData", formData);

        const uploadRes = await fetch(`${baseUrl}/api/reels/upload-reel`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          console.error("Upload error:", errorData);
          setError(errorData.message || "Erro ao fazer upload do reel.");
          return;
        }

        console.log("Upload successful");
        const { videoUrl, thumbnailUrl } = await uploadRes.json();

        const listingData = {
          userId: currentUser._id,
          type: "reel",
          tags: tags.split(",").map((t) => t.trim()),
          reel: {
            videoUrl,
            thumbnailUrl,
            description: reelDescription,
          },
        };

        console.log("listingData", listingData);
        const response = await fetch(`${baseUrl}/api/listings/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listingData),
        });

        const data = await response.json();
        console.log("response", response);

        if (response.ok) {
          resetForm();
          navigate("/"); // ou /reels
        } else {
          console.error("Error creating reel listing:", data);
          setError(data.message || "Erro ao criar reel.");
        }

        return; // parar aqui se for reel
      }

      // Se for outro tipo (blog, image, link, poll)
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
        tags: tags.split(",").map((t) => t.trim()),
      };

      if (listingType === "poll") {
        listingData.poll = {
          question: pollQuestion,
          options: pollOptions.filter((option) => option.trim()),
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
        navigate("/");
      } else {
        setError(data.message || "Erro ao criar publicação.");
      }
    } catch (err) {
      console.error("Erro ao criar publicação:", err);
      setError("Algo deu errado. Tente novamente.", err);
    }
  };

  // Reset form fields after successful submission
  const resetForm = () => {
    setBlogContent("");
    setImage(null);
    setLink("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setTags("");
  };

  const isYouTubeLink = (url) => {
    return url.includes("youtube.com/watch") || url.includes("youtu.be/");
  };

  const getYouTubeVideoId = (url) => {
    const youtubeRegex = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&#?\n]+)/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  return (
    <div className="screenWrapper">
      <div className="scrollable">
        <Header showProfileImage={false} navigate={navigate} />

        <h2>Criar nova postagem</h2>

        <div className="listing-type-selection">
          <label>Selecionar tipo da postagem: </label>
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
          >
            <option value="blog">Blog</option>
            <option value="image">Imagem</option>
            <option value="link">Link</option>
            <option value="poll">Enquete</option>
            <option value="reel">Reel</option>
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Conditionally render inputs based on listingType */}
          {/* a user should be able to add a section for either text, or an image, or an image to the left and text to the right and/or an image to the right and text to the left */}
          {listingType === "blog" && (
            // text area
            <div className="blog-input">
              {/* title */}
              <input
                value={blogTitle}
                className="BlogTitle"
                placeholder="Titulo do blog"
                onChange={(e) => setBlogTitle(e.target.value)}
              ></input>
              {/* area do texto */}
              <textarea
                value={blogContent}
                onChange={(e) => setBlogContent(e.target.value)}
                placeholder="Escreva Seu Blog Aqui..."
                rows="6"
              ></textarea>
              {/* Imagem */}
              <div className="image-upload">
                <label htmlFor="blogImage">
                  Adicionar uma imagem opcional ao final do blog:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  id="blogImage"
                  onChange={(e) => setImage(e.target.files[0])}
                />
                {image && (
                  <div className="image-preview">
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Pré-visualização da imagem"
                      style={{ maxWidth: "100%", marginTop: "10px" }}
                    />
                  </div>
                )}
              </div>
              {/* botao para adicionar  */}
            </div>
          )}

          {listingType === "image" && (
            <div className="image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {image && (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="image-preview"
                />
              )}
            </div>
          )}

          {listingType === "link" && (
            <div className="link-input">
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Cole o link do vídeo (YouTube, etc)..."
              />

              {/* Se for YouTube, mostra preview */}
              {isYouTubeLink(link) && getYouTubeVideoId(link) && (
                <div style={{ marginTop: "15px" }}>
                  <iframe
                    width="100%"
                    height="220"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                      link
                    )}`}
                    title="YouTube preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      borderRadius: "8px",
                      marginBottom: "10px",
                      maxWidth: "100%",
                    }}
                  />
                </div>
              )}

              {/* Campo opcional de texto para o usuário comentar sobre o vídeo */}
              <textarea
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Escreva algo sobre esse vídeo (opcional)..."
                rows="4"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          )}

          {listingType === "poll" && (
            <div className="poll-input">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question"
              />
              {pollOptions.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) =>
                    handlePollOptionChange(index, e.target.value)
                  }
                  placeholder={`Option ${index + 1}`}
                />
              ))}
              <button type="button" onClick={addPollOption}>
                Add another option
              </button>
            </div>
          )}

          {/* Reel related inputs */}
          {listingType === "reel" && (
            <div className="reel-input">
              <p>Reel Video</p>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setReelVideo(e.target.files[0])}
              />
              {reelVideo && (
                <video
                  controls
                  src={URL.createObjectURL(reelVideo)}
                  style={{ width: "100%", marginTop: "10px" }}
                />
              )}
              <textarea
                value={reelDescription}
                onChange={(e) => setReelDescription(e.target.value)}
                placeholder="Reel description..."
                rows="4"
              ></textarea>
              <p>Thumbnail</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReelThumbnail(e.target.files[0])}
              />
              {reelThumbnail && (
                <img
                  src={URL.createObjectURL(reelThumbnail)}
                  alt="Reel Thumbnail"
                  style={{ maxWidth: "100%", marginTop: "10px" }}
                />
              )}

              {reelError && <p className="error">{reelError}</p>}
            </div>
          )}

          {/* Tags input */}
          <div className="tags-input">
            <label>Tags (separated by commas):</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {/* Error message */}

          {error && <p className="error">{error}</p>}

          <button type="submit" className="submit-button">
            Submit Listing
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewListing;
