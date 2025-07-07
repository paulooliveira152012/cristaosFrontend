import { useEffect } from "react";
import { fetchUserFriends } from "../functions/profilePageFunctions";

export const ProfileUserFriends = ({ user }) => {
    console.log("user is:", user)

    useEffect(() => {
        if (user?._id) {
            console.log("evoking function to fetch frineds...")
            fetchUserFriends(user._id)
        }
    }, [user._id])

  return (
    <div>
      <p>displaying firneds of {user.username} </p>
    </div>
  );
};
