// 本地账号系统 - 同步哈希(本地学习应用，无需密码学强度)
import { storage } from './storage.js';

// djb2 变种同步哈希，避免依赖 crypto.subtle(非安全上下文不可用)
function hashPwd(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h) + text.charCodeAt(i);
    h = h & 0xffffffff;
  }
  return 'h_' + (h >>> 0).toString(16);
}

export const auth = {
  _user: null,

  async init() {
    const cur = await storage.get('currentUser', 'current');
    if (cur) {
      const u = await storage.get('users', cur.username);
      this._user = u || null;
    }
    return this;
  },

  currentUser() { return this._user; },

  async register(username, password, nickname) {
    username = (username || '').trim();
    if (username.length < 2) throw new Error('用户名至少2个字符');
    if (password.length < 4) throw new Error('密码至少4位');
    const exists = await storage.get('users', username);
    if (exists) throw new Error('用户名已存在');
    const user = {
      username,
      password: hashPwd(password),
      nickname: nickname || username,
      grade: '初二升初三',
      targetScore: { math: 90, english: 90, chinese: 90 },
      createdAt: Date.now()
    };
    await storage.put('users', user);
    return this._loginInternal(user);
  },

  async login(username, password) {
    const user = await storage.get('users', username);
    if (!user) throw new Error('用户不存在');
    const hash = hashPwd(password);
    if (hash !== user.password) throw new Error('密码错误');
    return this._loginInternal(user);
  },

  async _loginInternal(user) {
    this._user = user;
    await storage.put('currentUser', { id: 'current', username: user.username, ts: Date.now() });
    return user;
  },

  async logout() {
    this._user = null;
    await storage.delete('currentUser', 'current');
  },

  async update(patch) {
    if (!this._user) return;
    Object.assign(this._user, patch);
    await storage.put('users', this._user);
  }
};
