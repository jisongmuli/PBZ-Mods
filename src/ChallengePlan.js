"use strict";
const {multiplier}=require('./ReplayMath');
const MAX_BOSSES=5;
function addBoss(selection,id,catalog){
 if(selection.length>=MAX_BOSSES||!catalog.some(x=>x.id===id))return false;
 selection.push(id);return true;
}
function removeBoss(selection,index){
 if(!Number.isInteger(index)||index<0||index>=selection.length)return false;
 selection.splice(index,1);return true;
}
function snapshot(selection,catalog,chosen,musicEnabled){
 if(!selection.length||selection.length>MAX_BOSSES)throw Error('Select 1 to 5 bosses');
 const multipliers=Object.freeze({health:multiplier(chosen.health),shachi:multiplier(chosen.shachi),damage:multiplier(chosen.damage??1)});
 const entries=selection.map((id,index)=>{
  const boss=catalog.find(x=>x.id===id);if(!boss)throw Error('Unknown boss '+id);
  return Object.freeze({index,boss});
 });
 return Object.freeze({entries:Object.freeze(entries),multipliers,musicEnabled:!!musicEnabled,musicBoss:entries[0].boss,damageFactor:0.5*multipliers.damage});
}
function formation(center,yaw,count,radius=100){
 if(!Number.isInteger(count)||count<1||count>MAX_BOSSES)throw Error('Invalid boss count');
 if(count===1)return [{...center}];
 const spread=Math.min(1900,Math.max(700,(Math.max(0,radius)+150)/Math.sin(Math.PI/count)));
 return Array.from({length:count},(_,i)=>{
  const a=(yaw+360*i/count)*Math.PI/180;
  return {X:center.X+Math.cos(a)*spread,Y:center.Y+Math.sin(a)*spread,Z:center.Z};
 });
}
module.exports={MAX_BOSSES,addBoss,removeBoss,snapshot,formation};
