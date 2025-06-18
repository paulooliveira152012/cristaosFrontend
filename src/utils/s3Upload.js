import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // AWS SDK
import { fromEnv } from "@aws-sdk/credential-provider-env";

import { v4 as uuidv4 } from "uuid"; // For generating unique file names

const baseUrl = process.env.REACT_APP_API_BASE_URL

// Configure AWS S3 Client
const s3 = new S3Client({
  region: "us-east-2",
  credentials: fromEnv(), // Isso vai usar automaticamente as variáveis do ambiente
});

// Function to upload image to S3
const uploadImageToS3 = async (file) => {
  // 1. Pede a URL do backend
  const res = await fetch(`${baseUrl}/api/upload-url`);
  const { uploadURL, key } = await res.json();

  // 2. Faz o upload direto pra S3
  const upload = await fetch(uploadURL, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: file,
  });

  if (!upload.ok) throw new Error("Erro no upload");

  return `https://cristaos.s3.us-east-2.amazonaws.com/${key}`;
};


export { uploadImageToS3 };
