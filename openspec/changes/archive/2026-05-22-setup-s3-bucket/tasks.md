## 1. Dependencies & Environment

- [x] 1.1 Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` with bun
- [x] 1.2 Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, and `S3_ENDPOINT` (optional) to `.env.example` with placeholder values

## 2. S3 Client Implementation

- [x] 2.1 Create `lib/s3.ts` with a singleton `S3Client` instance that reads from env vars and uses `S3_ENDPOINT` when set
- [x] 2.2 Implement `upload(tenantId, relativePath, content)` — stores at `workspaces/<tenantId>/<relativePath>` with content-type detection
- [x] 2.3 Implement `download(tenantId, relativePath)` — returns UTF-8 string, throws `S3NotFoundError` when object is missing
- [x] 2.4 Implement `deleteObject(tenantId, relativePath)` — idempotent delete (no error on missing key)
- [x] 2.5 Implement `listObjects(tenantId, subPrefix?)` — returns relative paths with `workspaces/<tenantId>/` prefix stripped
- [x] 2.6 Export `S3NotFoundError` typed class from `lib/s3.ts`
- [x] 2.7 Implement `getSignedUrl(tenantId, relativePath, options?: { expiresIn?: number })` using `@aws-sdk/s3-request-presigner` — defaults to 3600s expiry, scoped to `workspaces/<tenantId>/<relativePath>`

## 3. Verification

- [x] 3.1 Run `npm run build` and confirm no TypeScript errors
- [ ] 3.2 Manually test `upload` and `download` round-trip against a real or local S3-compatible bucket (document test steps in PR description)
