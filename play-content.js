import {parse,evaluate,steps} from './logic.js';

export const discoveries = [
  ['Огонёк правды','1','Верно — это 1. Неверно — 0.'],
  ['Руна имени','X','Буква заменяет целую фразу.'],
  ['Перевёртыш','¬','НЕ меняет 0 на 1 и 1 на 0.'],
  ['Первая звезда','✦','Ты умеешь отличать правду от неправды.'],
  ['Двойной ключ','∧','Для И нужны две единицы.'],
  ['Развилка','∨','Для ИЛИ хватит одной единицы.'],
  ['Кристалл выбора','⊕','Разные значения → 1.'],
  ['Лунный ключ','↓','Пирс: сначала ИЛИ, потом НЕ.'],
  ['Печать обещания','→','Только 1 → 0 даёт ложь.'],
  ['Компас стрелок','→','Направление стрелки меняет смысл.'],
  ['Зеркальная руна','↔','Одинаковые значения → 1.'],
  ['Мостик мыслей','( )','Скобки считаем первыми.'],
  ['Четыре пути','▦','Для двух переменных — 4 набора.'],
  ['Следопыт','¬','Считай по одной операции.'],
  ['Восемь миров','8','Для трёх переменных — 8 наборов.'],
  ['Вечный свет','1','Тавтология истинна на всех наборах.'],
  ['Перо историй','∧','Слова «и», «или», «не» становятся знаками.'],
  ['Страж условия','→','«X только если Y» означает X → Y.'],
  ['Медаль Джо','Z','Сначала переведи маленькие фразы.'],
  ['Лупа истины','≠','Одна разная строка опровергает равносильность.'],
  ['Чары де Моргана','¬','НЕ над скобкой меняет И ↔ ИЛИ.'],
  ['Складной кристалл','≡','Укорачивай запись, сохраняя смысл.'],
  ['Ключ от тетради','≡','Большая формула — цепочка маленьких шагов.'],
  ['Сердце хранителя','✦','Смысл → шаги → проверка.']
];

