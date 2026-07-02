# PDF Genius — Product Requirements Document (for TestSprite)

**Product:** PDF Genius
**Live URL (test target):** https://pdfgenius.app
**Type:** All-in-one PDF & image toolkit — web app (React) + mobile app (Expo). This PRD covers the WEB app.
**Payments:** Dodo Payments (live mode) — **see the "OUT OF SCOPE" section; payment flows must NOT be tested.**

---

## 1. Product Overview

PDF Genius is a web application that lets users convert, edit, sign, compress, and manage PDF and image files directly in the browser. Users can use most tools without an account; signing in unlocks saved history, higher usage limits, an API, and paid plans.

The core user flow for every tool is the same:
1. User opens a tool page (empty upload state).
2. User uploads one or more files (drag-and-drop or file picker).
3. User optionally sets tool-specific options (e.g. output format, quality, page range, password).
4. User clicks the primary action button to process the file.
5. A processing/loading state appears.
6. On success, the user can **download** the result (and, if logged in, it is saved to their History/Files).

---

## 2. Test Target & Environment

- **Base URL:** `https://pdfgenius.app`
- **Dedicated test account:** use a throwaway test account (provided separately). Do NOT use a real customer account.
- **Test files:** use small, safe sample files (a 1–3 page PDF, a small JPG/PNG, a small DOCX). Do not upload sensitive documents.

---

## 3. Primary User Flows to Test (IN SCOPE)

### 3.1 Navigation & Static Pages
Verify these pages load without errors and render their main content:
- Home `/`
- All Tools `/tools`
- Pricing `/pricing`
- Features `/features`
- About `/about`
- Contact `/contact`
- Support `/support`

### 3.2 Authentication
- **Sign Up** `/signup` — email + password registration. Note: signup is a **2-step flow** — after submitting, the app sends a verification code (OTP) to the email, and the account is only created after the code is entered on the verification step. (Google sign-up is available but is an external OAuth popup — do not attempt to complete Google auth.)
- **Sign In** `/signin` — email + password login with the test account.
- **Forgot Password** `/forgot-password` — request a reset code by email (always returns a generic success message).
- **Reset Password** `/reset-password` — enter reset code + new password.
- **Log out** — verify the user is logged out and protected pages redirect to sign-in.

### 3.3 Core PDF Tools (test a representative sample end-to-end: upload → process → download)
Each tool lives at `/upload/<slug>`:

**Convert (PDF ⇄ Office / images):**
- PDF to Word `/upload/pdf-to-word`
- PDF to Excel `/upload/pdf-to-excel`
- PDF to PowerPoint `/upload/pdf-to-powerpoint`
- PDF to Images `/upload/pdf-to-images` (output is a ZIP)
- Word to PDF `/upload/word-to-pdf`
- Excel to PDF `/upload/excel-to-pdf`
- PowerPoint to PDF `/upload/powerpoint-to-pdf`
- HTML to PDF `/upload/html-to-pdf`
- Images to PDF `/upload/images-to-pdf`

**Organize / modify PDFs:**
- PDF Merger `/upload/merge-pdfs`
- PDF Splitter `/upload/split-pdf`
- Compress PDF `/upload/compress-pdf`
- Rotate PDF `/upload/rotate-pdf`
- Crop PDF `/upload/crop-pdf`
- Delete Pages `/upload/delete-pages-pdf`

**Edit / annotate PDFs:**
- Edit PDF `/upload/edit-pdf`
- Sign PDF `/upload/sign-pdf`
- Add Watermark `/upload/watermark-pdf`
- Add Image to PDF `/upload/add-image-pdf`
- OCR PDF `/upload/ocr-pdf` (recognizes text in scanned PDFs)

**Security:**
- Lock PDF `/upload/lock-pdf` (set a password)
- Unlock PDF `/upload/unlock-pdf` (remove a password)

### 3.4 Image Tools
- Resize Images `/upload/resize-image`
- Crop Images `/upload/crop-image`
- Rotate Images `/upload/rotate-image`
- Convert Image Format `/upload/convert-image-format`
- Compress Images `/upload/compress-image`
- Upscale Images `/upload/upscale-image`
- Remove Background `/upload/remove-background`
- Document Restore `/upload/restore-document`

### 3.5 Dashboard & Account (requires login with the test account)
- Dashboard `/dashboard` — overview, recent activity, usage stats load.
- Profile `/dashboard/profile` — view and update profile fields (name, avatar); verify changes persist after reload.
- Usage Stats `/dashboard/usage` — conversion history and usage numbers render.
- History / Files — verify a completed conversion appears and can be re-downloaded.
- API Setup `/dashboard/api-setup` — API key screen loads (do not perform real paid API calls).
- API Reference `/dashboard/api-reference` — documentation page loads.

### 3.6 Expected behaviors to assert
- Uploading a valid file enables the primary action button.
- Processing shows a loading state, then a success state with a working Download.
- Downloaded files are non-empty and open correctly.
- Invalid input (wrong file type, empty upload) shows a clear error, not a crash.
- Guests get one in-session download; logged-in users get saved history.
- Protected pages redirect unauthenticated users to sign-in.

---

## 4. OUT OF SCOPE — DO NOT TEST (critical)

**Do NOT test, click through, or attempt to complete any payment, billing, or checkout flow.** The site uses live payment keys.

Specifically, DO NOT:
- Click "Upgrade", "Choose plan", "Go Pro", "Go Business", or any plan-purchase button.
- Visit or interact with the checkout on **Manage Plans** `/dashboard/manage-plans`.
- Visit or interact with **Buy Credits** `/dashboard/buy-credits`.
- Navigate to, or submit anything on, **checkout.dodopayments.com** (the external hosted checkout).
- Enter any card / payment details anywhere.
- Complete Google or Apple OAuth (external identity providers) — stop at the provider redirect.

Viewing the public **Pricing** `/pricing` page is allowed (read-only); just do not click a purchase/upgrade CTA that leads to checkout.

---

## 5. Notes for Test Generation
- The app is a single-page app (client-side routing). Allow for async loading states after navigation and after file processing.
- File processing can take several seconds; wait for the success/download state rather than asserting immediately.
- Prefer small sample files to keep runs fast and reliable.
- Treat any uncaught console error, blank page, or non-200 page load as a failure worth reporting.
