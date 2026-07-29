// 英语学科 UI 模块 (ES6 模块)
// 涵盖 词汇 / 语法 / 听力 / 口语 四大模块
// 依赖: englishEngine / recommender / progress; 全局 window.App 与 window.navigate
//
// 路由入口: renderEnglish(params)
//   params.module: 'vocab' | 'grammar' | 'listening' | 'speaking' | undefined(学科首页)
//   params.kpId:   语法模块指定知识点时传入
//   params.level:  词汇/听力模块指定级别时传入 (1/2/3)

import { englishEngine } from '../../content/english-engine.js';
import { recommender } from '../../core/recommender.js';
import { progress } from '../../core/progress.js';

const { toast } = window.App;
// 局部查询工具: $ 单个, $$ 数组 (支持指定 root)
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ==================== 常量 ====================

// 四大模块定义 (首页卡片)
const MODULES = [
  { key: 'vocab',     icon: '📖', name: '词汇积累', desc: '1700+ 考纲词汇·看中选英/拼写/听写' },
  { key: 'dictation', icon: '✍️', name: '首字母默写', desc: '350+ 高频词·听写默写·分类练习' },
  { key: 'grammar',   icon: '✏️', name: '语法练习', desc: '14个核心语法知识点·讲解+练习' },
  { key: 'listening', icon: '🎧', name: '听力训练', desc: '听录音选意思·可调速重播' },
  { key: 'speaking',  icon: '🎤', name: '口语跟读', desc: '语音识别打分·纠正发音' }
];

// 首字母默写分类
const DICTATION_CATS = [
  { key: 'all',  name: '全部', icon: '📚' },
  { key: 'verb', name: '动词', icon: '🏃' },
  { key: 'noun', name: '名词', icon: '📦' },
  { key: 'adj',  name: '形容词', icon: '🎨' },
  { key: 'adv',  name: '副词', icon: '⏱️' }
];

// 词汇级别 (short 用于 kpId: vocab_${short})
const LEVELS = [
  { n: 1, name: 'L1 基础', short: 'base',  kp: 'vocab_base',  desc: '日常高频词·零基础起步' },
  { n: 2, name: 'L2 进阶', short: 'inter', kp: 'vocab_inter', desc: '初中核心词汇·承上启下' },
  { n: 3, name: 'L3 高阶', short: 'adv',   kp: 'vocab_adv',   desc: '拓展提升词汇·冲刺高分' }
];

// 听力级别
const LISTEN_LEVELS = [
  { n: 1, name: 'L1 基础', desc: '短句·慢速·日常表达' },
  { n: 2, name: 'L2 进阶', desc: '中等长度·含基本时态' },
  { n: 3, name: 'L3 高阶', desc: '复合句·含从句与被动' }
];

// 口语跟读内置简单句库
const SPEAK_SENTENCES = [
  'I am a student.',
  'She is my best friend.',
  'I go to school every day.',
  'He likes playing basketball.',
  'We are very happy today.',
  'The book is on the desk.',
  'I want to improve my English.',
  'Knowledge is power.',
  'Practice makes perfect.',
  'I can do it if I try hard.'
];

// ==================== 主入口 ====================

// 内部导航参数暂存 (兼容路由层不透传 params 的情况)
let _navParams = null;

// 内部跳转: 暂存 params 并触发路由
function navEnglish(params = {}) {
  _navParams = params;
  window.navigate('english', params);
}

export function renderEnglish(params = {}) {
  const view = $('#view');
  // 优先用直接传入的 params; 否则取内部导航暂存参数
  let p = (params && Object.keys(params).length) ? params : (_navParams || {});
  _navParams = null;
  // 仅有 kpId 未指定 module 时, 默认进入语法学习页
  if (p.kpId && !p.module) p = { ...p, module: 'grammar' };
  switch (p.module) {
    case 'vocab':     return renderVocab(view, p);
    case 'dictation': return renderDictation(view, p);
    case 'grammar':   return renderGrammar(view, p);
    case 'listening': return renderListening(view, p);
    case 'speaking':  return renderSpeaking(view, p);
    default:          return renderHome(view);
  }
}

// 返回英语首页 (停止可能的朗读/识别)
function backToEnglish() {
  try { englishEngine.stopSpeak(); } catch (e) { /* 忽略 */ }
  try { englishEngine.stopRecognition(); } catch (e) { /* 忽略 */ }
  window.navigate('english');
}

// ==================== 学科首页 ====================

