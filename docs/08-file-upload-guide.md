# File Upload Handling

## Overview

MyPO supports uploading documents to funding applications. Files are stored on the server's local disk and served through an authenticated download endpoint.

---

## Required Document Types

All 6 documents below are **mandatory**. The application form blocks submission until every document is attached.

| `documentType` value | Label shown to user |
|---|---|
| `purchase_order` | Purchase Order |
| `company_registration` | Company Registration Document |
| `bank_confirmation` | Bank Confirmation Letter |
| `director_id` | Director ID |
| `company_proof_of_address` | Company Proof of Address |
| `director_proof_of_address` | Director Proof of Address |

---

## Upload Constraints

| Constraint | Value |
|---|---|
| Maximum file size | **5 MB per file** |
| Allowed extensions | `.pdf`, `.doc`, `.docx` |
| Authentication | Required (any authenticated user with access to the application) |
| Minimum required | All 6 document types must be uploaded before submission is allowed |

---

## Storage Location

Files are stored under the API's content root:

```
MyPO.API/
└── uploads/
    └── applications/
        └── {applicationId}/
            └── {documentType}/
                └── {uuid}.pdf
```

- `{applicationId}` — the UUID of the funding application
- `{documentType}` — the type string passed by the client (e.g. `purchase_order`, `invoice`, `bank_statement`)
- `{uuid}` — a newly generated UUID (prevents filename collisions and path traversal)

The original filename is stored in the `application_documents` table and returned in API responses, but is not used for disk storage.

---

## Upload Endpoint

```
POST /api/applications/{id}/documents?documentType=purchase_order
Content-Type: multipart/form-data

Body field: file  (the file binary)
```

**Response `200`:**
```json
{
  "id": "<uuid>",
  "documentType": "purchase_order",
  "fileName": "mypo_purchase_order.pdf",
  "fileSize": 204800,
  "createdAt": "2026-07-21T10:00:00Z"
}
```

**Error responses:**
- `400` — file exceeds 5 MB: `{ "message": "File size must be under 5MB." }`
- `400` — wrong extension: `{ "message": "Only PDF, DOC, and DOCX files are allowed." }`
- `403` — user does not have access to this application
- `404` — application not found

---

## Replace Document Endpoint

```
PUT /api/applications/{id}/documents/{docId}
Content-Type: multipart/form-data

Body field: file
```

The old physical file is deleted from disk before the new file is saved. The document record is updated in place (same `id`).

---

## Download Endpoint

```
GET /api/applications/{id}/documents/{docId}/download
Authorization: Bearer <token>
```

Returns the file as a stream. Content type is `application/pdf` for `.pdf` files, `application/octet-stream` for others.

The download goes through the controller — files are **not** directly publicly accessible via URL.

---

## Production Considerations

### Disk Space
Monitor the `uploads/` folder. Each application can have multiple documents across multiple types, each up to 5 MB. Plan disk capacity accordingly.

### Backups
Include the `uploads/` folder in your backup strategy. If the folder is lost, document metadata remains in the database but the files cannot be recovered.

### External Storage (Recommended for Scale)
For production at scale, replace the local disk approach with a cloud storage service (e.g. AWS S3, Azure Blob Storage, Cloudflare R2). This would require changes to:
- `ApplicationsController.cs` — replace `FileStream` writes with SDK upload calls
- The download endpoint — generate a pre-signed URL or proxy the download from the storage service
- Remove `app.UseStaticFiles()` dependency for uploads

### Permissions
Ensure the user account running the .NET API has **write permissions** to the `uploads/` directory on the server.

```bash
# Linux example
sudo chown -R www-data:www-data /var/www/mypo/publish/uploads
sudo chmod -R 755 /var/www/mypo/publish/uploads
```
