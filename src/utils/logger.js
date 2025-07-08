const logLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

let currentLevel = process.env.NODE_ENV === 'production' ? logLevels.INFO : logLevels.DEBUG;

const logger = {
  debug: (message, ...args) => {
    if (currentLevel <= logLevels.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (currentLevel <= logLevels.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (currentLevel <= logLevels.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  error: (message, ...args) => {
    if (currentLevel <= logLevels.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  setLevel: (level) => {
    if (typeof level === 'string' && logLevels[level] !== undefined) {
      currentLevel = logLevels[level];
    } else if (typeof level === 'number') {
      currentLevel = level;
    }
  },
  
  getLevel: () => {
    return Object.keys(logLevels).find(key => logLevels[key] === currentLevel);
  }
};

// Make logger available globally in development
if (process.env.NODE_ENV === 'development') {
  window.logger = logger;
}

export default logger;
