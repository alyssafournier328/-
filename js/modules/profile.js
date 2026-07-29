// 个人中心：进度、成就、账号
import { auth } from '../core/auth.js';
import { progress } from '../core/progress.js';
import { recommender } from '../core/recommender.js';

const { el, $ } = window.App;

export async function renderProfile() {
  const user = auth.currentUser();
  const view = $('#view');
  view.innerHTML = `
    <div class="page-head">
      <div class="page-title">我的</div>
      <div class="page-sub">学习数据与账号管理</div>
    </div>

    <!-- 账号卡 -->
    <div class="card mb-l between">
      <div class="row" style="align-items:center;">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--c-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;">${user.nickname.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:700;">${user.nickname}</div>
          <div class="tiny">@${user.username} · ${user.grade || '初二升初三'}</div>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" id="logoutBtn">退出登录</button>
    </div>

    <!-- 总体统计 -->
    <h2 class="section-title">学习总览</h2>
    <div class="grid grid-4 mb-l" id="overviewGrid"></div>

    <!-- 成就 -->
    <h2 class="section-title">成就徽章 <span class="tiny" id="achCount" style="margin-left:auto;"></span></h2>
    <div class="grid grid-3 mb-l" id="achGrid"></div>

    <!-- 各科明细 -->
    <h2 class="section-title">各科知识点进度</h2>
    <div class="col" id="subjectProgress"></div>
  `;

  $('#logoutBtn').onclick = async () => {
    await auth.logout();
    window.App.toast('已退出登录');
    location.hash = 'login';
    window.navigate('login');
  };

  const s = await progress.stats();
  $('#overviewGrid').innerHTML = `
    <div class="stat-card"><div class="stat-num">${s.totalRecords}</div><div class="stat-label">总学习行为</div></div>
    <div class="stat-card"><div class="stat-num">${s.totalQuestions}</div><div class="stat-label">做题数</div></div>
    <div class="stat-card"><div class="stat-num">${s.wordsMastered}</div><div class="stat-label">掌握单词</div></div>
    <div class="stat-card"><div class="stat-num">${s.recited}</div><div class="stat-label">背诵篇数</div></div>
  `;

  // 成就
  const achs = await progress.achievements();
  const unlocked = achs.filter(a => a.unlocked).length;
  $('#achCount').textContent = `${unlocked}/${achs.length}`;
  $('#achGrid').innerHTML = achs.map(a => `
    <div class="card center" style="padding:14px;${a.unlocked ? '' : 'opacity:0.5;filter:grayscale(1);'}">
      <div style="font-size:34px;">${a.icon}</div>
      <div style="font-weight:700;font-size:13px;margin-top:6px;">${a.name}</div>
      <div class="tiny" style="margin-top:3px;">${a.desc}</div>
      ${a.unlocked ? '<span class="tag tag-success" style="margin-top:6px;">已解锁</span>' : '<span class="tag tag-muted" style="margin-top:6px;">未解锁</span>'}
    </div>
  `).join('');

  // 各科进度
  const SUBJECTS = [['math','数学'],['english','英语'],['chinese','语文']];
  const sp = $('#subjectProgress');
  for (const [subj, name] of SUBJECTS) {
    const items = await progress.subjectProgress(subj);
    const cur = await recommender.getSubjectKps(subj);
    const map = new Map(items.map(p => [p.kpId, p]));
    const card = el('div', { class: 'card' });
    card.innerHTML = `<h3 style="margin-bottom:10px;">${name} <span class="tiny">(${items.length}/${cur.length} 已开始)</span></h3>`;
    if (!cur.length) { card.innerHTML += '<p class="muted tiny">暂无知识点</p>'; sp.appendChild(card); continue; }
    const list = el('div', { class: 'col' });
    for (const kp of cur) {
      const p = map.get(kp.id) || { mastery: 0, total: 0, correct: 0 };
      const row = el('div', { class: 'kp-item' });
      row.innerHTML = `
        <span class="level-badge level-${kp.level}">L${kp.level}</span>
        <div class="kp-info">
          <div class="kp-name">${kp.name}</div>
          <div class="kp-meta">${p.total ? `做题${p.total}次 · 正确${p.correct}次` : '尚未开始'}</div>
        </div>
        <div style="width:120px;">
          <div class="progress"><div class="progress-fill ${p.mastery>=60?'success':''}" style="width:${p.mastery}%;"></div></div>
          <div class="tiny" style="text-align:right;margin-top:3px;">${p.mastery}%</div>
        </div>
      `;
      list.appendChild(row);
    }
    card.appendChild(list);
    sp.appendChild(card);
  }
}
