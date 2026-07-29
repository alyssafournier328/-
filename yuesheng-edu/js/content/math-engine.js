// 数学题目动态生成引擎 (ES6 模块)
// 面向上海初二升初三基础薄弱学生（平均 20 分）
// 按知识点参数化生成基础题，可无限出题
// 设计原则：基础、循序渐进、不出超纲怪题；难度由 level 控制（L1 小整数 / L2 中等 / L3 综合）
//
// 依赖: 无外部依赖，纯 ES6 模块

// ==================== 工具函数 ====================

// 生成 [min, max] 闭区间内的随机整数
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 从数组中随机选取一个元素
const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Fisher-Yates 洗牌，返回新数组（不修改原数组）
const randShuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// 最大公约数（结果为正整数）
const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
};

// 约分分数，返回 { num, den }（den > 0）
const simplifyFraction = (num, den) => {
  if (den < 0) { num = -num; den = -den; }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
};

// 分数转字符串（化为最简分数，整数直接输出）
const fracStr = (num, den) => {
  const f = simplifyFraction(num, den);
  if (f.den === 1) return String(f.num);
  return `${f.num}/${f.den}`;
};

// 数值格式化：整数直接输出，小数保留至多 2 位
const fmt = (v) => {
  if (typeof v === 'string') return v;
  if (Number.isInteger(v)) return String(v);
  return (Math.round(v * 100) / 100).toString();
};

// 题目 ID 自增计数器
let qCounter = 0;
const nextId = () => `math_q_${++qCounter}`;

// 构造选择题：把正确答案与干扰项打乱，保证 4 个选项互不相同
// 干扰项应为"常见错算结果"，不足时会自动补充占位项以维持 4 选项
const buildMcq = (correct, distractors) => {
  const cStr = fmt(correct);
  const seen = new Set([cStr]);
  const dds = [];
  for (const d of distractors) {
    const s = fmt(d);
    if (!seen.has(s)) { seen.add(s); dds.push(s); }
    if (dds.length >= 3) break;
  }
  // 若干扰项不足 3 个，则补充（数值题用 correct+n，文本题用占位标签）
  let pad = 1;
  while (dds.length < 3) {
    let cand;
    if (typeof correct === 'number' && !Number.isNaN(correct)) {
      cand = fmt(correct + pad);
    } else {
      cand = `其他选项${pad}`;
    }
    if (!seen.has(cand)) { seen.add(cand); dds.push(cand); }
    pad++;
  }
  const all = randShuffle([cStr, ...dds]);
  const letters = ['A', 'B', 'C', 'D'];
  const options = all.map((v, i) => `${letters[i]}. ${v}`);
  const answer = letters[all.indexOf(cStr)];
  return { options, answer };
};

// ==================== 各知识点题目生成器 ====================

// ---------- L1 ----------

// 实数运算：√a + |−b|、√a × √b
function genRealNumbers(level) {
  const squares = level <= 2 ? [4, 9, 16, 25, 36, 49] : [4, 9, 16, 25, 36, 49, 64, 81, 100];
  const mode = randInt(1, 2);
  if (mode === 1) {
    const a = randPick(squares);
    const b = randInt(1, level <= 2 ? 8 : 12);
    const sa = Math.sqrt(a);
    const correct = sa + b;
    const stem = `计算：√${a} + |−${b}|`;
    const d1 = a + b;       // 误把 √a 当作 a
    const d2 = sa - b;       // 误把绝对值当减号
    const d3 = a - b;       // 两个错误叠加
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'real_numbers', type: 'mcq',
      stem, options, answer,
      explanation: `√${a} = ${sa}，|−${b}| = ${b}，所以原式 = ${sa} + ${b} = ${correct}。`
    };
  } else {
    const a = randPick(squares);
    const b = randPick(squares);
    const sa = Math.sqrt(a), sb = Math.sqrt(b);
    const correct = sa * sb;
    const stem = `计算：√${a} × √${b}`;
    const d1 = sa + sb;     // 误把乘当加
    const d2 = a * b;       // 根号内相乘却忘了开方
    const d3 = sa * b;      // 只对一个根号开方
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'real_numbers', type: 'mcq',
      stem, options, answer,
      explanation: `√${a} × √${b} = √(${a} × ${b}) = √${a * b} = ${correct}。`
    };
  }
}

