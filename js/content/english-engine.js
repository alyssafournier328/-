// 英语学习内容引擎 (ES6 模块)
// 面向上海初二升初三基础薄弱学生(平均20分)
// 从 be动词、一般现在时 等最基础内容起步
// 配合浏览器 Web Speech API 实现听力 TTS 与口语跟读识别
//
// 依赖: 仅依赖浏览器原生 fetch 与 Web Speech API, 不引入其他模块
// 词库: 从 ./data/words.json 加载; 加载失败时回退到内置基础词库

// ==================== 内部工具函数 ====================

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 从数组随机取 n 个(不重复)
function takeRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}

// 构造选择题: 正确答案 + 干扰项(去重后打乱)
function mcq(correct, distractors) {
  const set = Array.from(new Set([correct, ...distractors]));
  return { options: shuffle(set), answer: correct };
}

// ==================== 语法题库 ====================
// 每个 kpId 对应一组模板函数, 调用后返回
// { type:'mcq'|'fill', stem, options?, answer, explanation }
const GRAMMAR_BANK = {
  // ===== be动词与人称 =====
  be_verbs: [
    // 主语选 be 动词
    () => {
      const pool = [
        { s: 'I', v: 'am', n: 'a student' },
        { s: 'He', v: 'is', n: 'a teacher' },
        { s: 'She', v: 'is', n: 'a nurse' },
        { s: 'It', v: 'is', n: 'a cat' },
        { s: 'They', v: 'are', n: 'my friends' },
        { s: 'We', v: 'are', n: 'classmates' },
        { s: 'You', v: 'are', n: 'a good boy' },
        { s: 'Tom', v: 'is', n: 'my brother' },
        { s: 'My parents', v: 'are', n: 'at home' },
        { s: 'The dog', v: 'is', n: 'in the garden' }
      ];
      const t = pick(pool);
      const { options, answer } = mcq(t.v, ['am', 'is', 'are'].filter(x => x !== t.v));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}.`,
        options, answer,
        explanation: `主语 "${t.s}" 用 be动词 "${t.v}"。口诀: I 用 am; you/we/they 用 are; he/she/it 及单数名词用 is。`
      };
    },
    // 否定句(常见错误: 用 don't/doesn't)
    () => {
      const pool = [
        { s: 'He', neg: "isn't", n: 'a student' },
        { s: 'They', neg: "aren't", n: 'at school' },
        { s: 'She', neg: "isn't", n: 'tall' },
        { s: 'We', neg: "aren't", n: 'late' }
      ];
      const t = pick(pool);
      const { options, answer } = mcq(t.neg, ["don't", "doesn't", 'is', 'are'].filter(x => x !== t.neg).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}.`,
        options, answer,
        explanation: `be动词否定直接在其后加 not (is not = isn't)。常见错误: 误用 don't/doesn't —— 那是实义动词的否定, be动词不需要助动词。`
      };
    },
    // 一般疑问句(常见错误: 加 Do)
    () => {
      const pool = [
        { q: 'Are', s: 'you', n: 'a student' },
        { q: 'Is', s: 'she', n: 'at home' },
        { q: 'Are', s: 'they', n: 'your friends' },
        { q: 'Is', s: 'he', n: 'a doctor' }
      ];
      const t = pick(pool);
      const { options, answer } = mcq(t.q, ['Do', 'Does', 'Am', 'Is', 'Are'].filter(x => x !== t.q).slice(0, 3));
      return {
        type: 'mcq',
        stem: `___ ${t.s} ${t.n}?`,
        options, answer,
        explanation: `be动词疑问句把 be 提前即可, 不需要 Do/Does。常见错误: "Do you are..." 是错的。`
      };
    },
    // 缩写形式
    () => {
      const pool = [
        { full: 'She is', short: "She's" },
        { full: 'They are', short: "They're" },
        { full: 'It is', short: "It's" },
        { full: 'I am', short: "I'm" },
        { full: 'He is', short: "He's" },
        { full: 'We are', short: "We're" }
      ];
      const t = pick(pool);
      const all = ["He's", "She's", "They're", "It's", "I'm", "We're", "You're"];
      const { options, answer } = mcq(t.short, all.filter(x => x !== t.short).slice(0, 3));
      return {
        type: 'mcq',
        stem: `"${t.full}" 的缩写形式是 ___。`,
        options, answer,
        explanation: `be动词常与主语缩写: I am→I'm, you are→you're, he is→he's, she is→she's, it is→it's, we are→we're, they are→they're。`
      };
    },
    // there be 句型
    () => {
      const pool = [
        { s: 'a book', v: 'is', loc: 'on the desk' },
        { s: 'two apples', v: 'are', loc: 'in the basket' },
        { s: 'a cat', v: 'is', loc: 'under the tree' },
        { s: 'some students', v: 'are', loc: 'in the classroom' }
      ];
      const t = pick(pool);
      const { options, answer } = mcq(t.v, ['is', 'are'].filter(x => x !== t.v));
      return {
        type: 'mcq',
        stem: `There ___ ${t.s} ${t.loc}.`,
        options, answer,
        explanation: `there be 句型遵循"就近原则": be 动词与其后最近的主语保持一致。单数用 is, 复数用 are。`
      };
    },
    // 填空
    () => {
      const pool = [
        { s: 'I', v: 'am', n: 'twelve years old.' },
        { s: 'My mother', v: 'is', n: 'a doctor.' },
        { s: 'They', v: 'are', n: 'very happy.' },
        { s: 'The book', v: 'is', n: 'on the table.' }
      ];
      const t = pick(pool);
      return {
        type: 'fill',
        stem: `${t.s} ___ ${t.n}`,
        answer: t.v,
        explanation: `主语 "${t.s}" 搭配 be动词 "${t.v}"。`
      };
    }
  ],

  // ===== 名词复数 =====
  nouns_plural: [
    // 规则 +s
    () => {
      const t = pick([
        { w: 'book', p: 'books', n: 'I have three ___.' },
        { w: 'pen', p: 'pens', n: 'There are five ___ on the desk.' }
      ]);
      const { options, answer } = mcq(t.p, [t.w + 'es', t.w + 's', t.w].filter(x => x !== t.p).concat(['bookes']));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `一般名词复数直接加 s: ${t.w} → ${t.p}。`
      };
    },
    // +es (s/sh/ch/x 结尾)
    () => {
      const t = pick([
        { w: 'watch', p: 'watches', n: 'He has two ___.' },
        { w: 'box', p: 'boxes', n: 'There are many ___ here.' },
        { w: 'bus', p: 'buses', n: 'I can see three ___.' }
      ]);
      const { options, answer } = mcq(t.p, [t.w + 's', t.w + 'ies', t.w + 's'].filter((x, i, a) => a.indexOf(x) === i && x !== t.p));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `以 s, sh, ch, x 结尾的名词复数加 es: ${t.w} → ${t.p}。`
      };
    },
    // 辅音字母+y → ies
    () => {
      const t = pick([
        { w: 'city', p: 'cities', n: 'There are many big ___ in China.' },
        { w: 'baby', p: 'babies', n: 'The ___ are crying.' },
        { w: 'story', p: 'stories', n: 'She tells us two ___.' }
      ]);
      const { options, answer } = mcq(t.p, [t.w + 's', t.w + 'es', t.w.slice(0, -1) + 'ies'].filter((x, i, a) => a.indexOf(x) === i && x !== t.p));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `辅音字母+y 结尾: 把 y 改 i 加 es: ${t.w} → ${t.p}。元音字母+y 直接加 s (如 boy→boys)。`
      };
    },
    // f/fe → ves
    () => {
      const t = pick([
        { w: 'knife', p: 'knives', n: 'He has two ___.' },
        { w: 'leaf', p: 'leaves', n: 'The ___ fall in autumn.' },
        { w: 'wolf', p: 'wolves', n: 'We saw three ___.' }
      ]);
      const { options, answer } = mcq(t.p, [t.w + 's', t.w + 'es', t.w.slice(0, -1) + 's'].filter((x, i, a) => a.indexOf(x) === i && x !== t.p));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `以 f/fe 结尾的名词: 变 f/fe 为 v 加 es: ${t.w} → ${t.p}。`
      };
    },
    // 不规则
    () => {
      const t = pick([
        { w: 'man', p: 'men', n: 'Two ___ are talking.' },
        { w: 'child', p: 'children', n: 'The ___ are playing.' },
        { w: 'foot', p: 'feet', n: 'I have two ___.' },
        { w: 'tooth', p: 'teeth', n: 'Brush your ___ every day.' }
      ]);
      const { options, answer } = mcq(t.p, [t.w + 's', t.w + 'es', t.w + 'ren'].filter(x => x !== t.p));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `不规则复数需记忆: man→men, woman→women, child→children, foot→feet, tooth→teeth, mouse→mice, goose→geese。`
      };
    },
    // 单复同形
    () => {
      const t = pick([
        { w: 'sheep', p: 'sheep', n: 'There are five ___ on the hill.' },
        { w: 'deer', p: 'deer', n: 'I see two ___ in the forest.' }
      ]);
      const { options, answer } = mcq(t.p, [t.w + 's', t.w + 'es', t.w + 'ren'].filter(x => x !== t.p));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `单复同形: sheep, deer, fish 单复数形式相同。常见错误: 写成 "sheeps"。`
      };
    },
    // 填空
    () => {
      const t = pick([
        { w: 'child', p: 'children', n: 'The ___ (child) are happy.' },
        { w: 'box', p: 'boxes', n: 'I have two ___ (box).' },
        { w: 'city', p: 'cities', n: 'There are many ___ (city) in China.' }
      ]);
      return {
        type: 'fill',
        stem: t.n,
        answer: t.p,
        explanation: `${t.w} 的复数是 ${t.p}。`
      };
    }
  ],

  // ===== 一般现在时 =====
  present_simple: [
    // 三单选动词形式(常见错误: go/going/went)
    () => {
      const t = pick([
        { s: 'He', v: 'goes', base: 'go', n: 'to school every day.' },
        { s: 'She', v: 'likes', base: 'like', n: 'apples.' },
        { s: 'Tom', v: 'plays', base: 'play', n: 'football after school.' },
        { s: 'My father', v: 'works', base: 'work', n: 'in a hospital.' }
      ]);
      const { options, answer } = mcq(t.v, [t.base, t.base + 'ing', t.base + 'ed'].filter(x => x !== t.v));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `主语是第三人称单数(he/she/it/单个人名)时, 动词加 s/es: ${t.base} → ${t.v}。常见错误: "He go" 是错的。`
      };
    },
    // 三单变化 es (o/s/sh/ch/x)
    () => {
      const t = pick([
        { s: 'He', v: 'watches', base: 'watch', n: 'TV every evening.' },
        { s: 'She', v: 'goes', base: 'go', n: 'to school by bus.' },
        { s: 'Tom', v: 'washes', base: 'wash', n: 'his clothes.' }
      ]);
      const { options, answer } = mcq(t.v, [t.base + 's', t.base, t.base + 'ing'].filter(x => x !== t.v));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `以 o, s, sh, ch, x 结尾的动词三单加 es: ${t.base} → ${t.v}。`
      };
    },
    // 否定句(常见错误: 用 don't)
    () => {
      const t = pick([
        { s: 'She', neg: "doesn't", base: 'like', n: 'apples.' },
        { s: 'He', neg: "doesn't", base: 'play', n: 'football.' },
        { s: 'They', neg: "don't", base: 'live', n: 'here.' },
        { s: 'I', neg: "don't", base: 'know', n: 'him.' }
      ]);
      const { options, answer } = mcq(t.neg, ["don't", "doesn't", "isn't", "aren't"].filter(x => x !== t.neg));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.base} ${t.n}`,
        options, answer,
        explanation: `一般现在时否定: 三单用 doesn't, 其余用 don't, 后接动词原形。注意: doesn't/don't 后动词恢复原形。`
      };
    },
    // 疑问句
    () => {
      const t = pick([
        { q: 'Do', s: 'you', base: 'play', n: 'football?' },
        { q: 'Do', s: 'they', base: 'live', n: 'here?' },
        { q: 'Does', s: 'she', base: 'like', n: 'music?' },
        { q: 'Does', s: 'he', base: 'go', n: 'to school?' }
      ]);
      const { options, answer } = mcq(t.q, ['Do', 'Does', 'Are', 'Is'].filter(x => x !== t.q).slice(0, 3));
      return {
        type: 'mcq',
        stem: `___ ${t.s} ${t.base} ${t.n}`,
        options, answer,
        explanation: `一般现在时疑问: 三单主语用 Does, 其余用 Do, 后接动词原形。`
      };
    },
    // 频率副词位置
    () => {
      const t = pick([
        { s: 'He', adv: 'always', v: 'plays', n: 'basketball.' },
        { s: 'She', adv: 'usually', v: 'gets', n: 'up early.' },
        { s: 'They', adv: 'often', v: 'go', n: 'shopping.' }
      ]);
      const { options, answer } = mcq(`${t.adv} ${t.v}`, [`${t.v} ${t.adv}`, `${t.adv} ${t.adv} ${t.v}`, `is ${t.adv} ${t.v}`]);
      return {
        type: 'mcq',
        stem: `选择正确语序: ${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `频率副词 (always/usually/often/sometimes/never) 放在实义动词前, be动词后。`
      };
    },
    // 填空: 三单
    () => {
      const t = pick([
        { s: 'My father', v: 'works', base: 'work', n: 'in a hospital.' },
        { s: 'She', v: 'watches', base: 'watch', n: 'TV every evening.' },
        { s: 'Tom', v: 'studies', base: 'study', n: 'hard.' }
      ]);
      return {
        type: 'fill',
        stem: `${t.s} ___ (${t.base}) ${t.n}`,
        answer: t.v,
        explanation: `三单主语, 动词 ${t.base} → ${t.v}。`
      };
    }
  ],

  // ===== 人称/物主代词 =====
  pronouns: [
    // 宾格
    () => {
      const t = pick([
        { s: 'I love', obj: 'her', n: 'very much.' },
        { s: 'Look at', obj: 'him', n: '.' },
        { s: 'Please help', obj: 'me', n: '.' },
        { s: 'I know', obj: 'them', n: '.' }
      ]);
      const { options, answer } = mcq(t.obj, ['she', 'he', 'I', 'they'].filter(x => x !== t.obj).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `动词或介词后用宾格: me/him/her/us/them。主格(I/he/she)做主语, 宾格做宾语。`
      };
    },
    // 形容词性物主代词
    () => {
      const t = pick([
        { s: 'This is', adj: 'my', n: 'book.' },
        { s: 'That is', adj: 'his', n: 'pen.' },
        { s: 'It is', adj: 'their', n: 'cat.' },
        { s: 'These are', adj: 'our', n: 'desks.' }
      ]);
      const { options, answer } = mcq(t.adj, ['mine', 'him', 'them', 'me'].filter(x => x !== t.adj).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `形容词性物主代词 (my/your/his/her/its/our/their) 后必须接名词。`
      };
    },
    // 名词性物主代词
    () => {
      const t = pick([
        { s: 'This book is', n: 'mine' },
        { s: 'That pen is', n: 'hers' },
        { s: 'The cat is', n: 'ours' },
        { s: 'These are', n: 'theirs' }
      ]);
      const { options, answer } = mcq(t.n, ['my', 'her', 'our', 'their'].filter(x => x !== t.n).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___.`,
        options, answer,
        explanation: `名词性物主代词 (mine/yours/his/hers/its/ours/theirs) 后不接名词, 相当于"形容词性物主代词+名词"。`
      };
    },
    // 主格做主语
    () => {
      const t = pick([
        { s: 'I', n: 'am a student.' },
        { s: 'She', n: 'is my sister.' },
        { s: 'They', n: 'are my friends.' },
        { s: 'He', n: 'is tall.' }
      ]);
      const { options, answer } = mcq(t.s, ['Me', 'My', 'Mine', 'Him'].filter(x => x !== t.s).slice(0, 3));
      return {
        type: 'mcq',
        stem: `___ ${t.n}`,
        options, answer,
        explanation: `句首主语用主格: I/you/he/she/it/we/they。`
      };
    },
    // 形容词性 vs 名词性 辨析
    () => {
      const t = pick([
        { s: 'This is her book. The book is', n: 'hers' },
        { s: 'This is my pen. The pen is', n: 'mine' }
      ]);
      const { options, answer } = mcq(t.n, ['her', 'my', 'him', 'me'].filter(x => x !== t.n).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___.`,
        options, answer,
        explanation: `后不接名词时用名词性物主代词。比较: my book (有名词) / The book is mine (无名词)。`
      };
    },
    // 填空
    () => {
      const t = pick([
        { s: 'This is', a: 'my', n: '(我) pen.' },
        { s: 'I love', a: 'her', n: '(她).' },
        { s: 'The bag is', a: 'mine', n: '(我的).' }
      ]);
      return {
        type: 'fill',
        stem: `${t.s} ___ ${t.n}`,
        answer: t.a,
        explanation: `根据句意填入合适的代词。`
      };
    }
  ],

  // ===== 冠词 a/an/the =====
  articles: [
    // a vs an (元音音素)
    () => {
      const t = pick([
        { w: 'apple', a: 'an' },
        { w: 'orange', a: 'an' },
        { w: 'egg', a: 'an' },
        { w: 'book', a: 'a' },
        { w: 'teacher', a: 'a' },
        { w: 'umbrella', a: 'an' },
        { w: 'hour', a: 'an' }
      ]);
      const { options, answer } = mcq(t.a, ['a', 'an', 'the'].filter(x => x !== t.a));
      return {
        type: 'mcq',
        stem: `I have ___ ${t.w}.`,
        options, answer,
        explanation: `不定冠词: 元音音素开头用 an, 辅音音素开头用 a。注意看"读音"不是"字母": hour(h不发音)用 an, university(ju音)用 a。`
      };
    },
    // 定冠词 the (独一无二)
    () => {
      const t = pick([
        { n: 'sun is bright.', a: 'The' },
        { n: 'moon is round.', a: 'The' },
        { n: 'earth is our home.', a: 'The' },
        { n: 'sky is blue.', a: 'The' }
      ]);
      const { options, answer } = mcq(t.a, ['A', 'An', '/'].filter(x => x !== t.a));
      return {
        type: 'mcq',
        stem: `___ ${t.n}`,
        options, answer,
        explanation: `世上独一无二的事物前用 the: the sun/moon/earth/sky/world。`
      };
    },
    // 球类运动零冠词
    () => {
      const t = pick([
        { v: 'football', a: '/' },
        { v: 'basketball', a: '/' },
        { v: 'tennis', a: '/' }
      ]);
      const { options, answer } = mcq(t.a, ['The', 'A', 'An'].filter(x => x !== t.a));
      return {
        type: 'mcq',
        stem: `I often play ___ ${t.v} after school.`,
        options, answer,
        explanation: `球类运动、棋类前不加冠词 (零冠词): play football/basketball/chess。常见错误: "play the football"。`
      };
    },
    // 三餐零冠词
    () => {
      const t = pick([
        { m: 'breakfast', a: '/' },
        { m: 'lunch', a: '/' },
        { m: 'dinner', a: '/' }
      ]);
      const { options, answer } = mcq(t.a, ['The', 'A', 'An'].filter(x => x !== t.a));
      return {
        type: 'mcq',
        stem: `I have ___ ${t.m} at seven.`,
        options, answer,
        explanation: `三餐前通常不加冠词: have breakfast/lunch/dinner。`
      };
    },
    // 乐器加 the
    () => {
      const t = pick([
        { i: 'piano', a: 'the' },
        { i: 'guitar', a: 'the' },
        { i: 'violin', a: 'the' }
      ]);
      const { options, answer } = mcq(t.a, ['A', 'An', '/'].filter(x => x !== t.a));
      return {
        type: 'mcq',
        stem: `She plays ___ ${t.i} well.`,
        options, answer,
        explanation: `西洋乐器前加 the: play the piano/guitar/violin。对比: 球类不加 the (play football)。`
      };
    },
    // 序数词/最高级前加 the
    () => {
      const t = pick([
        { n: 'first', a: 'the' },
        { n: 'second', a: 'the' }
      ]);
      const { options, answer } = mcq(t.a, ['A', 'An', '/'].filter(x => x !== t.a));
      return {
        type: 'mcq',
        stem: `He is ___ ${t.n} to come.`,
        options, answer,
        explanation: `序数词、形容词最高级前通常加 the。`
      };
    }
  ],

  // ===== 现在进行时 =====
  present_continuous: [
    // be + doing (常见错误: 缺 be)
    () => {
      const t = pick([
        { s: 'He', be: 'is', v: 'playing', n: 'football now.' },
        { s: 'They', be: 'are', v: 'reading', n: 'books.' },
        { s: 'She', be: 'is', v: 'watching', n: 'TV.' },
        { s: 'I', be: 'am', v: 'doing', n: 'my homework.' }
      ]);
      const { options, answer } = mcq(`${t.be} ${t.v}`, [t.v, `${t.v}`, `is ${t.v}`, 'plays'].filter((x, i, a) => a.indexOf(x) === i && x !== `${t.be} ${t.v}`).slice(0, 3));
      return {
        type: 'mcq',
        stem: `Look! ${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `现在进行时 = be + 动词ing。常见错误: 漏掉 be (只写 "He playing")。`
      };
    },
    // 选 be 动词
    () => {
      const t = pick([
        { s: 'They', be: 'are', n: 'reading now.' },
        { s: 'He', be: 'is', n: 'running.' },
        { s: 'I', be: 'am', n: 'writing.' }
      ]);
      const { options, answer } = mcq(t.be, ['am', 'is', 'are'].filter(x => x !== t.be));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `现在进行时的 be 动词随主语变化: I→am, he/she/it→is, we/you/they→are。`
      };
    },
    // 双写 + ing
    () => {
      const t = pick([
        { w: 'run', ing: 'running', n: 'He is ___.' },
        { w: 'swim', ing: 'swimming', n: 'The boy is ___.' },
        { w: 'sit', ing: 'sitting', n: 'She is ___ on the chair.' }
      ]);
      const { options, answer } = mcq(t.ing, [t.w + 'ing', t.w.slice(0, -1) + 'ing', t.w + 'ning'].filter((x, i, a) => a.indexOf(x) === i && x !== t.ing));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `重读闭音节结尾(辅音+元音+辅音)双写末尾辅音加 ing: ${t.w} → ${t.ing}。`
      };
    },
    // 去 e 加 ing
    () => {
      const t = pick([
        { w: 'make', ing: 'making', n: 'She is ___ a cake.' },
        { w: 'write', ing: 'writing', n: 'He is ___ a letter.' },
        { w: 'dance', ing: 'dancing', n: 'They are ___.' }
      ]);
      const { options, answer } = mcq(t.ing, [t.w + 'ing', t.w + 'eing', t.w.slice(0, -1) + 'eing'].filter((x, i, a) => a.indexOf(x) === i && x !== t.ing));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `以不发音的 e 结尾: 去 e 加 ing: ${t.w} → ${t.ing}。`
      };
    },
    // 否定
    () => {
      const t = pick([
        { s: 'I', neg: "am not", v: 'doing', n: 'my homework.' },
        { s: 'He', neg: "isn't", v: 'playing', n: 'now.' },
        { s: 'They', neg: "aren't", v: 'reading', n: 'books.' }
      ]);
      const { options, answer } = mcq(t.neg, ["don't", "doesn't", "is", 'are'].filter(x => x !== t.neg).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.v} ${t.n}`,
        options, answer,
        explanation: `现在进行时否定: 在 be 后加 not。不用 don't/doesn't。`
      };
    },
    // 填空
    () => {
      const t = pick([
        { s: 'She is', ing: 'swimming', base: 'swim', n: 'now.' },
        { s: 'He is', ing: 'making', base: 'make', n: 'a cake.' },
        { s: 'They are', ing: 'playing', base: 'play', n: 'football.' }
      ]);
      return {
        type: 'fill',
        stem: `${t.s} ___ (${t.base}) ${t.n}`,
        answer: t.ing,
        explanation: `现在分词: ${t.base} → ${t.ing}。`
      };
    }
  ],

  // ===== 一般过去时 =====
  past_simple: [
    // 不规则过去式
    () => {
      const t = pick([
        { s: 'He', v: 'went', base: 'go', n: 'to school yesterday.' },
        { s: 'She', v: 'had', base: 'have', n: 'a meeting last night.' },
        { s: 'I', v: 'saw', base: 'see', n: 'him yesterday.' },
        { s: 'They', v: 'ate', base: 'eat', n: 'an apple.' },
        { s: 'He', v: 'bought', base: 'buy', n: 'a book.' }
      ]);
      const { options, answer } = mcq(t.v, [t.base, t.base + 'ed', t.base + 's'].filter(x => x !== t.v));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `不规则动词过去式需记忆: ${t.base} → ${t.v}。常见错误: 直接加 ed (goed×)。`
      };
    },
    // 规则 ed
    () => {
      const t = pick([
        { s: 'I', v: 'watched', base: 'watch', n: 'TV last night.' },
        { s: 'She', v: 'played', base: 'play', n: 'football yesterday.' },
        { s: 'He', v: 'lived', base: 'live', n: 'here in 2010.' }
      ]);
      const { options, answer } = mcq(t.v, [t.base, t.base + 's', t.base + 'ing'].filter(x => x !== t.v));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `规则动词过去式加 ed: ${t.base} → ${t.v}。`
      };
    },
    // 否定(常见错误: 用 don't/doesn't)
    () => {
      const t = pick([
        { s: 'I', neg: "didn't", base: 'go', n: 'yesterday.' },
        { s: 'She', neg: "didn't", base: 'come', n: 'last night.' },
        { s: 'They', neg: "didn't", base: 'play', n: 'football.' }
      ]);
      const { options, answer } = mcq(t.neg, ["don't", "doesn't", "wasn't", 'not'].filter(x => x !== t.neg).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.base} ${t.n}`,
        options, answer,
        explanation: `一般过去时否定用 didn't, 后接动词原形。常见错误: "didn't went" 是错的 (应 didn't go)。`
      };
    },
    // 疑问句
    () => {
      const t = pick([
        { q: 'Did', s: 'you', base: 'see', n: 'him?' },
        { q: 'Did', s: 'she', base: 'go', n: 'home?' },
        { q: 'Did', s: 'they', base: 'play', n: 'football?' }
      ]);
      const { options, answer } = mcq(t.q, ['Do', 'Does', 'Were', 'Was'].filter(x => x !== t.q).slice(0, 3));
      return {
        type: 'mcq',
        stem: `___ ${t.s} ${t.base} ${t.n}`,
        options, answer,
        explanation: `一般过去时疑问用 Did, 后接动词原形。`
      };
    },
    // 双写 + ed
    () => {
      const t = pick([
        { w: 'stop', p: 'stopped', n: 'He ___ the car.' },
        { w: 'plan', p: 'planned', n: 'She ___ a trip.' }
      ]);
      const { options, answer } = mcq(t.p, [t.w + 'ed', t.w + 'd', t.w.slice(0, -1) + 'ed'].filter((x, i, a) => a.indexOf(x) === i && x !== t.p));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `重读闭音节结尾双写末尾辅音加 ed: ${t.w} → ${t.p}。`
      };
    },
    // was/were
    () => {
      const t = pick([
        { s: 'I', v: 'was', n: 'happy yesterday.' },
        { s: 'He', v: 'was', n: 'at home.' },
        { s: 'They', v: 'were', n: 'late.' },
        { s: 'She', v: 'was', n: 'a doctor.' }
      ]);
      const { options, answer } = mcq(t.v, ['was', 'were', 'is', 'are'].filter(x => x !== t.v).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `be动词过去式: I/he/she/it 用 was; we/you/they 用 were。`
      };
    },
    // 填空
    () => {
      const t = pick([
        { s: 'I', v: 'watched', base: 'watch', n: 'TV last night.' },
        { s: 'He', v: 'went', base: 'go', n: 'to school yesterday.' }
      ]);
      return {
        type: 'fill',
        stem: `${t.s} ___ (${t.base}) ${t.n}`,
        answer: t.v,
        explanation: `${t.base} 的过去式是 ${t.v}。`
      };
    }
  ],

  // ===== 一般将来时 =====
  future_simple: [
    // will
    () => {
      const t = pick([
        { s: 'I', v: 'will', base: 'go', n: 'tomorrow.' },
        { s: 'He', v: 'will', base: 'come', n: 'next week.' },
        { s: 'They', v: 'will', base: 'visit', n: 'us soon.' }
      ]);
      const { options, answer } = mcq(t.v, ['would', 'am', 'is', 'going'].filter(x => x !== t.v).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.base} ${t.n}`,
        options, answer,
        explanation: `will + 动词原形表将来。主语不分人称都用 will。`
      };
    },
    // be going to
    () => {
      const t = pick([
        { s: 'She', be: 'is', n: 'going to visit her uncle.' },
        { s: 'They', be: 'are', n: 'going to play football.' },
        { s: 'I', be: 'am', n: 'going to read a book.' }
      ]);
      const { options, answer } = mcq(t.be, ['am', 'is', 'are', 'will'].filter(x => x !== t.be).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `be going to + 动词原形, be 随主语变化。表计划、打算。`
      };
    },
    // will 否定
    () => {
      const t = pick([
        { s: 'He', neg: "won't", base: 'come', n: 'tomorrow.' },
        { s: 'I', neg: "won't", base: 'be', n: 'late.' },
        { s: 'They', neg: "won't", base: 'go', n: 'with us.' }
      ]);
      const { options, answer } = mcq(t.neg, ["don't", "doesn't", "willn't", 'not'].filter(x => x !== t.neg).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.base} ${t.n}`,
        options, answer,
        explanation: `will not 缩写为 won't (不是 willn't)。`
      };
    },
    // 标志词辨析(选时态)
    () => {
      const { options, answer } = mcq('will go', ['go', 'went', 'goes']);
      return {
        type: 'mcq',
        stem: `I ___ to Beijing next Sunday.`,
        options, answer,
        explanation: `next Sunday 是将来时间标志, 用 will + 动词原形。`
      };
    },
    // 疑问句
    () => {
      const t = pick([
        { q: 'Will', s: 'you', base: 'come', n: 'tomorrow?' },
        { q: 'Will', s: 'she', base: 'go', n: 'with us?' }
      ]);
      const { options, answer } = mcq(t.q, ['Do', 'Does', 'Are', 'Did'].filter(x => x !== t.q).slice(0, 3));
      return {
        type: 'mcq',
        stem: `___ ${t.s} ${t.base} ${t.n}`,
        options, answer,
        explanation: `will 疑问句把 will 提前。`
      };
    },
    // 填空
    () => {
      const t = pick([
        { s: 'I will', v: 'visit', base: 'visit', n: 'my uncle tomorrow.' },
        { s: 'They are going to', v: 'play', base: 'play', n: 'football.' }
      ]);
      return {
        type: 'fill',
        stem: `${t.s} ___ (${t.base}) ${t.n}`,
        answer: t.v,
        explanation: `will / be going to 后接动词原形。`
      };
    }
  ],

  // ===== 情态动词 =====
  modal_verbs: [
    // can
    () => {
      const t = pick([
        { s: 'He', m: 'can', base: 'swim', n: 'very well.' },
        { s: 'She', m: 'can', base: 'speak', n: 'English.' },
        { s: 'I', m: 'can', base: 'help', n: 'you.' }
      ]);
      const { options, answer } = mcq(t.m, ['cans', 'could to', 'is', 'does'].filter(x => x !== t.m).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.base} ${t.n}`,
        options, answer,
        explanation: `情态动词 can 后接动词原形, 无人称变化 (不用 cans/cans)。`
      };
    },
    // must
    () => {
      const t = pick([
        { s: 'You', m: 'must', base: 'finish', n: 'your homework.' },
        { s: 'We', m: 'must', base: 'study', n: 'hard.' }
      ]);
      const { options, answer } = mcq(t.m, ['must to', 'have', 'are', 'should to'].filter(x => x !== t.m).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.base} ${t.n}`,
        options, answer,
        explanation: `must 后接动词原形, 不加 to (不是 must to)。`
      };
    },
    // should
    () => {
      const t = pick([
        { s: 'You', m: 'should', base: 'study', n: 'hard.' },
        { s: 'He', m: 'should', base: 'rest', n: 'more.' }
      ]);
      const { options, answer } = mcq(t.m, ['shoulds', 'should to', 'must to', 'ought'].filter(x => x !== t.m).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.base} ${t.n}`,
        options, answer,
        explanation: `should 后接动词原形, 表建议。`
      };
    },
    // 情态动词 + 原形(辨析)
    () => {
      const t = pick([
        { s: 'He can', base: 'swim', wrong: 'swims', n: 'now.' },
        { s: 'She must', base: 'go', wrong: 'goes', n: 'home.' },
        { s: 'You should', base: 'help', wrong: 'helps', n: 'others.' }
      ]);
      const { options, answer } = mcq(t.base, [t.wrong, t.base + 'ing', t.base + 'ed'].filter(x => x !== t.base));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `情态动词 (can/must/should/may) 后只能接动词原形。常见错误: "He can swims"。`
      };
    },
    // 否定 mustn't
    () => {
      const { options, answer } = mcq("mustn't", ["don't must", "mustn't to", 'not must'].filter((x, i, a) => a.indexOf(x) === i));
      return {
        type: 'mcq',
        stem: `You ___ smoke here. (禁止)`,
        options, answer,
        explanation: `must not 缩写 mustn't, 表禁止。后面接动词原形。`
      };
    },
    // may 请求
    () => {
      const { options, answer } = mcq('May', ['Do', 'Am', 'Can to', 'Does']);
      return {
        type: 'mcq',
        stem: `___ I come in?`,
        options, answer,
        explanation: `May I...? 表客气请求。`
      };
    }
  ],

  // ===== 形容词比较级/最高级 =====
  comparative: [
    // 比较级 +er
    () => {
      const t = pick([
        { a: 'tall', comp: 'taller', n: 'Tom is ___ than Sam.' },
        { a: 'fast', comp: 'faster', n: 'A car is ___ than a bike.' },
        { a: 'old', comp: 'older', n: 'He is ___ than me.' }
      ]);
      const { options, answer } = mcq(t.comp, [t.a, t.a + 'est', 'more ' + t.a].filter(x => x !== t.comp));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `单音节形容词比较级加 er: ${t.a} → ${t.comp}。than 是比较级标志。`
      };
    },
    // 双写 + er
    () => {
      const t = pick([
        { a: 'big', comp: 'bigger', n: 'This box is ___ than that one.' },
        { a: 'hot', comp: 'hotter', n: 'Today is ___ than yesterday.' }
      ]);
      const { options, answer } = mcq(t.comp, [t.a + 'er', t.a + 'ger', 'more ' + t.a].filter((x, i, arr) => arr.indexOf(x) === i && x !== t.comp));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `重读闭音节双写末尾辅音加 er: ${t.a} → ${t.comp}。`
      };
    },
    // y → ier
    () => {
      const t = pick([
        { a: 'happy', comp: 'happier', n: 'She is ___ than before.' },
        { a: 'heavy', comp: 'heavier', n: 'This box is ___ than that.' }
      ]);
      const { options, answer } = mcq(t.comp, [t.a + 'er', t.a + 'r', 'more ' + t.a].filter((x, i, arr) => arr.indexOf(x) === i && x !== t.comp));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `辅音字母+y 结尾: 改 y 为 i 加 er: ${t.a} → ${t.comp}。`
      };
    },
    // 不规则 better
    () => {
      const t = pick([
        { comp: 'better', a: 'good', n: 'He is ___ at math than me.' },
        { comp: 'worse', a: 'bad', n: 'The weather is ___ than yesterday.' }
      ]);
      const { options, answer } = mcq(t.comp, [t.a, t.a + 'er', 'more ' + t.a].filter(x => x !== t.comp));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `不规则: good → better, bad → worse, many/much → more, little → less, far → farther/further。`
      };
    },
    // 最高级
    () => {
      const t = pick([
        { a: 'tall', sup: 'tallest', n: 'He is the ___ in our class.' },
        { a: 'fast', sup: 'fastest', n: 'He runs the ___ of all.' }
      ]);
      const { options, answer } = mcq(t.sup, [t.a, t.a + 'er', 'most ' + t.a].filter(x => x !== t.sup));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `单音节最高级加 est, 前加 the: ${t.a} → the ${t.sup}。`
      };
    },
    // 多音节 more/most
    () => {
      const t = pick([
        { a: 'beautiful', comp: 'more beautiful', n: 'This flower is ___ than that one.' },
        { a: 'interesting', comp: 'more interesting', n: 'The book is ___ than the film.' }
      ]);
      const { options, answer } = mcq(t.comp, [t.a + 'er', t.a + 'r', t.a].filter((x, i, arr) => arr.indexOf(x) === i && x !== t.comp));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `多音节形容词比较级在前面加 more: ${t.a} → more ${t.a}。`
      };
    }
  ],

  // ===== 现在完成时 =====
  present_perfect: [
    // have/has 选择
    () => {
      const t = pick([
        { s: 'I', h: 'have', v: 'finished', n: 'my homework.' },
        { s: 'She', h: 'has', v: 'gone', n: 'to Beijing.' },
        { s: 'They', h: 'have', v: 'arrived', n: 'in Shanghai.' },
        { s: 'He', h: 'has', v: 'lost', n: 'his key.' }
      ]);
      const { options, answer } = mcq(t.h, ['have', 'has', 'had', 'is'].filter(x => x !== t.h).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.v} ${t.n}`,
        options, answer,
        explanation: `现在完成时 = have/has + 过去分词。三单主语用 has, 其余用 have。`
      };
    },
    // 过去分词(常见错误: 用过去式)
    () => {
      const t = pick([
        { s: 'I have', pp: 'eaten', base: 'eat', n: 'breakfast.' },
        { s: 'She has', pp: 'written', base: 'write', n: 'a letter.' },
        { s: 'He has', pp: 'gone', base: 'go', n: 'home.' },
        { s: 'They have', pp: 'seen', base: 'see', n: 'the film.' }
      ]);
      const { options, answer } = mcq(t.pp, [t.base, t.base + 'ed', t.base + 's'].filter(x => x !== t.pp));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `不规则过去分词需记忆: ${t.base} → 过去分词 ${t.pp}。`
      };
    },
    // 否定
    () => {
      const t = pick([
        { s: 'I', neg: "haven't", pp: 'seen', n: 'him.' },
        { s: 'She', neg: "hasn't", pp: 'finished', n: 'it.' }
      ]);
      const { options, answer } = mcq(t.neg, ["don't", "doesn't", "didn't", 'not have'].filter(x => x !== t.neg).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.pp} ${t.n}`,
        options, answer,
        explanation: `现在完成时否定: have/has + not, 缩写 haven't/hasn't。`
      };
    },
    // ever/never
    () => {
      const { options, answer } = mcq('Have you ever been', ['Did you ever been', 'Do you ever been', 'Are you ever']);
      return {
        type: 'mcq',
        stem: `___ to Beijing?`,
        options, answer,
        explanation: `ever/never 常与现在完成时搭配: Have you ever...? / I have never...`
      };
    },
    // already/just/yet
    () => {
      const { options, answer } = mcq('have finished', ['finish', 'finished', 'are finishing']);
      return {
        type: 'mcq',
        stem: `I ___ already ___ my homework.`,
        options, answer,
        explanation: `already/just 常用于现在完成时, yet 用于否定/疑问句末。`
      };
    },
    // 填空
    () => {
      const t = pick([
        { s: 'I have', pp: 'eaten', base: 'eat', n: 'an apple.' },
        { s: 'She has', pp: 'written', base: 'write', n: 'a letter.' }
      ]);
      return {
        type: 'fill',
        stem: `${t.s} ___ (${t.base}) ${t.n}`,
        answer: t.pp,
        explanation: `${t.base} 的过去分词是 ${t.pp}。`
      };
    }
  ],

  // ===== 被动语态 =====
  passive_voice: [
    // 一般现在时被动
    () => {
      const t = pick([
        { s: 'English', v: 'is spoken', n: 'in many countries.' },
        { s: 'The room', v: 'is cleaned', n: 'every day.' },
        { s: 'Books', v: 'are read', n: 'by students.' }
      ]);
      const { options, answer } = mcq(t.v, ['speaks', 'speaking', 'speak', 'is speaking'].filter(x => x !== t.v).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `一般现在时被动 = am/is/are + 过去分词。`
      };
    },
    // 一般过去时被动
    () => {
      const t = pick([
        { s: 'The book', v: 'was written', n: 'in 1990.' },
        { s: 'The window', v: 'was broken', n: 'yesterday.' },
        { s: 'They', v: 'were invited', n: 'to the party.' }
      ]);
      const { options, answer } = mcq(t.v, ['wrote', 'writes', 'is written', 'writing'].filter(x => x !== t.v).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `一般过去时被动 = was/were + 过去分词。`
      };
    },
    // 含情态动词的被动
    () => {
      const t = pick([
        { s: 'It must', v: 'be done', n: 'at once.' },
        { s: 'The work can', v: 'be finished', n: 'today.' }
      ]);
      const { options, answer } = mcq(t.v, ['do', 'done', 'doing', 'is done'].filter(x => x !== t.v).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `含情态动词的被动 = 情态动词 + be + 过去分词。`
      };
    },
    // 选 be 动词
    () => {
      const t = pick([
        { s: 'The letter', be: 'was', n: 'sent yesterday.' },
        { s: 'The cars', be: 'were', n: 'made in China.' },
        { s: 'The book', be: 'is', n: 'written in English.' }
      ]);
      const { options, answer } = mcq(t.be, ['was', 'were', 'is', 'are'].filter(x => x !== t.be).slice(0, 3));
      return {
        type: 'mcq',
        stem: `${t.s} ___ ${t.n}`,
        options, answer,
        explanation: `被动语态的 be 动词要随时态和主语变化。`
      };
    },
    // 主动变被动辨析
    () => {
      const { options, answer } = mcq('was built', ['built', 'builds', 'is building']);
      return {
        type: 'mcq',
        stem: `The bridge ___ in 2000.`,
        options, answer,
        explanation: `桥是被建的, 用过去时被动 was built。`
      };
    },
    // 填空
    () => {
      const t = pick([
        { s: 'English is', pp: 'spoken', base: 'speak', n: 'here.' },
        { s: 'The book was', pp: 'written', base: 'write', n: 'by him.' }
      ]);
      return {
        type: 'fill',
        stem: `${t.s} ___ (${t.base}) ${t.n}`,
        answer: t.pp,
        explanation: `被动语态用过去分词: ${t.base} → ${t.pp}。`
      };
    }
  ],

  // ===== 宾语从句 =====
  object_clause: [
    // that 引导
    () => {
      const { options, answer } = mcq('that', ['what', 'which', 'who']);
      return {
        type: 'mcq',
        stem: `I think ___ he is right.`,
        options, answer,
        explanation: `that 引导宾语从句, that 在从句中不充当成分, 口语中可省略。`
      };
    },
    // if/whether 引导一般疑问
    () => {
      const { options, answer } = mcq('if', ['that', 'what', 'which']);
      return {
        type: 'mcq',
        stem: `I don't know ___ he will come.`,
        options, answer,
        explanation: `一般疑问句变宾语从句用 if/whether 引导 (是否)。`
      };
    },
    // 语序(陈述语序)
    () => {
      const { options, answer } = mcq('where he lives', ['where does he live', 'where he live', 'where is he live']);
      return {
        type: 'mcq',
        stem: `Can you tell me ___?`,
        options, answer,
        explanation: `宾语从句用陈述语序 (主语+谓语), 不能用疑问语序。常见错误: "where does he live"。`
      };
    },
    // 时态一致
    () => {
      const { options, answer } = mcq('was', ['is', 'will be', 'be']);
      return {
        type: 'mcq',
        stem: `He said he ___ a student.`,
        options, answer,
        explanation: `主句是过去时, 宾语从句用相应过去时 (时态一致)。`
      };
    },
    // wh- 引导
    () => {
      const t = pick([
        { w: 'who', n: 'I don\'t know ___ he is.' },
        { w: 'what', n: 'Tell me ___ you want.' },
        { w: 'where', n: 'I wonder ___ he lives.' }
      ]);
      const { options, answer } = mcq(t.w, ['that', 'which', 'how'].filter(x => x !== t.w));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `特殊疑问词 (who/what/where/when/why/how) 可直接引导宾语从句。`
      };
    },
    // 填空
    () => {
      const { options, answer } = mcq('if', ['that', 'what', 'which']);
      return {
        type: 'mcq',
        stem: `I don\'t know ___ he will come or not.`,
        options, answer,
        explanation: `"是否"引导宾语从句用 if/whether; whether...or not 是固定搭配。`
      };
    }
  ],

  // ===== 定语从句 =====
  attributive_clause: [
    // who 引导(人)
    () => {
      const { options, answer } = mcq('who', ['which', 'what', 'where']);
      return {
        type: 'mcq',
        stem: `The man ___ is talking is my teacher.`,
        options, answer,
        explanation: `先行词是人, 在从句中做主语用 who。`
      };
    },
    // which 引导(物)
    () => {
      const { options, answer } = mcq('which', ['who', 'what', 'where']);
      return {
        type: 'mcq',
        stem: `The book ___ I bought is interesting.`,
        options, answer,
        explanation: `先行词是物, 用 which 或 that。`
      };
    },
    // that 通用
    () => {
      const { options, answer } = mcq('that', ['what', 'whose', 'where']);
      return {
        type: 'mcq',
        stem: `The boy ___ you met yesterday is my brother.`,
        options, answer,
        explanation: `that 可指人也可指物 (做主语或宾语)。what 不能引导定语从句。`
      };
    },
    // who/which 选择
    () => {
      const t = pick([
        { w: 'who', n: 'The girl ___ wears red is my sister.' },
        { w: 'which', n: 'The car ___ is red is mine.' }
      ]);
      const { options, answer } = mcq(t.w, ['who', 'which', 'what'].filter(x => x !== t.w));
      return {
        type: 'mcq',
        stem: t.n,
        options, answer,
        explanation: `先行词是人用 who, 物用 which。what 不引导定语从句。`
      };
    },
    // 关系代词做宾语可省略
    () => {
      const { options, answer } = mcq('that', ['what', 'whose', 'whom']);
      return {
        type: 'mcq',
        stem: `I like the book ___ you gave me.`,
        options, answer,
        explanation: `关系代词做宾语时可用 that/which/who, 且可省略。what 不可。`
      };
    },
    // 填空
    () => {
      const { options, answer } = mcq('who', ['which', 'what', 'where']);
      return {
        type: 'mcq',
        stem: `The woman ___ teaches us English is Miss Li.`,
        options, answer,
        explanation: `先行词 the woman 是人, 在从句中做主语, 用 who。`
      };
    }
  ]
};

