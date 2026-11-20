'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import type { DailyItem, FeedItem, RankingItem } from '../lib/public-stories';
import { submitCandidate } from './submission';
import Brand from './brand';

const categories = ['全部', '机器人', '脑机接口', '能源', '芯片 / AI', '太空', '生物科技'];
const categoryLabels: Record<string, string> = { robotics: '机器人', bci: '脑机接口', energy: '能源', 'chips-ai': '芯片 / AI', space: '太空', biotech: '生物科技' };
const steps = [
  ['采集', '只从经过审核且明确授权的来源采集，访问、保存和处理权限分别确认。'],
  ['核验', '区分原始报道、独立佐证与转载；证据不足或相互矛盾时交由编辑处理。'],
  ['关联', '将可能描述同一事件的报道交给编辑核对，避免重复展示。'],
  ['评分', '突破性、影响、新颖性、关注度和意外程度分别评分；可信度独立判断。'],
  ['成稿', '仅在来源与供应商权限允许时处理已授权内容，生成的内容须有证据支持。'],
  ['人工审核', '编辑审核具体版本，发布是独立操作；更正和撤回保留记录。'],
];

const demoStories = [
  { slug: 'demo-robot', title: '人形机器人推开实验室大门，走向真实世界', summary: '虚构场景：用于展示栏目，并非新闻报道。', category: '机器人', score: 98 },
  { slug: 'demo-brain', title: '脑机接口让念头化为交流', summary: '虚构场景：脑机接口栏目演示。', category: '脑机接口', score: 94 },
  { slug: 'demo-energy', title: '清洁能源迎来全新突破', summary: '虚构场景：能源栏目演示。', category: '能源', score: 91 },
  { slug: 'demo-chip', title: '新一代计算芯片改变运算方式', summary: '虚构场景：芯片与 AI 栏目演示。', category: '芯片 / AI', score: 89 },
  { slug: 'demo-space', title: '下一段太空旅程启航', summary: '虚构场景：太空栏目演示。', category: '太空', score: 85 },
  { slug: 'demo-bio', title: '生命科学迎来全新设计工具', summary: '虚构场景：生物科技栏目演示。', category: '生物科技', score: 83 },
];

function dailyDetails(publishedAt: string | null, sourceCount: number | null, demo: boolean) {
  if (demo) return 'DEMO · 虚构事件与来源';
  const time = publishedAt ? new Date(publishedAt) : null;
  const date = time && Number.isFinite(time.getTime()) ? `首次发布 ${time.toISOString().slice(0, 10)} UTC` : '发布时间未知';
  const sources = typeof sourceCount === 'number' && Number.isInteger(sourceCount) && sourceCount >= 0
    ? `${sourceCount} 条来源链接` : '来源数量未知';
  return `${date} · ${sources}`;
}

