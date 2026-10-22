import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing. Check your .env file.");
}

export const config = {
  mongoUri,
  port: Number(process.env.PORT) || 3000,
};
