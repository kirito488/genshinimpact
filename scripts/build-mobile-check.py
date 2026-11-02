"""Create an owner-only phone-width review harness from the bundled real application.
The harness is written outside the source folder and is not part of the deployed app.
"""
from pathlib import Path
import json
import re

root=Path(__file__).resolve().parents[1]
preview=root.parent/'提瓦特心途-本地预览.html'
fixture=json.loads((root/'tests/mobile-result-fixture.json').read_text(encoding='utf-8'))
html=preview.read_text(encoding='utf-8')
# Synthetic review must never overwrite the owner's answers.
html=re.sub(r'\blocalStorage\b','qaLocalStorage',html)
html=re.sub(r'\bsessionStorage\b','qaSessionStorage',html)
storage='const qaMemoryStorage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};};const qaLocalStorage=qaMemoryStorage(),qaSessionStorage=qaMemoryStorage();'
html=html.replace('"use strict";', '"use strict";'+storage,1)
hook=r'''
function qaMeasure(view) {
  const visible=element=>{const rect=element.getBoundingClientRect();const css=getComputedStyle(element);return rect.width>0&&rect.height>0&&css.visibility!=='hidden'&&css.display!=='none';};
  const scope=modal.open?modal:document.body;
  const controls=[...scope.querySelectorAll('button:not(:disabled),input,a')].filter(visible);
  const smallTargets=controls.map(element=>({text:(element.getAttribute('aria-label')||element.textContent||element.tagName).trim().slice(0,35),rect:element.getBoundingClientRect()})).filter(({rect})=>rect.width<43.5||rect.height<43.5).map(({text,rect})=>({text,width:Math.round(rect.width),height:Math.round(rect.height)}));
  const width=document.documentElement.clientWidth;
  const scrollWidth=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);
  parent.postMessage({source:'teyvat-mobile-qa',view,width,scrollWidth,overflow:scrollWidth>width+1,smallTargets},'*');
}
function qaShow(view) {
  if(modal.open)modal.close();
  state.region=getRegion('inazuma');
  state.answers=Array(50).fill(null);state.index=0;state.draft=null;
  if(view==='home'){state.region=null;home();}
  else if(view==='gate'){home();state.region=getRegion('nodkrai');gate(state.region);}
  else if(view==='intro')intro();
  else if(view==='result'){
    state.answers=__LONG_ANSWERS__;
    result();
  }else{
    state.index=QUESTIONS[state.region.id].findIndex(q=>q.type===view);quiz();
    if(view==='rank')for(const index of [0,1,2,3])choose(index);
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>qaMeasure(view)));
}
window.addEventListener('message',event=>{if(event.source===parent&&event.data?.source==='teyvat-mobile-qa-control')qaShow(event.data.view);});
window.addEventListener('resize',()=>requestAnimationFrame(()=>qaMeasure(state.screen==='quiz'?currentQuestion().type:state.screen)));
'''
hook=hook.replace('__LONG_ANSWERS__',json.dumps(fixture['answers']))
assert html.count('\n})();</script>')==1
html=html.replace('\n})();</script>','\n'+hook+'\n})();</script>')
payload=json.dumps(html,ensure_ascii=False).replace('</',r'<\/')
shell=r'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>提瓦特心途 · 手机适配检查</title>
<style>body{margin:0;padding:24px;background:#e9eee9;color:#1b3540;font:14px/1.8 system-ui,'Microsoft YaHei',sans-serif}h1{margin:0 0 8px;font-size:25px}p{margin:0 0 18px;color:#4e656e}.toolbar{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:18px 0}select,button{font:inherit;padding:10px;min-height:44px;border:1px solid #9db2b5;border-radius:5px;background:white;color:#18313d}button{cursor:pointer;background:#d7bd86}#status{padding:12px 16px;border:1px solid #aac0b8;border-radius:5px;background:#fff;margin-bottom:18px}#viewport{max-width:100%;overflow:auto;padding:8px 0}iframe{display:block;width:390px;height:850px;border:4px solid #435d66;border-radius:14px;box-sizing:content-box;background:#111f2b}table{border-collapse:collapse;background:white;margin:20px 0;width:100%;max-width:850px}th,td{padding:9px 12px;text-align:left;border:1px solid #c7d2ce;font-size:12px}.pass{color:#24664e}.fail{color:#ac412e}small{font-size:12px;color:#54717a}.summary{max-width:850px}</style>
<h1>手机尺寸预览与检查</h1><p class="summary">使用真实页面，在所选 CSS 视口宽度中检查布局。可以预览各类题目与结果页；合成测试答案保存在临时内存，不会覆盖你的答题记录。这是浏览器尺寸检查，不等同于 iOS／Android 实机测试。</p>
<div class="toolbar"><label>屏幕宽度 <select id="width"><option>320</option><option>360</option><option selected>390</option><option>414</option><option>600</option><option>768</option><option>850</option></select></label><label>查看界面 <select id="view"><option value="home">地区首页</option><option value="gate">密钥弹窗</option><option value="intro">地区介绍与头像</option><option value="choice">单选题</option><option value="scale">五档倾向题</option><option value="multi">双选题</option><option value="rank">已填排序题</option><option value="result">角色结果与长姓名</option></select></label><button id="run">检查全部 56 种组合</button></div>
<div id="status" role="status">正在加载预览…</div><div id="viewport"><iframe id="phone" title="手机尺寸的真实网站预览"></iframe></div>
<table hidden id="results"><thead><tr><th>宽度</th><th>界面</th><th>横向溢出</th><th>小于44px的触区</th></tr></thead><tbody></tbody></table>
<script>
const source=__PAYLOAD__;
const frame=document.querySelector('#phone'),width=document.querySelector('#width'),view=document.querySelector('#view'),status=document.querySelector('#status');
let queue=[],running=false,current;
const labels={home:'地区首页',gate:'密钥弹窗',intro:'地区介绍',choice:'单选题',scale:'五档倾向',multi:'双选题',rank:'已填排序',result:'角色结果'};
function show(){frame.style.width=width.value+'px';frame.contentWindow.postMessage({source:'teyvat-mobile-qa-control',view:view.value},'*');}
function next(){if(!queue.length){running=false;document.querySelector('#run').disabled=false;status.textContent='批量尺寸检查结束；请结合下表及预览画面审阅。';return;}current=queue.shift();width.value=String(current.width);view.value=current.view;show();}
window.addEventListener('message',event=>{
  const data=event.data;if(event.source!==frame.contentWindow||data?.source!=='teyvat-mobile-qa')return;
  const small=data.width<=600?data.smallTargets:[];
  status.textContent=`${data.width}px · ${labels[data.view]||data.view}：${data.overflow?'发现横向溢出':'未发现横向溢出'}；${small.length?small.length+' 个较小触区':'主要控件触区符合检查阈值'}。`;
  if(running&&current&&data.width===current.width&&data.view===current.view){
    const row=document.createElement('tr');row.className=data.overflow||small.length?'fail':'pass';
    for(const text of [data.width,labels[data.view],data.overflow?`${data.scrollWidth}px，超出视口`:'无',small.length?small.map(t=>`${t.text} ${t.width}×${t.height}`).join('；'):'无']){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}
    document.querySelector('tbody').append(row);current=null;setTimeout(next,80);
  }
});
width.addEventListener('change',show);view.addEventListener('change',show);
document.querySelector('#run').onclick=()=>{queue=[320,360,390,414,600,768,850].flatMap(width=>Object.keys(labels).map(view=>({width,view})));running=true;document.querySelector('#results').hidden=false;document.querySelector('tbody').textContent='';document.querySelector('#run').disabled=true;next();};
frame.onload=show;frame.srcdoc=source;
</script></html>'''
output=root.parent/'手机适配检查.html'
output.write_text(shell.replace('__PAYLOAD__',payload),encoding='utf-8')
print('Mobile-width browser review harness generated outside the production source folder.')
