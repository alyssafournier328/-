// 语文学科 UI 模块 (ES6 模块)
// 面向初二升初三学生，涵盖三大模块：必背篇目 / 文言文 / 中考作文
// 依赖：chineseEngine(内容引擎)、progress(进度记录)；使用 window.App 全局工具与 window.navigate 路由
import { chineseEngine } from '../../content/chinese-engine.js';
import { recommender } from '../../core/recommender.js';
import { progress } from '../../core/progress.js';
import { auth } from '../../core/auth.js';

const { $, $$$ } = window.App;

// 难度等级映射：1基础 / 2巩固 / 3冲刺
const DIFFICULTY_MAP = {
  1: { name: '基础', cls: 'level-1' },
  2: { name: '巩固', cls: 'level-2' },
  3: { name: '冲刺', cls: 'level-3' }
};

// 作文主题映射
const COMPOSITION_THEMES = [
  { key: 'growth', name: '成长', icon: '🌱' },
  { key: 'family', name: '亲情', icon: '🏡' },
  { key: 'persistence', name: '坚持', icon: '💪' },
  { key: 'dream', name: '梦想', icon: '✨' },
  { key: 'friendship', name: '友情', icon: '🤝' }
];

// 主题 key → 中文标签
function themeLabel(key) {
  const map = { growth: '成长', family: '亲情', persistence: '坚持', dream: '梦想', friendship: '友情' };
  return map[key] || key;
}

// ==================== 入口 ====================
export async function renderChinese(params = {}) {
  const { module, kpId } = params;
  if (module === 'recite') {
    if (kpId) await renderReciteDetail(kpId);
    else await renderReciteList();
  } else if (module === 'classical') {
    if (kpId) await renderClassicalDetail(kpId);
    else await renderClassicalList();
  } else if (module === 'composition') {
    await renderComposition();
  } else {
    renderHome();
  }
}

// ==================== 学科首页 ====================
function renderHome() {
  const view = $('#view');
  const cards = [
    { module: 'recite', icon: '📜', name: '必背篇目', desc: '古诗文背诵·译文赏析·挖空测试' },
    { module: 'classical', icon: '📖', name: '文言文', desc: '原文注释·字词理解·选择测试' },
    { module: 'composition', icon: '✍️', name: '中考作文', desc: '素材积累·命题预测·提纲生成' }
  ];
  view.innerHTML = `
    <div class="page-head">
      <div class="page-title">语文</div>
      <div class="page-sub">背诵·文言·作文</div>
    </div>
    <div class="grid grid-3" id="moduleCards">
      ${cards.map(c => `
        <div class="card subject-card subject-chinese clickable" data-module="${c.module}">
          <div class="subj-icon">${c.icon}</div>
          <div class="subj-name">${c.name}</div>
          <div class="subj-desc">${c.desc}</div>
        </div>`).join('')}
    </div>
    <div class="card mt-l" style="background:#fff8e6;border:1px solid #f3e6c4;">
      <h3 style="font-size:14px;margin-bottom:6px;">📚 学习建议</h3>
      <ul style="font-size:13px;color:var(--c-text-2);line-height:1.8;padding-left:18px;">
        <li>必背篇目：先朗读熟读，再用挖空测试检验记忆</li>
        <li>文言文：结合注释理解字词，重点掌握一词多义</li>
        <li>作文：按主题积累素材，考前练习列提纲</li>
      </ul>
    </div>
  `;
  $$$('#moduleCards .subject-card').forEach(card => {
    card.onclick = () => window.navigate('chinese', { module: card.dataset.module });
  });
}

