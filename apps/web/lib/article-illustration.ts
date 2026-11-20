export type IllustrationTheme = 'ai'|'robot'|'chip'|'space'|'security'|'bio'|'energy'|'product'|'business'|'tech';
const rules: {theme:IllustrationTheme;pattern:RegExp}[] = [
 {theme:'security',pattern:/\b(security|cyber|hack|hacker|breach|ransomware|encryption|signal|vulnerability|exploit|malware|privacy)\b|网络安全|漏洞|加密|黑客/},
 {theme:'space',pattern:/\b(space|spacex|nasa|mars|lunar|moon|satellite|rocket|orbit|astronomy|black-hole|telescope)\b|航天|太空|火箭|卫星|月球|黑洞/},
 {theme:'bio',pattern:/\b(bio|biotech|biology|genetic|genetics|gene|dna|neuron|brain|medical|therapy|neuralink)\b|生物|基因|细胞|神经|脑机/},
 {theme:'energy',pattern:/\b(energy|battery|batteries|solar|fusion|nuclear|power-grid)\b|能源|电池|核聚变|太阳能/},
 {theme:'robot',pattern:/\b(robot|robots|robotics|humanoid|drone|drones|autonomous|autopilot)\b|机器人|无人机|自动驾驶/},
 {theme:'chip',pattern:/\b(chip|chips|gpu|cpu|npu|semiconductor|processor|wafer|silicon)\b|芯片|半导体|晶圆/},
 {theme:'ai',pattern:/\b(ai|agent|agents|llm|model|models|gpt|deepseek|chatgpt|gemini|claude|grok)\b|人工智能|大模型|智能体/},
];
const channels:Record<string,IllustrationTheme>={'ai':'ai','robotics':'robot','industry':'business','technology':'tech','internet':'security','products':'product'};
export function illustrationTheme(slug:string,channel?:string|null,tags:string[]=[]):IllustrationTheme {
 const text=[slug,...(Array.isArray(tags)?tags:[])].join(' ').toLowerCase();return rules.find(rule=>rule.pattern.test(text))?.theme??channels[channel??'']??'tech';
}
export function illustrationVariant(slug:string,count=4):number {let hash=2166136261;for(const char of slug)hash=Math.imul(hash^char.charCodeAt(0),16777619);return (hash>>>0)%count;}
