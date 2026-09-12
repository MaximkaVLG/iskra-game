import {parse,evaluate,format,steps,OPS,compare} from './logic.js';
import {lessons} from './course.js';

export const CUPS=[
  {id:'embers',name:'Кубок огоньков',symbol:'✦',after:0,topic:'Истина и ложь'},
  {id:'mirror',name:'Зеркальный кубок',symbol:'¬',after:4,topic:'Волшебное НЕ'},
  {id:'forest',name:'Лесной кубок',symbol:'∧',after:8,topic:'И, ИЛИ и два ключа'},
  {id:'bridge',name:'Небесный кубок',symbol:'→',after:12,topic:'Обещания и связки'},
  {id:'master',name:'Кубок хранителя',symbol:'≡',after:24,topic:'Равносильность формул'}
];
export const RIVALS=[{name:'Мох',score:60,tone:'moss'},{name:'Иней',score:90,tone:'frost'},{name:'Уголёк',score:115,tone:'ember'}];
export const RACE_LENGTH=10;
export const MAX_SCORE=130;
export function seededRandom(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
export function readChallenge(hash){const match=/^#challenge=([a-z]+)\.(\d+)\.(\d+)$/.exec(hash);if(!match)return null;const [,cupId,seedValue,scoreValue]=match,seed=Number(seedValue),score=Number(scoreValue);return CUPS.some(c=>c.id===cupId)&&Number.isInteger(seed)&&seed>=0&&seed<=4294967295&&Number.isInteger(score)&&score>=0&&score<=MAX_SCORE?{cupId,seed,score}:null;}
export function cupUnlocked(cup,completed){return lessons.slice(0,cup.after).every(l=>completed[l.id]);}
export function weekKey(now=new Date()){const d=new Date(now);d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function emptyArena(){return {best:{},week:weekKey(),weekly:{},runs:0,wins:0};}
export function validateArena(value){const a=emptyArena();if(!value)return a;for(const name of ['best','weekly'])for(const cup of CUPS){const v=value[name]?.[cup.id];if(Number.isInteger(v)&&v>=0&&v<=MAX_SCORE)a[name][cup.id]=v;}if(/^\d{4}-\d{2}-\d{2}$/.test(value.week))a.week=value.week;else a.weekly={};for(const key of ['runs','wins'])if(Number.isInteger(value[key])&&value[key]>=0)a[key]=Math.min(value[key],1e6);a.wins=Math.min(a.runs,a.wins);return a;}
export function weeklyScores(arena,now=new Date()){return arena?.week===weekKey(now)?arena.weekly||{}:{};}
export function medal(score){return score>=115?'🥇':score>=90?'🥈':score>=60?'🥉':'✧';}
export function racePlace(score,completed=RACE_LENGTH){return 1+RIVALS.filter(r=>Math.round(r.score*completed/RACE_LENGTH)>score).length;}
export function awardAnswer(race,hadError){const chain=hadError?0:race.chain+1,gained=hadError?4:10+Math.min(6,Math.floor(chain/3)*2);return {...race,chain,score:race.score+gained,bestChain:Math.max(race.bestChain,chain),gained};}
export function recordRace(arena,cupId,score,now=new Date()){
  if(!CUPS.some(c=>c.id===cupId)||!Number.isInteger(score)||score<0||score>MAX_SCORE)throw Error('Некорректный результат гонки.');
  const a=validateArena(arena),weekly={...weeklyScores(a,now)},previous=a.best[cupId]||0,weekPrevious=weekly[cupId]||0;
  weekly[cupId]=Math.max(weekPrevious,score);
  return {arena:{...a,best:{...a.best,[cupId]:Math.max(previous,score)},weekly,week:weekKey(now),runs:a.runs+1,wins:a.wins+(score>=115?1:0)},record:score>previous,weekRecord:score>weekPrevious};
}
const choose=(items,random)=>items[Math.floor(random()*items.length)];
function calculation(formula,env,lessonId){const tree=parse(formula),nodes=steps(tree);return {lessonId,kind:'choice',ask:'Зажжётся ли огонёк?',formula,env,options:['0 — ложь','1 — истина'],answer:evaluate(tree,env),why:nodes.map(n=>`${format(n)} = ${evaluate(n,env)}. ${OPS[n.op].rule}`).join(' '),hint:OPS[nodes[0]?.op]?.rule||'1 — истина, 0 — ложь.'};}
function basics(random,index){
  if(index%3===0){const q=choose(lessons[0].questions,random);return {...q,lessonId:'l1'};}
  const a=2+Math.floor(random()*8),b=1+Math.floor(random()*7),trueAnswer=random()<.5;
  const sum=a+b+(trueAnswer?0:choose([-2,-1,1,2],random));
  return {lessonId:'l1',kind:'choice',ask:`«${a} + ${b} = ${sum}». Правда?`,options:['0 — ложь','1 — истина'],answer:Number(trueAnswer),why:`${a} + ${b} = ${a+b}. Фраза ${trueAnswer?'верная — это истина, 1':'неверная — это ложь, 0'}.`,hint:'Проверь сумму. Верное утверждение — 1, неверное — 0.'};
}
export function createRace(cupId,random=Math.random){
  const level=CUPS.findIndex(c=>c.id===cupId);if(level<0)throw Error('Кубок не найден.');
  const queue=Array.from({length:RACE_LENGTH},(_,i)=>{
    if(level===0)return basics(random,i);
    const X=random()<.5?0:1,Y=random()<.5?0:1;
    if(level===1)return calculation(choose(['¬X','¬¬X'],random),{X},'l3');
    if(level===2){const op=choose(['∧','∨','⊕','↑','↓'],random);return calculation(`X ${op} Y`,{X,Y},{'∧':'l5','∨':'l6','⊕':'l7','↑':'l8','↓':'l8'}[op]);}
    if(level===3)return calculation(choose(['X → Y','X ↔ Y','(¬X ∨ Y) ∧ X','¬(X ∧ Y)','(X ⊕ Y) → X','X ∨ (¬X ∧ Y)'],random),{X,Y},'l12');
    const pairs=[['¬(X ∧ Y)','¬X ∨ ¬Y'],['¬(X ∨ Y)','¬X ∧ ¬Y'],['X → Y','¬X ∨ Y'],['X ∨ (X ∧ Y)','X'],['¬((X ∧ Y) ∨ (Y ∧ ¬Z))','¬Y ∨ (¬X ∧ Z)']];
    const [left,right]=choose(pairs,random),other=random()<.5?right:`¬(${right})`,same=compare(left,other).equivalent;
    return {lessonId:'l24',kind:'choice',ask:'Эти заклинания всегда дают одно и то же?',formula:left,comparison:other,options:['Да, равносильны','Нет, отличаются'],answer:same?0:1,why:same?`${left} ≡ ${other}. Значения совпадают на каждом наборе.`:(()=>{const c=compare(left,other).counterexample;return `${Object.entries(c.env).map(([k,v])=>`${k} = ${v}`).join(', ')}: первая формула даёт ${c.left}, вторая — ${c.right}. Одного различия достаточно.`;})(),hint:'Ищи набор, где результаты различаются. Или примени закон преобразования.'};
  });
  return {mode:'arena',cupId,index:0,errors:[],queue,score:0,chain:0,bestChain:0,gained:0};
}
