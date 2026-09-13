import {parse,evaluate} from './logic.js';
export const STORIES=[
  {id:'nest',title:'Спасти гнездо',subtitle:'Почини мост и верни свет домой.',icon:'⌂',reward:'Гнездо снова цело',after:null},
  {id:'lights',title:'Ночь светлячков',subtitle:'Проведи светлячков через лес.',icon:'✺',reward:'Светлячки поселились у дерева',after:'nest'},
  {id:'picnic',title:'Ягодный пикник',subtitle:'Собери рецепт любимой лепёшки.',icon:'❀',reward:'Открыт рецепт ягодной лепёшки',after:'lights'}
];
export const storyUnlocked=(island,id)=>{const s=STORIES.find(s=>s.id===id);return !!s&&(!s.after||!!island.stories[s.after]);};
export function expeditionSteps(storyId,seed=0){
  const variant=(seed>>>0)%2,night=storyId==='lights',picnic=storyId==='picnic';
  const flip=variant,gateFormula=night?'X ∨ Y':'X ∧ Y',gateStart=night?{X:0,Y:0}:{X:0,Y:1};
  const encounters=[
    {kind:'switch',scene:'gate',title:night?'Зажги хотя бы один фонарь':picnic?'Открой ягодную калитку':'Почини вход на мост',goal:night?'Поставь 1 хотя бы на одном переключателе.':'Оба переключателя должны быть включены.',formula:gateFormula,rule:night?'∨ — ИЛИ. Хватит одной единицы.':'∧ — И. Нужны две единицы.',env:gateStart,target:1,success:night?'Фонари зажглись!':'Проход открыт!',hint:night?'Нажми X: 0 станет 1.':'Нажми X: тогда X = 1 и Y = 1.'},
    {kind:'repair',scene:'lamp',title:'Искра перепутал значение',goal:'Нажми на неверный шаг.',formula:'¬ X',rule:'¬ — НЕ. Меняет 0 на 1, а 1 на 0.',env:{X:flip},lines:[`X = ${flip}`,`¬ X = ${flip}`],answer:1,success:'Ошибка найдена. Фонарь исправлен!',hint:`Первый шаг верен: X = ${flip}. НЕ должно дать ${1-flip}.`,repair:`НЕ переворачивает ${flip} в ${1-flip}. Правильно: ¬ ${flip} = ${1-flip}.`},
    {kind:'rune',scene:'rune',title:night?'Верни руну светлячкам':picnic?'Собери правило рецепта':'Вставь руну в замок',goal:'Выбери знак, который подходит обоим примерам.',formula:null,rule:'∧ — И: нужны обе 1. ∨ — ИЛИ: хватит одной 1.',cases:variant?[{X:1,Y:0,result:1},{X:0,Y:1,result:1}]:[{X:1,Y:0,result:0},{X:1,Y:1,result:1}],options:['∧','∨'],answer:variant?1:0,success:'Руна подошла!',hint:variant?'В каждом примере одна единица уже даёт 1. Это ИЛИ.':'В первом примере одна единица не помогла. Нужны обе — это И.'},
    {kind:'route',scene:'bridge',title:night?'Выбери тропу для светлячков':picnic?'Найди путь к ягодам':'По какому мосту пройти?',goal:'Нужен путь с результатом 1.',formula:null,rule:'И ждёт две единицы. ИЛИ достаточно одной.',env:{X:variant,Y:1-variant},options:variant?['X ∨ Y','X ∧ Y']:['X ∧ Y','X ∨ Y'],answer:variant?0:1,success:'Мы на другом берегу!',hint:'Здесь одна 1 и один 0. Открыта тропа с ИЛИ.'},
    {kind:'switch',scene:'home',title:night?'Зажги маяк у дома':picnic?'Открой корзинку для пикника':'Последний замок гнезда',goal:'Собери значения, при которых результат 1.',formula:'¬ X ∧ Y',rule:'Сначала НЕ X, затем И с Y.',env:{X:1,Y:0},target:1,success:night?'Светлячки нашли дом!':picnic?'Пикник удался!':'Гнездо спасено!',hint:'Поставь X = 0 и Y = 1. Тогда НЕ X = 1, а 1 И 1 = 1.'}
  ];
  if(picnic){
    encounters[0]={...encounters[0],title:'Собери корзинку',goal:'Добавь ягоды и возьми корзинку.',labels:{X:'Ягоды',Y:'Корзинка'}};
    encounters[1]={...encounters[1],title:'Искра забыл про мёд',formula:'X ∨ Y',env:{X:0,Y:1},lines:['X = 0, Y = 1','X ∨ Y = 0'],rule:'∨ — ИЛИ. Даже одной единицы достаточно.',hint:'В корзинке есть мёд: Y = 1. Для ИЛИ этого хватит.',repair:'Одной единицы достаточно. Правильно: 0 ∨ 1 = 1.',stepLabel:'Применяем ИЛИ'};
    encounters[4]={...encounters[4],scene:'recipe',title:'Приготовь угощение',goal:'Добавь ягоды или мёд. Убери испорченный плод.',formula:'(X ∨ Y) ∧ ¬ Z',env:{X:0,Y:0,Z:1},labels:{X:'Ягоды',Y:'Мёд',Z:'Испорчен'},rule:'1 — продукт есть, 0 — его нет. Сначала ИЛИ в скобках, потом НЕ Z, затем И.',hint:'Включи ягоды (X = 1) и убери испорченный плод (Z = 0). Получится (1 ИЛИ 0) И НЕ 0 = 1.'};
  }
  if(night){
    encounters[0].labels={X:'Левый',Y:'Правый'};
    encounters[4]={...encounters[4],title:'Настрой ночной маяк',goal:'Выключи дневной режим X и включи маяк Y.',labels:{X:'День',Y:'Маяк'}};
  }
  return encounters.map(q=>({...q,night}));
}
export function beginExpedition(island,id,seed){
  if(island.active)return island.active;
  if(!storyUnlocked(island,id))return null;
  island.runs++;const steps=expeditionSteps(id,seed);
  island.active={id:island.runs,storyId:id,seed:seed>>>0,step:0,passed:false,errors:0,env:{...steps[0].env},choice:null,feedback:null};return island.active;
}
export function currentEncounter(island){const a=island.active;return a?expeditionSteps(a.storyId,a.seed)[a.step]||null:null;}
export function toggleExpeditionValue(island,key){const a=island.active,q=currentEncounter(island);if(!a||a.passed||a.feedback==='wrong'||q?.kind!=='switch'||!Object.hasOwn(q.env,key))return false;a.env[key]=1-a.env[key];return true;}
export function answerEncounter(island,choice=null){
  const a=island.active,q=currentEncounter(island);if(!a||!q||a.passed||a.feedback==='wrong')return null;
  let good=false;
  if(q.kind==='switch')good=evaluate(parse(q.formula),a.env)===q.target;
  else {if(!Number.isInteger(choice)||choice<0||choice>=(q.options||q.lines).length)return null;a.choice=choice;good=choice===q.answer;}
  a.feedback=good?'good':'wrong';a.passed=good;if(!good)a.errors++;return good;
}
export function retryEncounter(island){const a=island.active;if(!a||a.passed)return false;a.feedback=null;a.choice=null;return true;}
export function advanceEncounter(island){
  const a=island.active;if(!a?.passed||a.step>=5)return false;
  a.step++;a.passed=false;a.feedback=null;a.choice=null;
  const q=currentEncounter(island);a.env={...(q?.env||{})};return true;
}
export function finishExpedition(island){
  const a=island.active;if(!a||a.step!==5||a.id<=island.lastReward)return null;
  const first=!island.stories[a.storyId],shells=first?30:20,xp=first?20:10;
  island.shells+=shells;island.rations++;island.pet.bond+=8;island.pet.appetite=Math.min(3,island.pet.appetite+1);island.pet.care={meal:false,play:false};
  island.stories[a.storyId]=true;island.lastReward=a.id;
  const reward={id:a.id,storyId:a.storyId,first,shells,xp};island.lastResult=reward;island.active=null;return reward;
}
