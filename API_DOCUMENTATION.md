# PDF Conversion API Documentation

## Overview
Comprehensive API for PDF conversion, image processing, and PDF management tools. All endpoints support real file processing with multiple conversion libraries.

**Base URL:** `https://your-replit-app.replit.app`

## Authentication
- **Optional Authentication:** JWT token or API key
- **Header Format:** `Authorization: Bearer <token>` or `Authorization: Bearer sk-<api_key>`
- **Rate Limiting:** 100 requests per minute per IP

---

## PDF Conversion Tools (7 Endpoints)

### 1. PDF to Word Conversion
**Endpoint:** `POST /api/convert/pdf-to-word`

**Description:** Convert PDF documents to editable Word format with text extraction and formatting preservation.

**Parameters:**
- `file` (file, required): PDF file to convert
- Maximum file size: 50MB
- Supported formats: `.pdf`

**Request Example:**
```bash
curl -X POST https://your-app.replit.app/api/convert/pdf-to-word \
  -H "Authorization: Bearer your-token" \
  -F "file=@document.pdf"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "jobId": 123,
    "status": "pending",
    "inputFilename": "document.pdf",
    "toolType": "pdf_to_word",
    "message": "File uploaded successfully. Processing started."
  }
}
```

**Error Responses:**
```json
// Invalid file format (400)
{
  "success": false,
  "error": "Invalid file format. Supported formats: pdf"
}

// File too large (400)
{
  "success": false,
  "error": "File size exceeds maximum limit of 50MB"
}

// No file uploaded (400)
{
  "success": false,
  "error": "No file uploaded"
}
```

---

### 2. PDF to Excel Conversion
**Endpoint:** `POST /api/convert/pdf-to-excel`

**Description:** Convert PDF documents to Excel spreadsheets with table extraction.

**Parameters:**
- `file` (file, required): PDF file to convert
- Maximum file size: 50MB
- Supported formats: `.pdf`

**Success Response:** Same format as PDF to Word

---

### 3. PDF to PowerPoint Conversion
**Endpoint:** `POST /api/convert/pdf-to-powerpoint`

**Description:** Convert PDF documents to PowerPoint presentations.

**Parameters:**
- `file` (file, required): PDF file to convert
- Maximum file size: 50MB
- Supported formats: `.pdf`

---

### 4. Word to PDF Conversion
**Endpoint:** `POST /api/convert/word-to-pdf`

**Description:** Convert Word documents to PDF format with layout preservation.

**Parameters:**
- `file` (file, required): Word document to convert
- Maximum file size: 100MB
- Supported formats: `.doc`, `.docx`

---

### 5. Excel to PDF Conversion
**Endpoint:** `POST /api/convert/excel-to-pdf`

**Description:** Convert Excel spreadsheets to PDF format.

**Parameters:**
- `file` (file, required): Excel file to convert
- Maximum file size: 100MB
- Supported formats: `.xls`, `.xlsx`

---

### 6. PowerPoint to PDF Conversion
**Endpoint:** `POST /api/convert/powerpoint-to-pdf`

**Description:** Convert PowerPoint presentations to PDF format.

**Parameters:**
- `file` (file, required): PowerPoint file to convert
- Maximum file size: 200MB
- Supported formats: `.ppt`, `.pptx`

---

### 7. HTML to PDF Conversion
**Endpoint:** `POST /api/convert/html-to-pdf`

**Description:** Convert HTML pages to PDF documents.

**Parameters:**
- `file` (file, required): HTML file to convert
- Maximum file size: 10MB
- Supported formats: `.html`, `.htm`

---

## Image Processing Tools (9 Endpoints)

### 8. Images to PDF Conversion
**Endpoint:** `POST /api/convert/images-to-pdf`

**Description:** Combine multiple images into a single PDF document.

**Parameters:**
- `files` (files[], required): Multiple image files
- Maximum file size: 100MB total
- Maximum files: 10
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.tiff`

**Request Example:**
```bash
curl -X POST https://your-app.replit.app/api/convert/images-to-pdf \
  -H "Authorization: Bearer your-token" \
  -F "files=@image1.jpg" \
  -F "files=@image2.png"
