import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { lookup } from "mime-types";

export class S3NotFoundError extends Error {
  constructor(key: string) {
    super(`S3 object not found: ${key}`);
    this.name = "S3NotFoundError";
  }
}

const client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
});

const bucket = process.env.S3_BUCKET_NAME!;

function workspaceKey(tenantId: string, relativePath: string): string {
  return `workspaces/${tenantId}/${relativePath}`;
}

export async function upload(
  tenantId: string,
  relativePath: string,
  content: string | Buffer
): Promise<void> {
  const key = workspaceKey(tenantId, relativePath);
  const contentType = lookup(relativePath) || "application/octet-stream";
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: contentType,
    })
  );
}

export async function download(tenantId: string, relativePath: string): Promise<string> {
  const key = workspaceKey(tenantId, relativePath);
  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    return await response.Body!.transformToString("utf-8");
  } catch (err: unknown) {
    if (isNoSuchKey(err)) throw new S3NotFoundError(key);
    throw err;
  }
}

export async function deleteObject(tenantId: string, relativePath: string): Promise<void> {
  const key = workspaceKey(tenantId, relativePath);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function listObjects(tenantId: string, subPrefix?: string): Promise<string[]> {
  const prefix = workspaceKey(tenantId, subPrefix ?? "");
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of response.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key.slice(`workspaces/${tenantId}/`.length));
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
}

export async function getSignedUrl(
  tenantId: string,
  relativePath: string,
  options?: { expiresIn?: number }
): Promise<string> {
  const key = workspaceKey(tenantId, relativePath);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return awsGetSignedUrl(client, command, { expiresIn: options?.expiresIn ?? 3600 });
}

function isNoSuchKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: string }).name === "NoSuchKey"
  );
}
