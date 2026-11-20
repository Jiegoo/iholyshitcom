// Comments only. These rules never classify news articles or reaction buttons.
const chineseRules = [
  '黑鬼', '白皮猪', '白皮豬', '支那', '尼哥', '犹太猪', '猶太豬', '种族清洗', '種族清洗',
  '种族优越', '種族優越', '劣等民族', '劣等人种', '劣等人種', '灭绝', '滅絕',
  '傻逼', '傻比', '煞笔', '煞筆', '沙比', '脑残', '腦殘', '智障', '贱人', '賤人',
  '狗杂种', '狗雜種', '杂种', '雜種', '畜生', '废物', '廢物', '去死', '你妈', '你媽',
  '他妈的', '他媽的', '操你', '草你', '艹你', '妈逼', '媽逼', '妈的', '媽的',
  '杀了你', '殺了你', '弄死你', '打死你', '人肉搜索', '开盒', '開盒', '住址曝光',
  '骗子', '騙子', '诈骗犯', '詐騙犯', '强奸犯', '強姦犯', '恋童', '戀童', '偷税', '偷稅',
  '政治', '政党', '政黨', '共产党', '共產黨', '民主党', '民主黨', '共和党', '共和黨',
  '总统', '總統', '选举', '選舉', '台独', '台獨', '港独', '港獨', '纳粹', '納粹',
  '战争', '戰爭', '宣战', '宣戰', '侵略', '屠杀', '屠殺', '恐怖主义', '恐怖主義',
  '俄乌', '俄烏', '巴以', '以巴', '哈马斯', '哈馬斯', '圣战', '聖戰',
  '色情', '裸聊', '成人视频', '成人視頻', '约炮', '約炮', '嫖娼', '卖淫', '賣淫',
  '儿童色情', '兒童色情', '代开发票', '代開發票', '刷单', '刷單', '博彩', '赌博', '賭博',
  '加微信', '加我微信', '加微', '加群', '稳赚', '穩賺', '高额返利', '高額返利',
  '自杀方法', '自殺方法', '教你自杀', '教你自殺',
];

const englishRules = [
  'nigger', 'nigga', 'chink', 'gook', 'kike', 'faggot', 'retard', 'retarded',
  'white supremacy', 'inferior race', 'ethnic cleansing', 'heil hitler', 'nazi',
  'fuck', 'fucking', 'motherfucker', 'bitch', 'asshole', 'cunt', 'bastard', 'dickhead',
  'kill yourself', 'kill you', 'you should die', 'rape you', 'dox you', 'doxxing',
  'fraudster', 'scammer', 'rapist', 'pedophile', 'paedophile',
  'politics', 'political', 'election', 'president', 'communist party', 'democratic party',
  'republican party', 'maga', 'war', 'warfare', 'genocide', 'terrorism', 'terrorist',
  'jihad', 'hamas', 'porn', 'pornography', 'child porn', 'sex chat', 'onlyfans',
  'casino', 'guaranteed profit', 'free money', 'buy followers', 'suicide instructions',
];

function normalize(text: string) {
  return text.normalize('NFKC').toLowerCase().normalize('NFD').replace(/[\p{M}\p{Cf}]/gu, '');
}

const chineseTerms = chineseRules.map(normalize);
const englishPatterns = englishRules.map(term => {
  // Boundaries avoid substring matches such as "class" or "Scunthorpe".
  const letters = normalize(term).replace(/ /g, '').split('');
  const pattern = letters.join('[^\\p{L}\\p{N}]*');
  return new RegExp('(?<![\\p{L}\\p{N}])' + pattern + '(?![\\p{L}\\p{N}])', 'u');
});

const contactPatterns = [
  /(?:https?:\/\/|www\.|[\p{L}\p{N}-]+\.(?:com|net|org|io|cn|xyz|top)\b)/iu,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/iu,
  /(?:\+?\d[\s().-]*){10,}/u,
  /(?:微信|微[信訊]|wechat|telegram|whatsapp|手机|手機|电话|電話|身份证|身份證|住址|home address|phone number)\s*[:：=]/iu,
];

export function isCommentAllowed(body: string): boolean {
  const normalized = normalize(body);
  const compact = normalized.replace(/[^\p{L}\p{N}]/gu, '');
  if (chineseTerms.some(term => compact.includes(term))) return false;
  // Common leetspeak substitutions, without changing the stored comment.
  const latin = normalized.replace(/[013457@$]/g, character =>
    ({'0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's'}[character]!));
  if (englishPatterns.some(pattern => pattern.test(normalized) || pattern.test(latin))) return false;
  return !contactPatterns.some(pattern => pattern.test(normalized));
}
