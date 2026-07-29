// 语文学习内容引擎 (ES6 模块)
// 面向上海初二升初三学生
// 三大模块：必背篇目、文言文、作文素材与命题预测
// 必背篇目与文言文数据来自 ./data/classics.json；作文素材与命题预测内置生成器动态产出
//
// 依赖: 仅依赖浏览器原生 fetch, 不引入其他模块

// ==================== 内置作文素材库 ====================
// 按主题分类: growth 成长 / family 亲情 / persistence 坚持 / dream 梦想 / friendship 友情
const compositionLibrary = {
  growth: {
    title: '成长感悟类作文素材',
    materials: [
      { type: '人物', content: '海伦·凯勒:19个月大时因病失去视力和听力,在老师安妮·沙利文帮助下学会读书写字,最终成为著名作家和教育家,著有《假如给我三天光明》,以顽强毅力诠释了生命的奇迹。' },
      { type: '人物', content: '司马迁:遭受宫刑之辱,仍忍辱负重,发愤著书,历时十余年完成《史记》,被鲁迅誉为"史家之绝唱,无韵之离骚",在屈辱中铸就了不朽丰碑。' },
      { type: '人物', content: '霍金:21岁被诊断患有运动神经元病,医生预言他活不过两年,却以顽强毅力活了76年,成为继爱因斯坦后最伟大的理论物理学家之一,用三根手指敲开了宇宙之门。' },
      { type: '事例', content: '一颗种子破土而出前,要在黑暗的泥土中默默积蓄力量;蝴蝶展翅高飞前,要在茧中经历痛苦的蜕变。成长往往伴随着阵痛,但正是这些阵痛造就了生命的美丽。' },
      { type: '事例', content: '竹子在前四年仅长3厘米,但从第五年开始以每天30厘米的速度疯长,六周就能长到15米。前期的扎根看似缓慢,却是后期飞速生长的坚实基础。' }
    ],
    quotes: [
      '宝剑锋从磨砺出,梅花香自苦寒来。',
      '不经历风雨,怎能见彩虹。',
      '生活总是让我们遍体鳞伤,但到后来,那些受伤的地方一定会变成我们最强壮的地方。——海明威',
      '成长就是一次次破茧成蝶的过程。'
    ],
    angles: [
      '从挫折中汲取成长的力量,写出困境对意志的磨砺',
      '以小见大,通过一件小事展现认知与心态的转变'
    ]
  },
  family: {
    title: '亲情温暖类作文素材',
    materials: [
      { type: '事例', content: '朱自清《背影》:父亲在火车站为儿子买橘子,那蹒跚的步伐、攀爬月台的身影,成为描写父爱的经典画面,质朴中见深情,平淡处显真意。' },
      { type: '事例', content: '史铁生《秋天的怀念》:母亲在身患重病时仍惦记着带"我"去北海看花,直到离世后才让人转告"我"和妹妹要"好好儿活",母爱深沉而隐忍。' },
      { type: '人物', content: '孟母三迁:为给孟子寻找良好的成长环境,孟母不惜三次搬家,最终定居学宫旁,体现了母亲对孩子教育的深远用心与无私付出。' },
      { type: '事例', content: '一个雨天,父亲来学校接孩子,伞总是倾斜在孩子这边,父亲的半边肩膀却被淋湿。这把"倾斜的伞"是亲情无声的注脚。' },
      { type: '事例', content: '母亲每晚都会为孩子留一盏灯和一杯温热的牛奶,无论孩子学到多晚,那盏灯始终亮着——陪伴是最长情的告白。' }
    ],
    quotes: [
      '谁言寸草心,报得三春晖。',
      '父母之爱子,则为之计深远。',
      '亲情是世界上最温暖的阳光,无论你走到哪里,它都会照亮你回家的路。',
      '有一种爱,它无处不在,却又常常被我们忽视,那就是父母的爱。'
    ],
    angles: [
      '抓住细节描写,以一个动作、一句话、一个眼神传递亲情',
      '运用对比手法,写出从不懂到理解的心理变化过程'
    ]
  },
  persistence: {
    title: '坚持不懈类作文素材',
    materials: [
      { type: '人物', content: '爱迪生:为寻找合适的灯丝材料,试验了上千次仍以失败告终,面对他人嘲笑,他说:"我没有失败,我只是发现了一万种行不通的方法。"最终发明了实用白炽灯,照亮了整个世界。' },
      { type: '人物', content: '居里夫人:在简陋的棚屋中用四年时间从数吨沥青铀矿中提炼出0.1克镭,期间不分寒暑地搅拌矿渣,双手被放射性物质灼伤仍不放弃,终获诺贝尔奖。' },
      { type: '人物', content: '王羲之:临池学书,日复一日练习书法,洗笔把池水都染成了黑色,"墨池"由此得名,终成"书圣",其《兰亭集序》被誉为天下第一行书。' },
      { type: '事例', content: '滴水穿石:水滴虽小,日积月累,竟能将坚硬的石头击穿,靠的不是力量,而是不舍昼夜的坚持。' },
      { type: '事例', content: '愚公移山:年近九十的愚公面对太行、王屋二山,坚信"子又生孙,孙又生子,子子孙孙无穷匮也",最终感动天帝派神移山。' }
    ],
    quotes: [
      '锲而舍之,朽木不折;锲而不舍,金石可镂。——荀子',
      '千淘万漉虽辛苦,吹尽狂沙始到金。——刘禹锡',
      '只要功夫深,铁杵磨成针。',
      '骐骥一跃,不能十步;驽马十驾,功在不舍。——荀子'
    ],
    angles: [
      '突出"坚持的过程",写出从想放弃到咬牙坚持的心理斗争',
      '通过对比"放弃"与"坚持"的不同结果,凸显坚持的价值'
    ]
  },
  dream: {
    title: '梦想追求类作文素材',
    materials: [
      { type: '人物', content: '马丁·路德·金:在林肯纪念堂前发表《我有一个梦想》的著名演讲,毕生为黑人平等权利而奋斗,虽遭暗杀,却推动了美国民权运动的进程,梦想的力量改变了一个时代。' },
      { type: '人物', content: '屈原:怀抱"路漫漫其修远兮,吾将上下而求索"的信念,纵然被流放仍心系楚国,写下《离骚》等不朽诗篇,成为爱国诗人的典范。' },
      { type: '人物', content: '袁隆平:怀揣"让所有人远离饥饿"的梦想,几十年扎根稻田,风吹日晒,研发出杂交水稻,解决了数亿人的温饱问题,被誉为"杂交水稻之父"。' },
      { type: '事例', content: '莱特兄弟从小梦想飞翔,面对无数次试验失败和世人的质疑,最终在1903年成功试飞人类第一架飞机,让人类飞行的梦想照进现实。' },
      { type: '事例', content: '一颗流星划过夜空,虽短暂却璀璨;一个梦想照进现实,虽遥远却值得追寻。梦想是黑夜中的灯塔,指引前行的方向。' }
    ],
    quotes: [
      '有梦想就有希望,有希望就有未来。',
      '一个人可以非常清贫、困顿、低微,但是不可以没有梦想。',
      '心有多大,舞台就有多大。',
      '梦想只要能持久,就能成为现实。'
    ],
    angles: [
      '写出梦想对人生的指引作用,体现追梦路上的执着',
      '从小梦想写到大情怀,升华梦想的社会价值'
    ]
  },
  friendship: {
    title: '友情珍贵类作文素材',
    materials: [
      { type: '事例', content: '伯牙子期:俞伯牙善弹琴,钟子期善听琴。子期死,伯牙谓世再无知音,乃破琴绝弦,终身不复鼓琴,留下"高山流水"的佳话。' },
      { type: '事例', content: '管仲鲍叔牙:管仲曾感叹"生我者父母,知我者鲍子也"。鲍叔牙不计前嫌,向齐桓公举荐管仲为相,二人成就"管鲍之交"的美谈。' },
      { type: '人物', content: '李白与杜甫:天宝年间两位诗坛巨匠相遇,李白比杜甫大11岁,二人结下深厚友谊,杜甫写下多首怀念李白的诗篇,传为文坛佳话。' },
      { type: '事例', content: '马克思与恩格斯:二人共同撰写《共产党宣言》,恩格斯在经济上长期资助马克思,亦师亦友,成就了伟大的革命友谊。' },
      { type: '事例', content: '一个人在困境中向朋友伸出的援手,往往比顺境中的祝福更珍贵。真正的友情经得起时间和距离的考验。' }
    ],
    quotes: [
      '海内存知己,天涯若比邻。——王勃',
      '桃花潭水深千尺,不及汪伦送我情。——李白',
      '真正的朋友,是在你跌倒时扶你一把的人。',
      '友谊是两颗心真诚相待,而不是一颗心对另一颗心的敲打。'
    ],
    angles: [
      '通过一件共同经历的小事,展现友情在细节中的流露',
      '写出友情中的"理解"与"包容",体现知己难得'
    ]
  }
};

