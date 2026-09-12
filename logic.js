export const OPS = {
  '¬': {name:'Отрицание',read:'не',rule:'Меняет значение на противоположное: 0 становится 1, а 1 — 0.'},
  '∧': {name:'Конъюнкция',read:'и',rule:'Истина только тогда, когда обе части истинны.'},
  '∨': {name:'Дизъюнкция',read:'или',rule:'Истина, если хотя бы одна часть истинна. Обе тоже могут быть истинны.'},
  '⊕': {name:'Исключающее ИЛИ',read:'либо одно, либо другое',rule:'Истина, если значения различаются. Два истинных дают ложь.'},
  '→': {name:'Импликация',read:'если… то…',rule:'Ложна только в случае 1 → 0: условие выполнено, а следствие — нет.'},
  '↔': {name:'Эквиваленция',read:'тогда и только тогда',rule:'Истина, если обе части имеют одинаковое значение.'},
  '↑': {name:'Штрих Шеффера',read:'не И',rule:'Отрицание конъюнкции: ¬(X ∧ Y). Ложь только при двух единицах.'},
  '↓': {name:'Стрелка Пирса',read:'не ИЛИ',rule:'Отрицание дизъюнкции: ¬(X ∨ Y). Истина только при двух нулях.'}
};
const precedence = {'↔':1,'→':2,'∨':3,'⊕':3,'↓':3,'∧':4,'↑':4};
export function parse(source) {
  if(typeof source !== 'string' || source.length > 200) throw Error('Формула должна быть короче 200 символов.');
  const s=source.toUpperCase().replaceAll('<->','↔').replaceAll('=>','→').replaceAll('->','→').replaceAll('!','¬').replaceAll('~','¬').replaceAll('&','∧').replaceAll('|','∨').replaceAll('^','⊕').replaceAll('≡','↔').replace(/\s/g,'');
  if(!s) throw Error('Введите формулу, например X ∧ ¬Y.');
  const tokens=[...s]; let i=0;
  function atom(){const t=tokens[i++];if(t==='¬') return {op:t,a:atom()};if(t==='('){const n=expr(1);if(tokens[i++]!==')')throw Error('Не хватает закрывающей скобки.');return n;}if(/[A-Z01]/.test(t??'') && t?.length===1)return {value:t};throw Error(t?`Здесь не ожидается «${t}». Используйте X, Y, Z и логические значки.`:'Формула не закончена. После знака нужна переменная или скобка.');}
  function expr(min){let left=atom();while(precedence[tokens[i]]>=min){const op=tokens[i++];const right=expr(precedence[op]+(op==='→'?0:1));left={op,a:left,b:right};}return left;}
  const tree=expr(1);if(i!==tokens.length)throw Error(`Между частями нужен знак операции. Проверьте «${tokens[i]}».`);
  if(variables(tree).length>3)throw Error('Для наглядного разбора используйте не больше трёх разных переменных.');return tree;
}
export function variables(tree){const found=new Set();function walk(n){if(n.value && !/^[01]$/.test(n.value))found.add(n.value);if(n.a)walk(n.a);if(n.b)walk(n.b);}walk(tree);return [...found].sort();}
export function evaluate(n,env={}){if(n.value!==undefined){if(n.value==='0'||n.value==='1')return Number(n.value);if(env[n.value]!==0&&env[n.value]!==1)throw Error(`Нет значения ${n.value}.`);return env[n.value];}const a=evaluate(n.a,env);if(n.op==='¬')return 1-a;const b=evaluate(n.b,env);return Number({'∧':a&&b,'∨':a||b,'⊕':a!==b,'→':!a||b,'↔':a===b,'↑':!(a&&b),'↓':!(a||b)}[n.op]);}
export function format(n){if(n.value!==undefined)return n.value;if(n.op==='¬')return `¬${n.a.value!==undefined||n.a.op==='¬'?format(n.a):`(${format(n.a)})`}`;return `${n.a.value!==undefined||n.a.op==='¬'?format(n.a):`(${format(n.a)})`} ${n.op} ${n.b.value!==undefined||n.b.op==='¬'?format(n.b):`(${format(n.b)})`}`;}
export function steps(tree){const list=[];const seen=new Set();function walk(n){if(n.a)walk(n.a);if(n.b)walk(n.b);if(n.op){const f=format(n);if(!seen.has(f)){list.push(n);seen.add(f);}}}walk(tree);return list;}
export function assignments(vars){return Array.from({length:2**vars.length},(_,i)=>Object.fromEntries(vars.map((v,j)=>[v,(i>>(vars.length-j-1))&1])));}
export function truthTable(source){const tree=parse(source),vars=variables(tree),columns=steps(tree);return {vars,columns:columns.map(format),rows:assignments(vars).map(env=>({env,values:columns.map(c=>evaluate(c,env)),result:evaluate(tree,env)}))};}
export function compare(a,b){const left=parse(a),right=parse(b),vars=[...new Set([...variables(left),...variables(right)])].sort();if(vars.length>3)throw Error('Сравнивайте формулы с общим набором не более трёх переменных.');const rows=assignments(vars).map(env=>({env,left:evaluate(left,env),right:evaluate(right,env)}));return {equivalent:rows.every(r=>r.left===r.right),vars,rows,counterexample:rows.find(r=>r.left!==r.right)};}