// ==================== 语法讲解 (HTML) ====================
const GRAMMAR_LESSONS = {
  be_verbs: `<h3>规则</h3>
<p>be 动词有 <b>am / is / are</b> 三种形式, 与主语搭配:</p>
<ul><li>I → am</li><li>He / She / It / 单数名词 → is</li><li>We / You / They / 复数名词 → are</li></ul>
<h3>例句</h3>
<ul><li>I <b>am</b> a student.</li><li>She <b>is</b> tall.</li><li>They <b>are</b> my friends.</li></ul>
<h3>常见错误</h3>
<ul><li>❌ He <b>are</b> a student. → ✅ He <b>is</b> a student.</li><li>❌ 否定用 don't: He don't a student. → ✅ He <b>isn't</b> a student. (be动词否定不加助动词)</li><li>❌ 疑问用 Do: Do you are...? → ✅ <b>Are</b> you...?</li></ul>`,
  nouns_plural: `<h3>规则</h3>
<ul><li>一般加 s: book → books</li><li>s/sh/ch/x 结尾加 es: bus → buses, watch → watches</li><li>辅音+y 改 ies: city → cities (元音+y 直接加 s: boy → boys)</li><li>f/fe 改 ves: knife → knives</li><li>不规则: man→men, child→children, foot→feet, tooth→teeth, mouse→mice</li><li>单复同形: sheep, deer, fish</li></ul>
<h3>常见错误</h3>
<ul><li>❌ three childs → ✅ three <b>children</b></li><li>❌ two sheeps → ✅ two <b>sheep</b></li><li>❌ citys → ✅ <b>cities</b></li></ul>`,
  present_simple: `<h3>规则</h3>
<p>表示经常性、习惯性的动作。主语是第三人称单数时动词变化:</p>
<ul><li>一般加 s: like → likes</li><li>o/s/sh/ch/x 结尾加 es: go → goes, watch → watches</li><li>辅音+y 改 ies: study → studies</li></ul>
<p>否定: don't / doesn't (后接动词原形); 疑问: Do / Does + 主语 + 动词原形</p>
<h3>例句</h3>
<ul><li>He <b>goes</b> to school every day.</li><li>She <b>doesn't like</b> apples.</li><li><b>Does</b> he <b>play</b> football?</li></ul>
<h3>常见错误</h3>
<ul><li>❌ He <b>go</b> to school. → ✅ He <b>goes</b>.</li><li>❌ He doesn't <b>goes</b>. → ✅ He doesn't <b>go</b>. (doesn't后用原形)</li><li>❌ Do he like...? → ✅ <b>Does</b> he like...?</li></ul>`,
  pronouns: `<h3>规则</h3>
<table><tr><th>主格</th><th>宾格</th><th>形容词性物主</th><th>名词性物主</th></tr>
<tr><td>I</td><td>me</td><td>my</td><td>mine</td></tr>
<tr><td>you</td><td>you</td><td>your</td><td>yours</td></tr>
<tr><td>he</td><td>him</td><td>his</td><td>his</td></tr>
<tr><td>she</td><td>her</td><td>her</td><td>hers</td></tr>
<tr><td>we</td><td>us</td><td>our</td><td>ours</td></tr>
<tr><td>they</td><td>them</td><td>their</td><td>theirs</td></tr></table>
<p>主格做主语; 宾格做动词/介词宾语; 形容词性物主后接名词; 名词性物主后不接名词。</p>
<h3>常见错误</h3>
<ul><li>❌ I love <b>she</b>. → ✅ I love <b>her</b>.</li><li>❌ This is <b>mine</b> book. → ✅ This is <b>my</b> book.</li><li>❌ The book is <b>my</b>. → ✅ The book is <b>mine</b>.</li></ul>`,
  articles: `<h3>规则</h3>
<ul><li><b>a</b>: 辅音音素开头, 单数可数: a book, a university(ju音)</li><li><b>an</b>: 元音音素开头: an apple, an hour(h不发音)</li><li><b>the</b>: 特指/独一无二: the sun, the book on the desk</li><li>零冠词: 球类运动 (play football)、三餐 (have breakfast)、专有名词前</li><li>乐器前加 the: play the piano</li></ul>
<h3>常见错误</h3>
<ul><li>❌ play <b>the</b> football → ✅ play football</li><li>❌ <b>a</b> hour → ✅ <b>an</b> hour (按读音)</li><li>❌ play <b>a</b> piano → ✅ play <b>the</b> piano</li></ul>`,
  present_continuous: `<h3>规则</h3>
<p>构成: <b>be (am/is/are) + 动词ing</b>。表示此时此刻或现阶段正在进行的动作。</p>
<p>现在分词变化:</p>
<ul><li>一般加 ing: play → playing</li><li>去 e 加 ing: make → making</li><li>双写末尾辅音加 ing: run → running, swim → swimming</li></ul>
<p>标志词: now, look, listen, at the moment</p>
<h3>常见错误</h3>
<ul><li>❌ He <b>playing</b> football. (漏 be) → ✅ He <b>is playing</b> football.</li><li>❌ swiming → ✅ <b>swimming</b> (双写)</li><li>❌ makeing → ✅ <b>making</b> (去e)</li></ul>`,
  past_simple: `<h3>规则</h3>
<p>表示过去发生的动作。规则动词加 ed; 不规则动词需记忆。</p>
<ul><li>一般加 ed: watch → watched</li><li>e 结尾加 d: live → lived</li><li>辅音+y 改 ied: study → studied</li><li>双写加 ed: stop → stopped</li></ul>
<p>否定: didn't + 动词原形; 疑问: Did + 主语 + 动词原形</p>
<p>be动词过去式: was (I/he/she/it) / were (we/you/they)</p>
<h3>常见错误</h3>
<ul><li>❌ He <b>goed</b> → ✅ He <b>went</b> (不规则)</li><li>❌ didn't <b>went</b> → ✅ didn't <b>go</b> (后接原形)</li><li>❌ stoped → ✅ <b>stopped</b> (双写)</li></ul>`,
  future_simple: `<h3>规则</h3>
<p>两种形式表达将来:</p>
<ul><li><b>will + 动词原形</b>: 表将来、临时决定: I will go tomorrow.</li><li><b>be going to + 动词原形</b>: 表计划打算: She is going to visit her uncle.</li></ul>
<p>标志词: tomorrow, next week, soon, in the future</p>
<p>will not = won't</p>
<h3>常见错误</h3>
<ul><li>❌ will <b>goes</b> → ✅ will <b>go</b> (后接原形)</li><li>❌ willn't → ✅ <b>won't</b></li><li>❌ He <b>is</b> going to <b>visited</b> → ✅ He is going to <b>visit</b>.</li></ul>`,
  modal_verbs: `<h3>规则</h3>
<p>情态动词 (can/could/must/should/may/might) <b>后接动词原形</b>, 无人称变化。</p>
<ul><li>can: 能力/请求</li><li>must: 必须 (否定 mustn't 禁止)</li><li>should: 建议</li><li>may: 请求许可/可能</li></ul>
<h3>例句</h3>
<ul><li>He <b>can swim</b>.</li><li>You <b>must finish</b> your homework.</li><li>You <b>should study</b> hard.</li></ul>
<h3>常见错误</h3>
<ul><li>❌ He <b>cans</b> swim. → ✅ He <b>can</b> swim. (不加s)</li><li>❌ He can <b>swims</b>. → ✅ He can <b>swim</b>. (后接原形)</li><li>❌ must to → ✅ <b>must</b> (不加to)</li></ul>`,
  comparative: `<h3>规则</h3>
<p>比较级 (两者比较, 常配 than); 最高级 (三者以上, 前加 the)。</p>
<ul><li>单音节: 加 er / est: tall → taller → tallest</li><li>e 结尾: 加 r / st: nice → nicer → nicest</li><li>辅音+y: 改 ier / iest: happy → happier → happiest</li><li>双写: big → bigger → biggest</li><li>多音节: 加 more / most: beautiful → more beautiful → most beautiful</li></ul>
<p>不规则: good→better→best, bad→worse→worst, many→more→most, little→less→least</p>
<h3>常见错误</h3>
<ul><li>❌ more taller → ✅ <b>taller</b> (不重复)</li><li>❌ biger → ✅ <b>bigger</b> (双写)</li><li>❌ gooder → ✅ <b>better</b> (不规则)</li></ul>`,
  present_perfect: `<h3>规则</h3>
<p>构成: <b>have/has + 过去分词</b>。表示过去发生并对现在有影响, 或持续到现在的动作。</p>
<p>三单主语用 has, 其余用 have。</p>
<p>标志词: already, just, yet, ever, never, since, for</p>
<h3>例句</h3>
<ul><li>I <b>have finished</b> my homework.</li><li>She <b>has gone</b> to Beijing.</li><li><b>Have</b> you <b>ever been</b> to Shanghai?</li></ul>
<h3>常见错误</h3>
<ul><li>❌ She <b>have</b> gone → ✅ She <b>has</b> gone.</li><li>❌ have <b>went</b> → ✅ have <b>gone</b> (用过去分词)</li><li>❌ I have <b>saw</b> it → ✅ I have <b>seen</b> it.</li></ul>`,
  passive_voice: `<h3>规则</h3>
<p>构成: <b>be + 过去分词</b>。be 动词随时态和主语变化。</p>
<ul><li>一般现在: am/is/are + done</li><li>一般过去: was/were + done</li><li>含情态动词: 情态动词 + be + done</li><li>现在完成: have/has been + done</li></ul>
<h3>例句</h3>
<ul><li>English <b>is spoken</b> in many countries.</li><li>The book <b>was written</b> in 1990.</li><li>It must <b>be done</b> at once.</li></ul>
<h3>常见错误</h3>
<ul><li>❌ English <b>speaks</b> here → ✅ English <b>is spoken</b> here.</li><li>❌ must <b>done</b> → ✅ must <b>be done</b>.</li></ul>`,
  object_clause: `<h3>规则</h3>
<p>宾语从句做主句动词的宾语。引导词:</p>
<ul><li><b>that</b>: 陈述句变来, 可省略</li><li><b>if/whether</b>: 一般疑问句变来 (是否)</li><li><b>wh-</b>: 特殊疑问句变来 (who/what/where/when/why/how)</li></ul>
<p>两个要点: ① 用<b>陈述语序</b> (主语+谓语); ② <b>时态一致</b> (主句过去时, 从句用相应过去时; 客观真理仍用现在时)。</p>
<h3>例句</h3>
<ul><li>I think <b>that</b> he is right.</li><li>I don't know <b>if</b> he will come.</li><li>Can you tell me <b>where he lives</b>?</li></ul>
<h3>常见错误</h3>
<ul><li>❌ ...where <b>does he live</b> → ✅ ...where <b>he lives</b> (陈述语序)</li><li>❌ He said he <b>is</b> a student → ✅ He said he <b>was</b> a student (时态一致)</li></ul>`,
  attributive_clause: `<h3>规则</h3>
<p>定语从句修饰名词 (先行词)。关系代词:</p>
<ul><li><b>who</b>: 指人, 做主语/宾语</li><li><b>which</b>: 指物, 做主语/宾语</li><li><b>that</b>: 指人或物, 做主语/宾语</li><li><b>whose</b>: 表所属 (...的)</li></ul>
<p>注意: <b>what 不能引导定语从句</b>。</p>
<h3>例句</h3>
<ul><li>The man <b>who</b> is talking is my teacher.</li><li>The book <b>which/that</b> I bought is good.</li><li>The boy <b>that</b> you met is my brother.</li></ul>
<h3>常见错误</h3>
<ul><li>❌ The man <b>which</b> is talking → ✅ The man <b>who</b> (人用who)</li><li>❌ The book <b>what</b> I bought → ✅ The book <b>that/which</b> (what不可)</li></ul>`
};