export default function Discovery({ stories, ranking: publishedRanking, daily, demo, localFixtures, tipsEnabled, submissionId }: { stories: FeedItem[]; ranking: RankingItem[]; daily: DailyItem[]; demo: boolean; localFixtures: boolean; tipsEnabled: boolean; submissionId: string }) {
  const [category, setCategory] = useState('全部');
  const [threshold, setThreshold] = useState(0);
  const [step, setStep] = useState(0);
  const [sort, setSort] = useState('latest');
  const [submission, submit, pending] = useActionState(submitCandidate, { message: '', success: false });
  const items = demo ? demoStories : stories.map(story => ({ ...story, category: story.category ? categoryLabels[story.category] ?? null : null,
    score: typeof story.score === 'number' && Number.isInteger(story.score) && story.score >= 0 && story.score <= 100 ? story.score : null }));
  const visible = items.filter(item => (category === '全部' || item.category === category) && (threshold === 0 || (item.score !== null && item.score >= threshold)));
  if (sort === 'score') visible.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const ranking = demo ? [...demoStories].sort((a, b) => b.score - a.score).slice(0, 5) : publishedRanking;
  const selected = demo ? demoStories.slice(0, 5).map(item => ({ ...item, published_at: null, source_count: null })) : daily.map(story => ({ ...story, category: story.category ? categoryLabels[story.category] ?? null : null }));
  const lead = selected[0];
  return <main className="muse" lang="zh-CN">
    <header className="muse-header muse-wrap"><div><Link className="muse-logo" href="/"><Brand /></Link><p>每天发现值得惊叹的科技事件</p></div><div className="muse-meta">THE INTERNET&apos;S DAILY DOSE OF HOLY SHIT<br />{!demo && <><a href="/search">搜索事件</a> &nbsp; / &nbsp; </>}<a href="/methodology">编辑方法</a> &nbsp; / &nbsp; <a href="/about">关于我们</a></div></header>
    <div className="muse-ticker"><div>✳ &nbsp; THE FUTURE IS WEIRD &nbsp; / &nbsp; 发现值得惊叹的科技事件 &nbsp; / &nbsp; EVIDENCE BEFORE EXCITEMENT &nbsp; ✳</div></div>
    <div className="muse-wrap">
      <div className="muse-notice">{demo ? 'DEMO 演示模式 / 所有条目、评分和场景均为虚构，不是新闻。' : localFixtures ? 'DEMO · 本地虚构验收数据 / 页面中的事件和评分均为测试样本，不是真实新闻。' : '编辑说明 / 我们只展示经过人工审核并正式发布的内容；未审核的分类和评分显示为未知。'}</div>
      <section className="muse-hero" aria-label="头条">
        <div className="muse-hero-copy">
          <span className="muse-tag">{demo || localFixtures ? 'DEMO · 示例头条' : 'THE BIG PICTURE'}</span>
          <h1>{lead ? (demo ? lead.title : <a href={`/story/${encodeURIComponent(lead.slug)}`}>{lead.title}</a>) : <>世界正在变得<br /><em>不可思议。</em></>}</h1>
          <p>{lead?.summary ?? '我们正在寻找那些值得你停下来、重新认识世界的科技事件。宁缺毋滥，每一条都要经过人工审核。'}</p>
          {lead && <p>{lead.category ?? '分类未知'} · {dailyDetails(lead.published_at, lead.source_count, demo)}</p>}
          <div className="muse-score"><strong>{lead?.score ?? '—'}</strong><span>Newsroom Index<br /><small>{lead?.score == null ? '暂无公开评分' : demo || localFixtures ? 'DEMO 示例评分' : '已审核版本评分'}</small></span></div>
        </div>
      </section>
      <nav className="muse-nav" aria-label="分类"><div className="muse-categories">{categories.map(c => <button type="button" key={c} className={category === c ? 'selected' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}{!demo && <a className="muse-search-link" href="/search">搜索 ↗</a>}</div></nav>
      <div className="muse-heading"><div><h2>每日精选 <em>/ DAILY WTF</em></h2><p>由编辑从已审核事件中挑选，按 UTC 日期更新。</p></div></div>
      {selected.length ? <div className="muse-grid">{selected.map(story => <article className="muse-card" key={story.slug}><div className="muse-card-top">{story.category ?? '分类未知'} <span>{story.score === null ? '评分未知' : `评分 ${story.score}`}</span></div><h3>{demo ? story.title : <a href={`/story/${encodeURIComponent(story.slug)}`}>{story.title} ↗</a>}</h3><p>{story.summary}</p><small>{dailyDetails(story.published_at, story.source_count, demo)}</small></article>)}</div> : <div className="muse-empty"><strong>今天还没有编辑精选</strong><p>经过核验并由编辑选择的事件会显示在这里。</p></div>}
      <div className="muse-heading" id="latest"><div><h2>最新震撼 <em>/ LATEST</em></h2><p>首页筛选最近 50 条事件；{demo ? '当前为虚构示例。' : '可在搜索页查找更多已发布事件。'}</p></div>{demo ? <a href="/methodology">HOW WE WORK ↗</a> : <a href="/search">搜索更多事件 ↗</a>}</div>
      <div className="muse-toolbar"><label htmlFor="shock">Newsroom Index</label><input id="shock" type="range" min="0" max="100" value={threshold} aria-valuetext={threshold === 0 ? '全部' : `不低于 ${threshold}`} onChange={e => setThreshold(Number(e.target.value))}/><strong>{threshold === 0 ? '全部' : `≥ ${threshold}`}</strong><label htmlFor="sort">排序</label><select id="sort" value={sort} onChange={e => setSort(e.target.value)}><option value="latest">最新</option><option value="score">评分最高</option></select><small>{demo ? '仅筛选虚构示例' : '未评分条目仅在门槛为 0 时显示'}</small></div>
      <div className="muse-layout"><div>{visible.length ? <div className="muse-grid">{visible.map(story => <article className="muse-card" key={story.slug}><div className="muse-card-top">{demo ? 'DEMO · ' : ''}{story.category ?? '分类未知'} <span>{story.score === null ? '评分未知' : `${demo ? '示例评分' : '评分'} ${story.score}`}</span></div><h3>{demo ? story.title : <a href={`/story/${encodeURIComponent(story.slug)}`}>{story.title} ↗</a>}</h3><p>{story.summary}</p><small>{demo ? 'DEMO STORY · FICTIONAL SOURCE · NO PUBLICATION DATE' : 'SOURCE DETAILS IN STORY · DATE NOT AVAILABLE'}</small></article>)}</div> : <div className="muse-empty"><strong>{items.length ? '暂无符合条件的事件' : 'No stories published yet'}</strong><p>{items.length ? '调整分类或评分门槛，查看更多事件。' : '新的发现经过核验与审核后会出现在这里。'}</p></div>}</div><aside className="muse-side"><section><h3>震撼榜 / TOP</h3>{ranking.length ? <ol>{ranking.map(item => <li key={item.slug}>{demo ? item.title : <a href={`/story/${encodeURIComponent(item.slug)}`}>{item.title}</a>} · {item.score} {demo && <small>DEMO</small>}</li>)}</ol> : <p>暂无已公开评分。</p>}<small>{demo ? '按虚构示例评分排序。' : '按已发布事件的已审核评分排序。'}</small></section><section><h3>这里的规矩</h3><ol><li><b>发现优先</b><br/>寻找真正值得关注的事件。</li><li><b>证据先行</b><br/>区分独立来源与转载。</li><li><b>冲突交给人</b><br/>不确定的事实不能被掩盖。</li><li><b>人工审核</b><br/>每次发布都经过编辑把关。</li></ol></section></aside></div>
      <div className="muse-heading"><div><h2>它怎么运转 <em>/ HOW IT WORKS</em></h2><p>点开任意一步，了解我们的工作方式。</p></div></div>
      <section className="muse-pipeline"><h2>工具帮忙，<em>人来把关。</em></h2><p>从授权来源到人工审核，事实和证据始终在前面。</p><div className="muse-steps">{steps.map(([name], i) => <button key={name} type="button" className={step === i ? 'active' : ''} aria-pressed={step === i} onClick={() => setStep(i)}><small>STEP 0{i + 1}</small><strong>{name}</strong></button>)}</div><div className="muse-step-detail"><b>{steps[step][0]}：</b>{steps[step][1]}</div></section>
      <section className="muse-submit"><h2>发现了什么？ / SEND A TIP</h2><p>提交候选线索供编辑查看。提交不会触发抓取，也不会自动发布。</p>{demo ? <p>DEMO 模式不接收投稿。</p> : !tipsEnabled ? <p>投稿暂未开放。</p> : <form action={submit}><input type="hidden" name="id" value={submissionId}/><label>标题<input name="title" maxLength={200} required /></label><label>HTTPS 链接<input name="url" type="url" maxLength={2048} required /></label><label className="muse-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><button disabled={pending || submission.success}>{pending ? '正在提交…' : '提交线索'}</button></form>}{submission.message && <p role="status">{submission.message}</p>}</section>
    </div>
  </main>;
}
