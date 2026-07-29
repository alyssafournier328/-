// 数学学科 UI 模块 (ES6 模块)
// 提供数学学科首页（知识点卡片网格）与知识点学习页（讲解 + 练习）
import { mathEngine } from '../../content/math-engine.js';
import { recommender } from '../../core/recommender.js';
import { progress } from '../../core/progress.js';

const { $, $$, toast } = window.App;

// 答对时的随机鼓励语
const PRAISE = [
  '答对啦！继续保持！',
  '漂亮，这题拿下了！',
  '太棒了，思路很清晰！',
  '稳！基础越来越扎实了。',
  '正确！你正在进步！',
  '好样的，再接再厉！'
];

// 等级文案映射
const LEVEL_TEXT = { 1: 'L1 基础', 2: 'L2 巩固', 3: 'L3 冲刺' };

// 每组练习题数量
const QUIZ_COUNT = 10;

// 取选择题正确答案的展示文本（含字母前缀，如 "A. 7"）
function answerText(q) {
  if (q.type === 'mcq' && Array.isArray(q.options)) {
    const opt = q.options.find(o => o.charAt(0) === q.answer);
    return opt || q.answer;
  }
  return q.answer;
}

// ============ 主入口 ============
// params 可能为 { kpId }：从首页推荐跳转直达某知识点学习页
export async function renderMath(params) {
  const kpId = params && params.kpId;
  if (kpId) {
    await renderKpLearn(kpId);
  } else {
    await renderMathHome();
  }
}

// ============ 学科首页 ============
async function renderMathHome() {
  const view = $('#view');
  view.innerHTML = `
    <div class="page-head">
      <div class="page-title">数学</div>
      <div class="page-sub">基础知识点·循序渐进</div>
    </div>

    <!-- 分级筛选器：默认全部 -->
    <div class="row wrap mb-m" id="filterBar" style="gap:8px;">
      <button class="btn btn-ghost btn-sm filter-btn active" data-level="0">全部</button>
      <button class="btn btn-outline btn-sm filter-btn" data-level="1">L1 基础</button>
      <button class="btn btn-outline btn-sm filter-btn" data-level="2">L2 巩固</button>
      <button class="btn btn-outline btn-sm filter-btn" data-level="3">L3 冲刺</button>
    </div>

    <!-- 知识点卡片网格 -->
    <div class="grid grid-2" id="kpGrid">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;

  // 取课标知识点，仅保留引擎支持的
  const allKps = await recommender.getSubjectKps('math');
  const supported = new Set(mathEngine.supportedKps());
  const kps = allKps.filter(k => supported.has(k.id));

  const grid = $('#kpGrid');

  // 按等级筛选渲染卡片
  const renderGrid = (level) => {
    const list = level === 0 ? kps : kps.filter(k => k.level === level);
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="emoji">📭</div><p>该等级暂无知识点</p></div>`;
      return;
    }
    grid.innerHTML = list.map(k => `
      <div class="card clickable" data-kp="${k.id}">
        <div class="between mb-s">
          <span class="level-badge level-${k.level}">L${k.level}</span>
          <span class="tag tag-muted">${LEVEL_TEXT[k.level] || ''}</span>
        </div>
        <div class="card-title">${k.name}</div>
        <div class="tiny" style="line-height:1.6;margin-bottom:12px;">${k.desc || ''}</div>
        <button class="btn btn-sm btn-block">开始学习</button>
      </div>
    `).join('');
    // 卡片点击进入知识点学习页（按钮点击会冒泡至卡片，统一触发一次跳转）
    $$('[data-kp]', grid).forEach(card => {
      card.onclick = () => window.navigate('math', { kpId: card.dataset.kp });
    });
  };

  renderGrid(0);

  // 筛选器切换：选中项用 btn-ghost，其余用 btn-outline
  const setFilterActive = (btn) => {
    $$('.filter-btn', view).forEach(b => {
      b.classList.remove('active', 'btn-ghost');
      b.classList.add('btn-outline');
    });
    btn.classList.add('active', 'btn-ghost');
    btn.classList.remove('btn-outline');
  };
  $$('.filter-btn', view).forEach(btn => {
    btn.onclick = () => {
      setFilterActive(btn);
      renderGrid(parseInt(btn.dataset.level, 10));
    };
  });
}