// ==================== 必背篇目模块 ====================
async function renderReciteList() {
  const view = $('#view');
  view.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  let list;
  try {
    list = await chineseEngine.getReciteList();
  } catch (e) {
    view.innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><p>加载失败</p><p class="tiny">${e.message}</p></div>`;
    return;
  }
  // 按难度分组
  const groups = { 1: [], 2: [], 3: [] };
  list.forEach(r => {
    const d = r.reciteDifficulty || 1;
    (groups[d] = groups[d] || []).push(r);
  });
  let html = `
    <button class="btn btn-outline btn-sm mb-m" id="backBtn">← 返回语文</button>
    <div class="page-head">
      <div class="page-title">📜 必背篇目</div>
      <div class="page-sub">按难度分组 · 点击篇目进入详情</div>
    </div>`;
  const hasAny = [1, 2, 3].some(d => (groups[d] || []).length);
  if (!hasAny) {
    html += `<div class="empty-state"><div class="emoji">📭</div><p>暂无背诵篇目</p></div>`;
  } else {
    [1, 2, 3].forEach(d => {
      const items = groups[d] || [];
      if (!items.length) return;
      const dm = DIFFICULTY_MAP[d];
      html += `<h2 class="section-title"><span class="level-badge ${dm.cls}">L${d}</span>${dm.name}</h2>`;
      html += `<div class="col mb-l">`;
      items.forEach(r => {
        html += `
          <div class="kp-item" data-id="${r.id}">
            <span class="level-badge ${dm.cls}">L${d}</span>
            <div class="kp-info">
              <div class="kp-name">${r.title} · ${r.author}（${r.dynasty}）</div>
              <div class="kp-meta">${r.type || '背诵'} · ${dm.name}</div>
            </div>
            <span class="tag">查看</span>
          </div>`;
      });
      html += `</div>`;
    });
  }
  view.innerHTML = html;
  $('#backBtn').onclick = () => window.navigate('chinese');
  $$$('.kp-item', view).forEach(item => {
    item.onclick = () => window.navigate('chinese', { module: 'recite', kpId: item.dataset.id });
  });
}

// 必背篇目详情
async function renderReciteDetail(id) {
  const view = $('#view');
  view.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  const recite = await chineseEngine.getRecite(id);
  if (!recite) {
    view.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><p>未找到该篇目</p></div>`;
    return;
  }
  const lines = recite.contentArr || (recite.content ? recite.content.split('\n') : []);
  const dm = DIFFICULTY_MAP[recite.reciteDifficulty || 1];
  view.innerHTML = `
    <button class="btn btn-outline btn-sm mb-m" id="backBtn">← 返回列表</button>
    <div class="page-head">
      <div class="page-title">${recite.title}</div>
      <div class="page-sub">${recite.author} · ${recite.dynasty} · <span class="level-badge ${dm.cls}">${dm.name}</span></div>
    </div>
    <div class="recite-card mb-m" id="reciteContent">
      ${lines.map(l => `<div class="verse">${l}</div>`).join('')}
    </div>
    <div class="col mb-l">
      <div class="card">
        <div class="between" style="cursor:pointer;" id="toggleTrans">
          <strong>译文</strong><span class="tiny">展开 ▾</span>
        </div>
        <div class="mt-s hide" id="transContent" style="line-height:1.8;">${recite.translation || '暂无译文'}</div>
      </div>
      ${recite.appreciation ? `
      <div class="card">
        <div class="between" style="cursor:pointer;" id="toggleApp">
          <strong>赏析</strong><span class="tiny">展开 ▾</span>
        </div>
        <div class="mt-s hide" id="appContent" style="line-height:1.8;">${recite.appreciation}</div>
      </div>` : ''}
      <div class="card">
        <strong>知识点</strong>
        <div class="row wrap mt-s">
          ${(recite.keyPoints || []).map(k => `<span class="tag">${k}</span>`).join('') || '<span class="tiny muted">暂无</span>'}
        </div>
      </div>
    </div>
    <div class="row wrap">
      <button class="btn" id="quizBtn">背诵测试</button>
      <button class="btn btn-outline" id="speakBtn">朗读</button>
      <button class="btn btn-ghost" id="listBtn">返回列表</button>
    </div>
    <div id="quizArea" class="mt-l"></div>
  `;
  $('#backBtn').onclick = () => window.navigate('chinese', { module: 'recite' });
  $('#listBtn').onclick = () => window.navigate('chinese', { module: 'recite' });
  $('#toggleTrans').onclick = () => $('#transContent').classList.toggle('hide');
  if ($('#toggleApp')) {
    $('#toggleApp').onclick = () => $('#appContent').classList.toggle('hide');
  }
  $('#quizBtn').onclick = () => startReciteQuiz(recite);
  $('#speakBtn').onclick = () => speakText(lines.join('\n'));
}

