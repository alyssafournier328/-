// 登录/注册视图
import { auth } from '../core/auth.js';
import { progress } from '../core/progress.js';

const { el, $ } = window.App;

export function renderLogin() {
  const view = $('#view');
  view.innerHTML = `
    <div class="auth-wrap" style="max-width:380px;margin:40px auto;padding:0 16px;">
      <div class="center col" style="margin-bottom:28px;">
        <div style="width:64px;height:64px;border-radius:18px;background:var(--c-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:700;">跃</div>
        <h1 style="margin-top:14px;">跃升学堂</h1>
        <p class="muted" style="margin-top:4px;">初二升初三 · 基础夯实学习平台</p>
      </div>

      <div class="card">
        <div class="tabs" style="display:flex;gap:8px;margin-bottom:16px;">
          <button class="btn btn-ghost btn-block" id="tabLogin">登录</button>
          <button class="btn btn-outline btn-block" id="tabReg">注册</button>
        </div>
        <form id="authForm">
          <div class="field" id="nickField" style="display:none;">
            <label class="field-label">昵称</label>
            <input class="input" name="nickname" placeholder="可选，留空则用用户名" />
          </div>
          <div class="field">
            <label class="field-label">用户名</label>
            <input class="input" name="username" placeholder="2位以上" autocomplete="username" required />
          </div>
          <div class="field">
            <label class="field-label">密码</label>
            <input class="input" type="password" name="password" placeholder="4位以上" autocomplete="current-password" required />
          </div>
          <button type="button" class="btn btn-block btn-lg" id="submitBtn">登录</button>
        </form>
      </div>

      <div class="card mt-m" style="background:#fff8e6;border:1px solid #f3e6c4;">
        <h3 style="font-size:14px;margin-bottom:6px;">适合这样的你</h3>
        <ul style="font-size:13px;color:var(--c-text-2);line-height:1.8;padding-left:18px;">
          <li>上海初二升初三，基础比较薄弱</li>
          <li>想从最基础开始稳扎稳打</li>
          <li>需要随时刷题、听读、背诵</li>
        </ul>
      </div>
    </div>
  `;

  let mode = 'login';
  const form = $('#authForm');
  const tabLogin = $('#tabLogin'), tabReg = $('#tabReg');
  const nickField = $('#nickField');
  const submitBtn = $('#submitBtn');

  const setMode = (m) => {
    mode = m;
    nickField.style.display = m === 'reg' ? 'block' : 'none';
    submitBtn.textContent = m === 'login' ? '登录' : '注册并登录';
    tabLogin.className = 'btn ' + (m === 'login' ? 'btn-ghost' : 'btn-outline') + ' btn-block';
    tabReg.className = 'btn ' + (m === 'reg' ? 'btn-ghost' : 'btn-outline') + ' btn-block';
  };
  tabLogin.onclick = () => setMode('login');
  tabReg.onclick = () => setMode('reg');

  // 提交逻辑(同时绑定 form.onsubmit 与 button.onclick，兼容回车与点击)
  const doAuth = async () => {
    const data = new FormData(form);
    const username = (data.get('username') || '').trim();
    const password = data.get('password') || '';
    const nickname = (data.get('nickname') || '').trim();
    if (!username || !password) { window.App.toast('请输入用户名和密码'); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = '处理中...';
    try {
      if (mode === 'login') {
        await auth.login(username, password);
      } else {
        await auth.register(username, password, nickname);
      }
      await progress.checkAchievements();
      window.App.toast('欢迎回来，' + auth.currentUser().nickname + '！');
      location.hash = 'dashboard';
      window.navigate('dashboard');
    } catch (err) {
      window.App.toast(err.message || '操作失败');
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'login' ? '登录' : '注册并登录';
    }
  };

  form.onsubmit = (e) => { e.preventDefault(); doAuth(); };
  submitBtn.onclick = () => doAuth();
}
