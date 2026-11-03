"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const math=require('../src/ReplayMath');
function fixture(){
 const base={Health_Max:30000,Health:30000,Shachi_Max:1000,Shachi:1000,Health_Min:0},effects=new Map(),player={Health_Max:850,Attack:100,Amplification_Physical:0};let serial=0,missing=false;
 const asc={MakeEffectContext:()=>({}),BP_ApplyGameplayEffectSpecToSelf(spec){const h={id:++serial};effects.set(h.id,spec);return h;},RemoveActiveGameplayEffect(h){effects.delete(h.id);}};
 const actor={};function read(a,n){if(a!==actor)return player[n];let v=base[n];for(const fx of effects.values())if(fx.name===n)v=fx.op===3?fx.value:v*fx.value;return v;}
 const UE={KismetSystemLibrary:{IsValid:x=>!!x},EGameplayModOp:{Override:3,Multiplicitive:1},BasicAttributeSet:{StaticClass:()=>({})},
  PBZBlueprintFunctionLibrary:{MakeAttribute:n=>n,GetAttributeFromCharacter:read},AbilitySystemBlueprintLibrary:{GetAbilitySystemComponent:()=>asc},
  AttributeUtils:{MakeAttributeModEffectSpec:(effect,context,op,value,duration)=>({name:effect.name,op,value,duration}),ModifyCharacterAttributeValue:(a,n,op,v)=>base[n]=v},
  Object:{Load:p=>missing&&p.includes('Shachi_Max')?null:{name:/GE_MA_(.*?)_0_/.exec(p)[1]}}};
 const c=vm.createContext({module:{exports:{}},require:n=>n==='ue'?UE:math});vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/BossScaling.js'),'utf8'),c);
 return {api:c.module.exports,base,effects,actor,player,read,setMissing:v=>missing=v};
}
test('owned health floor survives native base resets and removal restores native behavior',()=>{
 const f=fixture(),handle=f.api.holdFloor(f.actor);assert.equal(f.read(f.actor,'Health_Min'),1);f.base.Health_Min=0;assert.equal(f.read(f.actor,'Health_Min'),1);
 assert.equal(f.effects.get(handle.id).duration,-1);f.api.releaseFloor(f.actor,handle);assert.equal(f.read(f.actor,'Health_Min'),0);assert.equal(f.effects.size,0);
});
test('persistent multipliers follow native phase base changes and use initialized pre-travel player stats',()=>{
 const f=fixture(),stats={health:3000,attack:1500,amplification:0.5},r=f.api.apply(f.actor,f.player,{health:2,shachi:3},stats);
 assert.equal(r.stats.health,math.matchedHealth(stats,30000)*2);assert.equal(f.read(f.actor,'Shachi_Max'),3000);
 f.base.Shachi_Max=2000;assert.equal(f.read(f.actor,'Shachi_Max'),6000);assert.equal(f.effects.size,2);
});
test('partial native scaling failure rolls back effects before a retry',()=>{
 const f=fixture();f.setMissing(true);assert.throws(()=>f.api.apply(f.actor,f.player,{health:2,shachi:3}));assert.equal(f.effects.size,0);assert.equal(f.read(f.actor,'Health_Max'),30000);
 f.setMissing(false);f.api.apply(f.actor,f.player,{health:2,shachi:3});assert.equal(f.effects.size,2);assert.equal(f.read(f.actor,'Shachi_Max'),3000);
});
