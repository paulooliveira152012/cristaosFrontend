import { authHeaders } from "../utils/AuthHeaders";

const apiUrl = process.env.REACT_APP_API_BASE_URL
// topo do arquivo


export const banMember = async ({ isLeader, userId }) => {
    if(!isLeader) {
        console.log("Only a leader can ban a member...")
        return
    }

    if (!userId) {
        console.log("missing userId")
        return
    }

    console.log("banning member", userId)    

    try {
        const res = await fetch (`${apiUrl}/api/adm/ban`, {
            method: "POST",
            headers: authHeaders(),
            credentials: "include",
            body: JSON.stringify({userId, isLeader})
        })
        console.log("res:", res)
    } catch (err) {
        console.log("erro ao banir membro,", err)
    }
}