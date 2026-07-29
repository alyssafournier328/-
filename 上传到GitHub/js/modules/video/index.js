// 学习视频模块
// 数据源：data/videos.json（国家中小学智慧教育平台 + B站公开课 公开免费资源）
// 能力：按学科/难度筛选、关键词搜索、点击在新标签页打开视频页
import { progress } from '../../core/progress.js';

const { $, $$, $$, toast, modal, closeModal } = window.App;

const SUBJECTS = [
  { key: 'all',     name: '全部', icon: '📚' },
  { key: 'chinese', name: '语文', icon: '📜' },
  { key: 'math',    name: '数学', icon: '📐' },
  { key: 'english', name: '英语', icon: '🇬🇧' }
];

const LEVELS = [
  { key: 0, name: '全部难度' },
  { key: 1, name: 'L1 基础' },
  { key: 2, name: 'L2 进阶' },
  { key: 3, name: 'L3 冲刺' }
];

// 模块内状态
const state = {
  videos: [],
  subjects: SUBJECTS,
  sourcePolicy: '',
  filter: { subject: 'all', level: 0, keyword: '' },
  history: {}  // 记录已观看视频（按 videoId 存首次观看时间）
};

// ==================== 工具 ====================
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function providerLabel(p) {
  if (p === 'smartedu') return '国家智慧教育平台';
  if (p === 'bilibili') return 'B站公开课';
  return p;
}

function providerBadgeClass(p) {
  return p === 'smartedu' ? 'tag-success' : (p === 'bilibili' ? 'tag-warning' : 'tag-muted');
}

