"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const math=require('../src/ReplayMath'),catalog=require('../src/BossCatalog'),plans=require('../src/ChallengePlan');
function fixture(ids){
 const calls=[],world={path:'world'},point={X:0,Y:0,Z:0},attrs={Health:100,Health_Max:3000},keys={};let timer,emergency,enabled,now=1000,paused=false;
 const pawn={path:'player',GetClass:()=>({path:'/Game/BP_Renewal_Hun.BP_Renewal_Hun_C'}),K2_GetActorLocation:()=>point};
 const enemies=ids.map((id,index)=>({index,boss:catalog.find(b=>b.id===id),phase:'fighting',path:'boss'+index,actor:{path:'boss'+index,health:100,GetName:()=> 'boss'+index,K2_GetActorLocation:()=>point,K2_DestroyActor(){this.destroyed=true;calls.push(['destroy',index]);},GetOwner:()=>null,GetInstigator:()=>null,GetAttachParentActor:()=>null}}));
 const list={Num:()=>enemies.length,Get:i=>enemies[i].actor};
 const subsystems={inventory:{MainWeaponInfos:{Num:()=>28}},pipeline:{HasTagWithOutSource:()=>true,GetNPCActorByName:()=>null},sequence:{IsInSequence:()=>false},performance:{TeleportToTargetPoint:()=>calls.push(['teleport'])}};
 const UE={
  Key:class{},GameplayTag:class{},Vector:class{constructor(X,Y,Z){Object.assign(this,{X,Y,Z});}},Rotator:class{},Transform:class{SetLocation(){}SetRotation(){}},
  KismetSystemLibrary:{IsValid:o=>!!o&&!o.destroyed,GetPathName:o=>o.path},KismetMathLibrary:{Conv_RotatorToQuaternion:()=>({})},
  PuertsServerUtils:{GetPlayWorld:()=>world},
  GameplayStatics:{GetPlayerCharacter:()=>pawn,GetGameInstance:()=>({}),GetPlayerController:()=>({IsInputKeyDown:k=>!!keys[k.KeyName]}),IsGamePaused:()=>paused,GetTimeSeconds:()=>now/1000,GetCurrentLevelName:()=> 'PBZ_Xigu_WP',GetAllActorsOfClass:(_,__,ref)=>ref.value=list},
  SubsystemBlueprintLibrary:{GetWorldSubsystem:(_,token)=>subsystems[token]},
  PBZBackPackSubsystem:{StaticClass:()=> 'inventory'},EventPipelineManager:{StaticClass:()=> 'pipeline'},PBZLevelSequenceManager:{StaticClass:()=> 'sequence'},PerformanceSystemSubsystem:{StaticClass:()=> 'performance'},Actor:{StaticClass:()=> 'actor'},BasicAttributeSet:{StaticClass:()=>({})},WorldPartitionStreamingSourceComponent:{StaticClass:()=> 'streaming'},
  PBZBlueprintFunctionLibrary:{MakeAttribute:n=>n,GetAttributeFromCharacter:(a,n)=>a===pawn?attrs[n]:a.health},
  AttributeUtils:{ModifyCharacterAttributeValue:(_,name,op,value)=>{attrs[name]=value;calls.push(['attribute',name,value]);}},EGameplayModOp:{Override:1},EasyCsv:{SaveStringToFileWithFullPath:()=>true}
 };
 class Services{status(){return {};}stop(){calls.push(['stop']);}tick(){calls.push(['musicTick']);}}
 class Original{get active(){return false;}status(){return {};}tick(){}}
 const modules={ue:UE,puerts:{$ref:v=>({value:v}),$unref:r=>r.value},cpp:{},'./ReplayMath':math,'./BossCatalog':catalog,'./ChallengePlan':plans,'./CombatServices':{CombatServices:Services},'./BossScaling':{releaseFloor:()=>calls.push(['releaseFloor'])},'./EncounterCatalog':{},'./OriginalEncounter':{OriginalEncounter:Original},'./EmergencyReturn':{start:(check,fn)=>{enabled=check;emergency=fn;return ()=>{};}}};
 UE.NewArray=()=>list;
 class Clock extends Date{static now(){return now;}}
 const context=vm.createContext({module:{exports:{}},require:n=>{assert.ok(modules[n],n);return modules[n];},Date:Clock,setInterval:fn=>{timer=fn;return 1;},clearInterval(){}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/RiftArena.js'),'utf8'),context);
 const s=context.module.exports.start({version:'test'});
 Object.assign(s,{world:'world|player',closed:true,phase:'fighting',initialAssets:true,bellCreated:true,streaming:{GetComponentByClass:()=>({IsStreamingCompleted:()=>true})},enemies,enemy:enemies[0].actor,selection:ids.slice(),arrival:{location:{X:0,Y:0,Z:0}},battle:{location:{X:0,Y:0,Z:0}},floorActor:pawn,floorHandle:{}});
 return {s,enemies,calls,attrs,point,tick(){timer();assert.deepEqual(Array.from(s.errors),[]);now+=100;},wait(){now+=100000;},pause(v){paused=v;},f9(){assert.equal(enabled(),true);emergency();}};
}
for(const ids of [[catalog[0].id],[catalog[0].id,catalog[0].id,catalog[1].id,catalog[2].id,catalog[2].id]]){
 test(ids.length+' selected bosses stay in place after victory until manual F9',()=>{
  const f=fixture(ids);
  for(let i=0;i<f.enemies.length;i++){
   f.enemies[i].actor.health=1;f.tick();
   assert.equal(f.s.phase,i===f.enemies.length-1?'completed':'fighting');
   assert.equal(f.calls.some(c=>c[0]==='teleport'),false);
  }
  assert.equal(f.s.result,'挑战成功');assert.equal(f.attrs.Health,3000);assert.equal(f.s.floorHandle,null);
  const stops=f.calls.filter(c=>c[0]==='stop').length;
  f.point.X=50000;f.point.Z=5000;f.wait();for(let i=0;i<20;i++)f.tick();
  f.pause(true);f.tick();f.pause(false);f.tick();
  assert.equal(f.s.phase,'completed');assert.equal(f.calls.filter(c=>c[0]==='stop').length,stops);assert.equal(f.calls.some(c=>c[0]==='teleport'),false);
  assert.equal(f.s.startChallenge(),false);assert.equal(f.s.setMultiplier('health',2),false);
  f.f9();assert.equal(f.s.phase,'idle');assert.equal(f.calls.filter(c=>c[0]==='teleport').length,1);assert.equal(f.s.enemies.length,0);assert.deepEqual(Array.from(f.s.selection),ids);
  f.tick();assert.equal(f.calls.filter(c=>c[0]==='teleport').length,1);
 });
}
test('missing boss ends the challenge without silently teleporting or reporting victory',()=>{
 const f=fixture([catalog[0].id,catalog[1].id]);f.enemies[0].actor.destroyed=true;f.enemies[1].actor.health=1;f.tick();
 assert.equal(f.s.phase,'completed');assert.equal(f.s.result,'本次挑战已结束');assert.equal(f.calls.some(c=>c[0]==='teleport'),false);f.f9();assert.equal(f.s.phase,'idle');
});
test('manual F9 remains available before victory and preserves the selected roster',()=>{
 const ids=[catalog[0].id,catalog[0].id],f=fixture(ids);f.f9();assert.equal(f.s.phase,'idle');assert.equal(f.calls.filter(c=>c[0]==='teleport').length,1);assert.equal(f.s.enemies.length,0);assert.deepEqual(Array.from(f.s.selection),ids);
});
test('player defeat retains the existing return and recovery behavior',()=>{
 const f=fixture([catalog[0].id]);f.attrs.Health=1;f.tick();assert.equal(f.s.phase,'idle');assert.equal(f.s.result,'本次挑战结束');assert.equal(f.calls.filter(c=>c[0]==='teleport').length,1);assert.equal(f.attrs.Health,3000);
});
