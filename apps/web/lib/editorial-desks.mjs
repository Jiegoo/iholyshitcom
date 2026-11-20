export const editorialDesks = [
  {channel:'ai', name:'Newsroom AI Desk'},
  {channel:'robotics', name:'Newsroom Future Desk'},
  {channel:'industry', name:'Newsroom Industry Desk'},
  {channel:'technology', name:'Newsroom Science & Tech Desk'},
  {channel:'internet', name:'Newsroom Internet Desk'},
  {channel:'products', name:'Newsroom Products Desk'},
];

export function editorialDesk(channel) {
  return editorialDesks.find(desk => desk.channel === channel) ?? {channel:'editorial',name:'Newsroom Editorial Desk'};
}