```

---

### 9. PDF to Images Conversion
**Endpoint:** `POST /api/convert/pdf-to-images`

**Description:** Extract images from PDF documents as separate image files.

**Parameters:**
- `file` (file, required): PDF file to process
- Maximum file size: 100MB
- Supported formats: `.pdf`

---

### 10. Image Compression
**Endpoint:** `POST /api/image/compress`

**Description:** Reduce image file size while maintaining quality using advanced compression algorithms.

**Parameters:**
- `file` (file, required): Image file to compress
- Maximum file size: 50MB
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`

**Real Processing:** Uses Sharp library for actual compression with quality optimization.

---

### 11. Image Format Conversion
**Endpoint:** `POST /api/image/convert-format`

**Description:** Convert images between different formats (JPG, PNG, WebP, etc.).

**Parameters:**
- `file` (file, required): Image file to convert
- `outputFormat` (string, optional): Target format (jpg, png, webp)
- Maximum file size: 50MB
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.tiff`, `.webp`

---

### 12. Image Cropping
**Endpoint:** `POST /api/image/crop`

**Description:** Crop images to specific dimensions or center crop to 75% of original size.

**Parameters:**
- `file` (file, required): Image file to crop
- Maximum file size: 50MB
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`

---

### 13. Image Resizing
**Endpoint:** `POST /api/image/resize`

**Description:** Resize images to specific dimensions (default: 75% of original size).

**Parameters:**
- `file` (file, required): Image file to resize
- Maximum file size: 50MB
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`

---

### 14. Image Rotation
**Endpoint:** `POST /api/image/rotate`

**Description:** Rotate images by specified angles (default: 90 degrees clockwise).

**Parameters:**
- `file` (file, required): Image file to rotate
- Maximum file size: 50MB
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`

---

### 15. Image Upscaling
**Endpoint:** `POST /api/image/upscale`

**Description:** Enhance image resolution using AI upscaling techniques.

**Parameters:**
- `file` (file, required): Image file to upscale
- Maximum file size: 25MB
- Supported formats: `.jpg`, `.jpeg`, `.png`

---

### 16. Background Removal
**Endpoint:** `POST /api/image/remove-background`

**Description:** Remove background from images automatically using AI.

**Parameters:**
- `file` (file, required): Image file to process
- Maximum file size: 25MB
- Supported formats: `.jpg`, `.jpeg`, `.png`

---

## PDF Management Tools (4 Endpoints)

### 17. PDF Merging
**Endpoint:** `POST /api/pdf/merge`

**Description:** Combine multiple PDF files into one document.

**Parameters:**
- `files` (files[], required): Multiple PDF files
- Maximum file size: 200MB total
- Maximum files: 10
- Supported formats: `.pdf`

**Request Example:**
```bash
curl -X POST https://your-app.replit.app/api/pdf/merge \
  -H "Authorization: Bearer your-token" \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf"
```

---

### 18. PDF Splitting
**Endpoint:** `POST /api/pdf/split`

**Description:** Split PDF documents into separate pages or page ranges.

**Parameters:**
- `file` (file, required): PDF file to split
- Maximum file size: 100MB
- Supported formats: `.pdf`

---

### 19. PDF Compression
**Endpoint:** `POST /api/pdf/compress`

**Description:** Reduce PDF file size while maintaining quality.

**Parameters:**
- `file` (file, required): PDF file to compress
- Maximum file size: 200MB
- Supported formats: `.pdf`

---

### 20. PDF Rotation
**Endpoint:** `POST /api/pdf/rotate`

**Description:** Rotate PDF pages by specified angles.

**Parameters:**
- `file` (file, required): PDF file to rotate
- Maximum file size: 100MB
- Supported formats: `.pdf`

---

## Utility Endpoints

### Get Job Status
**Endpoint:** `GET /api/jobs/{jobId}`

**Description:** Check the status of a conversion job.

