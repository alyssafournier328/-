// 跃升学堂 - 应用主入口与路由
import { auth } from './core/auth.js';
import { storage } from './core/storage.js';
import { progress } from './core/progress.js';
import { recommender } from './core/recommender.js';

// ===== 全局工具 =====
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => el.querySelectorAll(sel);
const $$$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

function toast(msg, duration = 2000) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

function modal(html) {
  const mask = $('#modal');
  $('#modalBox').innerHTML = html;
  mask.hidden = false;
  mask.onclick = (e) => { if (e.target === mask) closeModal(); };
  return mask;
}
function closeModal() { $('#modal').hidden = true; }

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

// 全局暴露给模块用
window.App = { toast, modal, closeModal, el, $, $$, $$$ };

// 全局错误捕获：任何未处理异常以 toast 形式可见，便于诊断
window.addEventListener('error', (e) => {
  console.error('[全局错误]', e.message, e.filename + ':' + e.lineno);
  toast('出错了: ' + (e.message || '未知错误'));
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason && (e.reason.message || e.reason) || '未知异步错误';
  console.error('[未处理Promise]', msg);
  toast('异步错误: ' + msg);
});

// ===== 路由 =====
// 路由表：返回 render 函数引用，由 navigate 调用并传入 params
const routes = {
  dashboard: () => import('./modules/dashboard.js').then(m => m.renderDashboard),
  english: () => import('./modules/english/index.js').then(m => m.renderEnglish),
  math: () => import('./modules/math/index.js').then(m => m.renderMath),
  chinese: () => import('./modules/chinese/index.js').then(m => m.renderChinese),
  profile: () => import('./modules/profile.js').then(m => m.renderProfile),
  community: () => import('./modules/community.js').then(m => m.renderCommunity),
  login: () => import('./modules/auth-view.js').then(m => m.renderLogin)
};

async function navigate(route, params = {}) {
  if (!auth.currentUser() && route !== 'login') {
    route = 'login';
  }
  const view = $('#view');
  view.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  // 登录/注册页隐藏主导航，避免遮挡表单
  document.body.classList.toggle('auth-route', route === 'login');
  // 高亮导航
  $$$('.nav-tab, .bottom-nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
  try {
    const renderer = routes[route];
    if (!renderer) { view.innerHTML = '<p>页面不存在</p>'; return; }
    const mod = await renderer();
    if (typeof mod === 'function') await mod(params);
  } catch (err) {
    console.error('路由错误:', err);
    view.innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><p>页面加载失败</p><p class="tiny">${err.message}</p></div>`;
  }
  window.scrollTo(0, 0);
}

// ===== 启动 =====
async function boot() {
  // 注册 Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }

  // 初始化存储
  await storage.init();
  await auth.init();
  await progress.init();

  // 绑定导航
  const go = (route) => (e) => { e.preventDefault(); navigate(route); };
  $$('[data-route]').forEach(a => a.addEventListener('click', go(a.dataset.route)));

  // 启动路由
  window.addEventListener('hashchange', () => {
    const r = location.hash.slice(1) || 'dashboard';
    navigate(r);
  });

  const initial = location.hash.slice(1) || (auth.currentUser() ? 'dashboard' : 'login');
  navigate(initial);
}

// 暴露导航给模块
window.navigate = navigate;

boot();
