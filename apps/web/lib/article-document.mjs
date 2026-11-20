const paragraph = text => ({type:'paragraph',content:[{type:'text',text}]});
const heading = text => ({type:'heading',attrs:{level:2},content:[{type:'text',text}]});

// Keep this representation stable for existing submission idempotency hashes.
export function legacyArticleDocument(body) {
  return {type:'doc',content:body.trim().split(/\n\s*\n/).map(p=>paragraph(p.trim()))};
}

export function articleDocument(body) {
  const text = body.trim();
  const marker = /(<h2\b[^>]*>[\s\S]*?<\/h2\s*>|^[ \t]*##[ \t]+[^\r\n]+[ \t]*$)/gim;
  const parts = text.split(marker);
  if (parts.length > 1) {
    const content = [];
    for (const part of parts) {
      const h = part.match(/^\s*##[ \t]+([^\r\n]+)\s*$/) ?? part.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2\s*>$/i);
      if (h) {
        const title = h[1].replace(/<[^>]*>/g,'').trim();
        if (title) content.push(heading(title));
        else content.push(paragraph(part.trim()));
      } else if (part.trim()) {
        content.push(...part.trim().split(/\n\s*\n/).map(p=>paragraph(p.trim())));
      }
    }
    return {type:'doc',content};
  }
  const doc = legacyArticleDocument(body);
  if ([...text.replace(/\s/g,'')].length <= 800 || /<h2\b|^\s*##[ \t]/im.test(text) || doc.content.length < 4) return doc;
  // Use complete sentences already present in the text; do not invent facts.
  const selected = new Set([1,2,3].map(n=>Math.floor(doc.content.length*n/4)));
  const content = [];
  for (const [index,node] of doc.content.entries()) {
    if (selected.has(index)) {
      const sentence = node.content[0].text.match(/^([^\n。！？.!?]{8,90})[。！？.!?](?:\s|$|(?=[\u3400-\u9fff]))/u)?.[1]?.trim();
      if (sentence && !/[<>]/.test(sentence)) content.push(heading(sentence));
    }
    content.push(node);
  }
  return {type:'doc',content};
}