// 背诵测试：挖空填空
function startReciteQuiz(recite) {
  const area = $('#quizArea');
  const quiz = chineseEngine.generateReciteQuiz(recite, 3);
  if (!quiz.answer || quiz.answer.length === 0) {
    area.innerHTML = `<div class="card"><p class="muted">该篇目暂无内容可生成测试题</p></div>`;
    return;
  }
  // 按 ____ 切分题干，每段之间插入输入框
  const segments = quiz.stem.split('____');
  const stemHtml = segments.map((seg, i) => {
    if (i === segments.length - 1) return seg;
    return `${seg}<input class="input" data-idx="${i}" style="display:inline-block;width:84px;margin:0 4px;padding:4px 8px;text-align:center;vertical-align:middle;" />`;
  }).join('');
  area.innerHTML = `
    <div class="question-card">
      <div class="card-title">背诵测试 · 填空（共 ${quiz.answer.length} 空）</div>
      <div class="question-stem" style="white-space:pre-line;line-height:2.2;">${stemHtml}</div>
      <button class="btn btn-block" id="submitQuiz">提交答案</button>
      <div id="quizResult" class="mt-s"></div>
    </div>
  `;
  $('#submitQuiz').onclick = () => {
    const inputs = $$$('input', area);
    const userAnswers = inputs.map(inp => inp.value.trim());
    let correct = 0;
    quiz.answer.forEach((ans, i) => {
      if (userAnswers[i] === ans) correct++;
    });
    const total = quiz.answer.length;
    const passed = total > 0 && (correct === total || correct / total >= 2 / 3);
    // 标记每个输入框对错
    inputs.forEach((inp, i) => {
      inp.disabled = true;
      if (inp.value.trim() === quiz.answer[i]) {
        inp.style.borderColor = 'var(--c-success)';
        inp.style.background = '#e3f7ee';
      } else {
        inp.style.borderColor = 'var(--c-danger)';
        inp.style.background = '#ffe6e6';
      }
    });
    $('#quizResult').innerHTML = `
      <div class="card">
        <div style="font-weight:700;font-size:15px;">${passed ? '✅ 通过' : '❌ 未通过'}（${correct}/${total}）</div>
        <div class="tiny mt-s">原文正确答案：</div>
        <div class="recite-card mt-s">
          ${quiz.explanation.split('\n').map(l => `<div class="verse">${l}</div>`).join('')}
        </div>
      </div>
    `;
    // 记录进度
    progress.log({
      type: 'recite',
      subject: 'chinese',
      kpId: recite.id,
      correct: passed,
      passed: passed,
      detail: { title: recite.title, correctCount: correct, total }
    });
    window.App.toast(passed ? '背诵测试通过！' : `本次答对 ${correct}/${total}，继续加油`);
  };
}

