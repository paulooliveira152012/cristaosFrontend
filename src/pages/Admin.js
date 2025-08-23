import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { ChurchesAdmin } from "../components/Admin/ChurchAdminComponent";
import { MembersManager } from "../components/Admin/MemberAdminComponent";
import { ListingAdmin } from "../components/Admin/ListingAdminComponent";
import { StaffAdmin } from "../components/Admin/StaffAdminComponent";
import { ReportAdmin } from "../components/Admin/ReportAdminComponent";
import { MeetingAdmin } from "../components/Admin/MeetingAdminComponent";
import "../styles/Admin.css";


// Adjust this to your API base (e.g., http://localhost:4000)
const API = process.env.REACT_APP_API_BASE_URL;

const Admin = () => {
  const [tab, setTab] = useState("churches");

  return (
    <div
      className="adminPage min-h-screen w-full p-4 md:p-6"
      style={{ maxWidth: 1100, margin: "0 auto" }}
    >
      <Header showProfileImage={false} />

      <select onChange={(e) => setTab(e.target.value)} className="fwSellect">
        <option value="churches">Igrejas</option>
        <option value="meetings">Reuniões</option>
        <option value="users">Usuários</option>
        <option value="staff">Staff</option>
        <option value="posts">Postagens</option>
        <option value="reports">Relatórios</option>
      </select>

      {tab === "churches" && <ChurchesAdmin />}
      {tab === "users" && <MembersManager />}
      {tab === "meetings" && <MeetingAdmin />}
      {tab === "staff" && <StaffAdmin />}
      {tab === "posts" && <ListingAdmin />}
      {tab === "reports" && <ReportAdmin />}
    </div>
  );
};



export default Admin;
