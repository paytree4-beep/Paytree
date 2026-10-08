import { chromium } from 'playwright-core';
import fs from 'fs';
const F='node_modules/@fontsource';const b=p=>fs.readFileSync(p).toString('base64');
const logo=b('logo-mark.png');
const font=`@font-face{font-family:PJS;font-weight:400 800;src:url(data:font/woff2;base64,${b(F+'/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2')})}
@font-face{font-family:IS;src:url(data:font/woff2;base64,${b(F+'/instrument-serif/files/instrument-serif-latin-400-normal.woff2')})}`;
const page=(inner)=>`<style>${font}body{margin:0;width:1920px;height:1080px;background:#FAF5EA;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;font-family:PJS;color:#064E3B;text-align:center}
img{width:150px}.w{font-weight:700;font-size:44px}.h{font-family:IS;font-size:112px;line-height:1.05;text-transform:uppercase}.g{background:linear-gradient(90deg,#86600F,#B8893A,#86600F);-webkit-background-clip:text;color:transparent}.s{font-size:30px;font-weight:600;color:#1A3326}</style>${inner}`;
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const pg=await br.newPage({viewport:{width:1920,height:1080}});
const L=`<img src="data:image/png;base64,${logo}">`;
await pg.setContent(page(`${L}<div class="w">PayTree</div><div class="h">All your payment methods.<br><span class="g">One simple link.</span></div>`));await pg.waitForTimeout(500);await pg.screenshot({path:'c_intro.png'});
await pg.setContent(page(`${L}<div class="w">PayTree</div><div class="h" style="font-size:96px">7 days free · No card needed</div><div class="s">paytree.to</div>`));await pg.waitForTimeout(500);await pg.screenshot({path:'c_outro.png'});
await br.close();
