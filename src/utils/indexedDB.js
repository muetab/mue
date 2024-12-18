const DB_NAME = 'StatsDB';
const DB_VERSION = 4; // Increment version for new store
const STORE_NAME = 'eventLog';
const CUSTOM_STORE_NAME = 'customImages';
const SESSION_STORE_NAME = 'sessionStats';

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Add tabId to the schema
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CUSTOM_STORE_NAME)) {
        db.createObjectStore(CUSTOM_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }

      // Add tabId index to eventLog store if it exists
      const store = event.target.transaction.objectStore(STORE_NAME);
      if (!store.indexNames.contains('tabId')) {
        store.createIndex('tabId', 'tabId', { unique: false });
      }

      if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
        db.createObjectStore(SESSION_STORE_NAME, { keyPath: 'tabId' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const addEvent = (event) => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(event);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
};

export const getEvents = (query) => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
};

// New methods for custom images
export const addCustomImage = (image) => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CUSTOM_STORE_NAME);
      const request = store.add(image);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
};

export const getCustomImages = () => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CUSTOM_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
};

export const deleteCustomImage = (id) => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CUSTOM_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
};

// Add new methods for session stats
export const updateSessionStats = (session) => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSION_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SESSION_STORE_NAME);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  });
};

export const getAllSessionStats = () => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSION_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SESSION_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  });
};

export const clearSessionStats = () => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSION_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SESSION_STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  });
};