// ============ 知识点学习页 ============
async function renderKpLearn(kpId) {
  const view = $('#view');
  const kps = await recommender.getSubjectKps('math');
  const kp = kps.find(k => k.id === kpId) || { id: kpId, name: kpId, level: 1, desc: '' };

  view.innerHTML = `
    <div class="mb-m">
      <button class="btn btn-outline btn-sm" id="backBtn">← 返回数学</button>
    </div>
    <div class="page-head between">
      <div>
        <div class="page-title">${kp.name}</div>
        <div class="page-sub">${LEVEL_TEXT[kp.level] || ('L' + kp.level)}</div>
      </div>
      <span class="level-badge level-${kp.level}">L${kp.level}</span>
    </div>

    <!-- Tab 切换 -->
    <div class="row wrap mb-m" style="gap:8px;" id="tabBar">
      <button class="btn btn-ghost btn-sm tab-btn active" data-tab="lesson">知识点讲解</button>
      <button class="btn btn-outline btn-sm tab-btn" data-tab="practice">开始练习</button>
    </div>

    <div id="tabContent"></div>
  `;

  $('#backBtn').onclick = () => window.navigate('math');

  const tabContent = $('#tabContent');

  // 绑定 Tab 按钮点击切换
  $$('.tab-btn', view).forEach(b => {
    b.onclick = () => switchTab(b.dataset.tab);
  });

  // 切换 Tab：选中项 btn-ghost，其余 btn-outline
  function switchTab(tab) {
    $$('.tab-btn', view).forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('active', on);
      b.classList.toggle('btn-ghost', on);
      b.classList.toggle('btn-outline', !on);
    });
    if (tab === 'lesson') renderLesson();
    else renderPracticeEntry();
  }

  // 讲解 Tab：渲染引擎提供的知识点讲解 HTML
  function renderLesson() {
    tabContent.innerHTML = `<div class="recite-card">${mathEngine.getLesson(kpId)}</div>`;
  }

  // 练习 Tab 入口：选择难度并开始
  function renderPracticeEntry() {
    const defaultLevel = kp.level || 1;
    tabContent.innerHTML = `
      <div class="card">
        <div class="field">
          <label class="field-label">选择难度</label>
          <div class="row wrap" style="gap:8px;" id="levelPicker">
            <button class="btn btn-sm level-pick ${defaultLevel === 1 ? 'btn-ghost' : 'btn-outline'}" data-lv="1">L1 基础</button>
            <button class="btn btn-sm level-pick ${defaultLevel === 2 ? 'btn-ghost' : 'btn-outline'}" data-lv="2">L2 巩固</button>
            <button class="btn btn-sm level-pick ${defaultLevel === 3 ? 'btn-ghost' : 'btn-outline'}" data-lv="3">L3 冲刺</button>
          </div>
        </div>
        <button class="btn btn-block btn-lg" id="startBtn">开始练习（共 ${QUIZ_COUNT} 题）</button>
      </div>
    `;
    let chosen = defaultLevel;
    $$('.level-pick', tabContent).forEach(b => {
      b.onclick = () => {
        chosen = parseInt(b.dataset.lv, 10);
        $$('.level-pick', tabContent).forEach(x => { x.classList.remove('btn-ghost'); x.classList.add('btn-outline'); });
        b.classList.remove('btn-outline');
        b.classList.add('btn-ghost');
      };
    });
    $('#startBtn').onclick = () => startPractice(chosen);
  }

  // 启动一组练习会话（闭包维护题目与作答状态）
  function startPractice(level) {
    let questions;
    try {
      questions = mathEngine.generateBatch(kpId, level, QUIZ_COUNT);
    } catch (e) {
      toast('生成题目失败: ' + e.message);
      return;
    }
    const results = []; // 每题结果 { correct, userAns, rightAns }
    let idx = 0;

    // 渲染当前题目
    function renderQuestion() {
      const q = questions[idx];
      const pct = Math.round((idx / QUIZ_COUNT) * 100);
      let body = '';
      if (q.type === 'mcq' && Array.isArray(q.options)) {
        body = `<div class="options" id="optList">
          ${q.options.map((opt, i) => {
            const key = String.fromCharCode(65 + i);
            const text = opt.replace(/^[A-D]\.\s*/, '');
            return `<div class="option" data-key="${key}">
              <span class="option-key">${key}</span>
              <span>${text}</span>
            </div>`;
          }).join('')}
        </div>`;
      } else {
        body = `<input class="input" id="fillInput" placeholder="输入你的答案" autocomplete="off" />`;
      }

      tabContent.innerHTML = `
        <div class="question-card">
          <div class="between mb-s">
            <span class="tag">第 ${idx + 1} / ${QUIZ_COUNT} 题</span>
            <span class="tiny">${LEVEL_TEXT[level] || ''}</span>
          </div>
          <div class="progress mb-m"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="question-stem">${q.stem}</div>
          ${body}
          <div class="mt-m" id="feedback"></div>
          <button class="btn btn-block" id="submitBtn">提交</button>
        </div>
      `;

      // 选择题：点击选项切换 selected
      let selected = null;
      if (q.type === 'mcq') {
        $$('.option', tabContent).forEach(opt => {
          opt.onclick = () => {
            if ($('#submitBtn').disabled) return; // 已提交后禁止改选
            $$('.option', tabContent).forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selected = opt.dataset.key;
            document.title = 'DBG:选了 ' + selected;
          };
        });
      } else {
        // 填空题支持回车提交
        $('#fillInput').onkeydown = (e) => { if (e.key === 'Enter') $('#submitBtn').click(); };
      }

      $('#submitBtn').onclick = () => {
        // 从 DOM 直接读取选中项，避免闭包变量未同步
        let userAns;
        if (q.type === 'mcq') {
          const sel = tabContent.querySelector('.option.selected');
          userAns = sel ? sel.dataset.key : null;
        } else {
          userAns = ($('#fillInput').value || '').trim();
        }
        document.title = 'DBG:提交 userAns=' + userAns;
        if (!userAns) {
          toast('请先作答再提交');
          return;
        }
        handleSubmit(q, userAns);
      };
    }

    // 提交并判分
    function handleSubmit(q, userAns) {
      document.title = 'DBG:handleSubmit 进入';
      let correct;
      if (q.type === 'mcq') {
        correct = userAns === q.answer;
      } else {
        // 填空题：去空白、忽略大小写比较
        correct = String(userAns).replace(/\s+/g, '').toLowerCase() ===
                  String(q.answer).replace(/\s+/g, '').toLowerCase();
      }

      // 提交后禁用再次作答
      $('#submitBtn').disabled = true;

      // 选择题：标记正确选项与用户错选
      if (q.type === 'mcq') {
        $$('.option', tabContent).forEach(opt => {
          opt.onclick = null;
          if (opt.dataset.key === q.answer) opt.classList.add('correct');
          else if (opt.dataset.key === userAns && !correct) opt.classList.add('wrong');
        });
      }

      // 反馈：对错 + 正确答案（答错时高亮） + 解析
      const fb = $('#feedback');
      fb.innerHTML = `
        <div style="background:${correct ? '#e3f7ee' : '#fff3df'};padding:12px 14px;border-radius:8px;">
          <div style="font-weight:700;color:${correct ? 'var(--c-success)' : 'var(--c-danger)'};margin-bottom:6px;">
            ${correct ? '✅ 回答正确' : '❌ 回答错误'}
          </div>
          ${!correct ? `<div style="font-weight:700;color:var(--c-success);margin-bottom:6px;">正确答案：${answerText(q)}</div>` : ''}
          <div class="tiny" style="line-height:1.7;"><b>解析：</b>${q.explanation}</div>
        </div>
        <button class="btn btn-block btn-lg mt-m" id="nextBtn">${idx === QUIZ_COUNT - 1 ? '查看结果' : '下一题'}</button>
      `;

      // 记录学习行为
      results.push({ correct, userAns, rightAns: q.answer });
      progress.log({
        type: 'question',
        subject: 'math',
        kpId,
        correct,
        detail: { stem: q.stem, userAns, rightAns: q.answer }
      });

      // 答对触发鼓励语
      if (correct) toast(PRAISE[Math.floor(Math.random() * PRAISE.length)]);

      $('#nextBtn').onclick = () => {
        idx++;
        if (idx >= QUIZ_COUNT) renderResult();
        else renderQuestion();
      };
    }

    // 全部做完：显示结果
    function renderResult() {
      const correctCount = results.filter(r => r.correct).length;
      const acc = Math.round((correctCount / QUIZ_COUNT) * 100);
      const overview = results.map((r, i) =>
        `<span class="level-badge ${r.correct ? 'level-1' : ''}" style="${r.correct ? '' : 'background:var(--c-danger);'}font-size:12px;" title="第${i + 1}题：${r.correct ? '对' : '错'}">${i + 1}</span>`
      ).join(' ');

      tabContent.innerHTML = `
        <div class="card center" style="flex-direction:column;gap:6px;padding:24px;">
          <div style="font-size:40px;">${acc >= 80 ? '🎉' : acc >= 60 ? '👍' : '💪'}</div>
          <div class="page-title">练习完成！</div>
          <div class="stat-num" style="font-size:32px;">${correctCount} / ${QUIZ_COUNT}</div>
          <div class="muted">正确率 ${acc}%</div>
          <div class="progress" style="width:100%;margin-top:6px;"><div class="progress-fill ${acc >= 60 ? 'success' : ''}" style="width:${acc}%"></div></div>
        </div>
        <div class="card mt-m">
          <div class="card-title">各题概览</div>
          <div class="row wrap" style="gap:8px;">${overview}</div>
        </div>
        <div class="row mt-m" style="gap:8px;">
          <button class="btn btn-outline btn-block" id="retryBtn">再练一组</button>
          <button class="btn btn-block" id="backKpBtn">返回知识点</button>
        </div>
      `;

      $('#retryBtn').onclick = () => renderPracticeEntry();
      $('#backKpBtn').onclick = () => switchTab('lesson');
    }

    // 启动第一题
    renderQuestion();
  }

  // 默认显示讲解 Tab
  switchTab('lesson');
}
