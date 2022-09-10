import { Client } from 'minio';

export const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_KEY_ID!,
  secretKey: process.env.MINIO_KEY_SECRET!,
});
