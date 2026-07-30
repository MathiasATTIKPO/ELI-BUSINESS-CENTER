const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { getCloudinaryConfig } = require('../services/cloudinary');

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));
const backendRoot = path.resolve(__dirname, '..');

const getSourceCandidates = (source) => {
  const values = Array.isArray(source) ? source : [source];
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
};

const resolveLocalSource = (source) => {
  const value = String(source || '').trim();
  if (!value || isAbsoluteUrl(value)) return '';

  // Local development stores generated files under backend/uploads while the
  // database may contain either an absolute path or a public /uploads URL.
  if (/^[\\/]?uploads[\\/]/i.test(value)) {
    const relativeUploadPath = value.replace(/^[\\/]+/, '');
    const resolved = path.resolve(backendRoot, relativeUploadPath);
    const uploadsRoot = path.resolve(backendRoot, 'uploads');
    if (resolved === uploadsRoot || resolved.startsWith(`${uploadsRoot}${path.sep}`)) {
      return resolved;
    }
    return '';
  }

  return path.isAbsolute(value) ? path.normalize(value) : value;
};

const isCloudinaryUrl = (value) => {
  try {
    const parsed = new URL(String(value || ''));
    return /(^|\.)cloudinary\.com$/i.test(parsed.hostname);
  } catch (error) {
    return false;
  }
};

let cloudinaryConfigured = false;
const ensureCloudinaryConfigured = () => {
  if (cloudinaryConfigured) return true;

  const cfg = getCloudinaryConfig();
  if (!cfg) return false;

  cloudinary.config(cfg);
  cloudinaryConfigured = true;
  return true;
};

const extractCloudinaryAssetInfo = (source) => {
  try {
    const parsed = new URL(source);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    const resourceType = uploadIndex > 0 ? parts[uploadIndex - 1] : 'raw';
    const afterUpload = parts.slice(uploadIndex + 1);
    const normalized = afterUpload[0] && /^v\d+$/i.test(afterUpload[0])
      ? afterUpload.slice(1)
      : afterUpload;

    if (!normalized.length) return null;

    const publicIdWithExt = normalized.join('/');
    const dot = publicIdWithExt.lastIndexOf('.');
    const hasFormat = dot > -1;
    const publicId = hasFormat ? publicIdWithExt.slice(0, dot) : publicIdWithExt;
    const format = hasFormat ? publicIdWithExt.slice(dot + 1) : undefined;

    return {
      resourceType,
      publicId,
      format,
    };
  } catch (error) {
    return null;
  }
};

const getCloudinarySignedUrl = (source) => {
  if (!isCloudinaryUrl(source) || !ensureCloudinaryConfigured()) return null;

  const info = extractCloudinaryAssetInfo(source);
  if (!info?.publicId) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + (5 * 60);

  try {
    // Works for protected raw files (PDF, receipts, contracts) and keeps public files unaffected.
    return cloudinary.utils.private_download_url(info.publicId, info.format, {
      resource_type: info.resourceType || 'raw',
      type: 'upload',
      expires_at: expiresAt,
      attachment: false,
    });
  } catch (error) {
    return null;
  }
};

const fetchRemoteBuffer = async (source) => {
  const response = await fetch(source);
  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    return {
      ok: true,
      status: response.status,
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      buffer: Buffer.from(arrayBuffer),
    };
  }

  if (isCloudinaryUrl(source)) {
    const signedUrl = getCloudinarySignedUrl(source);
    if (signedUrl) {
      const signedResponse = await fetch(signedUrl);
      if (signedResponse.ok) {
        const arrayBuffer = await signedResponse.arrayBuffer();
        return {
          ok: true,
          status: signedResponse.status,
          contentType: signedResponse.headers.get('content-type') || 'application/octet-stream',
          buffer: Buffer.from(arrayBuffer),
        };
      }
      return { ok: false, status: signedResponse.status };
    }
  }

  return { ok: false, status: response.status };
};

const downloadSourceExists = async (source) => {
  const candidates = getSourceCandidates(source);
  if (!candidates.length) return false;

  for (const candidate of candidates) {
    if (isAbsoluteUrl(candidate)) {
      try {
        const head = await fetch(candidate, { method: 'HEAD' });
        if (head.ok) return true;

        const fallback = await fetchRemoteBuffer(candidate);
        if (fallback.ok) return true;
      } catch (error) {
        // Try the next persisted source (for example a local development copy).
      }
      continue;
    }

    const localSource = resolveLocalSource(candidate);
    if (localSource && fs.existsSync(localSource)) return true;
  }

  return false;
};

const sendAttachment = async (res, source, fileName, mimeType = 'application/pdf') => {
  const candidates = getSourceCandidates(source);
  if (!candidates.length) {
    return res.status(404).json({ success: false, message: 'Fichier introuvable.' });
  }

  for (const candidate of candidates) {
    if (isAbsoluteUrl(candidate)) {
      try {
        const remote = await fetchRemoteBuffer(candidate);
        if (remote.ok) {
          res.setHeader('Content-Type', remote.contentType || mimeType);
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          return res.send(remote.buffer);
        }
      } catch (error) {
        // A stale remote URL must not hide another valid persisted source.
      }
      continue;
    }

    const localSource = resolveLocalSource(candidate);
    if (localSource && fs.existsSync(localSource)) {
      return res.download(localSource, fileName);
    }
  }

  return res.status(404).json({ success: false, message: 'Fichier introuvable dans le stockage.' });
};

module.exports = {
  downloadSourceExists,
  sendAttachment,
};