async function renderHome(view) {
  view.innerHTML = `
    <div class="page-head">
      <div class="page-title">英语</div>
      <div class="page-sub">听说读写·从零开始</div>
    </div>

    <div class="grid grid-2" id="moduleGrid">
      ${MODULES.map(m => `
        <div class="card clickable" data-m="${m.key}" style="cursor:pointer;">
          <div style="font-size:34px;">${m.icon}</div>
          <div class="card-title" style="margin-top:6px;">${m.name}</div>
          <div class="tiny" style="color:var(--c-text-2);margin-top:2px;line-height:1.5;">${m.desc}</div>
          <button class="btn btn-sm btn-ghost" style="margin-top:10px;">进入</button>
        </div>
      `).join('')}
    </div>

    <h2 class="section-title" style="margin-top:22px;">语法知识点快速入口</h2>
    <div class="col" id="recentList">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;

  // 模块卡片点击
  $$('#moduleGrid [data-m]').forEach(card => {
    card.onclick = () => navEnglish({ module: card.dataset.m });
  });

  // 语法知识点快速入口 (按 level 分组)
  const list = $('#recentList');
  try {
    const kps = await recommender.getSubjectKps('english');
    const grammarKps = kps.filter(kp => !String(kp.id).startsWith('vocab_'));
    if (!grammarKps.length) {
      list.innerHTML = '<p class="muted tiny">暂无语法知识点</p>';
    } else {
      const byLevel = {};
      grammarKps.forEach(kp => { (byLevel[kp.level] = byLevel[kp.level] || []).push(kp); });
      list.innerHTML = Object.keys(byLevel).sort().map(lv => `
        <div style="margin-bottom:10px;">
          <div class="tiny" style="color:var(--c-text-3);margin:6px 2px;">L${lv} 级</div>
          ${byLevel[lv].map(kp => `
            <div class="kp-item" data-kp="${kp.id}">
              <span class="level-badge level-${kp.level}">L${kp.level}</span>
              <div class="kp-info">
                <div class="kp-name">${escapeHtml(kp.name)}</div>
                <div class="kp-meta">${escapeHtml(kp.desc || '')}</div>
              </div>
              <span class="tag">去学习</span>
            </div>
          `).join('')}
        </div>
      `).join('');
      $$('#recentList [data-kp]').forEach(item => {
        item.onclick = () => navEnglish({ module: 'grammar', kpId: item.dataset.kp });
      });
    }
  } catch (e) {
    list.innerHTML = '<p class="muted tiny">知识点加载失败</p>';
  }
}

// ==================== 词汇模块 ====================

async function renderVocab(view, params) {
  view.innerHTML = `
    <div class="page-head">
      <button class="btn btn-ghost btn-sm" id="backBtn">← 返回英语</button>
      <div class="page-title" style="margin-top:10px;">📖 词汇积累</div>
      <div class="page-sub">选择级别开始背单词·逐词学习与练习</div>
    </div>
    <div id="vocabBody"></div>
  `;
  $('#backBtn', view).onclick = backToEnglish;
  const body = $('#vocabBody', view);

  const level = Number(params.level);
  if (!level) {
    renderVocabLevelPicker(body);
  } else {
    await startVocabLearn(body, level);
  }
}

// ==================== 首字母默写模块 ====================
async function renderDictation(view, params) {
  view.innerHTML = `
    <div class="page-head">
      <button class="btn btn-ghost btn-sm" id="backBtn">← 返回英语</button>
      <div class="page-title" style="margin-top:10px;">✍️ 首字母默写</div>
      <div class="page-sub">根据首字母与中文提示,拼写完整单词</div>
    </div>
    <div id="dictBody"></div>
  `;
  $('#backBtn', view).onclick = backToEnglish;
  const body = $('#dictBody', view);

  const cat = params.category || 'all';
  if (cat === 'all' && !params.start) {
    renderDictationCatPicker(body);
  } else {
    await startDictationLearn(body, cat);
  }
}

function renderDictationCatPicker(body) {
  body.innerHTML = `
    <div class="row wrap mb-m" style="gap:8px;">
      ${DICTATION_CATS.map(c => `
        <button class="btn btn-outline" data-cat="${c.key}">${c.icon} ${c.name}</button>
      `).join('')}
    </div>
    <div id="catInfo" class="card mb-l" style="background:#f5f8ff;border:1px solid #dde6ff;">
      <p class="muted tiny" style="line-height:1.7;">首字母默写是上海中考英语的高频考点。根据首字母 + 词性 + 中文释义,补全完整单词。点击上方分类开始练习。</p>
    </div>
  `;
  $$('[data-cat]', body).forEach(btn => {
    btn.onclick = () => navEnglish({ module: 'dictation', category: btn.dataset.cat, start: 1 });
  });
}

async function startDictationLearn(body, category) {
  const list = await englishEngine.getDictationList(category);
  if (!list.length) {
    body.innerHTML = `<div class="empty-state"><div class="emoji">📭</div><p>暂无此类题目</p></div>`;
    return;
  }
  // 随机打乱后取 20 题
  const shuffled = list.slice().sort(() => Math.random() - 0.5).slice(0, 20);
  let idx = 0;
  let correct = 0;
  const catName = (DICTATION_CATS.find(c => c.key === category) || {}).name || '全部';

  function renderQuestion() {
    if (idx >= shuffled.length) {
      const passed = correct / shuffled.length >= 0.6;
      body.innerHTML = `
        <div class="card center" style="flex-direction:column;padding:24px;">
          <div style="font-size:42px;">${passed ? '🎉' : '💪'}</div>
          <h3 class="card-title mt-s">默写完成</h3>
          <div style="font-size:18px;font-weight:700;margin:8px 0;">${correct} / ${shuffled.length} 正确</div>
          <p class="muted">${passed ? '表现优秀,继续巩固!' : '多读多记,下次更好!'}</p>
          <div class="row wrap mt-s" style="gap:8px;justify-content:center;">
            <button class="btn" id="againBtn">再来一轮</button>
            <button class="btn btn-outline" id="backBtn2">返回分类</button>
          </div>
        </div>
      `;
      $('#againBtn', body).onclick = () => startDictationLearn(body, category);
      $('#backBtn2', body).onclick = () => navEnglish({ module: 'dictation' });
      return;
    }
    const item = shuffled[idx];
    const display = (item.word || '').replace(/\?/g, '_');
    body.innerHTML = `
      <div class="card mb-m" style="background:linear-gradient(135deg,#fff8e6,#fff);">
        <div class="between">
          <div>
            <span class="tag tag-warning">${catName}</span>
            <span class="tiny muted" style="margin-left:6px;">第 ${idx + 1} / ${shuffled.length} 题</span>
          </div>
          <div class="tiny">正确: ${correct}</div>
        </div>
        <div style="font-size:28px;font-weight:700;margin:14px 0 6px;letter-spacing:2px;">
          ${item.first_letter.toUpperCase()}<span style="color:#888;">${'_ '.repeat(Math.max(2, display.length - 1)).trim()}</span>
        </div>
        <div class="tiny muted" style="margin-bottom:6px;">(${item.pos}. ) ${item.meaning}</div>
      </div>
      <div class="card">
        <input class="input" id="dictInput" placeholder="请输入完整单词" autocomplete="off" autocapitalize="off" autocorrect="off" />
        <div class="row mt-s" style="gap:8px;">
          <button class="btn" id="dictSubmit">提交</button>
          <button class="btn btn-ghost" id="dictSkip">跳过</button>
          <button class="btn btn-ghost" id="dictHint" style="margin-left:auto;">💡 提示(${item.word.length} 字母)</button>
        </div>
        <div id="dictResult" class="mt-s"></div>
      </div>
    `;
    const input = $('#dictInput', body);
    input.focus();
    const doSubmit = () => {
      const user = (input.value || '').trim().toLowerCase();
      const target = (item.word || '').toLowerCase();
      if (!user) { toast('请输入答案'); return; }
      const isCorrect = user === target;
      if (isCorrect) correct++;
      input.disabled = true;
      input.style.borderColor = isCorrect ? 'var(--c-success)' : 'var(--c-danger)';
      input.style.background = isCorrect ? '#e3f7ee' : '#ffe6e6';
      $('#dictResult', body).innerHTML = `
        <div class="card" style="background:${isCorrect ? '#e3f7ee' : '#ffe6e6'};">
          <strong>${isCorrect ? '✅ 正确' : '❌ 错误'}</strong>
          <div class="tiny mt-s">正确答案: <b>${item.word}</b> (${item.pos}. ${item.meaning})</div>
          <button class="btn btn-block mt-s" id="nextBtn">${idx + 1 < shuffled.length ? '下一题' : '查看结果'}</button>
        </div>
      `;
      progress.log({
        type: 'dictation',
        subject: 'english',
        kpId: 'dictation_' + (item.category || 'all'),
        correct: isCorrect,
        detail: { word: item.word, user, category: item.category }
      });
      $('#nextBtn', body).onclick = () => { idx++; renderQuestion(); };
    };
    $('#dictSubmit', body).onclick = doSubmit;
    $('#dictSkip', body).onclick = () => { idx++; renderQuestion(); };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSubmit(); });
  }
  renderQuestion();
}

function renderVocabLevelPicker(body) {
  body.innerHTML = `
    <div class="grid grid-3">
      ${LEVELS.map(lv => `
        <div class="card clickable" data-level="${lv.n}" style="cursor:pointer;">
          <span class="level-badge level-${lv.n}">L${lv.n}</span>
          <div class="card-title" style="margin-top:8px;">${lv.name}</div>
          <div class="tiny" style="color:var(--c-text-2);margin-top:4px;">${lv.desc}</div>
          <button class="btn btn-sm btn-ghost" style="margin-top:10px;">开始学习</button>
        </div>
      `).join('')}
    </div>
  `;
  $$('#vocabBody [data-level]').forEach(card => {
    card.onclick = () => navEnglish({ module: 'vocab', level: Number(card.dataset.level) });
  });
}

async function startVocabLearn(body, level) {
  const lv = LEVELS.find(l => l.n === level) || LEVELS[0];
  body.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  let words = [];
  try {
    words = await englishEngine.getWordsByLevel(level);
  } catch (e) {
    body.innerHTML = '<p class="muted">词库加载失败，请稍后重试</p>';
    return;
  }
  if (!words.length) {
    body.innerHTML = '<p class="muted">该级别暂无词汇</p>';
    return;
  }
  const list = shuffle(words);
  await showVocabWord(body, list, 0, lv);
}

async function showVocabWord(body, list, idx, lv) {
  // 全部学完
  if (idx >= list.length) {
    body.innerHTML = `
      <div class="card center" style="padding:30px;">
        <div style="font-size:40px;">🎉</div>
        <p style="margin-top:8px;">本级别词汇已全部学完！</p>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
          <button class="btn btn-ghost" id="againBtn">再来一轮</button>
          <button class="btn btn-outline" id="backLvBtn">返回选级</button>
        </div>
      </div>
    `;
    $('#againBtn', body).onclick = () => navEnglish({ module: 'vocab', level: lv.n });
    $('#backLvBtn', body).onclick = () => navEnglish({ module: 'vocab' });
    return;
  }

  const w = list[idx];
  body.innerHTML = `
    <div class="tiny" style="margin-bottom:8px;color:var(--c-text-3);">进度：第 ${idx + 1} / ${list.length} 词 · ${lv.name}</div>
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
        <span style="font-size:26px;font-weight:700;">${escapeHtml(w.word)}</span>
        <span class="tiny" style="color:var(--c-text-3);">${escapeHtml(w.phonetic || '')}</span>
        <span class="tag tag-muted">${escapeHtml(w.pos || '')}</span>
        <button class="btn btn-ghost btn-sm" id="speakWordBtn" style="margin-left:auto;">🔊 朗读</button>
      </div>
      <div style="margin-top:10px;font-size:15px;">${escapeHtml(w.meaning || '')}</div>
      ${w.sentence ? `
        <div style="margin-top:10px;padding:10px;background:var(--c-primary-light);border-radius:8px;">
          <div style="font-size:14px;">${escapeHtml(w.sentence)}</div>
          ${w.sentenceCn ? `<div class="tiny" style="margin-top:4px;color:var(--c-text-2);">${escapeHtml(w.sentenceCn)}</div>` : ''}
        </div>
      ` : ''}
    </div>

    <div class="tiny" style="margin-bottom:6px;color:var(--c-text-2);">选择一种练习模式：</div>
    <div class="grid grid-2" id="modeBox">
      <button class="btn btn-outline" data-mode="cn2en">看中文选英文</button>
      <button class="btn btn-outline" data-mode="en2cn">看英文选中文</button>
      <button class="btn btn-outline" data-mode="spell">拼写单词</button>
      <button class="btn btn-outline" data-mode="listen">听写</button>
    </div>

    <div id="qzone" style="margin-top:14px;"></div>
  `;

  // 单词朗读按钮
  $('#speakWordBtn', body).onclick = async (e) => {
    const btn = e.currentTarget;
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = '播放中...';
    const ok = await englishEngine.speak(w.word, { rate: 1 });
    btn.disabled = false;
    btn.textContent = old;
    if (!ok) toast('语音朗读不可用，请检查浏览器设置');
  };

  // 等待用户选择练习模式
  const mode = await new Promise(resolve => {
    $$('#modeBox [data-mode]').forEach(b => {
      b.onclick = () => resolve(b.dataset.mode);
    });
  });

  // 生成并渲染练习题
  const q = englishEngine.generateVocabExercise(w, mode);
  // 不同模式的音频配置 (cn2en 不放音避免泄露答案; listen 自动播放)
  const audioMap = {
    cn2en: null,
    en2cn: { text: w.word },
    spell: { text: w.word },
    listen: { text: w.word, autoPlay: true }
  };
  const audio = audioMap[mode] || null;

  const qzone = $('#qzone', body);
  await renderQuestion(qzone, q, {
    audio,
    onSubmitted: (r) => {
      progress.log({
        type: 'word',
        subject: 'english',
        kpId: lv.kp,
        correct: r.correct,
        detail: { word: w.word, type: mode }
      });
    }
  });

  // 下一词
  await showVocabWord(body, list, idx + 1, lv);
}

// ==================== 语法模块 ====================

async function renderGrammar(view, params) {
  if (params.kpId) {
    await renderGrammarLearn(view, params.kpId);
  } else {
    await renderGrammarList(view);
  }
}

async function renderGrammarList(view) {
  view.innerHTML = `
    <div class="page-head">
      <button class="btn btn-ghost btn-sm" id="backBtn">← 返回英语</button>
      <div class="page-title" style="margin-top:10px;">✏️ 语法练习</div>
      <div class="page-sub">14 个核心语法知识点·讲解+练习</div>
    </div>
    <div id="grammarList"><div class="loading"><div class="spinner"></div></div></div>
  `;
  $('#backBtn', view).onclick = backToEnglish;
  const box = $('#grammarList', view);
  try {
    const kps = await recommender.getSubjectKps('english');
    const grammarKps = kps.filter(kp => !String(kp.id).startsWith('vocab_'));
    if (!grammarKps.length) {
      box.innerHTML = '<p class="muted">暂无语法知识点</p>';
      return;
    }
    const byLevel = {};
    grammarKps.forEach(kp => { (byLevel[kp.level] = byLevel[kp.level] || []).push(kp); });
    box.innerHTML = Object.keys(byLevel).sort().map(lv => `
      <div style="margin-bottom:14px;">
        <div class="tiny" style="color:var(--c-text-3);margin:8px 2px;">L${lv} 级</div>
        <div class="col">
          ${byLevel[lv].map(kp => `
            <div class="kp-item" data-kp="${kp.id}">
              <span class="level-badge level-${kp.level}">L${kp.level}</span>
              <div class="kp-info">
                <div class="kp-name">${escapeHtml(kp.name)}</div>
                <div class="kp-meta">${escapeHtml(kp.desc || '')}</div>
              </div>
              <span class="tag">去学习</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    $$('#grammarList [data-kp]').forEach(item => {
      item.onclick = () => navEnglish({ module: 'grammar', kpId: item.dataset.kp });
    });
  } catch (e) {
    box.innerHTML = '<p class="muted">知识点加载失败</p>';
  }
}

async function renderGrammarLearn(view, kpId) {
  // 取知识点名称
  let kpName = kpId;
  try {
    const kps = await recommender.getSubjectKps('english');
    const found = kps.find(k => k.id === kpId);
    if (found) kpName = found.name;
  } catch (e) { /* 忽略 */ }

  view.innerHTML = `
    <div class="page-head">
      <button class="btn btn-ghost btn-sm" id="backBtn">← 返回语法</button>
      <div class="page-title" style="margin-top:10px;">✏️ ${escapeHtml(kpName)}</div>
    </div>
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost" id="tabLesson">讲解</button>
        <button class="btn btn-outline" id="tabPractice">练习</button>
      </div>
    </div>
    <div id="panel"></div>
  `;
  $('#backBtn', view).onclick = () => navEnglish({ module: 'grammar' });

  const panel = $('#panel', view);
  const tabLesson = $('#tabLesson', view);
  const tabPractice = $('#tabPractice', view);

  const showLesson = () => {
    tabLesson.className = 'btn btn-ghost';
    tabPractice.className = 'btn btn-outline';
    const html = englishEngine.getGrammarLesson(kpId);
    panel.innerHTML = `<div class="card" style="line-height:1.8;">${html}</div>`;
  };
  const showPractice = () => {
    tabLesson.className = 'btn btn-outline';
    tabPractice.className = 'btn btn-ghost';
    startGrammarPractice(panel, kpId, kpName);
  };

  tabLesson.onclick = showLesson;
  tabPractice.onclick = showPractice;
  showLesson();
}

async function startGrammarPractice(panel, kpId, kpName) {
  const TOTAL = 10;
  let correct = 0;
  panel.innerHTML = `<div class="tiny" style="margin-bottom:8px;color:var(--c-text-2);">${escapeHtml(kpName)} · 共 ${TOTAL} 题</div><div id="qzone"></div>`;
  const qzone = $('#qzone', panel);

  for (let i = 0; i < TOTAL; i++) {
    const q = englishEngine.generateGrammar(kpId);
    await renderQuestion(qzone, q, {
      meta: `第 ${i + 1} / ${TOTAL} 题`,
      onSubmitted: (res) => {
        if (res.correct) correct++;
        progress.log({
          type: 'question',
          subject: 'english',
          kpId,
          correct: res.correct,
          detail: { stem: q.stem, userAns: res.userAns, answer: q.answer }
        });
      }
    });
  }

  // 完成总结
  qzone.innerHTML = `
    <div class="card center" style="padding:24px;">
      <div style="font-size:36px;">${correct >= 8 ? '🏆' : correct >= 6 ? '👍' : '💪'}</div>
      <div style="font-size:18px;font-weight:700;margin-top:8px;">练习完成</div>
      <div class="tiny" style="margin-top:4px;">本轮 ${TOTAL} 题，答对 ${correct} 题</div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-ghost" id="againBtn">再来一轮</button>
        <button class="btn btn-outline" id="listBtn">返回列表</button>
      </div>
    </div>
  `;
  $('#againBtn', qzone).onclick = () => startGrammarPractice(panel, kpId, kpName);
  $('#listBtn', qzone).onclick = () => navEnglish({ module: 'grammar' });
}

// ==================== 听力模块 ====================

async function renderListening(view, params) {
  view.innerHTML = `
    <div class="page-head">
      <button class="btn btn-ghost btn-sm" id="backBtn">← 返回英语</button>
      <div class="page-title" style="margin-top:10px;">🎧 听力训练</div>
      <div class="page-sub">听录音选择正确含义·可调速重播</div>
    </div>
    <div id="listenBody"></div>
  `;
  $('#backBtn', view).onclick = backToEnglish;
  const body = $('#listenBody', view);

  const level = Number(params.level);
  if (!level) {
    renderListenLevelPicker(body);
  } else {
    await startListeningPractice(body, level);
  }
}

function renderListenLevelPicker(body) {
  body.innerHTML = `
    <div class="grid grid-3">
      ${LISTEN_LEVELS.map(lv => `
        <div class="card clickable" data-level="${lv.n}" style="cursor:pointer;">
          <span class="level-badge level-${lv.n}">L${lv.n}</span>
          <div class="card-title" style="margin-top:8px;">${lv.name}</div>
          <div class="tiny" style="color:var(--c-text-2);margin-top:4px;">${lv.desc}</div>
          <button class="btn btn-sm btn-ghost" style="margin-top:10px;">开始听力训练</button>
        </div>
      `).join('')}
    </div>
  `;
  $$('#listenBody [data-level]').forEach(card => {
    card.onclick = () => navEnglish({ module: 'listening', level: Number(card.dataset.level) });
  });
}

async function startListeningPractice(body, level) {
  const lv = LISTEN_LEVELS.find(l => l.n === level) || LISTEN_LEVELS[0];
  const TOTAL = 10;
  let correct = 0;
  body.innerHTML = `
    <div class="tiny" style="margin-bottom:8px;color:var(--c-text-2);">${lv.name} · 共 ${TOTAL} 题</div>
    <div id="qzone"></div>
  `;
  const qzone = $('#qzone', body);

  for (let i = 0; i < TOTAL; i++) {
    const q = englishEngine.generateListening(level);
    await renderQuestion(qzone, q, {
      meta: `第 ${i + 1} / ${TOTAL} 题`,
      audio: { text: q.audioText, rates: [0.6, 0.8, 1.0, 1.2], revealOptions: true },
      onSubmitted: (res) => {
        if (res.correct) correct++;
        progress.log({
          type: 'listen',
          subject: 'english',
          kpId: 'listening',
          correct: res.correct,
          detail: { audioText: q.audioText, userAns: res.userAns, rightAns: q.answer }
        });
      }
    });
  }

  qzone.innerHTML = `
    <div class="card center" style="padding:24px;">
      <div style="font-size:36px;">🎧</div>
      <div style="font-size:18px;font-weight:700;margin-top:8px;">听力训练完成</div>
      <div class="tiny" style="margin-top:4px;">本轮 ${TOTAL} 题，答对 ${correct} 题</div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-ghost" id="againBtn">再来一轮</button>
        <button class="btn btn-outline" id="backLvBtn">返回选级</button>
      </div>
    </div>
  `;
  $('#againBtn', qzone).onclick = () => startListeningPractice(body, level);
  $('#backLvBtn', qzone).onclick = () => navEnglish({ module: 'listening' });
}

// ==================== 口语跟读模块 ====================

async function renderSpeaking(view) {
  const supported = englishEngine.isRecognitionSupported();
  view.innerHTML = `
    <div class="page-head">
      <button class="btn btn-ghost btn-sm" id="backBtn">← 返回英语</button>
      <div class="page-title" style="margin-top:10px;">🎤 口语跟读</div>
      <div class="page-sub">听标准朗读·跟读打分·纠正发音</div>
    </div>
    <div id="speakBody"></div>
  `;
  $('#backBtn', view).onclick = backToEnglish;
  const body = $('#speakBody', view);

  if (!supported) {
    body.innerHTML = `
      <div class="card" style="padding:20px;">
        <div class="tag tag-warning">不支持语音识别</div>
        <p style="margin-top:10px;">当前浏览器不支持语音识别，建议使用 <b>Chrome</b> 或 <b>Edge</b> 浏览器体验口语跟读功能。</p>
      </div>
    `;
    return;
  }
  await newSpeakingRound(body);
}

async function newSpeakingRound(body) {
  const sentence = SPEAK_SENTENCES[Math.floor(Math.random() * SPEAK_SENTENCES.length)];
  body.innerHTML = `
    <div class="card" style="margin-bottom:14px;">
      <div class="tiny" style="color:var(--c-text-2);margin-bottom:6px;">请跟读以下句子：</div>
      <div style="font-size:20px;font-weight:700;line-height:1.5;">${escapeHtml(sentence)}</div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost" id="playStdBtn">🔊 播放标准朗读</button>
        <button class="btn" id="startRecBtn">🎤 开始跟读</button>
      </div>
    </div>
    <div id="recStatus" style="margin-bottom:10px;"></div>
    <div id="recResult"></div>
  `;

  const playBtn = $('#playStdBtn', body);
  const startBtn = $('#startRecBtn', body);
  const statusBox = $('#recStatus', body);
  const resultBox = $('#recResult', body);

  // 播放标准朗读
  playBtn.onclick = async () => {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    playBtn.disabled = true;
    const old = playBtn.textContent;
    playBtn.textContent = '播放中...';
    const ok = await englishEngine.speak(sentence, { rate: 0.9 });
    playBtn.disabled = false;
    playBtn.textContent = old;
    if (!ok) toast('语音朗读不可用，请检查浏览器设置');
  };

  // 开始跟读识别
  startBtn.onclick = () => startSpeakingRecognition(body, sentence, statusBox, resultBox, startBtn);
}

async function startSpeakingRecognition(body, sentence, statusBox, resultBox, startBtn) {
  startBtn.disabled = true;
  startBtn.textContent = '识别中...';
  statusBox.innerHTML = `<div class="audio-bar"><span class="tiny">🎙️ 请大声跟读... (识别中)</span></div>`;
  resultBox.innerHTML = '';

  let finalText = '';
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    startBtn.disabled = false;
    startBtn.textContent = '🎤 开始跟读';
    try { englishEngine.stopRecognition(); } catch (e) { /* 忽略 */ }
    const score = englishEngine.scoreSpeech(sentence, finalText);
    renderSpeakingResult(body, sentence, finalText, score);
  };

  englishEngine.startRecognition({
    lang: 'en-US',
    onResult: (text, isFinal) => {
      finalText = text || finalText;
      statusBox.innerHTML = `<div class="audio-bar"><span class="tiny">🎯 识别中：${escapeHtml(text || '...')}</span></div>`;
      if (isFinal) finish();
    },
    onEnd: () => finish()
  });

  // 兜底: 超时 8 秒自动结束
  setTimeout(() => { if (!ended) finish(); }, 8000);
}

function renderSpeakingResult(body, sentence, spoken, score) {
  const feedback =
    score >= 90 ? '发音非常棒！' :
    score >= 75 ? '发音不错，继续加油！' :
    score >= 60 ? '基本正确，注意细节' :
    '再试一次，注意听标准发音';
  const cls = score >= 75 ? 'tag-success' : score >= 60 ? 'tag-warning' : 'tag-danger';
  const color = score >= 75 ? 'var(--c-success)' : score >= 60 ? 'var(--c-warning)' : 'var(--c-danger)';
  const resultBox = $('#recResult', body);
  resultBox.innerHTML = `
    <div class="card" style="padding:18px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;background:${color};">${score}</div>
        <div>
          <span class="tag ${cls}">${feedback}</span>
          <div class="tiny" style="margin-top:6px;color:var(--c-text-2);">原句：${escapeHtml(sentence)}</div>
          <div class="tiny" style="color:var(--c-text-2);">你读的：${escapeHtml(spoken || '(未识别到内容)')}</div>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost" id="retryBtn">🔁 再读一次</button>
        <button class="btn btn-outline" id="nextSentenceBtn">换一句</button>
      </div>
    </div>
  `;
  // 记录进度
  progress.log({
    type: 'speak',
    subject: 'english',
    kpId: 'speaking',
    correct: score >= 75,
    detail: { sentence, spoken, score }
  });
  $('#retryBtn', resultBox).onclick = () => newSpeakingRound(body);
  $('#nextSentenceBtn', resultBox).onclick = () => newSpeakingRound(body);
}

// ==================== 通用: 题目渲染 ====================
// 渲染一道题, 返回 Promise<result>; result = { correct:bool, userAns:string }
// options: { onSubmitted, audio, meta }
//   onSubmitted(result): 用户提交时回调 (用于记录进度)
//   audio: { text, rates?, autoPlay?, revealOptions? } 可选
//   meta: 字符串, 题号等元信息
function renderQuestion(container, q, { onSubmitted, audio, meta } = {}) {
  return new Promise(resolve => {
    const isMcq = q.type === 'mcq' && Array.isArray(q.options) && q.options.length;
    const hasAudio = audio && audio.text;
    const ttsSupported = ('speechSynthesis' in window);
    // 仅在 TTS 可用时才隐藏选项等待播放; 否则直接显示避免卡死
    const revealOpts = !!(hasAudio && audio.revealOptions && ttsSupported);

    container.innerHTML = `
      <div class="question-card">
        ${meta ? `<div class="tiny" style="color:var(--c-text-3);margin-bottom:6px;">${escapeHtml(meta)}</div>` : ''}
        ${hasAudio ? renderAudioBar(audio) : ''}
        <div class="question-stem">${escapeHtml(q.stem || '')}</div>
        ${isMcq ? `
          <div class="options" id="optsBox" ${revealOpts ? 'style="display:none;"' : ''}>
            ${q.options.map((opt, i) => `
              <div class="option" data-i="${i}">
                <div class="option-key">${String.fromCharCode(65 + i)}</div>
                <div class="option-text">${escapeHtml(opt)}</div>
              </div>
            `).join('')}
          </div>
          ${revealOpts ? `<div id="optHint" class="tiny" style="color:var(--c-text-2);margin-top:6px;">👆 请先点击播放听力</div>` : ''}
        ` : `
          <div class="field">
            <input class="input" id="fillInput" placeholder="输入你的答案，回车提交" autocomplete="off" autocapitalize="off" />
          </div>
        `}
        <div style="margin-top:14px;">
          <button class="btn" id="qSubmit" disabled>提交答案</button>
        </div>
        <div id="qFeedback" style="margin-top:12px;display:none;"></div>
      </div>
    `;

    const submitBtn = $('#qSubmit', container);
    const feedback = $('#qFeedback', container);
    let selected = null;
    let answered = false;
    const result = { correct: false, userAns: '' };

    // 音频条绑定
    if (hasAudio) {
      bindAudioBar(container, audio, () => {
        // 播放成功后揭示选项
        if (revealOpts) {
          const optsBox = $('#optsBox', container);
          const hint = $('#optHint', container);
          if (optsBox) optsBox.style.display = '';
          if (hint) hint.style.display = 'none';
        }
      });
    }

    if (isMcq) {
      $$('#optsBox .option', container).forEach(opt => {
        opt.onclick = () => {
          if (answered) return;
          $$('#optsBox .option', container).forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          selected = q.options[Number(opt.dataset.i)];
          submitBtn.disabled = false;
        };
      });
    } else {
      const input = $('#fillInput', container);
      input.oninput = () => { submitBtn.disabled = !input.value.trim(); };
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !submitBtn.disabled) submitBtn.click();
      });
    }

    submitBtn.onclick = () => {
      if (answered) {
        resolve(result);
        return;
      }
      // 判分
      if (isMcq) {
        result.userAns = selected;
        result.correct = String(selected) === String(q.answer);
      } else {
        const input = $('#fillInput', container);
        result.userAns = input.value.trim();
        result.correct = normText(result.userAns) === normText(q.answer);
        input.disabled = true;
      }
      answered = true;

      // 标记选项正误
      if (isMcq) {
        $$('#optsBox .option', container).forEach(opt => {
          const val = q.options[Number(opt.dataset.i)];
          opt.style.pointerEvents = 'none';
          if (String(val) === String(q.answer)) opt.classList.add('correct');
          else if (String(val) === String(result.userAns)) opt.classList.add('wrong');
        });
      }

      // 反馈
      feedback.style.display = 'block';
      feedback.innerHTML = `
        <span class="tag ${result.correct ? 'tag-success' : 'tag-danger'}" style="display:inline-flex;">
          ${result.correct ? '✅ 回答正确' : '❌ 回答错误'}
        </span>
        <div class="card" style="background:var(--c-primary-light);padding:10px;font-size:13px;line-height:1.7;margin-top:8px;">
          ${result.correct ? '' : `<div>正确答案：<b>${escapeHtml(String(q.answer))}</b></div>`}
          ${escapeHtml(q.explanation || '')}
        </div>
      `;

      submitBtn.textContent = '下一题 →';
      if (onSubmitted) {
        try { onSubmitted(result); } catch (e) { /* 忽略记录错误 */ }
      }
    };
  });
}

// 渲染音频条 HTML
function renderAudioBar(audio) {
  const rates = audio.rates;
  return `
    <div class="audio-bar" style="margin-bottom:12px;">
      <button class="btn btn-ghost btn-sm" id="qPlay" ${audio.autoPlay ? 'disabled' : ''}>
        🔊 ${audio.autoPlay ? '播放中...' : '点击播放'}
      </button>
      ${rates && rates.length ? `
        <select class="rate-select" id="qRate">
          ${rates.map(r => `<option value="${r}" ${r === 1 ? 'selected' : ''}>${r}x</option>`).join('')}
        </select>
      ` : ''}
      <span class="tiny" style="color:var(--c-text-2);">可重播</span>
    </div>
  `;
}

// 绑定音频条交互; onPlayed: 首次播放成功后回调
function bindAudioBar(container, audio, onPlayed) {
  const playBtn = $('#qPlay', container);
  const rateSel = $('#qRate', container);
  let playing = false;
  let firstPlayDone = false;
  const setBtn = (text, disabled) => { if (playBtn) { playBtn.textContent = text; playBtn.disabled = disabled; } };
  const getRate = () => rateSel ? parseFloat(rateSel.value) : 1;

  const play = async () => {
    if (playing) return;
    if (!('speechSynthesis' in window)) {
      toast('当前浏览器不支持语音朗读');
      setBtn('🔊 点击播放', false);
      return;
    }
    playing = true;
    setBtn('播放中...', true);
    const ok = await englishEngine.speak(audio.text, { rate: getRate() });
    playing = false;
    setBtn('🔊 重播', false);
    if (!ok) {
      toast('语音朗读不可用，请检查浏览器设置');
      return;
    }
    if (!firstPlayDone) {
      firstPlayDone = true;
      if (onPlayed) onPlayed();
    }
  };

  if (playBtn) playBtn.onclick = play;
  if (audio.autoPlay) setTimeout(play, 120);
}

// ==================== 工具函数 ====================

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normText(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}