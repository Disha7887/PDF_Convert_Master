---
name: pdf-lib embedJpg needs JFIF header
description: Why images-to-PDF re-encodes JPEGs through sharp before pdf-lib embedJpg
---

`pdf-lib`'s `embedJpg(buffer)` throws **"SOI not found in JPEG"** for JPEGs that
lack a JFIF/APP0 marker — even when the bytes are a valid baseline JPEG starting
with `0xFFD8`. Sharp's own `.jpeg()` output omits APP0, so feeding a raw uploaded
(or sharp-produced) JPEG straight into `embedJpg` fails.

**Rule:** in `combineImagesToPdf` (api-server), re-encode JPEGs via
`sharp(buf).jpeg().toBuffer()` before `embedJpg` (this *adds* the JFIF header),
and normalize every other format (png/webp/gif/bmp/tiff) to PNG via
`sharp(buf).png().toBuffer()` + `embedPng` (pdf-lib's embedPng is also picky
about exotic PNG color types).

**Why:** real phone photos usually carry EXIF/APP0 so embedJpg often works in the
wild, which masks the bug; sharp-generated test images expose it. Re-encoding
keeps photos as compact JPEG instead of bloating every page to PNG.

**How to apply:** any pdf-lib image embedding path — don't trust that a
format-sniffed "jpeg" buffer is embeddable as-is; round-trip through sharp first.
