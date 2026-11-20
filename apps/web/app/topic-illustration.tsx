import type {TopicScene} from '../lib/topic-illustrations';
export const topicGlyphs:Record<string,string>={};
export default function TopicIllustration({scene,locale}:{scene:TopicScene;locale:'zh'|'en';variant?:number}){return <figure className="article-illustration"><figcaption>{locale==='zh'?scene.zh:scene.en}</figcaption></figure>;}
