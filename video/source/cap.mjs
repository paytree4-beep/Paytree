import { chromium } from 'playwright-core';
import fs from 'fs';
const F='node_modules/@fontsource';
const b64=p=>fs.readFileSync(p).toString('base64');
const css=`
@font-face{font-family:PJS;font-weight:400;src:url(data:font/woff2;base64,${b64(F+'/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2')})}
@font-face{font-family:PJS;font-weight:500;src:url(data:font/woff2;base64,${b64(F+'/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2')})}
@font-face{font-family:PJS;font-weight:600;src:url(data:font/woff2;base64,${b64(F+'/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2')})}
@font-face{font-family:PJS;font-weight:700 800;src:url(data:font/woff2;base64,${b64(F+'/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2')})}
@font-face{font-family:IS;font-weight:400;src:url(data:font/woff2;base64,${b64(F+'/instrument-serif/files/instrument-serif-latin-400-normal.woff2')})}
html{--font-sans:PJS,system-ui,sans-serif !important;--font-serif:IS,Georgia,serif !important}
nextjs-portal{display:none !important}
.pt-bob,.pt-marquee,.pt-shine{animation-play-state:paused !important}
`;
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const pg=await br.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
await pg.goto('http://localhost:3100/',{waitUntil:'networkidle'});
await pg.addStyleTag({content:css});
await pg.evaluate(()=>document.fonts.ready);
// trigger reveal animations
const H=await pg.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<H;y+=400){await pg.evaluate(y=>scrollTo(0,y),y);await pg.waitForTimeout(250);}
await pg.evaluate(()=>scrollTo(0,0));await pg.waitForTimeout(800);
await pg.screenshot({path:'hero.png'});
const shot=async(sel,name,pad=0)=>{const e=pg.locator(sel).first();await e.scrollIntoViewIfNeeded();await pg.waitForTimeout(900);await e.screenshot({path:name+'.png'});};
await shot('#example','phone');
await shot('section[aria-label="Supported payment methods"]','strip');
await shot('#features','features');
await shot('#pricing','pricing');
await shot('#signup','cta');
await pg.locator('header').first().screenshot({path:'nav.png'});
await pg.locator('img[src*="logo-mark"]').first().screenshot({path:'logomark.png',omitBackground:true}).catch(()=>{});
await br.close();