// ==================== 文言文模块 ====================
async function renderClassicalList() {
  const view = $('#view');
  view.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  let list;
  try {
    list = await chineseEngine.getClassicalList();
  } catch (e) {
    view.innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><p>加载失败</p><p class="tiny">${e.message}</p></div>`;
    return;
  }
  let html = `
    <button class="btn btn-outline btn-sm mb-m" id="backBtn">← 返回语文</button>
    <div class="page-head">
      <div class="page-title">📖 文言文</div>
      <div class="page-sub">点击篇目进入原文与字词学习</div>
    </div>`;
  if (!list.length) {
    html += `<div class="empty-state"><div class="emoji">📭</div><p>暂无文言文篇目</p></div>`;
  } else {
    html += `<div class="col">`;
    list.forEach(c => {
      html += `
        <div class="kp-item" data-id="${c.id}">
          <span class="level-badge level-2">文</span>
          <div class="kp-info">
            <div class="kp-name">${c.title} · ${c.author}（${c.dynasty}）</div>
            <div class="kp-meta">${c.type || '文言文'}</div>
          </div>
          <span class="tag">查看</span>
        </div>`;
    });
    html += `</div>`;
  }
  view.innerHTML = html;
  $('#backBtn').onclick = () => window.navigate('chinese');
  $$$('.kp-item', view).forEach(item => {
    item.onclick = () => window.navigate('chinese', { module: 'classical', kpId: item.dataset.id });
  });
}

// 文言文详情
async function renderClassicalDetail(id) {
  const view = $('#view');
  view.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  const classical = await chineseEngine.getClassical(id);
  if (!classical) {
    view.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><p>未找到该篇目</p></div>`;
    return;
  }
  const lines = classical.contentArr || (classical.content ? classical.content.split('\n') : []);
  view.innerHTML = `
    <button class="btn btn-outline btn-sm mb-m" id="backBtn">← 返回列表</button>
    <div class="page-head">
      <div class="page-title">${classical.title}</div>
      <div class="page-sub">${classical.author} · ${classical.dynasty}</div>
    </div>
    <div class="recite-card mb-m">
      ${lines.map(l => `<div class="verse">${l}</div>`).join('')}
    </div>
    <div class="col mb-l">
      <div class="card">
        <div class="between" style="cursor:pointer;" id="toggleTrans">
          <strong>译文</strong><span class="tiny">展开 ▾</span>
        </div>
        <div class="mt-s hide" id="transContent" style="line-height:1.8;">${classical.translation || '暂无译文'}</div>
      </div>
      <div class="card">
        <strong>字词注释</strong>
        <div class="mt-s">
          ${(classical.notes || []).map(n => `
            <div class="row" style="margin-bottom:8px;align-items:baseline;">
              <span class="tag" style="min-width:56px;justify-content:center;">${n.word}</span>
              <span class="flex-1" style="line-height:1.7;">${n.meaning}</span>
            </div>`).join('') || '<p class="muted tiny">暂无注释</p>'}
        </div>
      </div>
      <div class="card">
        <strong>知识点</strong>
        <div class="row wrap mt-s">
          ${(classical.keyPoints || []).map(k => `<span class="tag">${k}</span>`).join('') || '<span class="tiny muted">暂无</span>'}
        </div>
      </div>
    </div>
    <div class="row wrap">
      <button class="btn" id="quizBtn">字词测试</button>
      <button class="btn btn-ghost" id="listBtn">返回列表</button>
    </div>
    <div id="quizArea" class="mt-l"></div>
  `;
  $('#backBtn').onclick = () => window.navigate('chinese', { module: 'classical' });
  $('#listBtn').onclick = () => window.navigate('chinese', { module: 'classical' });
  $('#toggleTrans').onclick = () => $('#transContent').classList.toggle('hide');
  $('#quizBtn').onclick = () => startClassicalQuiz(classical, 0, 0);
}

