import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { fetchUserFriends } from "./functions/profilePageFunctions";
import profileplaceholder from "../assets/images/profileplaceholder.png";
import { Link } from "react-router-dom";
import "../styles/FriendsList.css";

const FriendsList = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); // vem da URL: /profile/:userId/friends

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!userId) return; // URL inválida

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await fetchUserFriends(userId); // deve retornar array
        if (!cancelled) setFriends(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr("Falha ao carregar amigos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  console.log(friends)

  return (
    <div className="FriendsListPage">
  <Header showProfileImage={false} onBack={() => navigate(-1)} />
  <h1>Friends List</h1>

  {loading && <p className="friends-empty">Carregando…</p>}
  {err && <p className="friends-error">Falha ao carregar amigos.</p>}
  {!loading && !err && friends.length === 0 && (
    <p className="friends-empty">Nenhum amigo ainda.</p>
  )}

  <ul className="friends-grid">
    {friends.map((f) => (
      <li key={f._id} className="friend-card">
        <Link to={`/profile/${f._id}`} className="friend-link">
          <img
            src={f.profileImage || profileplaceholder}
            alt={f.username ?? f.name ?? "Amigo"}
            className="friend-avatar"
            loading="lazy"
            width={96}
            height={96}
          />
          <div className="friend-name">{f.username ?? f.name ?? f._id}</div>
          {/* opcional:
          <div className="friend-sub">@{f.username}</div>
          */}
        </Link>
      </li>
    ))}
  </ul>
</div>

  );
};

export default FriendsList;