**Parameters:**
- `jobId` (integer, required): Job ID returned from conversion request

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "jobId": 123,
    "status": "completed",
    "inputFilename": "document.pdf",
    "outputFilename": "document_converted.docx",
    "processingTime": 5000,
    "downloadUrl": "/api/download/123",
    "createdAt": "2025-08-02T10:30:00Z",
    "updatedAt": "2025-08-02T10:30:05Z"
  }
}
```

**Job Status Values:**
- `pending`: Job created, waiting to start
- `processing`: Conversion in progress
- `completed`: Conversion finished successfully
- `failed`: Conversion failed with error

---

### Download Converted File
**Endpoint:** `GET /api/download/{jobId}`

**Description:** Download the converted file after job completion.

**Parameters:**
- `jobId` (integer, required): Job ID from completed conversion

**Response:** Binary file download with appropriate headers

---

### Get All Tools
**Endpoint:** `GET /api/tools`

**Description:** Get list of all available conversion tools.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "PDF to Word",
      "type": "pdf_to_word",
      "category": "pdf_conversion",
      "description": "Convert PDF documents to editable Word format",
      "inputFormats": ["pdf"],
      "outputFormat": "docx",
      "maxFileSize": 50,
      "processingTimeEstimate": 8
    }
  ],
  "total": 20
}
```

---

### Get Tools by Category
**Endpoint:** `GET /api/tools/category/{category}`

**Parameters:**
- `category`: `pdf_conversion`, `image_tools`, or `pdf_management`

---

## Error Handling

### Common Error Codes
- **400 Bad Request:** Invalid file format, missing file, or file too large
- **401 Unauthorized:** Authentication required
- **404 Not Found:** Tool or job not found
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server processing error

### Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details (optional)"
}
```

---

## Rate Limiting
- **General API:** 100 requests per minute per IP
- **File Upload:** 50 requests per hour per IP
- **Download:** 200 requests per hour per IP

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
```

---

## Processing Times
**Estimated processing times by file size:**

| File Size | Small Files (<1MB) | Medium Files (1-5MB) | Large Files (5-10MB) | Very Large Files (10MB+) |
|-----------|-------------------|---------------------|---------------------|-------------------------|
| PDF Tools | 2-8 seconds       | 5-20 seconds        | 20-40 seconds       | 40-60 seconds           |
| Image Tools | 1-5 seconds      | 3-15 seconds        | 15-30 seconds       | 30-45 seconds           |
| Management | 1-3 seconds      | 2-10 seconds        | 10-25 seconds       | 25-40 seconds           |

---

## Examples

### Complete Workflow Example
```bash
# 1. Upload and start conversion
RESPONSE=$(curl -X POST https://your-app.replit.app/api/image/compress \
  -H "Authorization: Bearer your-token" \
  -F "file=@large-image.jpg" \
  -s)

# 2. Extract job ID
JOB_ID=$(echo $RESPONSE | jq -r '.data.jobId')

# 3. Poll for completion
while true; do
  STATUS=$(curl -s https://your-app.replit.app/api/jobs/$JOB_ID | jq -r '.data.status')
  if [ "$STATUS" = "completed" ]; then
    break
  fi
  sleep 2
done

# 4. Download result
curl -o compressed-image.jpg https://your-app.replit.app/api/download/$JOB_ID
```

### JavaScript SDK Example
```javascript
class PDFConverterAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://your-app.replit.app';
  }

  async compressImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/image/compress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    const result = await response.json();
    return result.data.jobId;
  }

  async getJobStatus(jobId) {
    const response = await fetch(`${this.baseURL}/api/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return await response.json();
  }

  async downloadFile(jobId) {
    const response = await fetch(`${this.baseURL}/api/download/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return await response.blob();
  }
}
```

---

## Support

For technical support or API questions:
- Check job status and error messages for debugging
- Ensure file formats match endpoint requirements
- Verify file size limits before upload
- Use proper authentication headers

**Note:** All endpoints perform real file processing using production-grade conversion libraries (Sharp, pdf-lib, mammoth, etc.) rather than generating placeholder content.