// 字词测试：连续5题选择题
function startClassicalQuiz(classical, qIndex, correctCount) {
  const area = $('#quizArea');
  const total = 5;
  // 完成全部题目
  if (qIndex >= total) {
    const passed = correctCount >= 3;
    area.innerHTML = `
      <div class="question-card center" style="flex-direction:column;">
        <div style="font-size:34px;">${passed ? '🎉' : '💪'}</div>
        <div class="card-title mt-s">字词测试完成</div>
        <div style="font-size:20px;font-weight:700;margin:6px 0;">正确 ${correctCount}/${total}</div>
        <p class="muted">${passed ? '表现不错，继续保持！' : '多看注释再战，加油！'}</p>
        <button class="btn btn-block mt-s" id="restartQuiz">再来一轮</button>
      </div>
    `;
    $('#restartQuiz').onclick = () => startClassicalQuiz(classical, 0, 0);
    return;
  }
  const quiz = chineseEngine.generateClassicalQuiz(classical);
  if (!quiz.options || quiz.options.length === 0) {
    area.innerHTML = `<div class="card"><p class="muted">该篇目暂无字词可测试</p></div>`;
    return;
  }
  area.innerHTML = `
    <div class="question-card">
      <div class="card-title">字词测试 · 第 ${qIndex + 1}/${total} 题</div>
      <div class="question-stem">${quiz.stem}</div>
      <div class="options" id="optionsList">
        ${quiz.options.map((opt, i) => `
          <div class="option" data-key="${String.fromCharCode(65 + i)}">
            <span class="option-key">${String.fromCharCode(65 + i)}</span>
            <span>${opt}</span>
          </div>`).join('')}
      </div>
      <div id="quizFeedback" class="mt-s"></div>
    </div>
  `;
  let answered = false;
  $$$('.option', area).forEach(opt => {
    opt.onclick = () => {
      if (answered) return;
      answered = true;
      const key = opt.dataset.key;
      const isCorrect = key === quiz.answer;
      // 标记选项对错
      $$$('.option', area).forEach(o => {
        o.style.pointerEvents = 'none';
        if (o.dataset.key === quiz.answer) o.classList.add('correct');
        else if (o.dataset.key === key) o.classList.add('wrong');
      });
      const newCorrect = isCorrect ? correctCount + 1 : correctCount;
      $('#quizFeedback').innerHTML = `
        <div class="card" style="background:${isCorrect ? '#e3f7ee' : '#ffe6e6'};">
          <strong>${isCorrect ? '✅ 正确' : '❌ 错误'}</strong>
          <p class="tiny mt-s" style="line-height:1.6;">${quiz.explanation}</p>
          <button class="btn btn-block mt-s" id="nextQ">${qIndex + 1 < total ? '下一题' : '查看结果'}</button>
        </div>
      `;
      // 记录本题进度
      progress.log({
        type: 'question',
        subject: 'chinese',
        kpId: classical.id,
        correct: isCorrect,
        detail: { title: classical.title, stem: quiz.stem, answer: quiz.answer, user: key }
      });
      $('#nextQ').onclick = () => startClassicalQuiz(classical, qIndex + 1, newCorrect);
    };
  });
}

// ==================== 作文模块 ====================
async function renderComposition() {
  const view = $('#view');
  view.innerHTML = `
    <button class="btn btn-outline btn-sm mb-m" id="backBtn">← 返回语文</button>
    <div class="page-head">
      <div class="page-title">✍️ 中考作文</div>
      <div class="page-sub">素材积累 · 命题预测 · 提纲生成</div>
    </div>
    <div class="row wrap mb-l" style="gap:8px;">
      <button class="btn btn-ghost" id="tabMaterials">素材库</button>
      <button class="btn btn-outline" id="tabPredict">命题预测</button>
      <button class="btn btn-outline" id="tabOutline">提纲生成</button>
    </div>
    <div id="compContent"></div>
  `;
  $('#backBtn').onclick = () => window.navigate('chinese');
  const tabs = [['Materials', 'materials'], ['Predict', 'predict'], ['Outline', 'outline']];
  const switchTab = (t) => {
    tabs.forEach(([suf, key]) => {
      const btn = $('#tab' + suf);
      btn.className = 'btn ' + (key === t ? 'btn-ghost' : 'btn-outline');
    });
    if (t === 'materials') renderCompMaterials();
    else if (t === 'predict') renderCompPredict();
    else renderCompOutline();
  };
  $('#tabMaterials').onclick = () => switchTab('materials');
  $('#tabPredict').onclick = () => switchTab('predict');
  $('#tabOutline').onclick = () => switchTab('outline');
  // 默认展示素材库
  renderCompMaterials();
}

