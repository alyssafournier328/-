// 学习中心首页
import { auth } from '../core/auth.js';
import { progress } from '../core/progress.js';
import { recommender } from '../core/recommender.js';

const { el, $ } = window.App;

export async function renderDashboard() {
  const user = auth.currentUser();
  const view = $('#view');
  view.innerHTML = `
    <div class="page-head between">
      <div>
        <div class="page-title">你好，${user.nickname}</div>
        <div class="page-sub" id="todayDate"></div>
      </div>
      <div class="tag tag-warning">初二升初三</div>
    </div>

    <!-- 今日统计 -->
    <div class="grid grid-4 mb-l" id="statsGrid">
      <div class="stat-card"><div class="stat-num" id="stToday">0</div><div class="stat-label">今日学习</div></div>
      <div class="stat-card"><div class="stat-num" id="stStreak">0</div><div class="stat-label">连续天数</div></div>
      <div class="stat-card"><div class="stat-num" id="stQuestions">0</div><div class="stat-label">累计题目</div></div>
      <div class="stat-card"><div class="stat-num" id="stAcc">0%</div><div class="stat-label">正确率</div></div>
    </div>

    <!-- 学科入口 -->
    <h2 class="section-title">学科学习</h2>
    <div class="grid grid-3 mb-l" id="subjectGrid"></div>

    <!-- 拓展学习 -->
    <h2 class="section-title">拓展学习</h2>
    <div class="grid grid-2 mb-l">
      <div class="subject-card subject-video" data-route="video">
        <div class="subj-icon">🎬</div>
        <div class="subj-name">学习视频</div>
        <div class="subj-desc">国家平台+B站 · 名师精讲</div>
        <div class="subj-progress">25+ 视频</div>
      </div>
      <div class="subject-card subject-community" data-route="community">
        <div class="subj-icon">💬</div>
        <div class="subj-name">学习社区</div>
        <div class="subj-desc">问答·分享·打卡</div>
        <div class="subj-progress">同伴互助</div>
      </div>
    </div>

    <!-- 今日推荐路径 -->
    <h2 class="section-title">今日推荐</h2>
    <div class="col" id="recommendList">
      <div class="loading"><div class="spinner"></div></div>
    </div>

    <!-- 能力雷达 -->
    <h2 class="section-title">学科掌握度</h2>
    <div class="card" id="radarCard">
      <div class="radar-wrap"><div class="loading"><div class="spinner"></div></div></div>
    </div>
  `;

  // 日期
  $('#todayDate').textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // 统计
  const s = await progress.stats();
  $('#stToday').textContent = s.todayCount;
  $('#stStreak').textContent = s.streak;
  $('#stQuestions').textContent = s.totalQuestions;
  $('#stAcc').textContent = Math.round(s.accuracy * 100) + '%';

  // 学科入口
  const subjects = [
    { route: 'english', name: '英语', desc: '词汇·语法·听说', cls: 'subject-english', icon: '英' },
    { route: 'math', name: '数学', desc: '知识点·刷基础', cls: 'subject-math', icon: '数' },
    { route: 'chinese', name: '语文', desc: '背诵·文言·作文', cls: 'subject-chinese', icon: '语' }
  ];
  const radar = await recommender.radarData();
  const radarMap = Object.fromEntries(radar.map(r => [r.subject, r]));
  $('#subjectGrid').innerHTML = subjects.map(sub => {
    const r = radarMap[sub.route] || { mastery: 0, touched: 0, total: 0 };
    return `<div class="subject-card ${sub.cls}" data-route="${sub.route}">
      <div class="subj-icon">${sub.icon}</div>
      <div class="subj-name">${sub.name}</div>
      <div class="subj-desc">${sub.desc}</div>
      <div class="subj-progress">掌握 ${r.mastery}% · ${r.touched}/${r.total}</div>
    </div>`;
  }).join('');
  $$$('[data-route]').forEach(a => {
    if (a.classList.contains('subject-card')) {
      a.onclick = () => window.navigate(a.dataset.route);
    }
  });

  // 今日推荐
  const recs = await recommender.recommendToday();
  const recList = $('#recommendList');
  if (!recs.length) {
    recList.innerHTML = `<div class="card center" style="padding:30px;"><div class="emoji" style="font-size:36px;">🎉</div><p style="margin-top:8px;">已覆盖所有推荐知识点，可自由探索各学科！</p></div>`;
  } else {
    recList.innerHTML = recs.map(r => `
      <div class="kp-item" data-subject="${r.subject}" data-kp="${r.kpId}">
        <span class="level-badge level-${r.level}">L${r.level}</span>
        <div class="kp-info">
          <div class="kp-name">${r.subjectName} · ${r.kpName}</div>
          <div class="kp-meta">${r.reason} · 当前掌握 ${r.mastery}%</div>
        </div>
        <span class="tag">去学习</span>
      </div>
    `).join('');
    $$('.kp-item', recList).forEach(item => {
      item.onclick = () => {
        const subject = item.dataset.subject, kp = item.dataset.kp;
        location.hash = subject;
        window.navigate(subject, { kpId: kp });
      };
    });
  }

  // 雷达图(SVG)
  renderRadar(radar);
}

function renderRadar(data) {
  const card = $('#radarCard');
  if (!data.length) { card.innerHTML = '<p class="muted center">暂无数据</p>'; return; }
  const size = 280, cx = size / 2, cy = size / 2, R = 100;
  const n = data.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI / n);
  const point = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  // 网格(4层)
  let grid = '';
  for (let k = 1; k <= 4; k++) {
    const r = R * k / 4;
    const pts = Array.from({ length: n }, (_, i) => point(i, r).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="#e6ecf5" stroke-width="1"/>`;
  }
  // 轴线
  let axes = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = point(i, R);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e6ecf5" stroke-width="1"/>`;
  }
  // 数据多边形
  const dataPts = data.map((d, i) => point(i, R * d.mastery / 100).join(',')).join(' ');
  // 数据点 + 标签
  let dots = '', labels = '';
  data.forEach((d, i) => {
    const [x, y] = point(i, R * d.mastery / 100);
    dots += `<circle cx="${x}" cy="${y}" r="4" fill="#4f7cff"/>`;
    const [lx, ly] = point(i, R + 22);
    labels += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="13" fill="#5b6677">${d.label}</text>`;
    labels += `<text x="${lx}" y="${ly + 14}" text-anchor="middle" font-size="11" fill="#9aa4b2">${d.mastery}%</text>`;
  });
  card.innerHTML = `
    <div class="radar-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${grid}${axes}
        <polygon points="${dataPts}" fill="rgba(79,124,255,0.25)" stroke="#4f7cff" stroke-width="2"/>
        ${dots}${labels}
      </svg>
    </div>
    <p class="tiny center">掌握度=正确率×题量因子，至少做10题后才能完全反映水平</p>
  `;
}

function $$$(sel, el = document) { return Array.from(el.querySelectorAll(sel)); }
function $$(sel, el = document) { return el.querySelectorAll(sel); }
