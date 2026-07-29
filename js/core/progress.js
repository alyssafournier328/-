// 学习进度追踪 + 成就系统
import { storage } from './storage.js';
import { auth } from './auth.js';

// 成就定义
const ACHIEVEMENTS = [
  { id: 'first_login', name: '初入学堂', desc: '完成首次登录', icon: '🎓', condition: () => true },
  { id: 'streak_3', name: '三日不辍', desc: '连续学习3天', icon: '🔥', condition: (s) => s.streak >= 3 },
  { id: 'streak_7', name: '一周坚持', desc: '连续学习7天', icon: '⚡', condition: (s) => s.streak >= 7 },
  { id: 'streak_21', name: '习惯养成', desc: '连续学习21天', icon: '🏆', condition: (s) => s.streak >= 21 },
  { id: 'questions_50', name: '小试牛刀', desc: '累计完成50道题', icon: '✏️', condition: (s) => s.totalQuestions >= 50 },
  { id: 'questions_200', name: '勤学苦练', desc: '累计完成200道题', icon: '📝', condition: (s) => s.totalQuestions >= 200 },
  { id: 'questions_500', name: '题海达人', desc: '累计完成500道题', icon: '🌊', condition: (s) => s.totalQuestions >= 500 },
  { id: 'accuracy_80', name: '精准射手', desc: '正确率达80%(至少50题)', icon: '🎯', condition: (s) => s.totalQuestions >= 50 && s.accuracy >= 0.8 },
  { id: 'words_100', name: '词汇百关', desc: '掌握100个英语单词', icon: '📖', condition: (s) => s.wordsMastered >= 100 },
  { id: 'recite_5', name: '诗书五车', desc: '背诵5篇文章', icon: '📜', condition: (s) => s.recited >= 5 },
  { id: 'all_subjects', name: '全面发展', desc: '三科均有学习记录', icon: '🌟', condition: (s) => s.subjectsTouched >= 3 }
];

export const progress = {
  async init() { return this; },

  _key(subject, kpId) {
    return `${auth.currentUser().username}_${subject}_${kpId}`;
  },

  // 记录一次答题/学习行为
  async log(record) {
    const user = auth.currentUser();
    if (!user) return;
    const r = {
      username: user.username,
      ts: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      ...record
    };
    await storage.put('records', r);

    // 更新知识点维度进度
    if (record.subject && record.kpId) {
      const key = this._key(record.subject, record.kpId);
      const p = (await storage.get('progress', key)) || {
        key, username: user.username, subject: record.subject, kpId: record.kpId,
        total: 0, correct: 0, mastery: 0, lastTs: 0
      };
      p.total += 1;
      if (record.correct) p.correct += 1;
      p.lastTs = Date.now();
      // 掌握度：正确率 * 衰减因子(鼓励持续学习)
      const acc = p.total ? p.correct / p.total : 0;
      const countFactor = Math.min(1, p.total / 10); // 至少做10题才完全反映正确率
      p.mastery = Math.round(acc * countFactor * 100);
      await storage.put('progress', p);
    }

    // 触发成就检查
    await this.checkAchievements();
  },

  // 用户某学科所有知识点进度
  async subjectProgress(subject) {
    const all = await storage.getAll('progress');
    return all.filter(p => p.username === auth.currentUser().username && p.subject === subject);
  },

  // 全部进度
  async allProgress() {
    const all = await storage.getAll('progress');
    return all.filter(p => p.username === auth.currentUser().username);
  },

  // 学习统计概览
  async stats() {
    const all = await storage.getAll('records');
    const mine = all.filter(r => r.username === auth.currentUser().username);
    const totalQuestions = mine.filter(r => r.type === 'question').length;
    const correct = mine.filter(r => r.type === 'question' && r.correct).length;
    const wordsMastered = mine.filter(r => r.type === 'word' && r.correct).reduce((acc, r) => {
      acc.add(r.kpId); return acc;
    }, new Set()).size;
    const recited = mine.filter(r => r.type === 'recite' && r.passed).reduce((acc, r) => {
      acc.add(r.kpId); return acc;
    }, new Set()).size;
    const subjectsTouched = new Set(mine.map(r => r.subject)).size;

    // 连续学习天数
    const dates = Array.from(new Set(mine.map(r => r.date))).sort();
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dates.includes(today) || dates.includes(yesterday)) {
      let cur = dates.includes(today) ? today : yesterday;
      while (dates.includes(cur)) {
        streak++;
        cur = new Date(new Date(cur).getTime() - 86400000).toISOString().slice(0, 10);
      }
    }

    return {
      totalQuestions,
      correct,
      accuracy: totalQuestions ? correct / totalQuestions : 0,
      wordsMastered,
      recited,
      subjectsTouched,
      streak,
      totalRecords: mine.length,
      todayCount: mine.filter(r => r.date === today).length
    };
  },

  // 成就检查与解锁
  async checkAchievements() {
    const s = await this.stats();
    const unlocked = [];
    for (const ach of ACHIEVEMENTS) {
      const key = `${auth.currentUser().username}_${ach.id}`;
      const got = await storage.get('achievements', key);
      if (!got && ach.condition(s)) {
        await storage.put('achievements', { key, id: ach.id, ts: Date.now() });
        unlocked.push(ach);
      }
    }
    return unlocked;
  },

  async achievements() {
    const all = await storage.getAll('achievements');
    const mine = new Set(all.filter(a => a.key.startsWith(auth.currentUser().username + '_')).map(a => a.id));
    return ACHIEVEMENTS.map(a => ({ ...a, unlocked: mine.has(a.id) }));
  },

  achievementDefs() { return ACHIEVEMENTS; }
};
