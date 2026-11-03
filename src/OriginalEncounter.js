"use strict";
const UE=require('ue'),p=require('puerts');
const {EncounterStorage}=require('./EncounterStorage'),scaling=require('./BossScaling'),{CombatServices}=require('./CombatServices');
const {healthy,verify}=require('./EncounterSnapshot');
function valid(v){try{return !!v&&UE.KismetSystemLibrary.IsValid(v);}catch(_){return false;}}
function path(v){try{return UE.KismetSystemLibrary.GetPathName(v);}catch(_){return '';}}
function leaf(v){return String(v).split('.').pop().replace(/_C$/,'');}
function tag(name){const v=new UE.GameplayTag();v.TagName=name;return v;}
class OriginalEncounter {
 constructor(config,done){this.storage=new EncounterStorage(config);this.done=done;this.generation=0;this.phase='idle';this.errors=[];this.services=new CombatServices();this.recovery=this.storage.recover();this.records=new Map();}
 get active(){return this.phase!=='idle'||!!this.recovery;}
 status(){return {phase:this.phase,recovering:!!this.recovery,mode:this.mode,map:this.profile?.map,seenBosses:this.records.size,sequence:this.sequence,skippedSequences:this.skipped||[],expectedWeapons:this.expectedWeapons,expectedPhantoms:this.expectedPhantoms,nativePhantoms:valid(this.currentContext?.inv)?this.currentContext.inv.ShaqiWeaponInfos?.Num?.():null,
  bosses:[...this.records.values()].map(r=>({path:path(r.actor),scaled:r.scaled,target:r.scale?.stats,health:valid(r.actor)?scaling.attribute(r.actor,'Health'):null,healthMax:valid(r.actor)?scaling.attribute(r.actor,'Health_Max'):null,shachiMax:valid(r.actor)?scaling.attribute(r.actor,'Shachi_Max'):null})),
  result:this.result,errors:this.errors.slice(),services:this.services.status()};}
 writeJournal(active){this.storage.journal({active,continueSlot:this.storage.continueSlot,advanced:this.storage.advanced,expectedWeapons:this.expectedWeapons,expectedPhantoms:this.expectedPhantoms});}
 start(c,plan,profile){
  if(this.active||plan.entries.length!==1||!profile)return false;
  this.phase='checkpoint';this.plan=plan;this.profile=profile;this.mode=plan.mode;this.records=new Map();this.claimedSpawners=new Set();this.errors=[];this.skipped=[];this.began=Date.now();this.playerKey=null;this.result=null;this.seenCombat=false;this.returnWanted=false;
  this.sequence=null;this.currentContext=c;
  this.expectedWeapons=c.inv.MainWeaponInfos.Num();this.expectedPhantoms=c.inv.ShaqiWeaponInfos?.Num?.()||0;
  this.playerStats={health:scaling.attribute(c.pawn,'Health_Max'),attack:scaling.attribute(c.pawn,'Attack'),amplification:scaling.attribute(c.pawn,'Amplification_Physical')};
  const ticket=++this.generation;
  try{this.storage.checkpoint(c,(error,snapshot)=>{
   if(ticket!==this.generation)return;
   if(error){this.fail(error,c,false);return;}
   this.snapshot=snapshot;
   try{this.writeJournal(true);this.phase='staging';this.storage.stage(snapshot,profile,(error,slot)=>{
    if(ticket!==this.generation)return;
    if(error){this.fail(error,null,true);return;}
    try{if(this.returnWanted){this.returnNow('已取消挑战');return;}this.phase='travelling';this.storage.veto();this.storage.travel(this.rawContext(),slot);this.travelAt=Date.now();}catch(e){this.fail(e,null,true);}
   });}catch(e){this.fail(e,null,true);}
  });return true;}catch(e){this.fail(e,c,false);return false;}
 }
 rawContext(){const world=UE.PuertsServerUtils.GetPlayWorld();if(!valid(world))return null;return {world,gi:UE.GameplayStatics.GetGameInstance(world),pc:UE.GameplayStatics.GetPlayerController(world,0)};}
 requestReturn(reason='已清空挑战并返回铃铛'){
  globalThis.__CodexBossControl?.restore('返回铃铛前已恢复主角');
  if(!this.active)return false;this.result=reason;
  if(this.phase==='checkpoint'){++this.generation;this.storage.release();this.phase='idle';this.done?.(reason);return true;}
  if(this.phase==='staging'){this.returnWanted=true;return true;}
  if(this.phase==='returning')return true;
  return this.returnNow(reason);
 }
 returnNow(reason){
  const c=this.rawContext();if(!c||c.gi.IsLoadingLevel){this.returnWanted=true;return true;}
  this.phase='returning';this.result=reason;++this.generation;this.services.stop(this.currentContext);
  for(const record of this.records.values())if(valid(record.actor))try{record.actor.K2_DestroyActor();}catch(_){}
  try{this.storage.restoreAdvanced();this.storage.travel(c,this.storage.returnSlot);this.travelAt=Date.now();return true;}catch(e){this.errors.push(String(e));this.phase='return-failed';return false;}
 }
 fail(error,c,hasCheckpoint){
  this.errors.push(String(error.stack||error));this.result='原剧情挑战未能启动，正在恢复铃铛快照';
  if(hasCheckpoint){this.returnNow(this.result);return;}
  try{this.storage.release();}catch(_){}this.phase='idle';this.done?.(this.result);
 }
 owns(actor){
  const queue=[actor],seen=new Set();
  while(queue.length&&seen.size<64){const a=queue.shift();if(!a)continue;const id=path(a);if(this.records.has(id))return true;if(!valid(a)||seen.has(id))continue;seen.add(id);try{queue.push(a.GetOwner(),a.GetInstigator(),a.GetAttachParentActor());}catch(_){}}
  return false;
 }
 scan(c){
  const classes=new Set(this.profile.classes.map(leaf)),ref=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.Actor.StaticClass(),ref);const actors=p.$unref(ref);
  for(let i=0;i<actors.Num();i++){
   const a=actors.Get(i);if(!valid(a)||a===c.pawn)continue;
   if(!this.profile.nativeFlow&&!this.seenCombat&&Date.now()-this.travelAt>5000&&this.profile.spawnerActors.includes(a.GetName())){
    if(!this.claimedSpawners)this.claimedSpawners=new Set();
    if(!this.claimedSpawners.has(path(a))){a.SpawnFromSequence();a.ClaimSeqSpawn(false,true,true);this.claimedSpawners.add(path(a));}
   }
   if(!classes.has(leaf(path(a.GetClass()))))continue;
   const id=path(a);let record=this.records.get(id);
   if(!record||record.actor!==a){record={actor:a,firstSeen:Date.now(),scaled:false};this.records.set(id,record);}
   if(!record.scaled&&scaling.attribute(a,'Health_Max')>0&&scaling.attribute(a,'Health')>0&&Date.now()-record.firstSeen>=150){
    UE.AbilitySystemBlueprintLibrary.AddLooseGameplayTags(a,UE.BlueprintGameplayTagLibrary.MakeGameplayTagContainerFromTag(tag('CharacterType.AI.ExcludeFromBossRecord')),false);
    record.scale=scaling.apply(a,c.pawn,this.plan.multipliers,this.playerStats);record.scaled=true;this.seenCombat=true;
   }
  }
 }
 sequences(c){
  const manager=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.PBZLevelSequenceManager.StaticClass());
  if(!valid(manager)||!manager.IsInSequence()){this.sequence=null;return;}
  const seq=manager.GetCurrentSequence(),name=path(seq);this.sequence=name;
  if(this.mode!=='original-battle')return;
  const meta=this.profile.sequences[name];
  // Unknown sequences are kept: transition cinematics must never be skipped by a blanket rule.
  if(!meta||meta.phase||this.skipped.includes(name))return;
  let player=manager.ActiveSessionPlayer;
  if(!valid(player)){
   const ref=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.LevelSequenceActor.StaticClass(),ref);const all=p.$unref(ref);
   for(let i=0;i<all.Num();i++){const a=all.Get(i);if(valid(a)&&path(a.GetSequence())===name&&valid(a.GetSequencePlayer())){player=a.GetSequencePlayer();break;}}
  }
  if(valid(player)){
   this.skipped.push(name);player.GoToEndAndStop();
   // Stop does not broadcast the player's natural-finish delegate. Complete the
   // still-active native flow node through its ordinary finish callback.
   const ref=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.Actor.StaticClass(),ref);const all=p.$unref(ref);
   for(let i=0;i<all.Num();i++){
    const actor=all.Get(i);if(!valid(actor)||!this.profile.owners.some(o=>actor.GetName()===o.name))continue;
    const component=UE.PBZFlowComponent.FindFlowComponent(actor);if(!valid(component)||path(component.RootFlow)!==meta.flow)continue;
    const flow=component.GetRootFlowInstance();if(!valid(flow))continue;
    const nodes=[];for(let j=0;j<flow.ActiveNodes.Num();j++)nodes.push(flow.ActiveNodes.Get(j));
    for(const node of nodes)if(valid(node)&&path(node.LoadedLevelSequence)===name&&typeof node.OnFinished==='function')node.OnFinished();
   }
  }
 }
 dialogue(c){
  if(this.mode!=='original-battle'||!Object.keys(this.profile.dialogueNodes||{}).length)return;
  const ref=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.Actor.StaticClass(),ref);const all=p.$unref(ref);
  for(let i=0;i<all.Num();i++){
   const actor=all.Get(i);if(!valid(actor)||!this.profile.owners.some(o=>actor.GetName()===o.name))continue;
   const component=UE.PBZFlowComponent.FindFlowComponent(actor);if(!valid(component))continue;
   const flow=component.GetRootFlowInstance();if(!valid(flow))continue;
   const active=[];for(let j=0;j<flow.ActiveNodes.Num();j++)active.push(flow.ActiveNodes.Get(j));
   for(const node of active){
    if(!valid(node))continue;const g=node.NodeGuid,key=['A','B','C','D'].map(k=>(g[k]>>>0).toString(16).padStart(8,'0').toUpperCase()).join(''),meta=this.profile.dialogueNodes[key];
    if(meta&&!meta.phase)node.TriggerFirstOutput(true);
   }
  }
 }
 tick(c){
  const raw=this.rawContext();if(!raw)return;
  if(this.recovery){
   if(!c)return;
   const r=this.recovery;this.recovery=null;this.expectedWeapons=r.expectedWeapons||1;this.expectedPhantoms=r.expectedPhantoms||0;
   try{this.storage.resume(raw,r);this.snapshot=this.storage.read(this.storage.returnSlot);if(!healthy(this.snapshot))throw Error('Recovery checkpoint is incomplete');this.returnNow('已恢复上次挑战前的铃铛快照');}catch(e){this.errors.push(String(e));this.phase='return-failed';}
   return;
  }
  if(!this.active)return;
  if(this.phase==='checkpoint'&&Date.now()-this.began>30000){this.requestReturn('游戏暂时不能建立挑战快照，请稍后重试');return;}
  if(this.returnWanted&&!['checkpoint','staging','returning'].includes(this.phase)){this.returnWanted=false;this.returnNow(this.result||'已取消挑战');return;}
  if(!c)return;
  const previousContext=this.currentContext;this.currentContext=c;
  if(this.phase==='returning'){
   const expected=this.snapshot?.PBZGameSystem?.CurrentLevelName;
   if(c.map!==expected||c.inv.MainWeaponInfos.Num()<this.expectedWeapons||scaling.attribute(c.pawn,'Health')<=0)return;
   verify(this.snapshot,JSON.parse(this.storage.save.SaveJsonObjectToString()),expected);
   if(this.storage.restoreAdvanced()===false)return;
   this.writeJournal(false);this.storage.release();this.phase='idle';this.profile=null;this.records.clear();this.done?.(this.result);return;
  }
  if(this.phase==='travelling'){
   if(c.map!==this.profile.map.split('/').pop()||c.inv.MainWeaponInfos.Num()<this.expectedWeapons)return;
   this.phase='encounter';this.playerKey=c.key;this.floorActor=c.pawn;this.floorHandle=scaling.holdFloor(c.pawn);
   this.services.start(c,{...this.plan,originalMap:true},[],a=>this.owns(a));this.nextScan=0;
  }
  if(this.phase!=='encounter')return;
  if(c.key!==this.playerKey||c.pawn!==previousContext?.pawn){
   // Native phases can replace Hun, change his form, or travel to a later
   // encounter stage. Keep the session and bind to the initialized new pawn.
   this.services.stop(previousContext);scaling.releaseFloor(this.floorActor,this.floorHandle);this.playerKey=c.key;this.floorActor=c.pawn;this.floorHandle=scaling.holdFloor(c.pawn);
   this.services.start(c,{...this.plan,originalMap:true},[],a=>this.owns(a));
  }
  if(scaling.attribute(c.pawn,'Health')<=1.01){this.requestReturn('本次挑战结束');return;}
  this.services.tick(c);this.sequences(c);
  if(Date.now()>=this.nextScan){this.nextScan=Date.now()+200;this.scan(c);this.dialogue(c);}
  if(!this.seenCombat&&Date.now()-this.travelAt>90000){this.requestReturn('未能启动该 Boss 的原生流程，已返回铃铛');return;}
  // The native flow owns phase transitions, death events, dialogue and choices.
  // F9 remains available after victory so complete-story dialogue is never cut off.
 }
}
module.exports={OriginalEncounter};
