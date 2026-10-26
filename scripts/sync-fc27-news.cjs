#!/usr/bin/env node
// Pull recent articles from EA's official FC27 news cards; never manufacture article records.
// Parsing is regex over the server-rendered markup, like the FUT.GG scrapers, so this job needs no dependencies.
// A card publishes a date, a headline and a summary — each is stored in its own field, and anything the card
// does not state stays absent instead of guessed.
const fs=require('node:fs');
const { plain } = require('./lib/futgg.cjs');
const MONTHS='January|February|March|April|May|June|July|August|September|October|November|December';
const PUBLISHED=new RegExp('((?:'+MONTHS+')\\s+\\d{1,2},\\s+\\d{4})');
const inner=(fragment,tag)=>{
 const match=new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/'+tag+'>').exec(fragment);
 return match?plain(match[1]):'';
};
// Some EA cards ship a deck shorter than the headline. The article body's first
// paragraph is the same official copy, so it is used as the summary instead of
// leaving a truncated or duplicated headline.
async function articleSummary(link){
 try{
  const res=await fetch(link,{headers:{'User-Agent':'Mozilla/5.0 FC27-Hub-News/1.0','Accept':'text/html'},signal:AbortSignal.timeout(20000)});
  if(!res.ok)return '';
  const html=await res.text();
  for(const [,body] of html.matchAll(/<p\b[^>]*>([\s\S]{40,800}?)<\/p>/g)){
   const text=plain(body);
   if(text.length>=40)return text;
  }
 }catch{}
 return '';
}
async function main(){
 const url='https://www.ea.com/games/ea-sports-fc/fc-27';
 const res=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 FC27-Hub-News/1.0','Accept':'text/html'},signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('EA HTTP '+res.status);
 const html=await res.text();
 const seen=new Set(),items=[];
 for(const [,href,body] of html.matchAll(/<a\b[^>]*href="([^"]*\/fc-27\/news\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)){
  let link;try{link=new URL(href.trim(),url)}catch{continue}
  if(link.hostname!=='www.ea.com'||/fc[- ]?26/i.test(link.pathname))continue;
  const text=plain(body);
  const title=inner(body,'h3')||text;
  const summary=inner(body,'p');
  const published=(PUBLISHED.exec(text)||[])[1]||'';
  if(title.length<16||/FC\s*26/i.test(title)||seen.has(link.pathname))continue;
  seen.add(link.pathname);
  const item={title,url:link.origin+link.pathname,source:'Electronic Arts'};
  if(published)item.published=published;
  if(summary&&summary!==title)item.summary=summary;
  if(!item.summary||item.summary.length<=title.length){
   const fallback=await articleSummary(item.url);
   if(fallback.length>title.length)item.summary=fallback;
  }
  items.push(item);
 }
 if(items.length<3)throw Error('Official news extraction failed (fewer than 3 titles); retaining previous verified snapshot.');
 fs.mkdirSync('data',{recursive:true});
 const file='data/fc27-news.json';
 const payload={source:'Electronic Arts',source_url:url,checked_at:new Date().toISOString(),items:items.slice(0,18)};
 fs.writeFileSync(file,JSON.stringify(payload,null,2)+'\n');
 console.log('EA FC27 articles:',payload.items.length,'with dates:',payload.items.filter(x=>x.published).length,'with summaries:',payload.items.filter(x=>x.summary).length);
}
main().catch(e=>{console.error(e);process.exitCode=1});