// ==================== 听力题句库 (按 level) ====================
// 每条: { en, cn, distractors:[中文干扰项] }
const LISTENING_BANK = {
  1: [
    { en: 'I am a student.', cn: '我是一名学生。', distractors: ['我是一名老师。', '我是一名医生。', '我是一名工人。'] },
    { en: 'She is my sister.', cn: '她是我的妹妹。', distractors: ['她是我的妈妈。', '她是我的朋友。', '她是我的老师。'] },
    { en: 'They are my friends.', cn: '他们是我的朋友。', distractors: ['他们是老师。', '他们是学生。', '他们是兄弟。'] },
    { en: 'I have a book.', cn: '我有一本书。', distractors: ['我有一支笔。', '我有一个苹果。', '我有一只猫。'] },
    { en: 'He goes to school every day.', cn: '他每天去上学。', distractors: ['他每天去上班。', '他每天去公园。', '他每天回家。'] },
    { en: 'The cat is on the chair.', cn: '猫在椅子上。', distractors: ['猫在桌子上。', '猫在床下。', '猫在树上。'] },
    { en: 'I like apples.', cn: '我喜欢苹果。', distractors: ['我喜欢香蕉。', '我喜欢橘子。', '我喜欢牛奶。'] },
    { en: 'It is a sunny day.', cn: '今天是个晴天。', distractors: ['今天是个雨天。', '今天是个阴天。', '今天是个雪天。'] }
  ],
  2: [
    { en: 'She is reading a book now.', cn: '她现在正在看书。', distractors: ['她现在正在写字。', '她现在正在睡觉。', '她现在正在吃饭。'] },
    { en: 'I went to Beijing last summer.', cn: '去年夏天我去了北京。', distractors: ['去年夏天我去了上海。', '去年夏天我去了南京。', '去年夏天我回家了。'] },
    { en: 'We will have a test tomorrow.', cn: '我们明天有考试。', distractors: ['我们明天有聚会。', '我们明天有比赛。', '我们明天放假。'] },
    { en: 'He can swim very well.', cn: '他游泳游得很好。', distractors: ['他跑步跑得很快。', '他唱歌唱得很好。', '他跳舞跳得很好。'] },
    { en: 'Tom is taller than Sam.', cn: '汤姆比萨姆高。', distractors: ['汤姆比萨姆矮。', '汤姆和萨姆一样高。', '萨姆比汤姆高。'] },
    { en: 'They are playing football on the playground.', cn: '他们正在操场上踢足球。', distractors: ['他们正在操场上打篮球。', '他们正在教室里看书。', '他们正在花园里散步。'] },
    { en: 'You should finish your homework first.', cn: '你应该先完成作业。', distractors: ['你应该先看电视。', '你应该先出去玩。', '你应该先吃饭。'] },
    { en: 'I bought a new bike yesterday.', cn: '我昨天买了一辆新自行车。', distractors: ['我昨天卖了一辆自行车。', '我昨天买了一本书。', '我昨天修了一辆自行车。'] }
  ],
  3: [
    { en: 'I have already finished my homework.', cn: '我已经完成了作业。', distractors: ['我还没完成作业。', '我正在做作业。', '我将要做作业。'] },
    { en: 'English is spoken in many countries.', cn: '许多国家说英语。', distractors: ['许多国家说中文。', '许多国家说法语。', '许多国家不说英语。'] },
    { en: 'The book that I bought is very interesting.', cn: '我买的那本书很有趣。', distractors: ['我买的那本书很无聊。', '我借的那本书很有趣。', '我送的那本书很有趣。'] },
    { en: 'She has lived here for ten years.', cn: '她在这里住了十年。', distractors: ['她在这里住了十年前。', '她将在这里住十年。', '她没在这里住过。'] },
    { en: 'He said he would come the next day.', cn: '他说他第二天会来。', distractors: ['他说他那天会来。', '他说他不会来。', '他说他来了。'] },
    { en: 'The bridge was built in 1990.', cn: '这座桥建于1990年。', distractors: ['这座桥将建于1990年。', '这座桥正在建造。', '人们1990年建了桥。'] },
    { en: 'Can you tell me where he lives?', cn: '你能告诉我他住在哪里吗？', distractors: ['你能告诉我他是谁吗？', '你能告诉我他什么时候走吗？', '你能告诉我他做什么吗？'] },
    { en: 'I have never been to that city.', cn: '我从没去过那座城市。', distractors: ['我经常去那座城市。', '我将要去那座城市。', '我住在那座城市。'] }
  ]
};