// 整式加减：合并同类项
function genIntegerOps(level) {
  const a = randInt(2, level <= 2 ? 5 : 9);
  const c = randInt(1, a - 1);
  const b = randInt(2, level <= 2 ? 6 : 9);
  const d = randInt(1, b - 1); // 保证 b - d > 0
  const co2 = a - c;
  const co1 = b - d;
  const stem = `化简：(${a}x² + ${b}x) − (${c}x² + ${d}x)`;
  const correct = `${co2}x² + ${co1}x`;
  const d1 = `${a + c}x² + ${b + d}x`;  // 减当加
  const d2 = `${co2}x² − ${co1}x`;     // 第二项符号错
  const d3 = `${co2}x² + ${b}x`;        // 忘记减去 d
  const { options, answer } = buildMcq(correct, [d1, d2, d3]);
  return {
    id: nextId(), kpId: 'integer_ops', type: 'mcq',
    stem, options, answer,
    explanation: `去括号合并同类项：${a}x² − ${c}x² = ${co2}x²，${b}x − ${d}x = ${co1}x，所以结果为 ${correct}。`
  };
}

// 一元一次方程：ax + b = c（x 为整数）或买苹果应用题
function genLinearEq(level) {
  const mode = randInt(1, 2);
  if (mode === 1) {
    const x = randInt(1, level <= 2 ? 8 : 12);
    const a = randInt(2, level <= 2 ? 4 : 6);
    const b = randInt(1, level <= 2 ? 8 : 15);
    const c = a * x + b;
    const stem = `解方程：${a}x + ${b} = ${c}`;
    const correct = x;
    const d1 = c - b;          // 移项后忘记除以 a
    const d2 = (c + b) / a;    // 移项时符号弄反
    const d3 = c / a;          // 忘记减去 b
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'linear_eq', type: 'mcq',
      stem, options, answer,
      explanation: `移项得 ${a}x = ${c} − ${b} = ${c - b}，两边除以 ${a} 得 x = ${x}。`
    };
  } else {
    // 应用题：买苹果
    const kg = randInt(3, 8);
    const price = randInt(2, level <= 2 ? 5 : 9);
    const money = kg * price;
    const stem = `小明买 ${kg} 千克苹果共付了 ${money} 元，求每千克苹果多少元？（设每千克 x 元）`;
    const correct = price;
    const d1 = money - kg;          // 误用减法
    const d2 = money + kg;          // 误用加法
    const d3 = Math.floor(money / kg) + 1; // 计算偏差
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'linear_eq', type: 'mcq',
      stem, options, answer,
      explanation: `列方程 ${kg}x = ${money}，解得 x = ${money} ÷ ${kg} = ${price}（元/千克）。`
    };
  }
}

// 二元一次方程组：加减消元
function genLinearSystem(level) {
  // x + y = S, x − y = D，需保证 x、y 为正整数
  let S, D, x, y;
  do {
    S = randInt(5, level <= 2 ? 12 : 20);
    D = randInt(1, S - 1);
    x = (S + D) / 2;
    y = (S - D) / 2;
  } while (!Number.isInteger(x) || !Number.isInteger(y) || x <= 0 || y <= 0);
  const stem = `解方程组（求 x 的值）：<br>x + y = ${S}<br>x − y = ${D}`;
  const correct = x;
  const d1 = y;          // 把 x、y 颠倒（求成了 y）
  const d2 = S / 2;      // 只用了第一个方程
  const d3 = D;         // 直接取了 D
  const { options, answer } = buildMcq(correct, [d1, d2, d3]);
  return {
    id: nextId(), kpId: 'linear_system', type: 'mcq',
    stem, options, answer,
    explanation: `两式相加得 2x = ${S + D}，x = ${x}；两式相减得 2y = ${S - D}，y = ${y}。`
  };
}

