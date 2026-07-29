// 个性化学习路径推荐引擎
// 规则：1) 优先推荐掌握度<60%且未完成的知识点 2) 同学科优先补前置依赖 3) 跨学科均衡分配
import { storage } from './storage.js';
import { auth } from './auth.js';

const SUBJECTS = ['math', 'english', 'chinese'];
const SUBJECT_NAMES = { math: '数学', english: '英语', chinese: '语文' };
const MASTERY_THRESHOLD = 60; // 掌握度阈值

export const recommender = {
  // curriculum: 来自data/curriculum.json的结构 { subject: [ { id, name, level, deps:[], subject } ] }
  async loadCurriculum() {
    if (this._curriculum) return this._curriculum;
    const res = await fetch('./data/curriculum.json');
    this._curriculum = await res.json();
    return this._curriculum;
  },

  async getSubjectKps(subject) {
    const cur = await this.loadCurriculum();
    return cur[subject] || [];
  },

  // 推荐今日学习计划：3条路径
  async recommendToday() {
    const cur = await this.loadCurriculum();
    const user = auth.currentUser();
    const all = await storage.getAll('progress');
    const mine = all.filter(p => p.username === user.username);
    const progressMap = new Map(mine.map(p => [`${p.subject}_${p.kpId}`, p]));

    const candidates = [];
    for (const subject of SUBJECTS) {
      const kps = cur[subject] || [];
      for (const kp of kps) {
        const p = progressMap.get(`${subject}_${kp.id}`);
        const mastery = p ? p.mastery : 0;
        const total = p ? p.total : 0;
        // 前置依赖是否已掌握
        const depsReady = (kp.deps || []).every(depId => {
          const dp = progressMap.get(`${subject}_${depId}`);
          return dp && dp.mastery >= MASTERY_THRESHOLD;
        });
        candidates.push({ ...kp, subject, mastery, total, depsReady });
      }
    }

    // 优先级：掌握度<60 且 前置已就绪 的；再按 level 升序(基础先)
    const needLearn = candidates
      .filter(c => c.mastery < MASTERY_THRESHOLD && c.depsReady)
      .sort((a, b) => a.level - b.level || a.mastery - b.mastery);

    // 每科取1-2条，组成今日3条
    const bySubject = {};
    const picks = [];
    for (const c of needLearn) {
      if ((bySubject[c.subject] || 0) >= 2) continue;
      bySubject[c.subject] = (bySubject[c.subject] || 0) + 1;
      picks.push(c);
      if (picks.length >= 3) break;
    }
    // 不足3条则用任何候选补足
    if (picks.length < 3) {
      for (const c of needLearn) {
        if (picks.find(p => p.subject === c.subject && p.id === c.id)) continue;
        picks.push(c);
        if (picks.length >= 3) break;
      }
    }

    return picks.map(p => ({
      subject: p.subject,
      subjectName: SUBJECT_NAMES[p.subject],
      kpId: p.id,
      kpName: p.name,
      level: p.level,
      mastery: p.mastery,
      reason: p.total === 0 ? '尚未开始，建议入门' :
              p.mastery < 30 ? '掌握度较低，需重点巩固' :
              '接近达标，再练几题即可掌握'
    }));
  },

  // 雷达图数据：每科平均掌握度
  async radarData() {
    const cur = await this.loadCurriculum();
    const user = auth.currentUser();
    const all = await storage.getAll('progress');
    const mine = all.filter(p => p.username === user.username);
    const progressMap = new Map(mine.map(p => [`${p.subject}_${p.kpId}`, p]));

    return SUBJECTS.map(subject => {
      const kps = cur[subject] || [];
      if (!kps.length) return { subject, label: SUBJECT_NAMES[subject], mastery: 0, touched: 0, total: 0 };
      let sum = 0, touched = 0;
      for (const kp of kps) {
        const p = progressMap.get(`${subject}_${kp.id}`);
        sum += p ? p.mastery : 0;
        if (p && p.total > 0) touched++;
      }
      return {
        subject,
        label: SUBJECT_NAMES[subject],
        mastery: Math.round(sum / kps.length),
        touched,
        total: kps.length
      };
    });
  }
};
