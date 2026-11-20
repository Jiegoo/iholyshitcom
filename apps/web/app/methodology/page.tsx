import SiteHeader from '../site-header';
import type { Metadata } from 'next';
import { bilingualPageSearchMetadata, pageSearchMetadata } from '../../lib/search-config.mjs';
import Brand from '../brand';
import { notFound } from 'next/navigation';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{lang?: string | string[]}> }): Promise<Metadata> {
  if (process.env.NEWS_BILINGUAL_PUBLIC_READ === 'true' || (await searchParams).lang !== undefined) {
    const {lang} = await searchParams;
    const locale = lang === 'zh' ? 'zh' : 'en';
    return { title: `${locale === 'zh' ? '编辑方法' : 'Methodology'}${locale === 'zh' ? ' - 科技简报 (Newsroom)' : '｜Newsroom'}`, ...(lang === undefined || lang === 'zh' || lang === 'en' ? bilingualPageSearchMetadata('/methodology', locale) : {}) };
  }
  return { title: 'Methodology｜Newsroom', ...pageSearchMetadata('/methodology') };
}

export default async function Methodology({searchParams}: {searchParams:Promise<{lang?:string|string[]}>}) {
  const {lang}=await searchParams;
  if(lang!==undefined && lang!=='zh' && lang!=='en') notFound();
  const zh=lang==='zh';
  if(zh) return <><SiteHeader locale="zh" path="/methodology" /><main className="info-page" lang="zh">
    <p className="eyebrow">编辑方法</p><h1>我们如何寻找不同寻常的事。</h1>
    <p className="description"><Brand /> 仍在建设中；以下是指导编辑流程的原则，不代表所有功能已上线。</p>
    <section><h2>关注事件，而不只是标题</h2><p>我们希望将同一事件的报道关联起来，区分独立证实与重复转载。</p></section>
    <section><h2>证据先于惊叹</h2><p>事实陈述应有来源；不确定或相互矛盾的报道需要编辑处理，AI 输出须由人核查。</p></section>
    <section><h2>惊讶不等于确定</h2><p>Newsroom Index 旨在衡量事件的发现价值，与事实可信度分开；评分方法仍需评估。</p></section>
    <section><h2>尊重来源</h2><p>访问、保存、处理和展示来源材料需分别核查权限；公开可访问不等于可任意使用。</p></section></main></>;
  return <><SiteHeader locale="en" path="/methodology" /><main className="info-page" lang="en">
    <p className="eyebrow">Methodology</p>
    <h1>How we plan to find the extraordinary.</h1>
    <p className="description"><Brand /> is in development. These are the principles guiding our editorial process, not a claim that every feature is live.</p>
    <section><h2>Events before headlines</h2><p>We aim to group reporting about the same event and distinguish independent confirmation from repeated coverage.</p></section>
    <section><h2>Evidence before excitement</h2><p>Sources should support factual claims. Uncertainty and conflicting reports need editorial attention; AI output must be checked by a person before publication.</p></section>
    <section><h2>Surprise is not certainty</h2><p>The Newsroom Index measures how remarkable a story may be. It is separate from confidence in the underlying facts, and its scoring method still needs evaluation.</p></section>
    <section><h2>Respect for sources</h2><p>Our approach requires separate permission for accessing, storing, processing, and displaying source material. Availability alone does not grant those rights.</p></section>
  </main></>;
}