// 一元一次不等式
function genInequality(level) {
  const x = randInt(1, level <= 2 ? 8 : 12);
  const a = randInt(2, level <= 2 ? 4 : 6); // a > 0，无需变号
  const b = randInt(1, level <= 2 ? 8 : 15);
  const c = a * x + b;
  const stem = `解不等式：${a}x + ${b} < ${c}`;
  const correct = `x < ${x}`;
  const d1 = `x < ${c - b}`;   // 忘记除以 a（直接用了 ax 的值）
  const d2 = `x > ${x}`;       // 不等号方向弄反
  const d3 = `x < ${-x}`;      // 解的符号错
  const { options, answer } = buildMcq(correct, [d1, d2, d3]);
  return {
    id: nextId(), kpId: 'inequality', type: 'mcq',
    stem, options, answer,
    explanation: `移项得 ${a}x < ${c} − ${b} = ${c - b}，两边同除以正数 ${a}（不等号方向不变）得 x < ${x}。`
  };
}

// ---------- L2 ----------

// 一元二次方程：能用因式分解法（x + p)(x + q) = 0
function genQuadraticEq(level) {
  const p = randInt(1, level <= 2 ? 4 : 7);
  const q = randInt(1, level <= 2 ? 4 : 7);
  const b = p + q;
  const c = p * q;
  const r1 = -p, r2 = -q;
  const stem = `解方程：x² + ${b}x + ${c} = 0`;
  const correct = `x₁ = ${r1}，x₂ = ${r2}`;
  const d1 = `x₁ = ${p}，x₂ = ${q}`;       // 忘记取负
  const d2 = `x₁ = ${r1}，x₂ = ${q}`;      // 一个对一个错
  const d3 = `x₁ = ${-b}，x₂ = ${-c}`;     // 把系数直接取负
  const { options, answer } = buildMcq(correct, [d1, d2, d3]);
  return {
    id: nextId(), kpId: 'quadratic_eq', type: 'mcq',
    stem, options, answer,
    explanation: `因式分解：x² + ${b}x + ${c} = (x + ${p})(x + ${q}) = 0，所以 x₁ = ${r1}，x₂ = ${r2}。`
  };
}

// 二次根式：化简 √(k²·m) = k√m
function genRadical(level) {
  const k = randInt(2, level <= 2 ? 3 : 4);
  const m = randPick([2, 3, 5]);
  const a = k * k * m;
  const stem = `化简：√${a}`;
  const correct = `${k}√${m}`;
  const d1 = `${k * k}√${m}`;        // 系数没开方，保留了 k²
  const d2 = `√${k * k}·√${m}`;      // 没合并成最简形式
  const d3 = `${k + 1}√${m}`;        // 系数算错
  const { options, answer } = buildMcq(correct, [d1, d2, d3]);
  return {
    id: nextId(), kpId: 'radical', type: 'mcq',
    stem, options, answer,
    explanation: `√${a} = √(${k}² × ${m}) = √${k * k} × √${m} = ${k}√${m}。`
  };
}

// 一次函数：斜率与截距、求函数值
function genLinearFunc(level) {
  const k = randInt(1, level <= 2 ? 4 : 6);
  const b = randInt(1, level <= 2 ? 5 : 9);
  const mode = randInt(1, 2);
  if (mode === 1) {
    const stem = `一次函数 y = ${k}x + ${b}，它的斜率和 y 轴截距分别是？`;
    const correct = `斜率${k}，截距${b}`;
    const d1 = `斜率${b}，截距${k}`;       // 颠倒
    const d2 = `斜率${k}，截距−${b}`;      // 截距符号错
    const d3 = `斜率${k + b}，截距${b}`;   // 斜率算错
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'linear_func', type: 'mcq',
      stem, options, answer,
      explanation: `y = kx + b 中，k 为斜率，b 为 y 轴截距。所以斜率 = ${k}，截距 = ${b}。`
    };
  } else {
    const xv = randInt(0, level <= 2 ? 5 : 8);
    const yv = k * xv + b;
    const stem = `一次函数 y = ${k}x + ${b}，求 x = ${xv} 时的函数值 y。`;
    const correct = yv;
    const d1 = k * xv - b;       // 截距符号错
    const d2 = k * (xv + b);     // 运算顺序错
    const d3 = (k + b) * xv;    // 系数合并错
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'linear_func', type: 'mcq',
      stem, options, answer,
      explanation: `代入 x = ${xv}：y = ${k} × ${xv} + ${b} = ${k * xv} + ${b} = ${yv}。`
    };
  }
}

