import {validatedPrice,type CardPrice,type Platform} from './prices';
interface CardIdentity{id?:string|number;versionId?:string|number;itemId?:string|number}
interface PriceFeed {updated_at:string|null;verification_window_minutes?:number;prices:CardPrice[]}
const quotes=new Map<string,CardPrice>();
const platforms=new Set<Platform>(['pc','ps','xbox']);
let freshnessWindow=720;
let snapshotStamp:string|null=null;
function currentPlatform():Platform{
 const el=document.getElementById('fcPricePlatform') as HTMLSelectElement|null;
 const val=el?.value as Platform|undefined;
 return val&&platforms.has(val)?val:'ps';
}
function verifiedQuote(versionId:string,platform:Platform):CardPrice|null{
 const item=quotes.get(versionId+':'+platform);
 if(!item)return null;
 const latest=validatedPrice(item,Date.now(),freshnessWindow);
 return latest.status==='verified'?latest:null;
}
export function getFC27CardCoins(card:CardIdentity):number|null{
 const version=String(card.versionId??card.itemId??card.id??'');
 if(!/^\d+$/.test(version))return null;
 return verifiedQuote(version,currentPlatform())?.coins??null;
}
export function getFC27CardPriceText(card:CardIdentity):string{
 const amount=getFC27CardCoins(card);
 return amount===null?'قیمت معتبر موجود نیست':amount.toLocaleString('fa-IR')+' سکه';
}
function showVerifiedCardPrice():void{
 const output=document.getElementById('fcPriceResult');
 const version=(document.getElementById('fcPriceVersion') as HTMLInputElement|null)?.value.trim()||'';
 if(!output)return;
 output.replaceChildren();
 if(!/^\d+$/.test(version)){output.textContent='شناسه دقیق نسخه کارت را وارد کنید / Enter an exact numeric card version ID.';return}
 const quote=verifiedQuote(version,currentPlatform());
 if(!quote||quote.coins===null||!quote.checkedAt||!quote.sourceUrl){output.textContent='قیمت تازه و معتبر برای این نسخه و پلتفرم موجود نیست / No verified fresh quote.';return}
 const amount=document.createElement('strong');amount.textContent=quote.coins.toLocaleString('fa-IR')+' Coins';
 const stamp=document.createElement('span');stamp.textContent=' · بررسی: '+new Date(quote.checkedAt).toLocaleString('fa-IR');
 const source=document.createElement('a');source.href=quote.sourceUrl;source.rel='noopener noreferrer';source.target='_blank';source.className='fc-price-sourced';source.textContent=' · مشاهده منبع ↗';
 output.append(amount,stamp,source);
}
async function refreshPrices():Promise<void>{
 quotes.clear();
 snapshotStamp=null;
 try{
  const response=await fetch('./data/fc27-prices.json',{cache:'no-store'});
  if(!response.ok)throw new Error('No verified price snapshot');
  const data:PriceFeed=await response.json();
  if(!Array.isArray(data.prices))throw new Error('Invalid prices');
  snapshotStamp=typeof data.updated_at==='string'?data.updated_at:null;
  freshnessWindow=Number.isFinite(data.verification_window_minutes)&&data.verification_window_minutes>0?data.verification_window_minutes:45;
  for(const record of data.prices){
   if(!record||!/^\d+$/.test(String(record.versionId))||!platforms.has(record.platform))continue;
   const safe=validatedPrice(record,Date.now(),freshnessWindow);
   if(safe.status==='verified')quotes.set(safe.versionId+':'+safe.platform,safe);
  }
 }catch(error){freshnessWindow=720;console.warn('Price feed unavailable; market remains unquoted',error)}
 reportFeedState();
}
// The provider can be reachable yet every quote older than the verification window; both states mean
// "no price is shown", so the page says which one it is instead of leaving the gap unexplained.
function reportFeedState():void{
 const line=document.getElementById('fcPriceFeed');
 if(!line)return;
 if(quotes.size){line.textContent='منبع قیمت: '+quotes.size+' قیمت تأییدشدهٔ تازه'+(snapshotStamp?' · آخرین snapshot: '+new Date(snapshotStamp).toLocaleString('fa-IR'):'');return}
 line.textContent=snapshotStamp
  ? 'هیچ قیمت این snapshot تازه نیست (بررسیٔ آخرین: '+new Date(snapshotStamp).toLocaleString('fa-IR')+'؛ مجاز: '+freshnessWindow+' دقیقه). برای جلوگیری از نمایش قیمت ساخته‌شده، قیمتی نشان داده نمی‌شود.'
  : 'snapshot قیمتی در دسترس نیست؛ منبع تأییدشدهٔ قیمت برنگشت. برای جلوگیری از نمایش قیمت ساخته‌شده، قیمتی نشان داده نمی‌شود.';
}
export function setupVerifiedMarkets(onUpdate:()=>void):void{
 document.getElementById('fcPriceCheck')?.addEventListener('click',showVerifiedCardPrice);
 document.getElementById('fcPricePlatform')?.addEventListener('change',()=>{showVerifiedCardPrice();onUpdate()});
 void refreshPrices().then(onUpdate);
}
