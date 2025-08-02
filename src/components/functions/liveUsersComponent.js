const baseUrl = process.env.REACT_APP_API_BASE_URL

export const getAllUsers = async (setAllUsers) => {
    console.log("getting all users...")
    console.log("api:", baseUrl)

    const res = await fetch(`${baseUrl}/api/users/getAllUsers`, {
        method: "GET",
    })

    const data = await res.json()
    setAllUsers(data.users)
    console.log("allUsers:", data)
}
