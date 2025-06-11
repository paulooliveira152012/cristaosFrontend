import '../styles/style.css'
import MenuIcon from '../assets/icons/menuIcon'
import MessageIcon from '../assets/icons/messageIcon'
import imagePlaceholder from '../assets/images/profileplaceholder.png'
import { useUser } from '../context/UserContext' // Ensure correct import
import { Link } from 'react-router-dom' // Correct import for Link
import Plus from '../assets/icons/plusIcon'
import HomeIcon from '../assets/icons/homeIcon'
import BellIcon from '../assets/icons/bellIcon'
import { useNavigate } from 'react-router-dom'

const Footer = () => {
    const navigate = useNavigate()
    
    const { currentUser } = useUser() // Destructure currentUser from useUser hook
    // console.log("Current user in footer component is is:", currentUser)
    // console.log("currentUser.userId in footer component is:", currentUser._id)

    const navigateToMainChat = () => {
        if(currentUser) {
            navigate('/chat');
        } else {
            window.alert("Por favor fazer login para acessar o chat principal")
        }
    }

    return (
        <div className="footerContainer">
            <Link to={"/"}>
            <HomeIcon />
            </Link>

            {/* <MenuIcon /> */}
            <div onClick={navigateToMainChat}>
                <MessageIcon />
            </div>

            {/* conditionally render Plus button */}
            {currentUser && (
                <Link to='/newlisting'>
                    <Plus />
                </Link>
            )}

            <BellIcon />
            
            
            {/* <div
                className='footerProfileImage'
                style={{
                    backgroundImage: `url(${currentUser?.profileImage || imagePlaceholder})`, // Use profile image or fallback image
                    backgroundPosition: 'center'
                }}
                onClick={() => navigate(`profile/${currentUser._id}`)}
            ></div> */}
            
        </div>
    )
}

export default Footer