// 作文 - 素材库 Tab
function renderCompMaterials() {
  const content = $('#compContent');
  content.innerHTML = `
    <div class="row wrap mb-l" style="gap:8px;">
      ${COMPOSITION_THEMES.map(t => `<button class="btn btn-outline" data-theme="${t.key}">${t.icon} ${t.name}</button>`).join('')}
    </div>
    <div id="materialsArea"><p class="muted center" style="padding:20px;">点击上方主题按钮，查看对应素材</p></div>
  `;
  $$$('[data-theme]', content).forEach(btn => {
    btn.onclick = () => {
      const theme = btn.dataset.theme;
      const data = chineseEngine.getCompositionMaterials(theme);
      renderMaterialsResult(theme, data);
      // 记录学习行为
      progress.log({
        type: 'composition',
        subject: 'chinese',
        kpId: 'comp_' + theme,
        correct: true,
        detail: { theme, title: data.title }
      });
    };
  });
}

// 渲染素材查询结果
function renderMaterialsResult(theme, data) {
  const area = $('#materialsArea');
  const themeInfo = COMPOSITION_THEMES.find(t => t.key === theme);
  area.innerHTML = `
    <div class="card mb-m">
      <div class="card-title">${themeInfo ? themeInfo.icon + ' ' : ''}${data.title}</div>
      <div class="tiny">已查看「${themeInfo ? themeInfo.name : themeLabel(theme)}」主题素材</div>
    </div>
    <h3 class="section-title">素材列表</h3>
    <div class="col mb-l">
      ${(data.materials || []).map(m => `
        <div class="card">
          <span class="tag ${m.type === '人物' ? 'tag-warning' : 'tag-success'}">${m.type}</span>
          <p class="mt-s" style="line-height:1.8;">${m.content}</p>
        </div>`).join('') || '<p class="muted">暂无素材</p>'}
    </div>
    <h3 class="section-title">名言佳句</h3>
    <div class="card mb-l">
      ${(data.quotes || []).map(q => `<p style="margin-bottom:8px;line-height:1.8;">“${q}”</p>`).join('') || '<p class="muted">暂无</p>'}
    </div>
    <h3 class="section-title">写作角度提示</h3>
    <div class="card mb-l">
      <ul style="padding-left:18px;line-height:1.9;">
        ${(data.tips || []).map(t => `<li>${t}</li>`).join('') || '<li>暂无</li>'}
      </ul>
    </div>
    <button class="btn" id="favBtn">⭐ 收藏素材</button>
  `;
  $('#favBtn').onclick = () => window.App.toast('已记录到素材本');
}

// 作文 - 命题预测 Tab
function renderCompPredict() {
  const content = $('#compContent');
  const list = chineseEngine.getCompositionPredictions();
  content.innerHTML = `
    <div class="page-sub mb-m">基于近年中考趋势预测，点击「生成提纲」获取写作框架</div>
    <div class="col">
      ${list.map((p, i) => `
        <div class="card">
          <div class="between" style="gap:8px;flex-wrap:wrap;">
            <strong style="font-size:15px;">${i + 1}. ${p.title}</strong>
            <span class="tag ${p.type === '命题' ? 'tag-success' : p.type === '半命题' ? 'tag-warning' : ''}">${p.type}</span>
          </div>
          <div class="row wrap mt-s" style="gap:6px;">
            <span class="tag tag-muted">难度 ${'★'.repeat(p.difficulty)}${'☆'.repeat(3 - p.difficulty)}</span>
          </div>
          <div class="tiny mt-s">写作提示：</div>
          <ul style="padding-left:18px;margin-top:4px;line-height:1.8;">
            ${p.hints.map(h => `<li>${h}</li>`).join('')}
          </ul>
          <button class="btn btn-ghost btn-sm mt-s" data-title="${p.title}">生成提纲</button>
        </div>`).join('')}
    </div>
  `;
  $$$('[data-title]', content).forEach(btn => {
    btn.onclick = () => {
      const title = btn.dataset.title;
      const outline = chineseEngine.generateCompositionOutline(title);
      showOutlineModal(outline);
    };
  });
}

