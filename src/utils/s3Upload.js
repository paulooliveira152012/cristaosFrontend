import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // AWS SDK
import { v4 as uuidv4 } from "uuid"; // For generating unique file names

// Configure AWS S3 Client
const s3 = new S3Client({
  region: "us-east-2", // Your region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload image to S3
const uploadImageToS3 = async (file) => {
  const fileName = `${uuidv4()}.jpg`; // Generate unique file name
  const BucketName = "cristaos"; // Name of your S3 bucket
  const region = "us-east-2"; // Set the AWS region

  const params = {
    Bucket: BucketName,
    Key: fileName,
    Body: file, // Upload the actual file, not a URL
    ContentType: file.type || "image/jpeg", // Correct content type of the file
  };

  try {
    console.log("Uploading image to S3 with params:", params);
    const data = await s3.send(new PutObjectCommand(params));

    // Construct the S3 URL using the fixed bucket name and region
    const s3Url = `https://${BucketName}.s3.${region}.amazonaws.com/${fileName}`;
    console.log("File uploaded successfully:", s3Url);
    return s3Url; // Return the S3 URL
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};

export { uploadImageToS3 };
