// components/profile/Tabs.jsx
export default function Tabs({ currentTab, onChange }) {
  return (
    <div className="profileOptions">
      <ul>
        <li className={currentTab === "" ? "active" : ""} onClick={() => onChange("")}>
          Listagens
        </li>
        <li className={currentTab === "mural" ? "active" : ""} onClick={() => onChange("mural")}>
          Mural
        </li>
      </ul>
    </div>
  );
}
