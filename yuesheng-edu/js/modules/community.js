// 社区交流模块 (ES6 模块)
// 本地社区：发帖 / 回复 / 点赞，同设备多用户可见
// 数据存储于 IndexedDB posts 表(含内嵌 replies)，离线可用
import { auth } from '../core/auth.js';
import { storage } from '../core/storage.js';

const { $, $$$, toast, modal, closeModal } = window.App;

const CATEGORIES = [
  { key: 'qa', name: '学习问答', icon: '❓', desc: '不懂就问，互相解答' },
  { key: 'share', name: '经验分享', icon: '💡', desc: '学习方法与心得' },
  { key: 'encourage', name: '互相鼓励', icon: '🤝', desc: '一起坚持，加油打气' }
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

// 首次进入社区时播种的引导帖，让社区不空旷
const SEED_POSTS = [
  {
    category: 'share',
    title: '欢迎来到跃升学堂社区！',
    content: '这里是同学们交流学习的小天地～\n\n· 学习问答：遇到不懂的题目或知识点，发帖求助\n· 经验分享：分享你的学习方法、背诵技巧、刷题心得\n· 互相鼓励：坚持不易，一起来加油打气\n\n希望每位同学都能在这里找到同伴，稳步提升！',
    username: 'system', nickname: '学堂小助手',
    ts: Date.now() - 3 * 86400000, likes: 5, likedBy: [], replies: []
  },
  {
    category: 'share',
    title: '数学基础薄弱怎么补？我的三点经验',
    content: '初二时我数学只有 30 分，经过半年努力提到了及格线以上，分享几个方法：\n\n1. 回归课本，把每个公式定理自己推导一遍，不追求难题\n2. 准备错题本，把错题按知识点分类，定期重做\n3. 每天固定做 10 道基础题，比偶尔做一套卷子更有效\n\n基础薄弱不可怕，可怕的是一直逃避。一起加油！',
    username: 'system', nickname: '学长小李',
    ts: Date.now() - 2 * 86400000, likes: 8, likedBy: [], replies: []
  },
  {
    category: 'qa',
    title: '英语听力总是听不懂怎么办？',
    content: '每次听力考试都跟不上节奏，单词认识但听起来反应不过来，有什么好办法吗？',
    username: 'system', nickname: '努力的阿明',
    ts: Date.now() - 86400000, likes: 3, likedBy: [],
    replies: [
      { username: 'system', nickname: '英语小达人', content: '建议先从「精听」开始：选一段短材料，反复听写直到写全，再对照原文。每天 15 分钟，一个月后会有明显进步。本平台的「听力训练」模块可以调速重播，很适合练精听。', ts: Date.now() - 80000000 }
    ]
  },
  {
    category: 'encourage',
    title: '今天背完了《岳阳楼记》，打卡！',
    content: '虽然花了一周，但终于能完整背下来了！坚持就是胜利，共勉！💪',
    username: 'system', nickname: '小背书匠',
    ts: Date.now() - 3600000, likes: 12, likedBy: [], replies: []
  }
];

async function seedIfEmpty() {
  const all = await storage.getAll('posts');
  if (all.length) return;
  await storage.bulkPut('posts', SEED_POSTS);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return m + ' 分钟前';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' 小时前';
  const d = Math.floor(h / 24);
  if (d < 30) return d + ' 天前';
  return new Date(ts).toLocaleDateString('zh-CN');
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==================== 主入口 ====================
export async function renderCommunity(params = {}) {
  await seedIfEmpty();
  if (params.postId != null) {
    await renderPostDetail(Number(params.postId));
  } else {
    await renderPostList(params.category);
  }
}

// ==================== 帖子列表 ====================
async function renderPostList(activeCat) {
  const view = $('#view');
  view.innerHTML = `
    <div class="page-head between">
      <div>
        <div class="page-title">社区</div>
        <div class="page-sub">交流学习 · 互相帮助</div>
      </div>
      <button class="btn btn-sm" id="newPostBtn">✍️ 发帖</button>
    </div>

    <div class="row wrap mb-m" id="catBar" style="gap:8px;">
      <button class="btn btn-sm filter-cat ${!activeCat ? 'btn-ghost' : 'btn-outline'}" data-cat="">全部</button>
      ${CATEGORIES.map(c => `<button class="btn btn-sm filter-cat ${activeCat === c.key ? 'btn-ghost' : 'btn-outline'}" data-cat="${c.key}">${c.icon} ${c.name}</button>`).join('')}
    </div>

    <div id="postList"><div class="loading"><div class="spinner"></div></div></div>
  `;

  $('#newPostBtn').onclick = () => showPostEditor();

  $$$('.filter-cat', view).forEach(btn => {
    btn.onclick = () => window.navigate('community', { category: btn.dataset.cat || undefined });
  });

  // 拉取并渲染帖子(按时间倒序)
  let posts = await storage.getAll('posts');
  posts.sort((a, b) => b.ts - a.ts);
  if (activeCat) posts = posts.filter(p => p.category === activeCat);

  const list = $('#postList');
  if (!posts.length) {
    list.innerHTML = `<div class="empty-state"><div class="emoji">📭</div><p>该分类暂无帖子</p><p class="tiny">来发第一帖吧～</p></div>`;
    return;
  }
  list.innerHTML = posts.map(p => {
    const cat = CAT_MAP[p.category] || { icon: '📌', name: '其他' };
    const snippet = escapeHtml(String(p.content || '').slice(0, 60)) + (p.content && p.content.length > 60 ? '…' : '');
    return `
      <div class="card post-card" data-id="${p.id}">
        <div class="between mb-s">
          <span class="tag">${cat.icon} ${cat.name}</span>
          <span class="tiny">${timeAgo(p.ts)}</span>
        </div>
        <div class="card-title">${escapeHtml(p.title)}</div>
        <div class="tiny post-snippet">${snippet}</div>
        <div class="between mt-s">
          <span class="tiny">@${escapeHtml(p.nickname)}</span>
          <span class="tiny">❤️ ${p.likes || 0} · 💬 ${(p.replies || []).length}</span>
        </div>
      </div>
    `;
  }).join('');
  $$$('.post-card', list).forEach(card => {
    card.onclick = () => window.navigate('community', { postId: card.dataset.id });
  });
}

// ==================== 发帖编辑器 ====================
function showPostEditor() {
  const html = `
    <h3 style="margin-bottom:12px;">✍️ 发新帖</h3>
    <div class="field">
      <label class="field-label">分类</label>
      <div class="row wrap" style="gap:8px;" id="editorCats">
        ${CATEGORIES.map((c, i) => `<button class="btn btn-sm ${i === 0 ? 'btn-ghost' : 'btn-outline'}" data-cat="${c.key}">${c.icon} ${c.name}</button>`).join('')}
      </div>
    </div>
    <div class="field">
      <label class="field-label">标题</label>
      <input class="input" id="editorTitle" placeholder="一句话说明你的主题" maxlength="40" />
    </div>
    <div class="field">
      <label class="field-label">内容</label>
      <textarea class="textarea" id="editorContent" placeholder="详细说说……" style="min-height:140px;"></textarea>
    </div>
    <div class="row" style="gap:8px;">
      <button class="btn btn-block" id="editorSubmit">发布</button>
      <button class="btn btn-outline" id="editorCancel">取消</button>
    </div>
  `;
  modal(html);
  let chosenCat = CATEGORIES[0].key;
  $$$('#editorCats .btn').forEach(btn => {
    btn.onclick = () => {
      chosenCat = btn.dataset.cat;
      $$$('#editorCats .btn').forEach(b => { b.classList.remove('btn-ghost'); b.classList.add('btn-outline'); });
      btn.classList.add('btn-ghost');
      btn.classList.remove('btn-outline');
    };
  });
  $('#editorCancel').onclick = closeModal;
  $('#editorSubmit').onclick = async () => {
    const title = $('#editorTitle').value.trim();
    const content = $('#editorContent').value.trim();
    if (!title) { toast('请填写标题'); return; }
    if (!content) { toast('请填写内容'); return; }
    const user = auth.currentUser();
    const post = {
      category: chosenCat,
      title, content,
      username: user.username, nickname: user.nickname,
      ts: Date.now(), likes: 0, likedBy: [], replies: []
    };
    await storage.put('posts', post);
    closeModal();
    toast('发布成功！');
    window.navigate('community');
  };
}

// ==================== 帖子详情 ====================
async function renderPostDetail(id) {
  const view = $('#view');
  const post = await storage.get('posts', id);
  if (!post) {
    view.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><p>帖子不存在或已删除</p></div>`;
    return;
  }
  const user = auth.currentUser();
  const cat = CAT_MAP[post.category] || { icon: '📌', name: '其他' };
  const liked = (post.likedBy || []).includes(user.username);

  view.innerHTML = `
    <button class="btn btn-outline btn-sm mb-m" id="backBtn">← 返回社区</button>
    <div class="card post-detail">
      <div class="between mb-s">
        <span class="tag">${cat.icon} ${cat.name}</span>
        <span class="tiny">${timeAgo(post.ts)}</span>
      </div>
      <div class="page-title" style="font-size:19px;">${escapeHtml(post.title)}</div>
      <div class="row mt-s" style="align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--c-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">${escapeHtml(post.nickname.charAt(0).toUpperCase())}</div>
        <span class="tiny">@${escapeHtml(post.nickname)}</span>
      </div>
      <div class="post-content mt-m">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
      <div class="row mt-m" style="gap:10px;">
        <button class="btn btn-ghost btn-sm ${liked ? 'liked' : ''}" id="likeBtn">❤️ ${post.likes || 0}</button>
        <span class="tiny" style="align-self:center;">💬 ${(post.replies || []).length} 回复</span>
      </div>
    </div>

    <h2 class="section-title">回复</h2>
    <div class="col" id="replyList"></div>

    <div class="card mt-m">
      <textarea class="textarea" id="replyInput" placeholder="说点什么……" style="min-height:80px;"></textarea>
      <button class="btn btn-block mt-s" id="replyBtn">发表回复</button>
    </div>
  `;

  $('#backBtn').onclick = () => window.navigate('community');

  renderReplies(post);

  // 点赞
  $('#likeBtn').onclick = async () => {
    const fresh = await storage.get('posts', id);
    const me = user.username;
    fresh.likedBy = fresh.likedBy || [];
    if (fresh.likedBy.includes(me)) {
      fresh.likedBy = fresh.likedBy.filter(u => u !== me);
      fresh.likes = Math.max(0, (fresh.likes || 0) - 1);
    } else {
      fresh.likedBy.push(me);
      fresh.likes = (fresh.likes || 0) + 1;
    }
    await storage.put('posts', fresh);
    renderPostDetail(id);
  };

  // 回复
  $('#replyBtn').onclick = async () => {
    const text = $('#replyInput').value.trim();
    if (!text) { toast('请输入回复内容'); return; }
    const fresh = await storage.get('posts', id);
    fresh.replies = fresh.replies || [];
    fresh.replies.push({
      username: user.username, nickname: user.nickname,
      content: text, ts: Date.now()
    });
    await storage.put('posts', fresh);
    toast('回复成功');
    renderPostDetail(id);
  };
}

function renderReplies(post) {
  const box = $('#replyList');
  const replies = post.replies || [];
  if (!replies.length) {
    box.innerHTML = `<p class="muted tiny center" style="padding:14px;">还没有回复，来抢沙发～</p>`;
    return;
  }
  box.innerHTML = replies.map(r => `
    <div class="card reply-item">
      <div class="row" style="align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--c-primary-light);color:var(--c-primary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${escapeHtml(r.nickname.charAt(0).toUpperCase())}</div>
        <span class="tiny"><b>@${escapeHtml(r.nickname)}</b></span>
        <span class="tiny" style="color:var(--c-text-3);margin-left:auto;">${timeAgo(r.ts)}</span>
      </div>
      <div class="mt-s" style="line-height:1.7;">${escapeHtml(r.content).replace(/\n/g, '<br>')}</div>
    </div>
  `).join('');
}
