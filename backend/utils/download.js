const fs = require('fs');

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));

const downloadSourceExists = async (source) => {
  if (!source) return false;

  if (isAbsoluteUrl(source)) {
    try {
      const response = await fetch(source, { method: 'HEAD' });
      if (response.ok) return true;

      const fallback = await fetch(source, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' }
      });

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
    const response = await fetch(source);
    if (!response.ok) {
      return res.status(404).json({ success: false, message: 'Fichier distant introuvable.' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || mimeType;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(Buffer.from(arrayBuffer));
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