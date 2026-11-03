"use strict";
class ActivePlayClock {
 constructor(){this.now=0;this.world=null;this.last=null;}
 update(world,time){if(this.world===world&&this.last!==null&&time>=this.last)this.now+=time-this.last;this.world=world;this.last=time;return this.now;}
}
// Input edges drive individual native actions. No automatic combo playback.
class BossComboController {
 constructor(port,profile){this.port=port;this.profile=profile;this.slots=profile.defaultSlots.slice();this.cooldowns=new Map();this.reset();}
 reset(){this.current=null;this.pending=null;this.step=0;this.lastAction=null;this.lastEnd=-Infinity;this.lastError=null;}
 request(kind,value){
  if(this.pending)return false;
  if(kind==='slot'&&(!Number.isInteger(value)||value<0||value>=this.slots.length))return false;
  if(!['light','heavy','slot','dodge'].includes(kind))return false;
  this.pending={kind,value};return true;
 }
 choose(input,now){
  let id,step=0;
  if(input.kind==='light'){
   step=now-this.lastEnd>1.5&&!this.current?1:(this.step%this.profile.chain.length)+1;id=this.profile.chain[step-1];
  }else if(input.kind==='heavy')id=this.profile.heavyBranches[this.lastAction==='heavy'?'heavy':String(this.step)]||this.profile.heavy;
  else if(input.kind==='slot')id=this.slots[input.value];
  else id=this.profile.dodge[input.value]||this.profile.dodge.B;
  if(!this.profile.abilities[id])throw Error('Unknown native action '+id);
  return {id,step,kind:input.kind};
 }
 tick(now){
  if(this.current&&!this.port.isRunning(this.current.token)){
   this.lastEnd=now;this.current=null;
  }
  if(!this.pending)return;
  const choice=this.choose(this.pending,now),description=this.profile.abilities[choice.id];
  if((this.cooldowns.get(choice.id)||0)>now){this.pending=null;return;}
  if(this.current){
   const age=now-this.current.started,source=this.profile.abilities[this.current.id];
   // Follow authored native combo windows; skills keep their whole commitment.
   const canChain=this.pending.kind!=='slot'&&this.current.kind!=='slot'&&age>=source.comboAt&&age<=source.comboEnd;
   if(!canChain)return;
  }
  const token=this.port.activate(description,!!this.current);
  if(!token)return;
  this.pending=null;this.current={...choice,token,started:now};this.lastAction=choice.kind;this.step=choice.step;
  if(choice.kind==='slot')this.cooldowns.set(choice.id,now+this.port.cooldown(description));
 }
 assign(slot,id){if(!Number.isInteger(slot)||slot<0||slot>=4||!this.profile.skills.includes(id))return false;this.slots[slot]=id;return true;}
 status(now){return {step:this.step,current:this.current?.id||null,pending:this.pending?{...this.pending}:null,slots:this.slots.slice(),cooldowns:Object.fromEntries([...this.cooldowns].filter(([,end])=>end>now).map(([id,end])=>[id,Math.ceil(end-now)]))};}
}
module.exports={BossComboController,ActivePlayClock};
