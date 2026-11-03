"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function fixture(){
 const calls=[],pawn={},other={},owner={},event={Add(fn){this.fn=fn;},Remove(){delete this.fn;}},action={EventReceived:event,Activate(){},EndAction(){calls.push(['endDamage']);}},volume={Tags:{Add(){}},SetActorEnableCollision(){},SetActorHiddenInGame(){},K2_DestroyActor(){calls.push(['destroyVolume']);}};
 const music={bDisableBossMusicOnUI:true,CurPlayingID_Gameplay:0,AddMusicVolume(){calls.push(['addVolume']);},RemoveMusicVolume(){calls.push(['removeVolume']);},UpdateGameplayMusic(){},PlayMusicAndSetState(event,state){calls.push(['play',event.path,state.path]);this.CurPlayingEvent_Gameplay=event;this.CurPlayingID_Gameplay=1;},SetMusicState(state){calls.push(['state',state.path]);},ClearMusic(...args){calls.push(['clear',...args]);this.CurPlayingID_Gameplay=0;},DisableGameplayMusic(value){calls.push(['disableGameplay',value]);}};
 const assets=new Map();const UE={
  KismetSystemLibrary:{IsValid:x=>!!x},GameplayTag:class{},Transform:class{SetLocation(){}},EMusicType:{CombatMusic:1},EGenericValueModifyType:{Mult:2},
  AbilityAsync_WaitGameplayEvent:{WaitGameplayEventToActor:()=>action},DamagePreTakePayload:{StaticClass:()=>({})},
  SubsystemBlueprintLibrary:{GetWorldSubsystem:()=>music},MusicSubsystem:{StaticClass:()=>({})},PBZMusicVolume:{StaticClass:()=>({})},ESpawnActorCollisionHandlingMethod:{AlwaysSpawn:1},
  SGameAIFunctionLibrary:{SpawnActorDeferred:()=>volume},GameplayStatics:{FinishSpawningActor:()=>volume},Object:{Load:n=>{if(!assets.has(n))assets.set(n,{path:n});return assets.get(n);}}
 };pawn.K2_GetActorLocation=()=>({X:0,Y:0,Z:0});
 const context=vm.createContext({module:{exports:{}},require:n=>n==='ue'?UE:{first:{event:'/native/first',state:'/native/state1'},second:{event:'/native/second',state:'/native/state2'}},Date});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/CombatServices.js'),'utf8'),context);const services=new context.module.exports.CombatServices(),c={world:{},key:'world|player',pawn};
 const payload=(target,source)=>({TargetActor:target,IsA:()=>true,GetDamageSourceOwner:()=>source,ApplyModifyToChildren:(tag,op,value)=>calls.push(['damage',tag.TagName,op,value])});
 return {services,c,music,calls,event,pawn,other,owner,payload,plan:{musicBoss:{id:'first',name:'first'},damageFactor:0.5,musicEnabled:true}};
}
test('damage modifier changes only selected bosses and descendants hitting the player; listener is removed on return',()=>{
 const f=fixture();f.services.start(f.c,f.plan,[],source=>source===f.owner);
 for(const e of [f.payload(f.other,f.owner),f.payload(f.pawn,f.other),f.payload(f.pawn,f.owner)])f.event.fn({OptionalObject:e});
 assert.deepEqual(f.calls.filter(x=>x[0]==='damage'),[['damage','Damage.Damage.Target.GeneralDamage',2,0.5]]);assert.equal(f.services.status().modifiedHits,1);
 f.services.stop(f.c);assert.equal(f.event.fn,undefined);assert.equal(f.music.bDisableBossMusicOnUI,true);assert.ok(f.calls.some(x=>x[0]==='endDamage'));
});
test('mixed-boss music keeps first selection and cleanup restores native subsystem ownership',()=>{
 const f=fixture();f.services.start(f.c,f.plan,[],()=>true);assert.deepEqual(f.calls.find(x=>x[0]==='play'),['play','/native/first','/native/state1']);
 f.music.CurPlayingEvent_Gameplay={path:'/native/second'};f.services.nextMusicCheck=0;f.services.tick(f.c);assert.deepEqual(f.calls.filter(x=>x[0]==='play').at(-1),['play','/native/first','/native/state1']);
 f.services.stop(f.c);assert.ok(f.calls.some(x=>x[0]==='removeVolume'));assert.ok(f.calls.some(x=>x[0]==='destroyVolume'));
});
test('music off owns and releases gameplay mute; native-story music keeps native phase switching',()=>{
 const f=fixture();f.services.start(f.c,{...f.plan,musicEnabled:false},[],()=>true);assert.ok(f.calls.some(x=>x[0]==='disableGameplay'&&x[1]));assert.equal(f.calls.some(x=>x[0]==='play'),false);
 f.services.stop(f.c);assert.ok(f.calls.some(x=>x[0]==='disableGameplay'&&!x[1]));
 const g=fixture();g.services.start(g.c,{...g.plan,originalMap:true},[],()=>true);assert.equal(g.calls.some(x=>x[0]==='addVolume'||x[0]==='play'),false);g.services.tick(g.c);assert.equal(g.calls.some(x=>x[0]==='state'),false);
});
