const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({ error: 'unserializable', message: error.message });
  }
};

const formatMeta = (meta) => {
  if (meta === undefined || meta === null) {
    return '';
  }

  if (typeof meta === 'string') {
    return ` ${meta}`;
  }

  return ` ${safeStringify(meta)}`;
};

const write = (level, scope, message, meta) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
  };

  if (meta !== undefined) {
    entry.meta = meta;
  }

  const line = safeStringify(entry);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
};

const logger = {
  info(scope, message, meta) {
    write('info', scope, message, meta);
  },
  warn(scope, message, meta) {
    write('warn', scope, message, meta);
  },
  error(scope, message, meta) {
    write('error', scope, message, meta);
  },
  debug(scope, message, meta) {
    if (process.env.LOG_LEVEL === 'debug') {
      write('debug', scope, message, meta);
    }
  },
  request(scope, req, meta) {
    write('info', scope, `${req.method} ${req.originalUrl}`, meta);
  },
};

module.exports = logger;