// ==================== 中考命题预测库 ====================
// 基于近年上海中考趋势,覆盖成长感悟、亲情温暖、坚持追梦、校园生活、传统文化、科技与人文等方向
const compositionPredictionsData = [
  {
    title: '那一刻,我____',
    type: '半命题',
    hints: ['补全题目,填入情感或动作词', '聚焦具体瞬间,写出细节', '展现情感或认知的变化'],
    difficulty: 2
  },
  {
    title: '原来,这就是____',
    type: '半命题',
    hints: ['补全题目,揭示对某事物的全新认识', '欲扬先抑,写出认知转折', '结尾点题升华'],
    difficulty: 2
  },
  {
    title: '我和____的故事',
    type: '半命题',
    hints: ['补全为人、物或地点', '选取典型事件展开叙述', '写出情感线索'],
    difficulty: 1
  },
  {
    title: '温暖',
    type: '命题',
    hints: ['以"温暖"为核心立意', '可写人、事、物传递的温暖', '开头结尾呼应点题'],
    difficulty: 2
  },
  {
    title: '伴我前行',
    type: '命题',
    hints: ['写出"陪伴"与"前行"的关系', '可写人、品质、爱好等', '突出正向激励作用'],
    difficulty: 2
  },
  {
    title: '以"传统文化就在身边"为话题,写一篇文章',
    type: '材料',
    hints: ['结合自身经历写传统文化', '可写节日、技艺、习俗等', '体现对传统文化的认同与传承'],
    difficulty: 3
  },
  {
    title: '科技的温度',
    type: '命题',
    hints: ['科技与人文结合', '写出科技如何温暖生活', '避免空谈,要有具体事例'],
    difficulty: 3
  },
  {
    title: '____给了我力量',
    type: '半命题',
    hints: ['补全为人、事、物或品质', '写出困境中的力量来源', '情感真实,细节生动'],
    difficulty: 2
  },
  {
    title: '最美的风景',
    type: '命题',
    hints: ['"风景"可实可虚', '可写自然风景或人性之美', '立意要新,避免俗套'],
    difficulty: 2
  },
  {
    title: '阅读材料作文:人工智能时代,我们更需要什么?',
    type: '材料',
    hints: ['思考科技发展与人文素养的关系', '可从创造力、情感、道德等角度切入', '观点鲜明,论证有力'],
    difficulty: 3
  }
];

