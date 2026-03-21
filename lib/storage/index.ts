import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  endpoint: process.env.LINODE_S3_ENDPOINT,
  region: process.env.LINODE_S3_REGION || "eu-central-1",
  credentials: {
    accessKeyId: process.env.LINODE_S3_KEY!,
    secretAccessKey: process.env.LINODE_S3_SECRET!,
  },
})

const BUCKET = process.env.LINODE_S3_BUCKET!

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "private",
  }))
  return `${process.env.LINODE_S3_CDN_URL}/${key}`
}

export async function getSignedDownloadUrl(key: string, expiresIn = 900): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  )
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export function generateKey(folder: string, filename: string): string {
  const timestamp = Date.now()
  const clean = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
  return `${folder}/${timestamp}_${clean}`
}