// 全等三角形：SSS / SAS / ASA / AAS 判定
function genCongruentTri(level) {
  const cases = [
    { cond: '三边分别对应相等', method: 'SSS' },
    { cond: '两边及其夹角对应相等', method: 'SAS' },
    { cond: '两角及其夹边对应相等', method: 'ASA' },
    { cond: '两角及其中一角的对边对应相等', method: 'AAS' },
  ];
  const pick = randPick(cases);
  const stem = `在 △ABC 和 △DEF 中，已知 ${pick.cond}，则这两个三角形全等的判定依据是？`;
  const correct = pick.method;
  const others = cases.filter(c => c.method !== pick.method).map(c => c.method);
  const d = randShuffle(others).slice(0, 3);
  const { options, answer } = buildMcq(correct, d);
  return {
    id: nextId(), kpId: 'congruent_tri', type: 'mcq',
    stem, options, answer,
    explanation: `${pick.cond}，根据全等三角形判定定理 ${pick.method}，可判定 △ABC ≌ △DEF。`
  };
}

// ---------- L3 ----------

// 二次函数：顶点 / 开口方向 / 对称轴；或已知顶点与一点求 a
function genQuadraticFunc(level) {
  const h = randInt(1, level <= 2 ? 4 : 6);
  const k = randInt(1, level <= 2 ? 4 : 6);
  const mode = randInt(1, 2);
  if (mode === 1) {
    const aa = randPick([1, 2, 3]);
    const stem = `二次函数 y = ${aa}(x − ${h})² + ${k}，下列说法正确的是？`;
    const correct = `顶点(${h}, ${k})，开口向上，对称轴 x = ${h}`;
    const d1 = `顶点(${h}, ${k})，开口向下，对称轴 x = ${h}`;   // 开口方向错
    const d2 = `顶点(−${h}, ${k})，开口向上，对称轴 x = −${h}`; // 顶点符号错
    const d3 = `顶点(${h}, ${k})，开口向上，对称轴 x = ${k}`;   // 对称轴取错
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'quadratic_func', type: 'mcq',
      stem, options, answer,
      explanation: `顶点式 y = a(x − h)² + k：顶点为 (h, k) = (${h}, ${k})，对称轴为 x = h = ${h}；a = ${aa} > 0，开口向上。`
    };
  } else {
    // 已知顶点 (h, k) 及另一点，求 a
    const aa = randPick([2, 3, 4]);
    const x2 = h + 2;                 // 保证 (x2 − h)² = 4
    const y2 = aa * 4 + k;
    const stem = `二次函数 y = a(x − ${h})² + ${k} 的图象过点 (${x2}, ${y2})，求 a 的值。`;
    const correct = aa;
    const d1 = y2 - k;                // 忘记除以 (x2 − h)²
    const d2 = (y2 - k) / (x2 - h);   // 忘记对 (x2 − h) 平方
    const d3 = aa + 1;                // 计算偏差
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'quadratic_func', type: 'mcq',
      stem, options, answer,
      explanation: `代入点 (${x2}, ${y2})：${y2} = a × (${x2} − ${h})² + ${k} = a × 4 + ${k}，所以 a = (${y2} − ${k}) ÷ 4 = ${aa}。`
    };
  }
}

