import {expeditionSteps} from './expeditions.js';
export const HOME_TIERS=[
  {name:'Гнездо у дерева',cost:0,bond:0},
  {name:'Уютное гнездо',cost:60,bond:40},
  {name:'Дом с характером',cost:120,bond:90},
  {name:'Веранда для друзей',cost:240,bond:160},
  {name:'Дом мечты',cost:420,bond:260}
];
export const DECORATIONS=[
  {id:'lantern',name:'Светлячки в банке',price:20,icon:'✺',description:'Коснись фонаря — светлячки проснутся.'},
  {id:'cushion',name:'Облачная подушка',price:30,icon:'☁',description:'Коснись подушки — Искра уютно свернётся.'},
  {id:'chimes',name:'Музыка ветра',price:45,icon:'♫',description:'Коснись подвески — она закачается.'}
];
export const BOND_LEVELS=[{at:0,name:'Знакомимся',next:'Первое «дай пять»'},{at:12,name:'Свои',next:'Уютное гнездо'},{at:40,name:'Напарники',next:'Дом с характером'},{at:90,name:'Друзья',next:'Веранда для друзей'},{at:160,name:'Одна команда',next:'Дом мечты'},{at:260,name:'Неразлучные',next:'Новые общие воспоминания'}];
const int=(v,fallback=0,max=1e6)=>Number.isInteger(v)&&v>=0?Math.min(v,max):fallback;
export function freshIsland(completed=0){return {version:1,shells:Math.min(completed*10,240),rations:2,favoriteMeals:0,pet:{name:'Искра',bond:Math.min(completed*8,90),appetite:1,care:{meal:false,play:false}},home:{tier:0,owned:[],equipped:[]},stories:{},runs:0,lastReward:0,active:null,lastResult:null};}
export function bondLevel(bond){const index=BOND_LEVELS.findLastIndex(l=>bond>=l.at);return {...BOND_LEVELS[Math.max(0,index)],ceiling:BOND_LEVELS[index+1]?.at||null};}
export function validateIsland(value,completed=0){
  if(!value||value.version!==1)return freshIsland(completed);
  const s=freshIsland();
  s.shells=int(value.shells);s.rations=int(value.rations);s.favoriteMeals=int(value.favoriteMeals);
  s.pet.name=typeof value.pet?.name==='string'&&value.pet.name.trim()?value.pet.name.trim().slice(0,20):'Искра';
  s.pet.bond=int(value.pet?.bond);s.pet.appetite=int(value.pet?.appetite,1,3);
  s.pet.care={meal:value.pet?.care?.meal===true,play:value.pet?.care?.play===true};
  s.home.tier=int(value.home?.tier,0,4);
  const ids=DECORATIONS.map(d=>d.id);
  s.home.owned=[...new Set(Array.isArray(value.home?.owned)?value.home.owned.filter(id=>ids.includes(id)):[])];
  s.home.equipped=[...new Set(Array.isArray(value.home?.equipped)?value.home.equipped.filter(id=>s.home.owned.includes(id)):[])];
  for(const id of ['nest','lights','picnic'])if(value.stories?.[id]===true)s.stories[id]=true;
  s.runs=int(value.runs);s.lastReward=int(value.lastReward,0,s.runs);
  const a=value.active;
  if(a&&['nest','lights','picnic'].includes(a.storyId)&&Number.isInteger(a.id)&&a.id>s.lastReward&&a.id<=s.runs&&Number.isInteger(a.seed)&&a.seed>=0&&a.seed<=4294967295&&Number.isInteger(a.step)&&a.step>=0&&a.step<=5){
    const defaults=expeditionSteps(a.storyId,a.seed)[a.step]?.env||{};
    s.active={id:a.id,storyId:a.storyId,seed:a.seed,step:a.step,passed:a.passed===true,errors:int(a.errors),env:Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,[0,1].includes(a.env?.[k])?a.env[k]:v])),choice:Number.isInteger(a.choice)&&a.choice>=0&&a.choice<=4?a.choice:null,feedback:['wrong','good'].includes(a.feedback)?a.feedback:null};
  }
  const r=value.lastResult;
  if(r&&r.id===s.lastReward&&['nest','lights','picnic'].includes(r.storyId))s.lastResult={id:r.id,storyId:r.storyId,shells:r.first===true?30:20,xp:r.first===true?20:10,first:r.first===true};
  return s;
}
export function feedPet(island,favorite=false){
  if(!island.pet.appetite)return {ok:false,message:'Я уже сыт. Оставим на потом!'};
  const key=favorite?'favoriteMeals':'rations';
  if(!island[key])return {ok:false,message:favorite?'Сначала приготовим лепёшку.':'Порция ждёт в следующем приключении.'};
  island[key]--;island.pet.appetite--;
  const gained=island.pet.care.meal?0:favorite?3:2;
  island.pet.bond+=gained;island.pet.care.meal=true;
  return {ok:true,gained,message:favorite?'М-м… моя любимая лепёшка!':'Спасибо! Теперь можно играть.'};
}
export function playPet(island){const gained=island.pet.care.play?0:2;island.pet.bond+=gained;island.pet.care.play=true;return {ok:true,gained,message:'Лови! А теперь обратно мне!'};}
export function rewardPetLearning(island){
  island.shells+=20;island.rations++;island.pet.bond+=8;
  island.pet.appetite=Math.min(3,island.pet.appetite+1);island.pet.care={meal:false,play:false};
  return {shells:20,rations:1,bond:8};
}
export function buyFavorite(island){
  if(!island.stories.picnic)return {ok:false,message:'Рецепт найдём в «Ягодном пикнике».'};
  if(island.shells<6)return {ok:false,message:'Для лепёшки нужно 6 ракушек.'};
  island.shells-=6;island.favoriteMeals++;return {ok:true,message:'Ягодная лепёшка готова!'};
}
export function buyDecoration(island,id){
  const d=DECORATIONS.find(d=>d.id===id);if(!d)return {ok:false,message:'Предмет не найден.'};
  if(island.home.owned.includes(id))return {ok:false,message:'Этот предмет уже твой.'};
  if(island.shells<d.price)return {ok:false,message:`Нужно ещё ${d.price-island.shells} ракушек.`};
  island.shells-=d.price;island.home.owned.push(id);island.home.equipped.push(id);return {ok:true,message:d.description};
}
export function toggleDecoration(island,id){if(!island.home.owned.includes(id))return false;island.home.equipped=island.home.equipped.includes(id)?island.home.equipped.filter(x=>x!==id):[...island.home.equipped,id];return true;}
export function upgradeHome(island){
  const next=HOME_TIERS[island.home.tier+1];if(!next)return {ok:false,message:'Дом мечты уже готов.'};
  if(island.shells<next.cost||island.pet.bond<next.bond)return {ok:false,message:`Нужно ${next.cost} ракушек и ${next.bond} дружбы.`};
  island.shells-=next.cost;island.home.tier++;return {ok:true,message:`${next.name}: обновление готово!`};
}
