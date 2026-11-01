/** Dependency-free acceptance checks, runnable in Node or a standards-compatible JS engine. */
export function runChecks(lib) {
  const {REGIONS,CHARACTERS,QUESTIONS,scoreAnswers,questionBounds,possibleAnswers,isValidAnswer,matchCharacters,matchingReasons,restoreProgress,DATA_VERSION} = lib;
  const report={assertions:0,regions:[],characters:CHARACTERS.length,questions:0};
  const assert=(value,message)=>{report.assertions++;if(!value)throw new Error(message);};
  const ids=new Set(), prompts=new Set(), characterIds=new Set();
  assert(REGIONS.length===7,'Exactly seven regions');
  assert(REGIONS.at(-1).id==='nodkrai','Seventh region must be Nod-Krai');
  assert(!REGIONS.some(r=>r.id==='snezhnaya'),'No Snezhnaya entrance');
  assert(new Set(REGIONS.map(r=>r.keyHash)).size===7,'Keys must be independent');
  for(const r of REGIONS){
    assert(/^[a-f0-9]{64}$/.test(r.keyHash),`${r.id}: key hash`);
    assert(r.chapters.length===5,`${r.id}: five chapters`);
    const qs=QUESTIONS[r.id],pool=CHARACTERS.filter(c=>c.region===r.id);
    assert(qs?.length===50,`${r.id}: exactly50 questions`);
    assert(pool.length>=9,`${r.id}: broad roster`);
    const coverage=Array(6).fill(0),typeCounts={};
    qs.forEach((q,i)=>{
      assert(q.id===`${r.id}-${String(i+1).padStart(2,'0')}`,`${q.id}: sequential stable ID`);
      assert(!ids.has(q.id),`Duplicate question ID ${q.id}`);ids.add(q.id);
      const fullPrompt=(q.scene||'')+'|'+q.prompt;
      assert(!prompts.has(fullPrompt),`Duplicate full question: ${q.prompt}`);prompts.add(fullPrompt);
      assert(['choice','scene','scale','multi','rank'].includes(q.type),`${q.id}: known type`);
      const dimensions=['social','care','order','drive','curiosity','autonomy'];
      assert(dimensions.includes(q.measure),`${q.id}: explicit observed behavior`);
      assert(!/最像哪|你更像|选择两句|寄语|留言/.test(q.prompt),`${q.id}: no symbolic personality proxy`);
      typeCounts[q.type]=(typeCounts[q.type]||0)+1;
      assert(q.prompt.length+(q.scene||'').length>=10,`${q.id}: real authored scenario`);
      assert(q.options.length===(q.type==='scale'?5:4),`${q.id}: option count`);
      assert(new Set(q.options.map(o=>o.text)).size===q.options.length,`${q.id}: distinct options`);
      for(const option of q.options){
        assert(typeof option.text==='string'&&option.text.length>0,`${q.id}: option label`);
        assert(option.scores.length===6&&option.scores.every(n=>Number.isFinite(n)&&n>=-2&&n<=2),`${q.id}: valid six-axis option`);
        assert(option.scores.every((n,d)=>n===0||d===dimensions.indexOf(q.measure)),`${q.id}: no unrelated trait inference`);
      }
      let informative=0;
      questionBounds(q).forEach(({min,max},d)=>{if(min<0&&max>0){informative++;coverage[d]++;}});
      assert(informative>0,`${q.id}: every question must contribute evidence`);
      assert(!isValidAnswer(q,null),`${q.id}: null rejected`);
      assert(!isValidAnswer(q,99),`${q.id}: out of range rejected`);
      if(q.type==='multi'||q.type==='rank')assert(!isValidAnswer(q,[0,0]),`${q.id}: duplicate choices rejected`);
      for(const answer of possibleAnswers(q))assert(isValidAnswer(q,answer),`${q.id}: possible answer valid`);
    });
    assert(coverage.every(n=>n>=8),`${r.id}: at least8 direct behavior questions per dimension (${coverage})`);
    assert(Object.keys(typeCounts).length===5,`${r.id}: all five types`);
    const answers=qs.map(q=>possibleAnswers(q)[0]);
    const scored=scoreAnswers(qs,answers);
    assert(scored.completed===50,`${r.id}: complete scored`);
    assert(scored.vector.every(n=>Number.isFinite(n)&&n>=-1&&n<=1),`${r.id}: finite normalized scores`);
    const ranking=matchCharacters(r.id,scored.vector,CHARACTERS);
    assert(ranking.length===pool.length&&ranking.every(m=>m.character.region===r.id),`${r.id}: strict region isolation`);
    assert(ranking.every(m=>m.resonance>=0&&m.resonance<=100),`${r.id}: bounded resonance`);
    assert(JSON.stringify(ranking)===JSON.stringify(matchCharacters(r.id,scored.vector,CHARACTERS)),`${r.id}: deterministic matching`);
    const partial=[...answers];partial[23]=null;
    let threw=false;try{scoreAnswers(qs,partial);}catch{threw=true;}
    assert(threw,`${r.id}: incomplete result blocked`);
    assert(scoreAnswers(qs,partial,{requireComplete:false}).completed===49,`${r.id}: partial count`);
    const validSave={version:DATA_VERSION,region:r.id,answers,index:49};
    assert(restoreProgress(validSave,r.id,qs)?.complete,`${r.id}: result survives reload`);
    assert(restoreProgress({...validSave,answers:partial},r.id,qs)?.index===23,`${r.id}: restore first unanswered safely`);
    assert(restoreProgress({...validSave,version:-1},r.id,qs)===null,`${r.id}: stale version rejected`);
    assert(restoreProgress({...validSave,region:'wrong'},r.id,qs)===null,`${r.id}: other-region save rejected`);
    assert(restoreProgress({...validSave,index:-5},r.id,qs)?.index===49,`${r.id}: corrupt index repaired`);
    for(let sample=0;sample<120;sample++){
      const generated=qs.map((q,i)=>{const options=possibleAnswers(q);return options[(sample*13+i*7+(sample>>2))%options.length];});
      const v=scoreAnswers(qs,generated).vector;
      assert(v.every(x=>Number.isFinite(x)&&Math.abs(x)<=1),`${r.id}: simulated scores`);
      assert(matchCharacters(r.id,v,CHARACTERS)[0].character.region===r.id,`${r.id}: simulated result isolation`);
    }
    report.regions.push({id:r.id,questions:qs.length,characters:pool.length,typeCounts,coverage});
    report.questions+=qs.length;
  }
  for(const c of CHARACTERS){
    assert(!characterIds.has(c.id),`Duplicate character ${c.id}`);characterIds.add(c.id);
    assert(REGIONS.some(r=>r.id===c.region),`${c.id}: supported region`);
    assert(c.traits.length===6&&c.traits.every(v=>Number.isFinite(v)&&Math.abs(v)<=1),`${c.id}: trait vector`);
    assert(c.tags.length===3&&new Set(c.tags).size===3,`${c.id}: three tags`);
    for(const field of ['name','title','description','strength','growth','affiliation','source'])assert(typeof c[field]==='string'&&c[field].length>0,`${c.id}: ${field}`);
    assert(/^https:\/\//.test(c.source),`${c.id}: attributed source`);
    assert(matchCharacters(c.region,c.traits,CHARACTERS)[0].character.id===c.id,`${c.id}: unique nearest profile`);
    for(const reason of matchingReasons(c.traits,c))assert(reason.user*reason.trait>0,`${c.id}: explanation direction`);
  }
  const sparse={id:'neutral-fixture',type:'choice',options:[{text:'a',scores:[2,0,0,0,0,0]},{text:'b',scores:[0,0,0,0,0,0]},{text:'c',scores:[0,0,0,0,0,0]},{text:'d',scores:[0,0,0,0,0,0]}]};
  assert(scoreAnswers([sparse],[1]).vector[0]===0,'Unmeasured neutral must not become opposite trait');
  const bipolar={...sparse,options:[...sparse.options.slice(0,3),{text:'d',scores:[-2,0,0,0,0,0]}]};
  assert(scoreAnswers([bipolar],[0]).vector[0]===1,'Positive endpoint');
  assert(scoreAnswers([bipolar],[3]).vector[0]===-1,'Negative endpoint');
  assert(scoreAnswers([bipolar],[1]).vector[0]===0,'Bipolar neutral remains neutral');
  const ranking={id:'rank-fixture',type:'rank',options:[{text:'a',scores:[2,0,0,0,0,0]},{text:'b',scores:[1,0,0,0,0,0]},{text:'c',scores:[-1,0,0,0,0,0]},{text:'d',scores:[-2,0,0,0,0,0]}]};
  assert(scoreAnswers([ranking],[[0,1,2,3]]).vector[0]===-scoreAnswers([ranking],[[3,2,1,0]]).vector[0],'Rank reversal flips direction');
  assert(report.questions===350,'Exactly350 questions total');
  return report;
}