const gates = [
  {kind:'wake',title:'Пс-с… Искра уснул!',action:'Разбуди его одним касанием.',rule:'«Искра проснулся»: правда → 1. Пока спит — 0.',formula:'X',initial:{X:0},target:1},
  {kind:'gate',title:'Одна буква — целая история',action:'Зажги X. Это короткое имя огонька.',rule:'X = 1: огонёк горит. X = 0: погас.',formula:'X',initial:{X:0},target:1},
  {kind:'gate',title:'Ворота наоборот',action:'Погаси X, чтобы открыть проход.',rule:'¬ — отрицание («не»). Меняет 0 и 1 местами.',formula:'¬X',initial:{X:1},target:1},
  {kind:'gate',title:'Два переворота!',action:'Зажги X. Что сделают два НЕ?',rule:'Два НЕ отменяют друг друга: ¬¬X = X.',formula:'¬¬X',initial:{X:0},target:1},
  {kind:'gate',title:'Ворота двух огоньков',action:'Для прохода зажги оба огонька.',rule:'∧ — конъюнкция («и»). Нужны оба огонька.',formula:'X ∧ Y',initial:{X:0,Y:0},target:1},
  {kind:'gate',title:'Выбирай любую тропинку',action:'Зажги хотя бы один огонёк.',rule:'∨ — дизъюнкция («или»). Можно один огонёк или оба!',formula:'X ∨ Y',initial:{X:0,Y:0},target:1},
  {kind:'gate',title:'Вдвоём не пролезем!',action:'Оставь включённым ровно один огонёк.',rule:'⊕ — исключающее ИЛИ: значения должны различаться.',formula:'X ⊕ Y',initial:{X:1,Y:1},target:1},
  {kind:'gate',title:'Тихо! Ворота спят',action:'Погаси оба огонька.',rule:'↓ — НЕ-ИЛИ. Проход открыт только при двух нулях.',formula:'X ↓ Y',initial:{X:1,Y:1},target:1},
  {kind:'gate',title:'Почини обещание',action:'X уже горит. Зажги и Y.',rule:'→ — импликация («если… то…»). Только 1 → 0 даёт 0.',formula:'X → Y',initial:{X:1,Y:0},target:1},
  {kind:'gate',title:'Стрелка смотрит назад',action:'Слева теперь Y. Сделай результат равным 0.',rule:'Y → X и X → Y — разные обещания.',formula:'Y → X',initial:{X:1,Y:0},target:0},
  {kind:'gate',title:'Зеркальные огоньки',action:'Сделай значения одинаковыми.',rule:'↔ — эквиваленция: совпало → 1.',formula:'X ↔ Y',initial:{X:1,Y:0},target:1},
  {kind:'gate',title:'Скобки открывают мост',action:'Получится ли 0? Найди такой набор.',rule:'Сначала X ∧ Y. Потом — стрелка к Z.',formula:'(X ∧ Y) → Z',initial:{X:0,Y:0,Z:0},target:0},
  {kind:'scan',title:'Поймай все четыре мира',action:'Переключай X и Y. Найди все сочетания.',rule:'Два огонька: 00, 01, 10, 11. Всего 4 набора.',formula:'X ∧ Y',initial:{X:0,Y:0},target:1},
  {kind:'gate',title:'Не держи всё в голове',action:'Найди набор, где получится 0.',rule:'Сначала ¬X, затем ИЛИ с Y.',formula:'¬X ∨ Y',initial:{X:0,Y:1},target:0},
  {kind:'scan',title:'Ого, восемь миров!',action:'Переключай три огонька. Собери 8 наборов.',rule:'Каждый новый огонёк удваивает число наборов.',formula:'(X ∧ Y) → Z',initial:{X:0,Y:0,Z:0},target:1},
  {kind:'scan',title:'Свет, который не гаснет',action:'Попробуй оба значения X.',rule:'X ∨ ¬X всегда равно 1. Это тавтология.',formula:'X ∨ ¬X',initial:{X:0},target:1},
  {kind:'spell',title:'Переведи язык драконов',action:'«Есть ключ И нет карты». Выбери заклинание.',rule:'X — ключ. Y — карта. «Нет» ставит НЕ перед Y.',choices:['X ∧ ¬Y','¬X ∧ Y','X ∨ Y'],answer:0},
  {kind:'spell',title:'Страж пропускает только с ключом',action:'«Приз только если есть ключ». Куда стрелка?',rule:'P — приз, K — ключ. Стрелка ведёт к необходимому условию.',choices:['K → P','P → K','P ↔ K'],answer:1},
  {kind:'spell',title:'Джо потерял приз',action:'Z — «Джо получит приз». А если не получит?',rule:'Отрицай нужную фразу: поставь ¬ перед её буквой.',choices:['¬X','¬Y','¬Z'],answer:2},
  {kind:'compare',title:'Найди трещину в зеркале',action:'Переключай огоньки: получи разные ответы.',rule:'Один разный ответ — уже контрпример.',formula:'X ∧ Y',other:'X ∨ Y',initial:{X:0,Y:0}},
  {kind:'spell',title:'Сними заклятие НЕ',action:'Во что превратится ¬(X ∧ Y)?',rule:'Меняем И на ИЛИ и отрицаем обе части.',choices:['¬X ∧ ¬Y','¬X ∨ ¬Y','X ∨ Y'],answer:1},
  {kind:'spell',title:'Упакуй заклинание',action:'X ∨ (X ∧ Y) можно записать одной буквой.',rule:'Если X = 1, всё равно 1. Если X = 0, всё равно 0.',choices:['X','Y','Z'],answer:0},
  {kind:'spell',title:'Тетрадь больше не страшная',action:'Сними НЕ со скобки: ¬(Y ∧ ¬Z).',rule:'И превращается в ИЛИ. Двойное НЕ исчезает.',choices:['¬Y ∧ Z','Y ∨ ¬Z','¬Y ∨ Z'],answer:2},
  {kind:'gate',title:'Последние ворота',action:'Открой проход. Формула уже тебе знакома.',rule:'Сначала скобки, затем ИЛИ. По одному шагу.',formula:'¬Y ∨ (¬X ∧ Z)',initial:{X:1,Y:1,Z:0},target:1}
];
export function introFor(lesson){return gates[Number(lesson.id.slice(1))-1];}
export function newIntro(lesson){const intro=introFor(lesson),env={...intro.initial};return {env,moves:0,seen:intro.formula?[Object.values(env).join('')]:[],picked:null,solved:false};}
export function introComplete(lesson,state){const cfg=introFor(lesson);if(!state||state.moves<1)return false;if(cfg.kind==='spell')return state.picked===cfg.answer;if(cfg.kind==='scan')return new Set(state.seen).size===2**Object.keys(state.env).length;if(cfg.kind==='compare')return evaluate(parse(cfg.formula),state.env)!==evaluate(parse(cfg.other),state.env);return evaluate(parse(cfg.formula),state.env)===cfg.target;}
export function moveIntro(lesson,state,key){const cfg=introFor(lesson),next={...state,env:{...state.env},seen:[...state.seen],moves:state.moves+1};if(cfg.kind==='spell'){if(!Number.isInteger(key)||!cfg.choices[key])throw Error('Неизвестное заклинание');next.picked=key;}else{if(!Object.hasOwn(next.env,key))throw Error('Неизвестный огонёк');next.env[key]=1-next.env[key];next.seen=[...new Set([...next.seen,Object.values(next.env).join('')])];}next.solved=state.solved||introComplete(lesson,next);return next;}
export function briefFeedback(q,good,full){if(q.formula&&q.env){const tree=parse(q.formula),a=steps(tree).at(-1);if(a){const left=evaluate(a.a,q.env),right=a.b?evaluate(a.b,q.env):null,result=evaluate(a,q.env);const rules={'¬':'НЕ переворачивает значение.','∧':'Для И нужны две единицы.','∨':'Для ИЛИ хватит одной единицы.','⊕':'Разные значения дают 1.','→':'Только 1 → 0 даёт 0.','↔':'Одинаковые значения дают 1.','↑':'Это И, а затем НЕ.','↓':'Это ИЛИ, а затем НЕ.'};return `${right===null?'¬'+left:left+' '+a.op+' '+right} = ${result}. ${rules[a.op]}`;}}if(q.kind==='table'&&good)return 'Все миры на месте. Ты собрал таблицу истинности!';if(q.kind==='formula'&&good)return 'Твоё заклинание работает на всех наборах.';const sentence=String(full||q.why).split(/(?<=[.!?])\s+/)[0];return sentence.length<=175?sentence:sentence.slice(0,172)+'…';}
export function spellTiles(q){const pieces=[...new Set(q.expected?.match(/[A-Z01¬∧∨→↔⊕()]/g)||[])];return pieces.sort((a,b)=>'XYZ¬∧∨→↔⊕()01'.indexOf(a)-'XYZ¬∧∨→↔⊕()01'.indexOf(b));}
export function tableRow(q,values){return q.table.rows.findIndex((_,i)=>values[i]===undefined);}
export function evaluateTableMove(q,values,value){if(value!==0&&value!==1)throw Error('Выбери 0 или 1');const index=tableRow(q,values);if(index===-1)return {done:true,good:true,index};const row=q.table.rows[index];return {index,good:row.result===value,expected:row.result,env:row.env,done:index===q.table.rows.length-1&&row.result===value};}
export function discoveryFor(lesson){const [name,symbol,rule]=discoveries[Number(lesson.id.slice(1))-1];return {name,symbol,rule};}