async function loadData() {
  try {
    const res = await fetch('./data/videos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    state.videos = Array.isArray(json.videos) ? json.videos : [];
    state.subjects = json.subjects && json.subjects.length ? json.subjects : SUBJECTS;
    state.sourcePolicy = json.sourcePolicy || '';
  } catch (e) {
    console.error('[video] 加载 videos.json 失败:', e);
    state.videos = [];
    toast('视频数据加载失败：' + e.message);
  }
}

async function loadHistory() {
  try {
    const all = await progress.all();
    const uid = (window.App && window.App.userId) || (window.currentUser && window.currentUser());
    const list = (all.videoHistory && all.videoHistory[uid]) || [];
    list.forEach(v => { state.history[v.id] = v.ts; });
  } catch (e) {
    state.history = {};
  }
}

function applyFilter() {
  const { subject, level, keyword } = state.filter;
  const kw = (keyword || '').trim().toLowerCase();
  return state.videos.filter(v => {
    if (subject !== 'all' && v.subject !== subject) return false;
    if (level && v.level !== level) return false;
    if (kw) {
      const hay = (v.title + ' ' + v.topic + ' ' + (v.tags || []).join(' ') + ' ' + providerLabel(v.provider)).toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
}

function renderChips() {
  const subjHtml = state.subjects.map(s => {
    const active = state.filter.subject === s.key ? 'active' : '';
    return `<button class="filter-chip ${active}" data-subject="${s.key}">${s.icon || ''} ${escapeHtml(s.name)}</button>`;
  }).join('');
  const lvlHtml = LEVELS.map(l => {
    const active = state.filter.level === l.key ? 'active' : '';
    return `<button class="filter-chip ${active}" data-level="${l.key}">${escapeHtml(l.name)}</button>`;
  }).join('');
  return `
    <div class="filter-row">
      <div class="filter-label">学科</div>
      <div class="filter-chips" id="subjChips">${subjHtml}</div>
    </div>
    <div class="filter-row">
      <div class="filter-label">难度</div>
      <div class="filter-chips" id="lvlChips">${lvlHtml}</div>
    </div>
    <div class="filter-row">
      <input id="kwInput" class="filter-input" placeholder="🔍 搜索标题、主题、标签…" value="${escapeHtml(state.filter.keyword)}" />
    </div>
  `;
}

function renderList() {
  const list = applyFilter();
  if (!list.length) {
    return `<div class="empty-state"><div class="emoji">🎬</div><p>没有匹配的视频</p><p class="tiny">试试切换学科/难度，或换个关键词</p></div>`;
  }
  return `<div class="video-grid">${list.map(renderCard).join('')}</div>`;
}

function renderCard(v) {
  const watched = state.history[v.id];
  const watchedTag = watched
    ? `<span class="tag tag-muted video-watched-tag">✓ 已观看</span>`
    : '';
  return `
    <div class="card video-card clickable" data-id="${escapeHtml(v.id)}">
      <div class="video-cover">
        <div class="video-cover-emoji">${escapeHtml(v.cover || '🎬')}</div>
        <div class="video-duration">${escapeHtml(v.duration || '')}</div>
        <div class="video-level level-badge level-${v.level || 1}">L${v.level || 1}</div>
      </div>
      <div class="video-body">
        <div class="video-subject">
          <span class="tag ${providerBadgeClass(v.provider)}">${escapeHtml(providerLabel(v.provider))}</span>
          <span class="tag tag-muted">${escapeHtml(getSubjectName(v.subject))}</span>
          ${watchedTag}
        </div>
        <div class="video-title">${escapeHtml(v.title)}</div>
        <div class="video-topic">主题：${escapeHtml(v.topic)}</div>
        <div class="video-tags">${(v.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}</div>
      </div>
    </div>
  `;
}

function getSubjectName(key) {
  const s = state.subjects.find(x => x.key === key);
  return s ? s.name : key;
}

function bindFilter() {
  const view = $('#view');
  $$('.filter-chip[data-subject]', view).forEach(btn => {
    btn.onclick = () => {
      state.filter.subject = btn.dataset.subject;
      state.filter.level = 0; // 切换学科时重置难度
      rerender();
    };
  });
  $$('.filter-chip[data-level]', view).forEach(btn => {
    btn.onclick = () => {
      state.filter.level = Number(btn.dataset.level);
      rerender();
    };
  });
  const kw = $('#kwInput', view);
  if (kw) {
    let timer = null;
    kw.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.filter.keyword = kw.value;
        // 仅刷新列表，不重建输入框
        $('#videoList').innerHTML = renderList();
        bindList();
      }, 200);
    };
  }
}

function bindList() {
  const view = $('#view');
  $$('.video-card[data-id]', view).forEach(card => {
    card.onclick = () => openVideo(card.dataset.id);
  });
}

function rerender() {
  const view = $('#view');
  // 仅替换筛选条和列表区域，保留搜索框焦点
  $('#filterBar').innerHTML = renderChips();
  $('#videoList').innerHTML = renderList();
  bindFilter();
  bindList();
}

async function openVideo(id) {
  const v = state.videos.find(x => x.id === id);
  if (!v) return;
  // 记录观看历史
  if (!state.history[id]) {
    state.history[id] = Date.now();
    saveHistory(v).catch(() => {});
  }
  // 打开方式：唤起模态确认，再新标签页打开
  const html = `
    <div class="video-modal">
      <div class="video-modal-cover">${escapeHtml(v.cover || '🎬')}</div>
      <div class="video-modal-title">${escapeHtml(v.title)}</div>
      <div class="video-modal-meta">
        <span class="tag ${providerBadgeClass(v.provider)}">${escapeHtml(providerLabel(v.provider))}</span>
        <span class="tag tag-muted">${escapeHtml(getSubjectName(v.subject))}</span>
        <span class="level-badge level-${v.level || 1}">L${v.level || 1}</span>
        <span class="tag">⏱ ${escapeHtml(v.duration || '')}</span>
      </div>
      <div class="video-modal-topic">主题：${escapeHtml(v.topic)}</div>
      <div class="video-modal-tags">${(v.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}</div>
      <div class="video-modal-tip">视频将在新标签页打开，请允许浏览器弹窗或点击下方按钮手动打开。</div>
      <div class="video-modal-actions">
        <button class="btn btn-ghost btn-sm" id="vmCancel">关闭</button>
        <a class="btn btn-sm" id="vmOpen" target="_blank" rel="noopener noreferrer" href="${escapeHtml(v.url)}">▶ 打开视频</a>
      </div>
    </div>
  `;
  modal(html);
  $('#vmCancel').onclick = closeModal;
}

async function saveHistory(v) {
  try {
    // 直接通过 progress 暴露的最小 API 存：写入一条"视频观看"到学习日志
    if (progress && typeof progress.log === 'function') {
      await progress.log({
        type: 'video_watch',
        videoId: v.id,
        subject: v.subject,
        title: v.title,
        ts: Date.now()
      });
    }
  } catch (e) { /* 静默失败，不影响主流程 */ }
}

// ==================== 主入口 ====================
export async function renderVideo(params = {}) {
  await loadData();
  await loadHistory();

  const view = $('#view');
  view.innerHTML = `
    <div class="page-head between">
      <div>
        <div class="page-title">🎬 学习视频</div>
        <div class="page-sub">${state.videos.length} 个公开免费资源 · 国家智慧教育平台 + B站公开课</div>
      </div>
      <a class="btn btn-ghost btn-sm" data-route="dashboard">← 返回</a>
    </div>

    <div class="card mb-l" id="filterBar">
      ${renderChips()}
    </div>

    <div id="videoList" class="mb-l">${renderList()}</div>

    <p class="tiny muted">${escapeHtml(state.sourcePolicy || '全部为公开免费学习资源。')}</p>
  `;

  // 返回 dashboard
  $('[data-route="dashboard"]', view).onclick = (e) => {
    e.preventDefault();
    window.navigate('dashboard');
  };

  bindFilter();
  bindList();

  // 若带 videoId 参数，自动打开对应视频
  if (params && params.videoId) {
    setTimeout(() => openVideo(params.videoId), 50);
  }
}