// 相似三角形：比例计算
function genSimilarTri(level) {
  const ratio = randInt(2, level <= 2 ? 3 : 4); // 相似比
  const ab = randInt(2, level <= 2 ? 4 : 6);
  const de = ab * ratio;
  const bc = ratio * randInt(1, level <= 2 ? 2 : 3); // bc 为 ratio 的倍数，保证干扰项为整数
  const ef = bc * ratio;
  const stem = `△ABC ∼ △DEF，相似比为 ${ratio}。已知 AB = ${ab}，BC = ${bc}，DE = ${de}，求 EF 的长。`;
  const correct = ef;
  const d1 = bc + de;     // 乱用加法
  const d2 = bc / ratio;  // 相似比用反了
  const d3 = bc;          // 忽略相似比
  const { options, answer } = buildMcq(correct, [d1, d2, d3]);
  return {
    id: nextId(), kpId: 'similar_tri', type: 'mcq',
    stem, options, answer,
    explanation: `相似三角形对应边成比例：EF / BC = 相似比 = ${ratio}，所以 EF = ${ratio} × ${bc} = ${ef}。`
  };
}

// 圆的性质：圆周角 = 2 × 圆心角；切线性质（勾股）
function genCircle(level) {
  const mode = randInt(1, 2);
  if (mode === 1) {
    const inscribed = randInt(1, level <= 2 ? 4 : 8) * 10; // 圆周角
    const central = inscribed * 2;
    const stem = `同弧所对的圆周角为 ${inscribed}°，则该弧所对的圆心角为多少度？`;
    const correct = central;
    const d1 = inscribed / 2;   // 关系用反
    const d2 = inscribed;       // 误以为相等
    const d3 = inscribed + 90;  // 乱加角度
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'circle', type: 'mcq',
      stem, options, answer,
      explanation: `同弧所对的圆心角 = 2 × 圆周角 = 2 × ${inscribed}° = ${central}°。`
    };
  } else {
    // 切线性质：PA 切圆 O 于 A，OA ⊥ PA，OA = r，PA = 切线长，求 OP（斜边）
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]];
    const t = randPick(triples);
    const r = t[0], pa = t[1], op = t[2];
    const stem = `PA 切圆 O 于点 A，OA 为半径，OA = ${r}，PA = ${pa}，求 OP 的长。`;
    const correct = op;
    const d1 = r + pa;     // 直接相加
    const d2 = pa - r;     // 直接相减
    const d3 = r * pa;     // 直接相乘
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'circle', type: 'mcq',
      stem, options, answer,
      explanation: `切线性质：OA ⊥ PA，故 △OAP 为直角三角形。由勾股定理：OP = √(OA² + PA²) = √(${r}² + ${pa}²) = √(${r * r} + ${pa * pa}) = ${op}。`
    };
  }
}

// 概率与统计：袋中摸球求概率（分数）；求平均数
function genProbability(level) {
  const mode = randInt(1, 2);
  if (mode === 1) {
    // 袋中摸球
    let red, blue;
    do {
      red = randInt(2, level <= 2 ? 4 : 6);
      blue = randInt(2, level <= 2 ? 4 : 6);
    } while (red === blue);
    const total = red + blue;
    const stem = `袋中有 ${red} 个红球和 ${blue} 个蓝球（除颜色外完全相同）。从中任意摸出一个球，求摸到红球的概率。`;
    const correct = fracStr(red, total);
    const d1 = fracStr(blue, total);     // 摸成了蓝球的概率
    const d2 = fracStr(red, total + 1);  // 总数多数一个
    const d3 = fracStr(red + 1, total);  // 红球数多算一个
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'probability', type: 'mcq',
      stem, options, answer,
      explanation: `红球 ${red} 个，共 ${total} 个球，所以 P(红) = ${red}/${total} = ${correct}。`
    };
  } else {
    // 统计：求平均数
    const n = randInt(4, 5);
    const nums = [];
    for (let i = 0; i < n; i++) nums.push(randInt(2, level <= 2 ? 9 : 15));
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / n;
    const stem = `数据 ${nums.join('、')} 的平均数是？`;
    const correct = avg;
    const d1 = sum;               // 忘记除以个数
    const d2 = avg + 1;           // 计算偏差
    const d3 = (sum + 1) / n;     // 求和错算一位
    const { options, answer } = buildMcq(correct, [d1, d2, d3]);
    return {
      id: nextId(), kpId: 'probability', type: 'mcq',
      stem, options, answer,
      explanation: `总和 = ${nums.join(' + ')} = ${sum}，平均数 = ${sum} ÷ ${n} = ${fmt(avg)}。`
    };
  }
}

