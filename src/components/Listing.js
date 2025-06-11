import '../styles/style.css';
import { useUser } from '../context/UserContext'; // Ensure correct import

const NewListing = () => {
    const { currentUser } = useUser();
    console.log("Usuario atual no listingComponent", currentUser);

    // Conditionally render to ensure currentUser is available before trying to access profileImage
    if (!currentUser) {
        return <div>Loading...</div>; // Display a loading message until currentUser is available
    }

    return (
        <div className='newListingContainer'>
            <div className='newListingImageContainer'>
                <div
                    className='newListingImage'
                    style={{
                        backgroundImage: `url(${currentUser.profileImage})`,
                        backgroundSize: 'cover', // Ensures the image covers the div
                        backgroundPosition: 'center', // Centers the image
                        borderRadius: 50
                    }}
                ></div>
            </div>
            <div className='newListingMainContainer'>
                
            </div>
        </div>
    );
}

export default NewListing;
