'use client';
import {useState} from 'react';
import type {BrowseItem, Locale} from '../lib/public-stories';
import {displayedFeaturedKeys} from '../lib/homepage-dedup.mjs';
import DailyPicks from './daily-picks';
import LatestDiscoveries from './latest-discoveries';

export default function HomeDiscoveries({locale,picks,picksRecent,headline,recent,heat}:{locale:Locale;picks:BrowseItem[];picksRecent:BrowseItem[];headline?:BrowseItem;recent:BrowseItem[];heat:BrowseItem[]}) {
 const [mode,setMode]=useState<'heat'|'recent'>('heat');
 const featuredKeys=displayedFeaturedKeys(headline,picks,picksRecent,mode);
 return <><DailyPicks locale={locale} heat={picks} recent={picksRecent} mode={mode} setMode={setMode}/><LatestDiscoveries locale={locale} recent={recent} heat={heat} featuredKeys={featuredKeys}/></>;
}