// 作文 - 提纲生成 Tab
function renderCompOutline() {
  const content = $('#compContent');
  content.innerHTML = `
    <div class="card mb-l">
      <label class="field-label">输入作文题目</label>
      <input class="input" id="outlineInput" placeholder="如：那一刻，我长大了" />
      <button class="btn btn-block mt-s" id="genOutline">生成提纲</button>
    </div>
    <div id="outlineResult"></div>
  `;
  $('#genOutline').onclick = () => {
    const title = $('#outlineInput').value.trim();
    if (!title) {
      window.App.toast('请输入作文题目');
      return;
    }
    const outline = chineseEngine.generateCompositionOutline(title);
    renderOutlineInline(outline);
    // 记录学习行为
    progress.log({
      type: 'composition',
      subject: 'chinese',
      kpId: 'comp_outline',
      correct: true,
      detail: { title }
    });
  };
}

// 内联展示提纲
function renderOutlineInline(outline) {
  const area = $('#outlineResult');
  area.innerHTML = buildOutlineHtml(outline);
}

// 弹窗展示提纲
function showOutlineModal(outline) {
  const html = buildOutlineHtml(outline, true) + `<button class="btn btn-block mt-s" id="closeModalBtn">关闭</button>`;
  window.App.modal(html);
  const btn = $('#closeModalBtn');
  if (btn) btn.onclick = () => window.App.closeModal();
}

// 构建提纲 HTML（outline 含中文键，统一用方括号访问）
function buildOutlineHtml(outline, isModal = false) {
  const cardCls = isModal ? 'card' : 'card mb-m';
  const structure = outline.structure || {};
  const main = Array.isArray(structure['主体']) ? structure['主体'] : [];
  const tips = Array.isArray(outline['要点提示']) ? outline['要点提示'] : [];
  return `
    <div class="${cardCls}">
      <div class="card-title">📝 提纲：${outline.title}</div>
      ${outline.theme ? `<span class="tag tag-warning">主题：${themeLabel(outline.theme)}</span>` : ''}
    </div>
    <div class="${cardCls}">
      <strong>开头</strong>
      <p class="mt-s" style="line-height:1.8;">${structure['开头'] || ''}</p>
    </div>
    <div class="${cardCls}">
      <strong>主体段落</strong>
      <ol style="padding-left:20px;margin-top:8px;line-height:1.9;">
        ${main.map(p => `<li style="margin-bottom:6px;">${p}</li>`).join('')}
      </ol>
    </div>
    <div class="${cardCls}">
      <strong>结尾</strong>
      <p class="mt-s" style="line-height:1.8;">${structure['结尾'] || ''}</p>
    </div>
    <div class="${cardCls}">
      <strong>字数建议</strong>
      <p class="mt-s">${outline['wordCount建议'] || '600-800字'}</p>
    </div>
    <div class="${cardCls}">
      <strong>要点提示</strong>
      <ul style="padding-left:20px;margin-top:8px;line-height:1.9;">
        ${tips.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>
  `;
}

// ==================== 工具：语音朗读 ====================
function speakText(text) {
  if (!window.speechSynthesis) {
    window.App.toast('当前浏览器不支持语音朗读');
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.9;
  // 尝试选择中文语音
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('zh'));
  if (zhVoice) utter.voice = zhVoice;
  window.speechSynthesis.speak(utter);
  window.App.toast('开始朗读…');
}
