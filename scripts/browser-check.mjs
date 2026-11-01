import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,webkit} from 'playwright';
import {REGIONS} from '../data/regions.js';
import {INAZUMA_QUESTIONS} from '../data/questions/inazuma.js';
import {DATA_VERSION} from '../engine.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='http://127.0.0.1:4173';
const output=path.join(root,'artifacts');
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[path.join(root,'scripts/serve.js')],{cwd:path.join(root,'dist'),stdio:['ignore','pipe','pipe']});
let serverLog='';server.stdout.on('data',chunk=>serverLog+=chunk);server.stderr.on('data',chunk=>serverLog+=chunk);
const report={browsers:[],layouts:[],realDevice:false};
const fixture=JSON.parse(await readFile(path.join(root,'tests/mobile-result-fixture.json'),'utf8'));
const region=REGIONS.find(r=>r.id==='inazuma');
async function inspect(page,browser,width,screen){
  const result=await page.evaluate(()=>{
    const viewport=document.documentElement.clientWidth;
    const scope=document.querySelector('dialog[open]')||document.body;
    const targets=[...scope.querySelectorAll('button:not(:disabled),a,input')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&r.bottom>=0&&s.display!=='none'&&s.visibility!=='hidden';});
    return {viewport,scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),small:targets.map(el=>({label:(el.getAttribute('aria-label')||el.textContent||el.tagName).trim().slice(0,30),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})).filter(r=>r.width<43.5||r.height<43.5)};
  });
  assert.ok(result.scrollWidth<=result.viewport+1,`${browser}/${width}/${screen}: horizontal overflow ${JSON.stringify(result)}`);
  if(width<=600)assert.equal(result.small.length,0,`${browser}/${width}/${screen}: undersized touch targets ${JSON.stringify(result.small)}`);
  report.layouts.push({browser,width,screen,overflow:false,touchChecked:width<=600});
}
async function answer(page,q){
  const choices=q.type==='rank'?[0,1,2,3]:q.type==='multi'?[0,1]:[q.type==='scale'?2:0];
  for(const index of choices)await page.locator(`#answer-options [data-action="choose"][data-index="${index}"]`).click();
}
try{
  let ready=false;
  for(let attempt=0;attempt<40;attempt++){try{if((await fetch(origin)).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
  assert.ok(ready,'Local browser-test server did not start: '+serverLog);
  for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await type.launch({headless:true});
    try{
      for(const width of [320,360,390,414,600,768,850]){
        const context=await browser.newContext({viewport:{width,height:850},isMobile:width<=600,hasTouch:width<=600});
        const page=await context.newPage();page.setDefaultTimeout(15000);
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
        await page.addInitScript(({id,keyHash})=>sessionStorage.setItem('teyvat-unlock-'+id,keyHash),region);
        try{
          await page.goto(origin);
          await page.locator('.region-card').first().waitFor();
          assert.equal(await page.locator('.region-card').count(),7);
          await inspect(page,name,width,'home');
          if(width===390)await page.screenshot({path:path.join(output,name+'-portrait-home.png'),fullPage:true});
          await page.goto(origin+'/#/region/nodkrai');
          await page.locator('#region-key').waitFor();
          await inspect(page,name,width,'key-gate');
          if(width===390){
            await page.locator('#region-key').fill('NOT-A-VALID-KEY');
            await page.locator('#key-form [type="submit"]').click();
            await page.waitForFunction(()=>document.querySelector('#key-error')?.textContent.length>0);
            assert.equal(await page.locator('#question-title').count(),0,'Wrong key opened quiz');
          }
          await page.goto(origin+'/#/region/inazuma');
          await page.locator('[data-action="start"]').waitFor();
          await inspect(page,name,width,'region-intro');
          await page.locator('[data-action="start"]').click();
          const seen=new Set(),count=width===390?50:10;
          for(let index=0;index<count;index++){
            const q=INAZUMA_QUESTIONS[index];
            await page.locator('#question-title').waitFor();
            await answer(page,q);
            if(!seen.has(q.type)){
              await inspect(page,name,width,q.type);seen.add(q.type);
              if(width===390&&q.type==='rank')await page.screenshot({path:path.join(output,name+'-portrait-rank.png'),fullPage:true});
            }
            await page.locator('[data-action="next"]').click();
            if((index+1)%10===0&&index<49){await page.locator('.checkpoint').waitFor();await inspect(page,name,width,'chapter-'+((index+1)/10));await page.locator('[data-action="continue"]').click();}
          }
          if(count===50){await page.locator('.result-page').waitFor();await inspect(page,name,width,'complete-journey');}
          await page.locator('a.brand').click();
          await page.locator('.region-card').first().waitFor();
          await page.evaluate(({fixture,version})=>localStorage.setItem(`teyvat-journey-v${version}-${fixture.region}`,JSON.stringify({version,region:fixture.region,answers:fixture.answers,index:49})),{fixture,version:DATA_VERSION});
          await page.goto(origin+'/#/region/inazuma');
          // A fragment-only navigation keeps the app's in-memory progress cache.
          // Reload so this synthetic saved-result fixture is read as a new visit.
          await page.reload();
          await page.locator('[data-action="start"]').click();
          await page.locator('.character-identity h2').waitFor();
          assert.equal(await page.locator('.character-identity h2').textContent(),fixture.name,'Result name does not match the validated answer fixture');
          await inspect(page,name,width,'long-name-result');
          if(width===390)await page.screenshot({path:path.join(output,name+'-portrait-result.png'),fullPage:true});
          assert.deepEqual(errors,[],`${name}/${width}: browser script errors`);
        }catch(error){await page.screenshot({path:path.join(output,`${name}-${width}-failure.png`),fullPage:true}).catch(()=>{});throw error;}
        finally{await context.close();}
      }
      report.browsers.push(name);
    }finally{await browser.close();}
  }
  await writeFile(path.join(output,'browser-check.json'),JSON.stringify(report,null,2));
  console.log(`Browser checks passed: ${report.browsers.join(', ')}, ${report.layouts.length} layouts, seven widths, full portrait journeys.`);
}finally{server.kill();}