// ==================== 知识点讲解（HTML 字符串） ====================
const lessons = {
  real_numbers: `<h3>实数运算</h3>
    <p><b>平方根</b>：若 x² = a (a ≥ 0)，则 x = √a。常见：√4=2, √9=3, √16=4, √25=5, √36=6。</p>
    <p><b>绝对值</b>：|a| ≥ 0，即 |−5| = 5，|5| = 5。</p>
    <p><b>公式</b>：√a × √b = √(ab) (a,b ≥ 0)；|−a| = a (a ≥ 0)。</p>
    <p><b>例题</b>：√16 + |−3| = 4 + 3 = 7。</p>`,
  integer_ops: `<h3>整式加减</h3>
    <p><b>同类项</b>：所含字母相同，并且相同字母的指数也相同的项。</p>
    <p><b>合并法则</b>：字母部分不变，系数相加减。括号前是"−"号时，去括号后各项都要变号。</p>
    <p><b>例题</b>：(3x² + 2x) − (x² + 5x) = 3x² + 2x − x² − 5x = 2x² − 3x。</p>`,
  linear_eq: `<h3>一元一次方程</h3>
    <p><b>标准形式</b>：ax + b = c (a ≠ 0)。</p>
    <p><b>解法步骤</b>：移项（变号）→ 合并同类项 → 系数化为 1（两边除以 a）。</p>
    <p><b>例题</b>：2x + 3 = 7 → 2x = 4 → x = 2。</p>`,
  linear_system: `<h3>二元一次方程组</h3>
    <p><b>代入消元</b>：从一个方程解出一个未知数，代入另一个方程。</p>
    <p><b>加减消元</b>：两个方程相加或相减，消去一个未知数。</p>
    <p><b>例题</b>：x + y = 5，x − y = 1。两式相加得 2x = 6，x = 3；相减得 2y = 4，y = 2。</p>`,
  inequality: `<h3>一元一次不等式</h3>
    <p><b>解法</b>：与解一元一次方程类似，但要注意：<b>两边同乘/除以负数时，不等号方向必须改变</b>。</p>
    <p><b>例题</b>：2x + 1 < 5 → 2x < 4 → x < 2。</p>`,
  quadratic_eq: `<h3>一元二次方程</h3>
    <p><b>标准形式</b>：ax² + bx + c = 0 (a ≠ 0)。</p>
    <p><b>因式分解法</b>：把方程化为 (x + p)(x + q) = 0，则 x = −p 或 x = −q。</p>
    <p><b>例题</b>：x² + 5x + 6 = 0 → (x + 2)(x + 3) = 0 → x = −2 或 x = −3。</p>`,
  radical: `<h3>二次根式</h3>
    <p><b>定义</b>：形如 √a (a ≥ 0) 的式子。</p>
    <p><b>性质</b>：√(a²) = |a|；√a × √b = √(ab)；√a ÷ √b = √(a/b)。</p>
    <p><b>化简</b>：把根号内能开方的因数移到根号外，使根号内不含能开方的因数。</p>
    <p><b>例题</b>：√18 = √(9 × 2) = 3√2。</p>`,
  linear_func: `<h3>一次函数</h3>
    <p><b>解析式</b>：y = kx + b (k ≠ 0)。k 为斜率，b 为 y 轴截距。</p>
    <p><b>图象</b>：一条直线。k > 0 时 y 随 x 增大而增大；k < 0 时 y 随 x 增大而减小。</p>
    <p><b>例题</b>：y = 2x + 1，斜率 = 2，截距 = 1；当 x = 3 时 y = 2 × 3 + 1 = 7。</p>`,
  congruent_tri: `<h3>全等三角形</h3>
    <p><b>判定定理</b>：</p>
    <ul>
      <li><b>SSS</b>：三边对应相等</li>
      <li><b>SAS</b>：两边及其夹角对应相等</li>
      <li><b>ASA</b>：两角及其夹边对应相等</li>
      <li><b>AAS</b>：两角及其中一角的对边对应相等</li>
    </ul>
    <p><b>注意</b>：SSA 不能判定全等。</p>
    <p><b>例题</b>：△ABC 与 △DEF 中，AB = DE, BC = EF, ∠B = ∠E，由 SAS 可判定全等。</p>`,
  quadratic_func: `<h3>二次函数</h3>
    <p><b>顶点式</b>：y = a(x − h)² + k，顶点为 (h, k)，对称轴为直线 x = h。</p>
    <p><b>开口方向</b>：a > 0 时开口向上；a < 0 时开口向下。|a| 越大，开口越小（图象越窄）。</p>
    <p><b>例题</b>：y = 2(x − 1)² + 3，顶点 (1, 3)，对称轴 x = 1，开口向上。</p>`,
  similar_tri: `<h3>相似三角形</h3>
    <p><b>定义</b>：对应角相等、对应边成比例的两个三角形相似。</p>
    <p><b>相似比</b>：对应边的比。相似比 = 对应高之比 = 周长之比；面积比 = 相似比²。</p>
    <p><b>例题</b>：△ABC ∼ △DEF，相似比为 2，AB = 3，则 DE = 2 × 3 = 6。</p>`,
  circle: `<h3>圆的性质</h3>
    <p><b>圆心角与圆周角</b>：同弧所对的<b>圆心角 = 2 × 圆周角</b>。</p>
    <p><b>切线性质</b>：圆的切线垂直于过切点的半径（即 OA ⊥ PA）。</p>
    <p><b>例题</b>：圆周角为 50°，则同弧所对的圆心角 = 100°。</p>`,
  probability: `<h3>概率与统计</h3>
    <p><b>概率</b>：P(A) = 事件 A 发生的情况数 ÷ 总情况数，且 0 ≤ P ≤ 1。</p>
    <p><b>平均数</b>：所有数据之和 ÷ 数据个数。</p>
    <p><b>中位数</b>：数据由小到大排列后最中间的数（偶数个时取中间两数的平均）。</p>
    <p><b>众数</b>：出现次数最多的数。</p>
    <p><b>例题</b>：袋中 3 红 2 白球，摸一个，P(红) = 3/5。数据 2, 4, 4, 6 的平均数 = 4，中位数 = 4，众数 = 4。</p>`
};

