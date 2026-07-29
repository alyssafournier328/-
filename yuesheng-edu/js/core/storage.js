// IndexedDB 存储封装 - 离线优先
const DB_NAME = 'yuesheng_edu';
const DB_VERSION = 2;

const STORES = {
  users: { keyPath: 'username' },        // 用户账号
  currentUser: { keyPath: 'id' },        // 当前登录态(单条 id:'current')
  progress: { keyPath: 'key' },          // 学习进度 key=`${user}_${subject}_${kpId}`
  records: { keyPath: 'id', autoIncrement: true }, // 学习记录(做题/背诵)
  achievements: { keyPath: 'key' },       // 成就 key=`${user}_${achId}`
  settings: { keyPath: 'key' },           // 全局设置
  posts: { keyPath: 'id', autoIncrement: true } // 社区帖子(含回复内嵌)
};

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      for (const [name, cfg] of Object.entries(STORES)) {
        if (!d.objectStoreNames.contains(name)) {
          d.createObjectStore(name, { keyPath: cfg.keyPath, autoIncrement: cfg.autoIncrement || false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

function req2promise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const storage = {
  async init() {
    if (!db) db = await openDB();
    return this;
  },

  async get(store, key) {
    return req2promise(tx(store).get(key));
  },
  async getAll(store) {
    return req2promise(tx(store).getAll());
  },
  async put(store, value) {
    return req2promise(tx(store, 'readwrite').put(value));
  },
  async delete(store, key) {
    return req2promise(tx(store, 'readwrite').delete(key));
  },
  async clear(store) {
    return req2promise(tx(store, 'readwrite').clear());
  },

  // 按索引范围查询(用于records按用户筛选)
  async queryByIndex(store, indexName, value) {
    const idx = tx(store).index(indexName);
    return req2promise(idx.getAll(value));
  },

  // 批量写入
  async bulkPut(store, items) {
    const t = db.transaction(store, 'readwrite');
    const os = t.objectStore(store);
    items.forEach(it => os.put(it));
    return new Promise((resolve, reject) => {
      t.oncomplete = () => resolve(true);
      t.onerror = () => reject(t.error);
    });
  }
};