export function restoreDraft(q,draft={}){
  const tableValues={};
  if(q.kind==='table'){
    for(let i=0;i<q.table.rows.length;i++){
      if(draft.tableValues?.[i]!==q.table.rows[i].result)break;
      tableValues[i]=draft.tableValues[i];
    }
  }
  const selection=q.kind==='choice'&&Number.isInteger(draft.selection)&&draft.selection>=0&&draft.selection<q.options.length?draft.selection:null;
  const formulaValue=typeof draft.formulaValue==='string'?draft.formulaValue.slice(0,200):'';
  const feedback=q.kind==='table'&&Object.keys(tableValues).length===q.table.rows.length?{good:true,text:q.why}:null;
  return {selection,tableValues,formulaValue,feedback};
}

export function questionContext(q,lesson){
  const story=lesson.id==='l17'?{X:'есть ключ',Y:'есть карта'}:['l18','l19'].includes(lesson.id)?{X:'Джо умён',Y:'Джим глуп',Z:'Джо получит приз'}:null;
  let ask=q.ask;
  if(story&&ask.startsWith('X —'))ask=ask.slice(ask.indexOf('. ')+2);
  const formula=q.formula||(lesson.id==='l23'&&q===lesson.questions[0]?'¬((X ∧ Y) ∨ (Y ∧ ¬Z))':'');
  const clue=q.ask.includes('высказыванием')?'Высказывание можно проверить: правда это или нет.':q.formula?.includes('↑')?'↑ — штрих Шеффера: сначала И, затем НЕ.':'';
  return {story,ask,formula,clue};
}