// ==================== 内置基础词库 (words.json 加载失败时回退) ====================
const FALLBACK_WORDS = [
  // L1 基础层
  { word: 'student', phonetic: '/ˈstjuːdnt/', meaning: 'n. 学生', pos: 'n.', level: 1, sentence: 'I am a student.', sentenceCn: '我是一名学生。', synonyms: ['pupil'], antonyms: ['teacher'] },
  { word: 'teacher', phonetic: '/ˈtiːtʃə/', meaning: 'n. 老师', pos: 'n.', level: 1, sentence: 'She is a teacher.', sentenceCn: '她是一名老师。', synonyms: ['instructor'], antonyms: ['student'] },
  { word: 'friend', phonetic: '/frend/', meaning: 'n. 朋友', pos: 'n.', level: 1, sentence: 'He is my friend.', sentenceCn: '他是我的朋友。', synonyms: ['mate'], antonyms: ['enemy'] },
  { word: 'school', phonetic: '/skuːl/', meaning: 'n. 学校', pos: 'n.', level: 1, sentence: 'I go to school every day.', sentenceCn: '我每天去上学。', synonyms: [], antonyms: [] },
  { word: 'book', phonetic: '/bʊk/', meaning: 'n. 书', pos: 'n.', level: 1, sentence: 'I have a book.', sentenceCn: '我有一本书。', synonyms: [], antonyms: [] },
  { word: 'happy', phonetic: '/ˈhæpi/', meaning: 'adj. 高兴的', pos: 'adj.', level: 1, sentence: 'I am happy today.', sentenceCn: '我今天很高兴。', synonyms: ['glad', 'pleased'], antonyms: ['sad'] },
  { word: 'big', phonetic: '/bɪɡ/', meaning: 'adj. 大的', pos: 'adj.', level: 1, sentence: 'The box is big.', sentenceCn: '这个箱子很大。', synonyms: ['large'], antonyms: ['small'] },
  { word: 'go', phonetic: '/ɡəʊ/', meaning: 'v. 去', pos: 'v.', level: 1, sentence: 'I go to school.', sentenceCn: '我去上学。', synonyms: [], antonyms: ['come'] },
  { word: 'eat', phonetic: '/iːt/', meaning: 'v. 吃', pos: 'v.', level: 1, sentence: 'I eat an apple.', sentenceCn: '我吃一个苹果。', synonyms: [], antonyms: [] },
  { word: 'water', phonetic: '/ˈwɔːtə/', meaning: 'n. 水', pos: 'n.', level: 1, sentence: 'I drink water.', sentenceCn: '我喝水。', synonyms: [], antonyms: [] },
  // L2 进阶层
  { word: 'improve', phonetic: '/ɪmˈpruːv/', meaning: 'v. 改善, 提高', pos: 'v.', level: 2, sentence: 'I want to improve my English.', sentenceCn: '我想提高我的英语。', synonyms: ['better'], antonyms: ['worsen'] },
  { word: 'important', phonetic: '/ɪmˈpɔːtnt/', meaning: 'adj. 重要的', pos: 'adj.', level: 2, sentence: 'English is important.', sentenceCn: '英语很重要。', synonyms: ['significant'], antonyms: ['unimportant'] },
  { word: 'travel', phonetic: '/ˈtrævl/', meaning: 'v. 旅行', pos: 'v.', level: 2, sentence: 'I travel to Beijing every year.', sentenceCn: '我每年去北京旅行。', synonyms: ['journey'], antonyms: [] },
  { word: 'decide', phonetic: '/dɪˈsaɪd/', meaning: 'v. 决定', pos: 'v.', level: 2, sentence: 'She decided to go home.', sentenceCn: '她决定回家。', synonyms: ['choose'], antonyms: ['hesitate'] },
  { word: 'expensive', phonetic: '/ɪkˈspensɪv/', meaning: 'adj. 昂贵的', pos: 'adj.', level: 2, sentence: 'The car is expensive.', sentenceCn: '这辆车很贵。', synonyms: ['costly'], antonyms: ['cheap'] },
  { word: 'remember', phonetic: '/rɪˈmembə/', meaning: 'v. 记得', pos: 'v.', level: 2, sentence: 'I remember his name.', sentenceCn: '我记得他的名字。', synonyms: ['recall'], antonyms: ['forget'] },
  { word: 'different', phonetic: '/ˈdɪfrənt/', meaning: 'adj. 不同的', pos: 'adj.', level: 2, sentence: 'We are different.', sentenceCn: '我们是不同的。', synonyms: ['various'], antonyms: ['same'] },
  // L3 高阶层
  { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 实现, 达到', pos: 'v.', level: 3, sentence: 'He achieved his dream.', sentenceCn: '他实现了梦想。', synonyms: ['accomplish'], antonyms: ['fail'] },
  { word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', meaning: 'n. 环境', pos: 'n.', level: 3, sentence: 'We must protect the environment.', sentenceCn: '我们必须保护环境。', synonyms: ['surroundings'], antonyms: [] },
  { word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/', meaning: 'n. 知识', pos: 'n.', level: 3, sentence: 'Knowledge is power.', sentenceCn: '知识就是力量。', synonyms: ['learning'], antonyms: ['ignorance'] },
  { word: 'succeed', phonetic: '/səkˈsiːd/', meaning: 'v. 成功', pos: 'v.', level: 3, sentence: 'He succeeded in the exam.', sentenceCn: '他考试成功了。', synonyms: ['manage'], antonyms: ['fail'] },
  { word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', meaning: 'n. 挑战', pos: 'n.', level: 3, sentence: 'Life is full of challenges.', sentenceCn: '生活充满挑战。', synonyms: ['test'], antonyms: [] },
  { word: 'confident', phonetic: '/ˈkɒnfɪdənt/', meaning: 'adj. 自信的', pos: 'adj.', level: 3, sentence: 'She is confident about her future.', sentenceCn: '她对未来充满信心。', synonyms: ['self-assured'], antonyms: ['shy'] }
];

// 词汇缓存
let _wordsCache = null;

// 首字母默写缓存
let _dictationCache = null;

// 规范 level: 接受 1/2/3 / 'L1' / 'base'/'inter'/'adv'
function normalizeLevel(level) {
  if (level == null) return 1;
  const s = String(level).toLowerCase().trim();
  if (s === '1' || s === 'l1' || s === 'base') return 1;
  if (s === '2' || s === 'l2' || s === 'inter') return 2;
  if (s === '3' || s === 'l3' || s === 'adv') return 3;
  const n = parseInt(s, 10);
  return isNaN(n) ? 1 : n;
}

// level 数值 -> kpId
function levelToKpId(level) {
  const n = normalizeLevel(level);
  return n === 1 ? 'vocab_base' : n === 2 ? 'vocab_inter' : 'vocab_adv';
}

// ==================== TTS (语音合成) 内部状态 ====================
let _ttsUtter = null;
let _voicesCache = [];
let _voicesReady = false;

// 初始化语音列表 (监听 voiceschanged)
function _initVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const load = () => {
    try {
      _voicesCache = window.speechSynthesis.getVoices() || [];
      if (_voicesCache.length) _voicesReady = true;
    } catch (e) { /* 忽略 */ }
  };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

// 自动初始化 (浏览器环境下)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  _initVoices();
}

// ==================== STT 内部状态 ====================
let _recognition = null;

// ==================== 引擎主体 ====================
export const englishEngine = {
  // 知识点列表 (与 curriculum.json 对齐)
  supportedKps() {
    return [
      'be_verbs', 'nouns_plural', 'present_simple', 'pronouns', 'articles',
      'present_continuous', 'past_simple', 'future_simple', 'modal_verbs',
      'comparative', 'present_perfect', 'passive_voice', 'object_clause',
      'attributive_clause',
      'vocab_base', 'vocab_inter', 'vocab_adv'
    ];
  },

  // ==================== 词汇 ====================

  // 异步加载词库; 返回 [{word,phonetic,meaning,pos,level,sentence,sentenceCn,synonyms,antonyms}]
  async loadWords() {
    if (_wordsCache) return _wordsCache;
    // 并行加载 words.json 与 vocab_2026.js(考纲 1706 词)
    const tasks = [this._loadWordsJson(), this._loadVocab2026()];
    const [baseList, vocab2026] = await Promise.all(tasks);
    // 合并: 优先 vocab_2026 的释义(更全);按 word 去重
    const map = new Map();
    (baseList || []).forEach(w => map.set(w.word, w));
    (vocab2026 || []).forEach(w => { if (!map.has(w.word)) map.set(w.word, w); });
    _wordsCache = Array.from(map.values());
    return _wordsCache;
  },

  // 内部: 加载内置 words.json
  async _loadWordsJson() {
    try {
      const res = await fetch('./data/words.json');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.words || data.list || []);
        if (list && list.length) {
          return list.map(w => ({
            word: w.word || '',
            phonetic: w.phonetic || '',
            meaning: w.meaning || '',
            pos: w.pos || '',
            level: normalizeLevel(w.level),
            sentence: w.sentence || '',
            sentenceCn: w.sentenceCn || '',
            synonyms: Array.isArray(w.synonyms) ? w.synonyms : [],
            antonyms: Array.isArray(w.antonyms) ? w.antonyms : []
          }));
        }
      }
    } catch (e) {
      console.warn('[englishEngine] words.json 加载失败:', e);
    }
    return FALLBACK_WORDS.slice();
  },

  // 内部: 加载考纲 2026 词汇模块
  async _loadVocab2026() {
    try {
      const mod = await import('../../data/vocab_2026.js');
      const list = (mod && mod.VOCAB_2026) || [];
      return list.map(w => ({
        word: w.word || '',
        phonetic: w.phonetic || '',
        meaning: w.meaning || '',
        pos: w.pos || '',
        level: normalizeLevel(w.level),
        sentence: w.sentence || '',
        sentenceCn: w.sentenceCn || '',
        synonyms: [],
        antonyms: [],
        source: w.source || '上海中考考纲'
      }));
    } catch (e) {
      console.warn('[englishEngine] vocab_2026.js 加载失败:', e);
      return [];
    }
  },

  // 返回词库元信息(用于前端展示)
  async getWordsMeta() {
    const all = await this.loadWords();
    const dist = { 1: 0, 2: 0, 3: 0 };
    all.forEach(w => { dist[w.level] = (dist[w.level] || 0) + 1; });
    return { total: all.length, levelDist: dist };
  },

  // 按等级取词
  async getWordsByLevel(level) {
    const n = normalizeLevel(level);
    const all = await this.loadWords();
    return all.filter(w => w.level === n);
  },

  // 从缓存取同等级干扰词(用于选项)
  _getDistractorWords(word, n) {
    const all = _wordsCache && _wordsCache.length ? _wordsCache : FALLBACK_WORDS;
    const same = all.filter(w => w.word !== word.word && w.level === word.level);
    const pool = same.length >= 3 ? same : all.filter(w => w.word !== word.word);
    return takeRandom(pool, 3);
  },

  // 生成单词练习题
  // type: 'cn2en' | 'en2cn' | 'spell' | 'listen'
  generateVocabExercise(word, type) {
    const w = word && word.word ? word : { word: '', meaning: '', level: 1, sentence: '', phonetic: '', ...word };
    const kpId = levelToKpId(w.level);
    const distractors = this._getDistractorWords(w);

    switch (type) {
      // 看中文选英文
      case 'cn2en': {
        const opts = takeRandom(distractors.map(d => d.word).filter(x => x && x !== w.word), 3);
        const { options, answer } = mcq(w.word, opts);
        return {
          kpId,
          type: 'mcq',
          stem: `选出与"${w.meaning}"对应的单词`,
          options,
          answer,
          explanation: `"${w.word}" ${w.phonetic} 意为: ${w.meaning}。例: ${w.sentence} (${w.sentenceCn})`,
          audioText: w.word
        };
      }
      // 看英文选中文
      case 'en2cn': {
        const opts = takeRandom(distractors.map(d => d.meaning).filter(x => x && x !== w.meaning), 3);
        const { options, answer } = mcq(w.meaning, opts);
        return {
          kpId,
          type: 'mcq',
          stem: `选出 "${w.word}" ${w.phonetic} 的中文意思`,
          options,
          answer,
          explanation: `"${w.word}" 意为: ${w.meaning}。例: ${w.sentence} (${w.sentenceCn})`,
          audioText: w.word
        };
      }
      // 看中文拼写
      case 'spell': {
        return {
          kpId,
          type: 'fill',
          stem: `请根据中文拼写单词 (可点击听发音): ${w.meaning}`,
          answer: w.word,
          explanation: `"${w.word}" ${w.phonetic} 意为: ${w.meaning}。例: ${w.sentence} (${w.sentenceCn})`,
          audioText: w.word
        };
      }
      // 听写
      case 'listen': {
        return {
          kpId,
          type: 'fill',
          stem: '听录音, 写出你听到的单词',
          answer: w.word,
          explanation: `听到的单词是 "${w.word}" ${w.phonetic}, 意为: ${w.meaning}。`,
          audioText: w.word
        };
      }
      default: {
        return this.generateVocabExercise(w, 'en2cn');
      }
    }
  },

  // ==================== 语法 ====================

  // 生成语法题
  generateGrammar(kpId) {
    const bank = GRAMMAR_BANK[kpId];
    if (!bank || !bank.length) {
      return {
        kpId,
        type: 'fill',
        stem: '(暂无题目)',
        answer: '',
        explanation: `知识点 ${kpId} 暂无题库。`
      };
    }
    const gen = pick(bank);
    const q = gen();
    return { kpId, ...q };
  },

  // 语法讲解 (HTML 字符串)
  getGrammarLesson(kpId) {
    return GRAMMAR_LESSONS[kpId] || `<p>暂无 ${kpId} 的讲解内容。</p>`;
  },

  // ==================== 听力 (TTS) ====================

  // 返回所有可用语音 (Promise, 处理 voiceschanged 异步加载)
  getVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve([]);
    }
    const cur = window.speechSynthesis.getVoices() || [];
    if (cur.length) {
      _voicesCache = cur;
      _voicesReady = true;
      return Promise.resolve(cur);
    }
    // 异步等待 voices 加载
    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (done) return;
        const v = window.speechSynthesis.getVoices() || [];
        if (v.length) {
          done = true;
          _voicesCache = v;
          _voicesReady = true;
          window.speechSynthesis.removeEventListener('voiceschanged', finish);
          resolve(v);
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', finish);
      finish();
      // 超时兜底, 避免一直挂起
      setTimeout(() => {
        if (!done) {
          done = true;
          window.speechSynthesis.removeEventListener('voiceschanged', finish);
          resolve(window.speechSynthesis.getVoices() || []);
        }
      }, 1500);
    });
  },

  // 朗读; rate: 0.5-1.5; voiceName 可选; 返回 Promise, 完成后 resolve
  speak(text, { rate = 1, voiceName } = {}) {
    return new Promise(resolve => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        resolve(false);
        return;
      }
      if (!text) { resolve(false); return; }
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = Math.min(1.5, Math.max(0.5, rate));
        u.lang = 'en-US';
        u.pitch = 1;
        u.volume = 1;
        const voices = window.speechSynthesis.getVoices() || _voicesCache || [];
        let v = null;
        if (voiceName) v = voices.find(x => x.name === voiceName);
        if (!v) v = voices.find(x => x.lang === 'en-US')
          || voices.find(x => x.lang === 'en-GB')
          || voices.find(x => x.lang && x.lang.startsWith('en'));
        if (v) u.voice = v;
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        _ttsUtter = u;
        window.speechSynthesis.speak(u);
      } catch (e) {
        resolve(false);
      }
    });
  },

  // 停止朗读
  stopSpeak() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    }
    _ttsUtter = null;
  },

  // 生成听力题 (短句听后选意思)
  generateListening(level) {
    const n = normalizeLevel(level);
    const bank = LISTENING_BANK[n] || LISTENING_BANK[1];
    const item = pick(bank);
    const { options, answer } = mcq(item.cn, item.distractors.slice(0, 3));
    return {
      kpId: 'listening',
      type: 'mcq',
      stem: '听录音选择正确含义',
      audioText: item.en,
      options,
      answer,
      explanation: `录音内容: "${item.en}" 意为"${item.cn}"。`
    };
  },

  // ==================== 首字母默写 (高频词) ====================
  async _loadDictation2026() {
    if (_dictationCache) return _dictationCache;
    try {
      const mod = await import('../../data/dictation_2026.js');
      _dictationCache = (mod && mod.DICTATION_2026) || [];
    } catch (e) {
      console.warn('[englishEngine] dictation_2026.js 加载失败:', e);
      _dictationCache = [];
    }
    return _dictationCache;
  },

  // 异步获取全部首字母默写题(按分类筛选)
  async getDictationList(category) {
    const all = await this._loadDictation2026();
    if (!category || category === 'all') return all.slice();
    return all.filter(i => i.category === category);
  },

  // 生成首字母默写题(填空): 给首字母+词性+中文, 拼写完整单词
  generateDictationItem(category) {
    const list = (this._dictationCache || []).filter(i => !category || i.category === category);
    if (!list.length) {
      return {
        kpId: 'dictation',
        type: 'fill',
        stem: '(暂无题目)',
        answer: '',
        explanation: '首字母默写题库为空。'
      };
    }
    const item = pick(list);
    // 跳过未识别的占位词
    let finalItem = item;
    if ((item.word || '').includes('?')) {
      const realOnes = list.filter(i => !(i.word || '').includes('?'));
      finalItem = realOnes.length ? pick(realOnes) : item;
    }
    const w = finalItem.word || '';
    return {
      kpId: 'dictation_' + (finalItem.category || 'all'),
      type: 'fill',
      stem: `请根据首字母和中文写出单词: ${finalItem.first_letter}${'▢'.repeat(Math.max(3, w.length - 1))} (${finalItem.pos}.) ${finalItem.meaning}`,
      answer: w,
      explanation: `答案: ${w}。首字母 ${finalItem.first_letter.toUpperCase()}, ${finalItem.pos}. ${finalItem.meaning}。`,
      audioText: w
    };
  },

  // ==================== 口语跟读 (STT) ====================

  // 是否支持语音识别
  isRecognitionSupported() {
    return typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  // 开始识别; onResult(text, isFinal), onEnd()
  startRecognition({ onResult, onEnd, lang = 'en-US' } = {}) {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      if (onEnd) onEnd();
      return null;
    }
    // 先停止已有识别
    this.stopRecognition();
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let txt = '';
      let isFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        txt += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      if (onResult) onResult(txt, isFinal);
    };
    rec.onerror = () => { /* 出错视为结束 */ };
    rec.onend = () => { if (onEnd) onEnd(); };
    try {
      rec.start();
    } catch (e) {
      if (onEnd) onEnd();
      return null;
    }
    _recognition = rec;
    return rec;
  },

  // 停止识别
  stopRecognition() {
    if (_recognition) {
      try { _recognition.stop(); } catch (e) { /* 忽略 */ }
      _recognition = null;
    }
  },

  // 文本相似度评分 (0-100), 基于 Levenshtein 距离
  scoreSpeech(target, spoken) {
    const a = String(target || '').toLowerCase().replace(/[^a-z0-9\s']/g, '').trim();
    const b = String(spoken || '').toLowerCase().replace(/[^a-z0-9\s']/g, '').trim();
    if (!a.length && !b.length) return 100;
    if (!a.length || !b.length) return 0;
    const m = a.length, n = b.length;
    // Levenshtein 动态规划
    const dp = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,        // 删除
          dp[i][j - 1] + 1,        // 插入
          dp[i - 1][j - 1] + cost  // 替换
        );
      }
    }
    const dist = dp[m][n];
    const maxLen = Math.max(m, n);
    const score = maxLen === 0 ? 100 : Math.round((1 - dist / maxLen) * 100);
    return score < 0 ? 0 : (score > 100 ? 100 : score);
  }
};
