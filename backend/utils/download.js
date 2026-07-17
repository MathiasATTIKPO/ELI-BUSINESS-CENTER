const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');
const { getCloudinaryConfig } = require('../services/cloudinary');

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));
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

  // Works for protected raw files (PDF, receipts, contracts) and keeps public files unaffected.
  return cloudinary.utils.private_download_url(info.publicId, info.format, {
    resource_type: info.resourceType || 'raw',
    type: 'upload',
    expires_at: expiresAt,
    attachment: false,
  });
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

  if ((response.status === 401 || response.status === 403) && isCloudinaryUrl(source)) {
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
  if (!source) return false;

  if (isAbsoluteUrl(source)) {
    try {
      const head = await fetch(source, { method: 'HEAD' });
      if (head.ok) return true;

      const fallback = await fetchRemoteBuffer(source);
      return fallback.ok;
    } catch (error) {
      return false;
    }
  }

  return fs.existsSync(source);
};

const sendAttachment = async (res, source, fileName, mimeType = 'application/pdf') => {
  if (!source) {
    return res.status(404).json({ success: false, message: 'Fichier introuvable.' });
  }

  if (isAbsoluteUrl(source)) {
    const remote = await fetchRemoteBuffer(source);
    if (!remote.ok) {
      return res.status(404).json({ success: false, message: 'Fichier distant introuvable.' });
    }

    res.setHeader('Content-Type', remote.contentType || mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(remote.buffer);
  }

  if (!fs.existsSync(source)) {
    return res.status(404).json({ success: false, message: 'Fichier local introuvable.' });
  }

  return res.download(source, fileName);
};

module.exports = {
  downloadSourceExists,
  sendAttachment,
};