// ==================== 内部工具函数 ====================

// 随机选取 n 个不重复索引
function pickRandomIndices(length, n) {
  const indices = Array.from({ length }, (_, i) => i);
  const result = [];
  const count = Math.min(n, length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * indices.length);
    result.push(indices[idx]);
    indices.splice(idx, 1);
  }
  return result;
}

// 判断字符是否为汉字(可挖空的对象)
function isChineseChar(ch) {
  return /[\u4e00-\u9fa5]/.test(ch);
}

// 从一行文字中随机挖空 1-2 个汉字,用 ____ 替换
// 返回 { stem: 含挖空的题目行, answer: [被挖掉的原文], explanation: 完整原句 }
function blankLine(line) {
  const chars = line.split('');
  // 找出所有汉字位置
  const chinesePositions = chars.map((ch, i) => isChineseChar(ch) ? i : -1).filter(i => i >= 0);
  if (chinesePositions.length === 0) {
    return { stem: line, answer: [], explanation: line };
  }
  // 挖空 1-2 个字(汉字数>=2时有一半概率挖2个)
  const blankNum = Math.min(chinesePositions.length >= 2 && Math.random() < 0.5 ? 2 : 1, chinesePositions.length);
  const selected = pickRandomIndices(chinesePositions.length, blankNum).map(i => chinesePositions[i]).sort((a, b) => a - b);
  const answers = selected.map(p => chars[p]);
  selected.forEach(p => { chars[p] = '____'; });
  return {
    stem: chars.join(''),
    answer: answers,
    explanation: line
  };
}

// 随机打乱数组(返回新数组,不修改原数组)
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ==================== 缓存 ====================
let classicsCache = null;   // classics.json 数据缓存
let classicsLoaded = false; // 是否已加载
let recites2026Cache = null; // 2026 必背古诗文模块缓存

