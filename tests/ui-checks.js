/** Controller integration checks with a small DOM adapter. These do not replace visual browser QA. */
export async function runUIChecks(imports, appSource) {
  const report={assertions:0,journeys:[],visualBrowser:false};
  const assert=(value,message)=>{report.assertions++;if(!value)throw new Error(message);};
  const listeners={document:{},window:{}},elements=new Map(),local=new Map(),session=new Map();
  let document;
  class Element {
    constructor(selector){this.selector=selector;this.innerHTML='';this.textContent='';this.className='';this.disabled=false;this.open=false;this.value='';this.type='password';this.dataset={};this.attrs={};this.tagName='DIV';this.classList={contains:name=>this.className.split(' ').includes(name),add:name=>{if(!this.className.split(' ').includes(name))this.className+=' '+name;},remove:name=>{this.className=this.className.split(' ').filter(n=>n!==name).join(' ');}};}
    querySelector(selector){return element(this.selector+' '+selector);}
    querySelectorAll(){return [];}
    focus(){document.activeElement=this;}
    select(){}
    scrollIntoView(){}
    addEventListener(type,handler){this['on'+type]=handler;}
    showModal(){this.open=true;}
    close(){this.open=false;}
    getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100};}
    setAttribute(name,value){this.attrs[name]=value;}
    closest(){return this;}
  }
  function element(selector){if(!elements.has(selector))elements.set(selector,new Element(selector));return elements.get(selector);}
  document={querySelector:element,querySelectorAll:()=>[],addEventListener:(type,handler)=>{listeners.document[type]=handler;},activeElement:null,title:'',createElement:()=>new Element('created')};
  const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value))});
  const location={hash:'#/'};
  const env={document,window:{addEventListener:(type,handler)=>{listeners.window[type]=handler;},scrollTo(){}},location,localStorage:storage(local),sessionStorage:storage(session),setTimeout:()=>0,clearTimeout(){},navigator:{},matchMedia:()=>({matches:true})};
  const names=Object.keys(imports),values=Object.values(imports);
  const source=appSource.replace(/^import .*?;\s*$/gm,'');
  const app=new Function(...names,'env','const {document,window,location,localStorage,sessionStorage,setTimeout,clearTimeout,navigator,matchMedia}=env;\n'+source+'\nreturn {getState:()=>state,route,begin,choose,next,quiz,readProgress,home,intro,result,review,passport,roster,commitDraftIfValid};')(...values,env);
  const click=async(action,index)=>{const target=new Element('action');target.dataset={action,...(index!==undefined?{index:String(index)}:{})};listeners.document.click({target,preventDefault(){}});};
  assert(element('#main').innerHTML.includes('350'),'Homepage shows350 questions');
  assert((element('#main').innerHTML.match(/class="region-card"/g)||[]).length===7,'Homepage has seven selectable regions');
  for(const region of imports.REGIONS){
    location.hash='#/region/'+region.id;app.route();
    assert(element('#modal').open,region.id+': direct route gated');
    assert(app.getState().screen==='home',region.id+': no quiz before key');
    element('#region-key').value='WRONG';
    const form=new Element('key-form');form.id='key-form';
    await listeners.document.submit({target:form,preventDefault(){}});
    assert(element('#modal').open&&element('#key-error').textContent.length>0,region.id+': wrong key blocked');
    element('#region-key').value='TEST-'+region.id;
    await listeners.document.submit({target:form,preventDefault(){}});
    assert(!element('#modal').open&&app.getState().screen==='intro',region.id+': correct key opens intro');
    app.begin();
    const qs={...imports.QUESTIONS_WEST,...imports.QUESTIONS_EAST,...imports.QUESTIONS_NODKRAI}[region.id];
    let checkpoints=0;
    for(let i=0;i<50;i++){
      assert(app.getState().index===i&&app.getState().screen==='quiz',region.id+': question index '+i);
      const q=qs[i];
      if(q.type==='rank'){
        for(const choice of [0,1,2,3])app.choose(choice);
        assert(app.getState().draft.join(',')==='0,1,2,3',q.id+': rank assembled');
        await click('rank-up',2);
        assert(app.getState().draft.join(',')==='0,2,1,3',q.id+': rank moved');
      }else if(q.type==='multi'){
        app.choose(0);app.next();assert(app.getState().index===i,q.id+': incomplete multi cannot advance');
        app.choose(1);app.choose(2);assert(app.getState().draft.length===2,q.id+': multi limit');
      }else app.choose(q.type==='scale'?2:i%4);
      app.next();
      if(i<49&&(i+1)%10===0){assert(app.getState().screen==='checkpoint',q.id+': chapter checkpoint');checkpoints++;await click('continue');}
    }
    assert(checkpoints===4,region.id+': four interchapter screens');
    assert(app.getState().screen==='result',region.id+': 50answers reveal result');
    assert(app.getState().result.matches.every(m=>m.character.region===region.id),region.id+': result never crosses region');
    assert(element('#main').innerHTML.includes('你的六维心象'),region.id+': result contains six-axis explanation');
    assert(app.readProgress(region.id).complete,region.id+': completion persisted');
    app.route();app.begin();assert(app.getState().screen==='result',region.id+': saved result can reopen');
    app.review();assert(element('#modal').innerHTML.includes('回顾你的选择'),region.id+': review opens');
    await click('edit-answer',0);assert(app.getState().index===0&&app.getState().screen==='quiz',region.id+': review edit jumps to original question');
    app.choose(1);location.hash='#/';app.route();
    assert(app.readProgress(region.id).answers[0]===1,region.id+': map navigation preserves valid draft');
    report.journeys.push({id:region.id,questions:50,checkpoints,gate:true,complete:true});
  }
  assert(element('#passport-count').textContent==='7 / 7','All seven journeys recorded independently');
  const before=app.getState().screen;let prevented=false;
  element('.skip-link').onclick({preventDefault(){prevented=true;}});
  assert(prevented&&app.getState().screen===before,'Skip navigation does not change route');
  return report;
}
