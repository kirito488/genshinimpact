// Each question observes one explicit behavior preference. No object/symbol-to-personality proxies.
export const QUESTION_AXES = ['social','care','order','drive','curiosity','autonomy'];
const TYPES = ['scene','choice','scale','scene','multi','choice','scene','scale','rank','choice'];
const AXES = [0,2,5,1,4,3,0,2,1,5,4,3,0,1,2,5,3,4,0,2,1,5,3,4,0,2,5,1,4,3,2,0,1,5,3,4,2,0,5,1,3,4,2,0,1,5,4,3,2,1];
const ORDERS = [[0,2,1,3],[2,0,3,1],[1,3,0,2],[3,1,2,0]];
const FREQUENCY = ['几乎不会','偶尔会','大约一半时候会','多数时候会','几乎每次都会'];
export function buildRegionQuestions(region, rows, seed) {
  if(rows.length!==50)throw new Error(`${region}: expected 50 authored scenarios`);
  return rows.map((row,index)=>{
    const [context,prompt,answers]=row,axis=AXES[index],type=TYPES[index%10];
    const vector=value=>QUESTION_AXES.map((_,d)=>d===axis?value:0);
    let options;
    if(type==='scale'){
      if(answers!==1&&answers!==-1)throw new Error(`${region}-${index}: scale direction`);
      options=FREQUENCY.map((text,i)=>({text,scores:vector((i-2)*answers)}));
    }else{
      if(!Array.isArray(answers)||answers.length!==4)throw new Error(`${region}-${index}: four direct answers required`);
      const authored=answers.map((text,i)=>({text,scores:vector([2,1,-1,-2][i])}));
      options=ORDERS[(index+seed)%ORDERS.length].map(i=>authored[i]);
    }
    return {id:`${region}-${String(index+1).padStart(2,'0')}`,type,measure:QUESTION_AXES[axis],scene:context,prompt,options};
  });
}