// ==================== 生成器注册表 ====================
const kpRegistry = {
  real_numbers: genRealNumbers,
  integer_ops: genIntegerOps,
  linear_eq: genLinearEq,
  linear_system: genLinearSystem,
  inequality: genInequality,
  quadratic_eq: genQuadraticEq,
  radical: genRadical,
  linear_func: genLinearFunc,
  congruent_tri: genCongruentTri,
  quadratic_func: genQuadraticFunc,
  similar_tri: genSimilarTri,
  circle: genCircle,
  probability: genProbability
};

// ==================== 对外接口 ====================
export const mathEngine = {
  // 获取引擎支持的所有知识点 id
  supportedKps() {
    return Object.keys(kpRegistry);
  },

  // 生成单题
  // 返回: { id, kpId, type:'mcq'|'fill', stem, options?:[A,B,C,D], answer, explanation }
  generateQuestion(kpId, level = 1) {
    const gen = kpRegistry[kpId];
    if (!gen) {
      return {
        id: nextId(),
        kpId,
        type: 'fill',
        stem: `（暂不支持的知识点：${kpId}）`,
        answer: '',
        explanation: `该知识点尚未实现生成器。`
      };
    }
    try {
      return gen(level);
    } catch (e) {
      return {
        id: nextId(),
        kpId,
        type: 'fill',
        stem: `题目生成失败，请重试。`,
        answer: '',
        explanation: `错误信息：${e && e.message ? e.message : String(e)}`
      };
    }
  },

  // 批量生成
  generateBatch(kpId, level = 1, count = 5) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(this.generateQuestion(kpId, level));
    }
    return arr;
  },

  // 知识点讲解（html 字符串）
  getLesson(kpId) {
    return lessons[kpId] || `<p>该知识点暂无讲解。</p>`;
  }
};
