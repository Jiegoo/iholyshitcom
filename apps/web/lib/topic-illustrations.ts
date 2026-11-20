export type TopicScene={channel:string;topic:string;zh:string;en:string;symbols:readonly [string,string]};
export const topicScenes:Record<string,readonly [string,string]>={};
export const topicAccentSymbols:Record<string,readonly string[]>={};
export function topicScene(_channel:string|null|undefined,_topics:string[]|null|undefined):TopicScene|null{void _channel;void _topics;return null;}
