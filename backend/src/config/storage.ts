import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '../../../.env') });

// Configure for MinIO (local) or AWS S3 (production)
const endpoint = process.env.S3_ENDPOINT || undefined;
const forcePathStyle = !!endpoint; // Required for MinIO

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint,
  forcePathStyle,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
  },
});

export const bucketName = process.env.S3_BUCKET_NAME || 'lyric-videos';
export const bucketUrl = process.env.S3_BUCKET_URL || `http://localhost:9000/${bucketName}`;

export default s3Client;
