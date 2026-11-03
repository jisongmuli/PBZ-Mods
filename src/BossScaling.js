"use strict";
const UE=require('ue');
const {challengeStats}=require('./ReplayMath');
function valid(o){try{return !!o&&UE.KismetSystemLibrary.IsValid(o);}catch(_){return false;}}
function attribute(actor,name){return UE.PBZBlueprintFunctionLibrary.GetAttributeFromCharacter(actor,UE.PBZBlueprintFunctionLibrary.MakeAttribute(name,UE.BasicAttributeSet.StaticClass()));}
function set(actor,name,value){UE.AttributeUtils.ModifyCharacterAttributeValue(actor,UE.PBZBlueprintFunctionLibrary.MakeAttribute(name,UE.BasicAttributeSet.StaticClass()),UE.EGameplayModOp.Override,value);}
function effect(actor,name,value,operation,suffix){
 const effectName='GE_MA_'+name+'_0_'+suffix;
 const effect=UE.Object.Load('/PBZCombatAsset/Config/AttributesModifyEffect/'+effectName+'.'+effectName);
 if(!valid(effect))throw Error('Native attribute effect is missing: '+effectName);
 const asc=UE.AbilitySystemBlueprintLibrary.GetAbilitySystemComponent(actor);
 const spec=UE.AttributeUtils.MakeAttributeModEffectSpec(effect,asc.MakeEffectContext(),operation,value,-1);
 return asc.BP_ApplyGameplayEffectSpecToSelf(spec);
}
function multiply(actor,name,value){return effect(actor,name,value,UE.EGameplayModOp.Multiplicitive,'Mul');}
function releaseFloor(actor,handle){if(valid(actor)&&handle)UE.AbilitySystemBlueprintLibrary.GetAbilitySystemComponent(actor).RemoveActiveGameplayEffect(handle,-1);}
function holdFloor(actor){
 const handle=effect(actor,'Health_Min',1,UE.EGameplayModOp.Override,'Override');
 let accepted=false;
 try{accepted=attribute(actor,'Health_Min')>=0.99;if(!accepted)throw Error('Native training health floor was rejected');return handle;}
 finally{if(!accepted)releaseFloor(actor,handle);}
}
function apply(actor,player,chosen,playerBaseline){
 const base={health:attribute(actor,'Health_Max'),shachi:attribute(actor,'Shachi_Max')};
 const stats=challengeStats(playerBaseline||{health:attribute(player,'Health_Max'),attack:attribute(player,'Attack'),amplification:attribute(player,'Amplification_Physical')},base,chosen);
 const handles=[];
 try{
 handles.push(multiply(actor,'Health_Max',stats.health/base.health));
 if(base.shachi>0)handles.push(multiply(actor,'Shachi_Max',chosen.shachi));
 const actual={health:attribute(actor,'Health_Max'),shachi:attribute(actor,'Shachi_Max')};
 if(Math.abs(actual.health-stats.health)>Math.max(1,stats.health*0.001)||Math.abs(actual.shachi-stats.shachi)>Math.max(1,stats.shachi*0.001))throw Error('Native persistent boss scaling was rejected');
 set(actor,'Health',actual.health);if(base.shachi>0)set(actor,'Shachi',actual.shachi);
 return {base,stats,handles};
 }catch(e){const asc=UE.AbilitySystemBlueprintLibrary.GetAbilitySystemComponent(actor);for(const handle of handles)asc.RemoveActiveGameplayEffect(handle,-1);throw e;}
}
module.exports={apply,attribute,set,holdFloor,releaseFloor};
