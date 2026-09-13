import {parse,evaluate,steps,OPS} from './logic.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function writeNode(node,words=false){
  if(node.value!==undefined)return node.value;
  const part=n=>n.value!==undefined||n.op==='¬'?writeNode(n,words):`(${writeNode(n,words)})`;
  if(node.op==='¬')return `${words?'НЕ':'¬'} ${node.a.value!==undefined?writeNode(node.a,words):`(${writeNode(node.a,words)})`}`;
  const names={'∧':'И','∨':'ИЛИ','⊕':'либо… либо','→':'→','↔':'↔','↑':'НЕ-И','↓':'НЕ-ИЛИ'};
  return `${part(node.a)} ${words?names[node.op]:node.op} ${part(node.b)}`;
}
export function displayFormula(formula){return writeNode(parse(formula));}
export function readFormula(formula){return writeNode(parse(formula),true);}
export function mathMarkup(formula){
  const tree=parse(formula),text=writeNode(tree),singleLine=steps(tree).length<=2&&text.length<=16;
  return `<span class="math-expression${singleLine?' math-single-line':''}" role="math" aria-label="${escape(readFormula(formula))}">${text.split(/(¬ [A-Z01]|[¬∧∨⊕→↔↑↓])/).map(t=>/^¬ [A-Z01]$/.test(t)?`<span class="math-atom"><span class="math-op" aria-hidden="true">¬</span> ${t.at(-1)}</span>`:OPS[t]?`<span class="math-op" aria-hidden="true">${t}</span>`:escape(t)).join('')}</span>`;
}
export function operatorGuide(formula){
  const tree=parse(formula),symbols=[...new Set(steps(tree).map(n=>n.op))];
  if(!symbols.length)return '';
  if(tree.op==='¬'&&tree.a.op==='¬')return '<div class="operator-guide"><span class="math-symbol">¬</span><span><strong>НЕ</strong> переворачивает значение.<br>Здесь два НЕ — переверни дважды.</span></div>';
  const short={'¬':'0 становится 1, а 1 становится 0.','∧':'нужны две единицы.','∨':'хватит одной единицы.','⊕':'разные значения дают 1.','→':'только 1 → 0 даёт 0.','↔':'одинаковые значения дают 1.','↑':'сначала И, затем НЕ.','↓':'сначала ИЛИ, затем НЕ.'};
  if(symbols.length===1)return `<div class="operator-guide"><span><strong>${escape(OPS[tree.op].read.toUpperCase())}:</strong> ${short[tree.op]}</span></div>`;
  return `<div class="operator-guide">${symbols.map(s=>`<span class="operator-pair"><b class="math-symbol">${s}</b><span>${escape(OPS[s].read.toUpperCase())}</span></span>`).join('')}</div>`;
}
export function formulaPanel(formula,{env=null,reveal=false,comparison=null}={}){
  const value=reveal&&env?evaluate(parse(formula),env):null;
  const numeric=reveal&&env?formula.replace(/[A-Z]/g,k=>String(env[k])):null;
  return `<div class="formula-panel ${formula.length>18?'long-formula':''}">${comparison?`<div class="compare-formulas"><div>${mathMarkup(formula)}</div><span class="compare-label">и</span><div>${mathMarkup(comparison)}</div></div>`:`<div class="formula-main">${mathMarkup(formula)}${value!==null?`<span class="math-result">= <b>${value}</b></span>`:''}</div>`}${numeric&&numeric!==formula?`<div class="numeric-substitution">Подставили: ${mathMarkup(numeric)} = <strong>${value}</strong></div>`:''}${value!==null?`<span class="result-meaning">Результат ${value} — ${value?'истина':'ложь'}</span>`:formula.length<=16?`<p class="formula-reading">${escape(readFormula(formula))}</p>`:''}</div>`;
}
export function calculationExplanation(formula,env){
  return steps(parse(formula)).map(n=>({formula:writeNode(n),numeric:n.op==='¬'?`¬ ${evaluate(n.a,env)}`:`${evaluate(n.a,env)} ${n.op} ${evaluate(n.b,env)}`,value:evaluate(n,env),read:OPS[n.op].read.toUpperCase()}));
}
export function renderCalculation(formula,env){
  const calculations=calculationExplanation(formula,env);
  return calculations.length?`<ol class="answer-steps">${calculations.map(n=>`<li><span>${mathMarkup(n.numeric)} = <b>${n.value}</b></span></li>`).join('')}</ol>`:'';
}