// 加载 2026 古诗文模块(独立 ES 模块,失败时降级为空数组)
async function loadRecites2026() {
  if (recites2026Cache) return recites2026Cache;
  try {
    const mod = await import('../../data/recites_2026.js');
    recites2026Cache = mod.RECITES || [];
  } catch (e) {
    console.warn('[chinese-engine] 加载 recites_2026.js 失败:', e);
    recites2026Cache = [];
  }
  return recites2026Cache;
}

// 把 2026 模块数据规范化为引擎内统一格式
function normalizeRecite2026(item) {
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    dynasty: item.dynasty,
    type: item.type || '文言文',
    content: (item.contentArr || []).join('\n'),
    contentArr: item.contentArr || [],
    translation: item.translation || '',
    appreciation: item.appreciation || '',
    keyPoints: item.keyPoints || [],
    reciteDifficulty: item.reciteDifficulty || 2,
    source: '2026考纲'
  };
}

// ==================== 语文学习内容引擎 ====================
export const chineseEngine = {
  // ========== 必背篇目模块 ==========

  // 异步加载 classics.json,带缓存;并合并 2026 必背古诗文模块
  async loadClassics() {
    if (classicsLoaded) {
      return classicsCache;
    }
    const [resp, recites2026] = await Promise.all([
      fetch('./data/classics.json'),
      loadRecites2026()
    ]);
    if (!resp.ok) {
      throw new Error('加载 classics.json 失败:HTTP ' + resp.status);
    }
    const data = await resp.json();
    // 合并 2026 必背古诗文(去重:id 重复时优先保留 2026 版)
    const baseRecites = data.recites || [];
    const baseIds = new Set(baseRecites.map(r => r.id));
    const normalized2026 = recites2026
      .filter(r => !baseIds.has(r.id))
      .map(normalizeRecite2026);
    data.recites = [...baseRecites, ...normalized2026];
    classicsCache = data;
    classicsLoaded = true;
    return classicsCache;
  },

  // 返回背诵篇目列表(精简字段)
  async getReciteList() {
    const data = await this.loadClassics();
    const list = data.recites || [];
    return list.map(item => ({
      id: item.id,
      title: item.title,
      author: item.author,
      dynasty: item.dynasty,
      type: item.type,
      reciteDifficulty: item.reciteDifficulty
    }));
  },

  // 返回完整篇目对象
  async getRecite(id) {
    const data = await this.loadClassics();
    const list = data.recites || [];
    return list.find(item => item.id === id) || null;
  },

  // 生成背诵测试题:挖空填空
  // recite: 篇目对象(含 contentArr 或 content)
  // blankCount: 挖空的行数,默认 3
  // 返回 { kpId, type:'fill', stem(含挖空), answer:[被挖掉的原文], explanation(完整原句) }
  generateReciteQuiz(recite, blankCount = 3) {
    // 兼容 contentArr 数组和 content 按行分割两种格式
    const lines = recite.contentArr || (recite.content ? recite.content.split('\n') : []);
    if (lines.length === 0) {
      return {
        kpId: recite.id,
        type: 'fill',
        stem: '',
        answer: [],
        explanation: '该篇目暂无内容可生成测试题'
      };
    }
    const count = Math.min(blankCount, lines.length);
    const selectedIdx = pickRandomIndices(lines.length, count).sort((a, b) => a - b);
    const stems = [];
    const answers = [];
    const explanations = [];
    selectedIdx.forEach(idx => {
      const line = lines[idx].trim();
      if (!line) return;
      const result = blankLine(line);
      stems.push(result.stem);
      answers.push(...result.answer);
      explanations.push(result.explanation);
    });
    return {
      kpId: recite.id,
      type: 'fill',
      stem: stems.join('\n'),
      answer: answers,
      explanation: explanations.join('\n')
    };
  },

  // ========== 文言文模块 ==========

  // 文言文篇目列表
  async getClassicalList() {
    const data = await this.loadClassics();
    const list = data.classicals || [];
    return list.map(item => ({
      id: item.id,
      title: item.title,
      author: item.author,
      dynasty: item.dynasty,
      type: item.type
    }));
  },

  // 返回完整文言文对象
  async getClassical(id) {
    const data = await this.loadClassics();
    const list = data.classicals || [];
    return list.find(item => item.id === id) || null;
  },

  // 文言字词解释题(选择题)
  // classical: 文言文对象(含 notes 数组,每项为 {word, meaning})
  // 返回 { kpId, type:'mcq', stem, options:[4个], answer, explanation }
  generateClassicalQuiz(classical) {
    const notesArr = Array.isArray(classical.notes) ? classical.notes : [];
    if (notesArr.length === 0) {
      return {
        kpId: classical.id,
        type: 'mcq',
        stem: '该篇目暂无字词注解',
        options: [],
        answer: '',
        explanation: '暂无可生成的题目'
      };
    }
    // 随机选1个目标词
    const targetIdx = Math.floor(Math.random() * notesArr.length);
    const targetWord = notesArr[targetIdx].word;
    const correctMeaning = notesArr[targetIdx].meaning;
    // 干扰项:从其他词的释义中选3个
    const otherMeanings = notesArr.filter((_, i) => i !== targetIdx).map(n => n.meaning);
    const distractors = shuffle(otherMeanings).slice(0, 3);
    // 干扰项不足3个时用占位补充
    while (distractors.length < 3) {
      distractors.push('（无此释义）');
    }
    // 组合并打乱4个选项
    const options = shuffle([correctMeaning, ...distractors]);
    const answerIndex = options.indexOf(correctMeaning);
    return {
      kpId: classical.id,
      type: 'mcq',
      stem: `下列对"${targetWord}"的解释正确的是`,
      options: options,
      answer: String.fromCharCode(65 + answerIndex), // 返回 A/B/C/D
      explanation: `"${targetWord}"意为"${correctMeaning}"。`
    };
  },

  // ========== 作文素材与命题预测模块 ==========

  // 获取作文素材(按主题)
  // theme: 'growth'|'family'|'persistence'|'dream'|'friendship'
  // 返回 { theme, title, materials:[{type,content}], quotes:[], tips }
  getCompositionMaterials(theme) {
    const lib = compositionLibrary[theme];
    if (!lib) {
      return {
        theme: theme,
        title: '未知主题',
        materials: [],
        quotes: [],
        tips: []
      };
    }
    // 取3个素材
    const materials = shuffle(lib.materials).slice(0, 3).map(m => ({
      type: m.type,
      content: m.content
    }));
    // 取3条名言
    const quotes = shuffle(lib.quotes).slice(0, 3);
    // 取2个写作角度
    const tips = lib.angles.slice(0, 2);
    return {
      theme: theme,
      title: lib.title,
      materials: materials,
      quotes: quotes,
      tips: tips
    };
  },

  // 中考命题预测(基于近年上海中考趋势)
  // 返回 [{ title, type:'命题'|'半命题'|'材料', hints:[], difficulty }]
  getCompositionPredictions() {
    return compositionPredictionsData.slice();
  },

  // 生成作文提纲
  // title: 作文题目
  // 返回 { title, structure:{开头, 主体:[段], 结尾}, wordCount建议, 要点提示 }
  generateCompositionOutline(title) {
    // 根据题目关键词匹配素材主题
    let theme = 'growth';
    const keywordMap = {
      family: ['亲情', '温暖', '家', '父', '母', '背影', '爱'],
      persistence: ['坚持', '不懈', '努力', '奋斗', '磨砺', '毅力'],
      dream: ['梦想', '理想', '追梦', '远行', '远方'],
      friendship: ['友情', '朋友', '知己', '陪伴', '同行'],
      growth: ['成长', '变化', '蜕变', '少年', '青春']
    };
    for (const key in keywordMap) {
      if (keywordMap[key].some(kw => title.includes(kw))) {
        theme = key;
        break;
      }
    }
    const materials = this.getCompositionMaterials(theme);
    const themeLabel = {
      growth: '成长',
      family: '亲情',
      persistence: '坚持',
      dream: '梦想',
      friendship: '友情'
    }[theme];
    return {
      title: title,
      theme: theme,
      structure: {
        开头: `开门见山点题,引出"${title}"的核心立意,可用名言或场景描写切入,约80-100字。`,
        主体: [
          `选取典型事例(参考素材:${materials.materials[0] ? materials.materials[0].content.slice(0, 30) + '……' : '亲身经历'}),具体叙述事件经过,注重细节描写,约200字。`,
          `写出情感或认知的变化,体现"${title}"的深层含义,可运用对比或欲扬先抑手法,约200字。`,
          `结合个人感悟升华,将个人经历与${themeLabel}的普遍意义联系起来,约150字。`
        ],
        结尾: '呼应开头,点明主旨,抒发感悟,可引用名言收束全文,余味悠长,约80-100字。'
      },
      wordCount建议: '600-800字(上海中考建议800字左右)',
      要点提示: [
        '开头结尾务必扣题,避免离题',
        `可引用名言:${materials.quotes[0] || '选择贴合主题的名言'}`,
        ...materials.tips
      ]
    };
  }
};
