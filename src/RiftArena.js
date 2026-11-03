"use strict";
const UE=require('ue'),p=require('puerts'),cpp=require('cpp');
const {multiplier,challengeStats}=require('./ReplayMath');
const catalog=require('./BossCatalog');
const planTools=require('./ChallengePlan');
const {CombatServices}=require('./CombatServices');
const scaling=require('./BossScaling');
const encounters=require('./EncounterCatalog');
const {OriginalEncounter}=require('./OriginalEncounter');
const KEY='__CodexRiftArena';
const ENTRANCE_FLOW='/game/pbzcontent/blueprint/flowgraph/questflowgraph/xigu/bpf_santouwawa_teleport.bpf_santouwawa_teleport';
const TARGET='SanTouWaWaTeleportPoint',CLOSED='xg.三头娃娃.裂缝消失';
function valid(o){try{return !!o&&UE.KismetSystemLibrary.IsValid(o);}catch(_){return false;}}
function pos(v){return {X:v.X,Y:v.Y,Z:v.Z};}
function rot(v){return {Pitch:v.Pitch,Yaw:v.Yaw,Roll:v.Roll};}
function vec(v){return new UE.Vector(v.X,v.Y,v.Z);}
function distance(a,b){return Math.hypot(a.X-b.X,a.Y-b.Y,a.Z-b.Z);}
function tag(name){const t=new UE.GameplayTag();t.TagName=name;return t;}
function attr(a,name){return UE.PBZBlueprintFunctionLibrary.GetAttributeFromCharacter(a,UE.PBZBlueprintFunctionLibrary.MakeAttribute(name,UE.BasicAttributeSet.StaticClass()));}
function setAttr(a,name,value){UE.AttributeUtils.ModifyCharacterAttributeValue(a,UE.PBZBlueprintFunctionLibrary.MakeAttribute(name,UE.BasicAttributeSet.StaticClass()),UE.EGameplayModOp.Override,value);}
function context(){
 const world=UE.PuertsServerUtils.GetPlayWorld();if(!valid(world))return null;
 const gi=UE.GameplayStatics.GetGameInstance(world);if(!valid(gi)||gi.IsLoadingLevel)return null;
 const pawn=UE.GameplayStatics.GetPlayerCharacter(world,0);if(!valid(pawn))return null;
 if(!/BP_Renewal_Hun(?:_Climax|_Young)?\./i.test(UE.KismetSystemLibrary.GetPathName(pawn.GetClass())))return null;
 const inv=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(world,UE.PBZBackPackSubsystem.StaticClass());
 if(!valid(inv)||!inv.MainWeaponInfos.Num()||attr(pawn,'Health_Max')<=0)return null;
 const pipe=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(world,UE.EventPipelineManager.StaticClass());
 const sequence=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(world,UE.PBZLevelSequenceManager.StaticClass());
 return {world,pawn,inv,pipe,gi,pc:UE.GameplayStatics.GetPlayerController(world,0),
  blocked:UE.GameplayStatics.IsGamePaused(world)||(valid(sequence)&&sequence.IsInSequence()),
  key:UE.KismetSystemLibrary.GetPathName(world)+'|'+UE.KismetSystemLibrary.GetPathName(pawn),
  time:UE.GameplayStatics.GetTimeSeconds(world),map:UE.GameplayStatics.GetCurrentLevelName(world),location:pos(pawn.K2_GetActorLocation())};
}
function start(config){
 if(globalThis[KEY])return globalThis[KEY];
 const s={phase:'idle',config,actors:[],enemies:[],selection:[],musicEnabled:true,meshes:new Map(),menus:new Set(),generation:0,worldGeneration:0,errors:[],world:null,lastTime:-1,result:null,multipliers:{health:1,shachi:1,damage:1}};
 const services=new CombatServices();
 const original=new OriginalEncounter(config,reason=>{s.phase='idle';s.result=reason;});
 if(original.active)s.phase='original';
 globalThis[KEY]=s;
 function status(){
  const c=context();
  const data={mod:'CodexRiftArena',version:config.version,at:new Date().toISOString(),phase:s.phase,world:s.world,
   closed:s.closed,entrance:s.entrance,arrival:s.arrival,bell:s.bellPoint,bellCreated:s.bellCreated,ownedActors:s.actors.length,menuOpen:s.menus.size,battle:s.battle,
   boss:s.boss?.name,multipliers:{...s.multipliers},challengeMultipliers:s.challengeMultipliers,baseStats:s.baseStats,
   targetHealth:s.targetHealth,actualHealth:valid(s.enemy)?attr(s.enemy,'Health'):null,
   targetShachi:s.targetShachi,actualShachi:valid(s.enemy)?attr(s.enemy,'Shachi'):null,actualShachiMax:valid(s.enemy)?attr(s.enemy,'Shachi_Max'):null,recordExcluded:s.recordExcluded,
   selection:s.selection.slice(),musicEnabled:s.musicEnabled,music:services.status(),damageFactor:s.plan?.damageFactor,
   enemies:s.enemies.map(e=>({slot:e.index+1,name:e.boss.name,phase:e.phase,path:e.path,baseStats:e.baseStats,targetStats:e.stats,health:valid(e.actor)?attr(e.actor,'Health'):null,shachi:valid(e.actor)?attr(e.actor,'Shachi'):null})),
   player:c?{location:c.location,health:attr(c.pawn,'Health'),max:attr(c.pawn,'Health_Max'),min:attr(c.pawn,'Health_Min'),weapons:c.inv.MainWeaponInfos.Num()}:null,
   original:original.status(),result:s.result,errors:s.errors};
  UE.EasyCsv.SaveStringToFileWithFullPath(JSON.stringify(data,null,2),config.arenaStatusFile);
  s.lastStatus=data;return data;
 }
 function own(actor){actor.Tags.Add('CodexRiftArenaOwned');s.actors.push(actor);return actor;}
 function destroy(actor){if(valid(actor))actor.K2_DestroyActor();s.actors=s.actors.filter(x=>x!==actor);}
 function ownedBy(actor,paths){
  const seen=new Set(),queue=[actor];
  while(queue.length&&seen.size<64){
   const current=queue.shift();if(!current)continue;
   let path;try{path=UE.KismetSystemLibrary.GetPathName(current);}catch(_){continue;}
   if(paths.has(path))return true;if(seen.has(path))continue;seen.add(path);
   if(!valid(current))continue;
   try{queue.push(current.GetInstigator(),current.GetOwner(),current.GetAttachParentActor());}catch(_){}
  }
  return false;
 }
 function destroyEnemies(records=s.enemies){
  const paths=new Set(records.map(e=>e.path).filter(Boolean));
  const c=context();
  if(c&&paths.size){
   const ref=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.Actor.StaticClass(),ref);const actors=p.$unref(ref);
   const children=[];
   for(let i=0;i<actors.Num();i++){
    const a=actors.Get(i);if(!valid(a)||a===c.pawn||a===c.pc)continue;
    if(ownedBy(a,paths))children.push(a);
   }
   for(const child of children)try{destroy(child);}catch(e){s.errors.push('Cleanup: '+e);}
  }
  for(const record of records){try{destroy(record.actor);}catch(e){s.errors.push('Cleanup root: '+e);}record.actor=null;}
  s.enemy=s.enemies.find(e=>valid(e.actor))?.actor||null;
 }
 function tip(c,text){
  if(text===s.tipText)return;hideTip();if(!text)return;
  if(!valid(s.tipClass))return;
  const sys=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.UIExtensionSubsystem.StaticClass());
  const data=UE.NewObject(s.tipClass);data.ShowText=cpp.FText.FromString(text);
  s.tipHandle=sys.K2_RegisterExtensionAsData(tag('UI.ExtensionPoint.TextTips'),data,100);s.tipText=text;s.tipWorld=s.world;
 }
 function hideTip(){
  if(s.tipHandle){try{const c=context();if(c&&c.key===s.tipWorld)UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.UIExtensionSubsystem.StaticClass()).UnregisterExtension(s.tipHandle);}catch(_){} }
  s.tipHandle=null;s.tipText=null;
 }
 function loadClass(c,path,fn){
  const generation=s.worldGeneration,world=s.world;
  UE.PBZAssetManager.AsyncLoadClass(c.gi,UE.KismetSystemLibrary.MakeSoftObjectPath(path),p.toOneShotDelegate(klass=>{
   if(globalThis[KEY]!==s||s.worldGeneration!==generation||s.world!==world)return;
   if(!valid(klass)){s.errors.push('Could not load '+path);return;}fn(klass);
  }));
 }
 function readClosed(c){
  try{if(c.pipe.HasTagWithOutSource(tag(CLOSED)))return true;}catch(_){}
  if(Date.now()<(s.nextSnapshot||0))return !!s.closed;
  s.nextSnapshot=Date.now()+5000;
  const save=UE.SubsystemBlueprintLibrary.GetGameInstanceSubsystem(c.world,UE.PBZSaveLoadSubsystem.StaticClass());
  try{return JSON.parse(save.SaveJsonObjectToString()).EventPipeline.GlobalTags.includes(CLOSED);}catch(_){return false;}
 }
 function findAnchors(c){
  const target=c.pipe.GetNPCActorByName(TARGET);
  if(valid(target)){
   s.arrival={location:pos(target.K2_GetActorLocation()),rotation:rot(target.K2_GetActorRotation())};
   const right=target.GetActorRightVector(),v=s.arrival.location;
   s.bellPoint={X:v.X+right.X*275,Y:v.Y+right.Y*275,Z:v.Z-80};
  }
  const ar=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.Actor.StaticClass(),ar);const actors=p.$unref(ar);
  for(let i=0;i<actors.Num();i++){
   const a=actors.Get(i);if(!valid(a))continue;const name=a.GetName();
   if(/FlowInteractActor/.test(name)){
    const f=UE.PBZFlowComponent.FindFlowComponent(a);
    if(valid(f)&&valid(f.RootFlow)&&UE.KismetSystemLibrary.GetPathName(f.RootFlow).toLowerCase()===ENTRANCE_FLOW){
     s.entrance={location:pos(a.K2_GetActorLocation()),rotation:rot(a.K2_GetActorRotation())};
     s.portal=a;
     if(s.closed&&!s.portalOriginal){s.portalOriginal={actor:a,hidden:a.bHidden,collision:a.GetActorEnableCollision(),meshVisible:valid(a.StaticMesh)?a.StaticMesh.IsVisible():null};}
     if(s.closed){a.SetActorHiddenInGame(false);a.SetActorEnableCollision(false);if(valid(a.StaticMesh))a.StaticMesh.SetVisibility(true,true);}
    }
   }
   if(s.arrival&&/NPCSpawner/.test(name)&&Math.abs(a.K2_GetActorLocation().Z-s.arrival.location.Z)<4000){
    try{
     const klass=a.NPCClass.Get();
     const path=valid(klass)?UE.KismetSystemLibrary.GetPathName(klass):UE.KismetSystemLibrary.Conv_SoftClassReferenceToString(a.NPCClass);
     if(/BP_(?:Monster_YuCong(?:_FirstTime|_P1)?|NPC_YuCong_FirstTime)\./i.test(path)){
      const native=pos(a.K2_GetActorLocation()),arrival=s.arrival.location;
      const center={X:(native.X+arrival.X)/2,Y:(native.Y+arrival.Y)/2,Z:native.Z};
      s.battle={location:center,rotation:rot(a.K2_GetActorRotation()),sourceClass:path,nativeStand:native};
     }
    }catch(_){}
   }
  }
 }
 function ground(c,point){
  const hit=p.$ref(new UE.HitResult());
  const ok=UE.KismetSystemLibrary.LineTraceSingle(c.world,new UE.Vector(point.X,point.Y,point.Z+500),new UE.Vector(point.X,point.Y,point.Z-1500),UE.ETraceTypeQuery.TraceTypeQuery1,false,UE.NewArray(UE.Actor),UE.EDrawDebugTrace.None,hit,true);
  return ok?pos(p.$unref(hit).ImpactPoint):point;
 }
 function makeBell(c){
  if(!s.closed||!s.bellPoint||s.bellCreated||s.meshLoading||Date.now()<(s.meshRetryAt||0))return;
  s.meshLoading=true;
  const paths=['/Game/PBZContent/Environments/IP/Teleport/WoodenFrameBell/Mesh/SM_WoodenFrameBellStand.SM_WoodenFrameBellStand','/Game/PBZContent/Environments/IP/Teleport/WoodenFrameBell/Mesh/SM_WoodenFrameBellWithCloth.SM_WoodenFrameBellWithCloth'];
  const array=UE.NewArray(UE.SoftObjectPath);paths.forEach(x=>array.Add(UE.KismetSystemLibrary.MakeSoftObjectPath(x)));
  const generation=s.worldGeneration,world=s.world;
  UE.PBZAssetManager.AsyncLoadObjects(c.gi,array,p.toOneShotDelegate(assets=>{
   if(globalThis[KEY]!==s||s.worldGeneration!==generation||s.world!==world)return;
   s.meshLoading=false;const fresh=context();if(!fresh)return;
   const staged=[];
   try{
    s.bellPoint=ground(fresh,s.bellPoint);
    for(let i=0;i<assets.Num();i++){
     const mesh=assets.Get(i);if(!valid(mesh))throw Error('Bell mesh missing');
     const t=new UE.Transform();t.SetLocation(vec(s.bellPoint));
     const a=UE.SGameAIFunctionLibrary.SpawnActorDeferred(fresh.world,UE.StaticMeshActor.StaticClass(),t,UE.ESpawnActorCollisionHandlingMethod.AlwaysSpawn);
     staged.push(a);own(a);
     a.StaticMeshComponent.SetStaticMesh(mesh);a.SetActorEnableCollision(false);
     UE.GameplayStatics.FinishSpawningActor(a,t);
    }
    s.bellCreated=true;status();
   }catch(e){for(const a of staged)destroy(a);s.meshRetryAt=Date.now()+5000;const error='Bell: '+String(e);if(s.errors[s.errors.length-1]!==error)s.errors.push(error);}
  }));
 }
 function prepare(c){
  if(!s.arrival||valid(s.streaming)||s.streamingLoading)return;
  s.streamingLoading=true;
  loadClass(c,'/Game/PBZContent/UI/Help/BP_StreamingActor.BP_StreamingActor_C',klass=>{
   const fresh=context();if(!fresh)return;s.streamingLoading=false;
   const t=new UE.Transform();t.SetLocation(vec(s.arrival.location));
   s.streaming=own(UE.GameplayStatics.FinishSpawningActor(UE.SGameAIFunctionLibrary.SpawnActorDeferred(fresh.world,klass,t,UE.ESpawnActorCollisionHandlingMethod.AlwaysSpawn),t));
  });
 }
 function streamed(){return valid(s.streaming)&&s.streaming.GetComponentByClass(UE.WorldPartitionStreamingSourceComponent.StaticClass()).IsStreamingCompleted();}
 function teleport(c,point){
  const t=new UE.Transform();t.SetLocation(vec(point.location));
  const r=point.rotation||{Pitch:0,Yaw:0,Roll:0};
  t.SetRotation(UE.KismetMathLibrary.Conv_RotatorToQuaternion(new UE.Rotator(r.Pitch,r.Yaw,r.Roll)));
  UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.PerformanceSystemSubsystem.StaticClass()).TeleportToTargetPoint(t,c.map);
 }
 function enter(){
  const c=context();if(!c||!s.closed||!s.arrival||!streamed()||s.phase!=='idle')return false;
  hideTip();teleport(c,s.arrival);s.result=null;return true;
 }
 function restoreMin(c){if(s.floorHandle){scaling.releaseFloor(s.floorActor,s.floorHandle);s.floorHandle=null;s.floorActor=null;}}
 function finish(reason,point=s.arrival){
  const c=context();s.generation++;hideTip();
  if(valid(s.menuPush))s.menuPush.Cancel();s.menuPush=null;s.menuOpening=false;
  for(const menu of [...s.menus])try{menu.DeactivateWidget();}catch(_){}s.menus.clear();
  destroyEnemies();services.stop(c);s.bossClass=null;s.classLoading=false;
  if(c){restoreMin(c);if(attr(c.pawn,'Health')>0)setAttr(c.pawn,'Health',attr(c.pawn,'Health_Max'));if(point)teleport(c,point);}
  s.result=reason;s.phase='idle';s.boss=null;s.enemy=null;s.enemies=[];s.plan=null;status();
 }
 function startChallenge(ids=s.selection){
  const c=context();
  if(!c||!s.closed||!s.battle||!s.arrival||s.phase!=='idle'||original.active)return false;
  if(distance(c.location,s.arrival.location)>1000||attr(c.pawn,'Health')<=0)return false;
  let plan;try{plan=planTools.snapshot(ids,catalog,s.multipliers,s.musicEnabled);}catch(_){return false;}
  s.generation++;s.plan=plan;s.boss=plan.entries[0].boss;s.phase='queued';s.queuedAt=Date.now();s.result=null;s.incompleteFight=false;
  s.challengeMultipliers=plan.multipliers;s.baseStats=null;s.targetHealth=null;s.targetShachi=null;
  s.enemies=plan.entries.map(e=>({...e,phase:'loading',actor:null,klass:null}));
  const ticket=s.generation;
  for(const entry of s.enemies)loadClass(c,entry.boss.classPath,klass=>{if(s.generation===ticket&&s.phase==='queued'){entry.klass=klass;entry.phase='ready';}});
  status();return true;
 }
 function select(id){return startChallenge([id]);}
 function spawn(c){
  if(s.phase!=='queued'||!s.enemies.every(e=>valid(e.klass)))return;
  s.floorActor=c.pawn;s.floorHandle=scaling.holdFloor(c.pawn);
  const points=planTools.formation(s.battle.location,s.battle.rotation.Yaw,s.enemies.length);
  for(const entry of s.enemies){
  const t=new UE.Transform();t.SetLocation(vec(s.battle.location));
  const enemy=UE.SGameAIFunctionLibrary.SpawnActorDeferred(c.world,entry.klass,t,UE.ESpawnActorCollisionHandlingMethod.AlwaysSpawn);
  entry.actor=own(enemy);entry.path=UE.KismetSystemLibrary.GetPathName(enemy);
  const floor=ground(c,points[entry.index]),capsule=enemy.GetComponentByClass(UE.CapsuleComponent.StaticClass());
  const half=valid(capsule)?capsule.GetScaledCapsuleHalfHeight():100;
  t.SetLocation(new UE.Vector(floor.X,floor.Y,floor.Z+half+10));
  const tags=UE.BlueprintGameplayTagLibrary.MakeGameplayTagContainerFromTag(tag('CharacterType.AI.ExcludeFromBossRecord'));
  UE.AbilitySystemBlueprintLibrary.AddLooseGameplayTags(enemy,tags,false);
  UE.GameplayStatics.FinishSpawningActor(enemy,t);
  const asc=UE.AbilitySystemBlueprintLibrary.GetAbilitySystemComponent(enemy);
  if(!asc.HasMatchingGameplayTag(tag('CharacterType.AI.ExcludeFromBossRecord')))UE.AbilitySystemBlueprintLibrary.AddLooseGameplayTags(enemy,tags,false);
  entry.recordExcluded=asc.HasMatchingGameplayTag(tag('CharacterType.AI.ExcludeFromBossRecord'));
  if(!entry.recordExcluded)throw Error('Practice boss record exclusion was not applied');
  enemy.SpawnDefaultController();enemy.SetActorHiddenInGame(true);enemy.SetActorEnableCollision(false);entry.phase='initializing';
  }
  s.enemy=s.enemies[0].actor;s.recordExcluded=s.enemies.every(e=>e.recordExcluded);
  s.phase='initializing';s.spawnedAt=Date.now();status();
 }
 function openMenu(){
  const c=context();if(!c||!s.battle||!valid(s.menuClass)||s.menuOpening||s.menus.size||s.phase!=='idle')return false;
  s.menuOpening=true;hideTip();
  s.menuOpeningAt=Date.now();
  try{
  const action=UE.AsyncAction_PushContentToLayerForPlayer.PushContentToLayerForPlayer(c.pc,UE.KismetSystemLibrary.Conv_SoftClassPathToSoftClassRef(UE.KismetSystemLibrary.MakeSoftClassPath('/Game/PBZContent/UI/InGame/Bell/W_BellMenu.W_BellMenu_C')),tag('UI.Layer.Menu'),false);
  if(!valid(action)){s.menuOpening=false;return false;}s.menuPush=action;
  action.BeforePush.Add(widget=>{s.menuPush=null;widget.__codexRiftArenaMenu=true;});
  action.AfterPush.Add(widget=>{s.menuOpening=false;});
  action.Activate();return true;
  }catch(e){s.menuOpening=false;s.menuPush=null;throw e;}
 }
 function cleanup(){
  hideTip();if(valid(s.menuPush))s.menuPush.Cancel();s.menuPush=null;
  for(const menu of s.menus){try{menu.DeactivateWidget();}catch(_){}}s.menus.clear();
  destroyEnemies();services.stop(context());s.enemies=[];s.plan=null;
  for(const actor of s.actors)if(valid(actor))actor.K2_DestroyActor();s.actors=[];
  const c=context();restoreMin(c);
  const old=s.portalOriginal;if(old&&valid(old.actor)){old.actor.SetActorHiddenInGame(old.hidden);old.actor.SetActorEnableCollision(old.collision);if(valid(old.actor.StaticMesh)&&old.meshVisible!==null)old.actor.StaticMesh.SetVisibility(old.meshVisible,true);}
  s.portalOriginal=null;s.portal=null;s.enemy=null;s.streaming=null;s.streamingLoading=false;s.bellCreated=false;s.meshLoading=false;
  s.phase=original.active?'original':'idle';s.generation++;s.worldGeneration++;s.entrance=null;s.arrival=null;s.battle=null;s.bellPoint=null;s.closed=false;s.menuOpening=false;
 }
 const stopEmergency=require('./EmergencyReturn').start(()=>{
  if(original.active)return true;const c=context();return !!(c&&s.arrival&&(s.phase!=='idle'||distance(c.location,s.arrival.location)<20000));
 },()=>{if(original.active)original.requestReturn();else finish('已清空挑战并返回铃铛');},e=>{const error=String(e);if(!s.errors.includes(error))s.errors.push(error);});
 let next=0,nextStatus=0,eDown=false;
 s.timer=setInterval(()=>{
  try{
   const c=context();original.tick(c);if(!c)return;
   if(c.key!==s.world||c.time<s.lastTime-0.5){cleanup();s.world=c.key;s.nextSnapshot=0;s.initialAssets=false;}
   s.lastTime=c.time;
   if(original.active){if(Date.now()>=nextStatus){nextStatus=Date.now()+3000;status();}return;}
   if(!/PBZ_Xigu_WP$/.test(c.map))return;
   const now=Date.now();
   if(s.menuOpening&&now-s.menuOpeningAt>8000&&!s.menus.size){if(valid(s.menuPush))s.menuPush.Cancel();s.menuPush=null;s.menuOpening=false;}
   if(!s.initialAssets){s.initialAssets=true;loadClass(c,'/Game/PBZContent/UI/FrontEnd/WB_TextTipsObj.WB_TextTipsObj_C',x=>s.tipClass=x);loadClass(c,'/Game/PBZContent/UI/InGame/Bell/W_BellMenu.W_BellMenu_C',x=>s.menuClass=x);}
   if(now>=next){next=now+1500;s.closed=readClosed(c);findAnchors(c);if(s.closed&&s.arrival&&((s.entrance&&distance(c.location,s.entrance.location)<3000)||distance(c.location,s.arrival.location)<20000)){prepare(c);if(streamed())makeBell(c);}}
   const e=new UE.Key();e.KeyName='E';const pressed=c.pc.IsInputKeyDown(e);
   if(attr(c.pawn,'Health')<=0)return;
   if(c.blocked){eDown=pressed;hideTip();if(now>=nextStatus){nextStatus=now+3000;status();}return;}
   if(s.closed&&s.phase==='idle'&&!s.menus.size&&!s.menuOpening){
    const nearDoor=s.entrance&&distance(c.location,s.entrance.location)<220;
    const nearBell=s.bellPoint&&distance(c.location,s.bellPoint)<360;
    if(nearDoor){tip(c,streamed()?'E  进入影境再战':'影境正在准备…');if(pressed&&!eDown)enter();}
    else if(nearBell){tip(c,(s.result?s.result+'\n':'')+'E  影境再战');if(pressed&&!eDown)openMenu();}
    else hideTip();
   }
   eDown=pressed;
   if(s.phase==='queued'){
    tip(c,'已选择 '+s.enemies.length+' 个 Boss（生命 ×'+s.challengeMultipliers.health+' / 杀气 ×'+s.challengeMultipliers.shachi+' / 半伤 ×'+s.challengeMultipliers.damage+'），进入庭院开始；F9 返回');
    if(!s.enemies.every(e=>valid(e.klass))&&now-s.queuedAt>30000){finish('Boss 资源暂时不可用，可重新选择');return;}
    if(!s.battle){finish('原生挑战位置暂时不可用');return;}
    else if(distance(c.location,s.battle.location)<2800)spawn(c);
   }else if(s.phase==='initializing'){
    if(Date.now()-s.spawnedAt>20000){finish('Boss 加载失败，可重新选择');return;}
    if(s.enemies.every(e=>valid(e.actor)&&attr(e.actor,'Health_Max')>0)&&now-s.spawnedAt>500){
     const radii=s.enemies.map(e=>{const capsule=e.actor.GetComponentByClass(UE.CapsuleComponent.StaticClass());return valid(capsule)?capsule.GetScaledCapsuleRadius():100;});
     const points=planTools.formation(s.battle.location,s.battle.rotation.Yaw,s.enemies.length,Math.max(...radii));
     const r=s.battle.rotation;
     for(const entry of s.enemies){
      const enemy=entry.actor,floor=ground(c,points[entry.index]),capsule=enemy.GetComponentByClass(UE.CapsuleComponent.StaticClass());
      const half=valid(capsule)?capsule.GetScaledCapsuleHalfHeight():100;
      UE.PBZBlueprintFunctionLibrary.PBZActorTeleportTo(enemy,new UE.Vector(floor.X,floor.Y,floor.Z+half+20),new UE.Rotator(r.Pitch,r.Yaw,r.Roll),false,true);
      const result=scaling.apply(enemy,c.pawn,s.challengeMultipliers);entry.baseStats=result.base;entry.stats=result.stats;entry.scaleHandles=result.handles;
      entry.floorHandle=scaling.holdFloor(enemy);
     }
     s.baseStats=s.enemies[0].baseStats;s.targetHealth=s.enemies[0].stats.health;s.targetShachi=s.enemies[0].stats.shachi;
     services.start(c,s.plan,s.enemies,a=>ownedBy(a,new Set(s.enemies.map(e=>e.path))));
     for(const entry of s.enemies){entry.actor.SetActorHiddenInGame(false);entry.actor.SetActorEnableCollision(true);entry.phase='fighting';}
     s.phase='fighting';hideTip();status();
    }
   }else if(s.phase==='fighting'){
    services.tick(c);
    if(attr(c.pawn,'Health')<=1.01)finish('本次挑战结束');
    else{
     for(const entry of s.enemies){
      if(entry.phase!=='fighting')continue;
      if(!valid(entry.actor)){entry.phase='vanished';s.incompleteFight=true;destroyEnemies([entry]);}
      else if(attr(entry.actor,'Health')<=1.01){entry.phase='defeated';destroyEnemies([entry]);}
     }
     if(s.enemies.every(e=>e.phase!=='fighting'))finish(s.incompleteFight?'本次挑战已结束':'挑战成功');
     else if(s.battle&&(Math.abs(c.location.Z-s.battle.location.Z)>1800||distance(c.location,s.battle.location)>13000))finish('已返回挑战铃铛');
    }
   }
   if(now>=nextStatus){nextStatus=now+3000;status();}
  }catch(e){const error=String(e.stack||e);if(s.errors[s.errors.length-1]!==error)s.errors.push(error);try{if(['initializing','fighting','queued'].includes(s.phase))finish('挑战暂时无法开始');status();}catch(_){} }
 },100);
 s.select=select;s.enter=enter;s.finish=finish;s.openMenu=openMenu;s.context=context;s.status=status;
 s.startChallenge=startChallenge;s.returnToBell=()=>{if(original.active)return original.requestReturn();finish('已清空挑战并返回铃铛');return true;};
 s.startMode=mode=>{
  if(mode==='arena')return startChallenge();
  if(!['original-battle','original-story'].includes(mode)||s.phase!=='idle'||s.selection.length!==1)return false;
  const c=context();if(!c||!s.arrival||distance(c.location,s.arrival.location)>1000||attr(c.pawn,'Health')<=1)return false;
  const profile=encounters[s.selection[0]];if(!profile){s.result='该 Boss 的原生场地信息尚不可用';return false;}
  const plan={...planTools.snapshot(s.selection,catalog,s.multipliers,s.musicEnabled),mode};
  if(!original.start(c,plan,profile))return false;
  hideTip();s.phase='original';s.result=null;status();return true;
 };
 s.addBoss=id=>s.phase==='idle'&&planTools.addBoss(s.selection,id,catalog);
 s.removeBoss=index=>s.phase==='idle'&&planTools.removeBoss(s.selection,index);
 s.clearSelection=()=>{if(s.phase!=='idle')return false;s.selection=[];return true;};
 s.setMusicEnabled=enabled=>{if(s.phase!=='idle')return false;s.musicEnabled=!!enabled;return true;};
 s.setMultiplier=(field,value)=>{
  if(s.phase!=='idle'||!['health','shachi','damage'].includes(field))return false;
  try{s.multipliers[field]=multiplier(value);return true;}catch(_){return false;}
 };
 s.returnOutside=()=>{
  const c=context();if(!c)return false;
  const bell=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.BellManager.StaticClass());
  const point=bell.GetBellLocationFromBellID('Bell_NLES_014');
  finish('已退出挑战',{location:{X:point.X,Y:point.Y,Z:point.Z+130},rotation:rot(bell.GetTeleportRotationFromBellID('Bell_NLES_014'))});return true;
 };
 s.onMenu=menu=>{s.menus.add(menu);require('./RiftMenu').attach(menu,s,catalog,s.lastMenuPage||0);};
 s.onMenuClosed=menu=>{require('./RiftMenu').detach(menu);s.menus.delete(menu);};
 s.onMenuBack=menu=>require('./RiftMenu').back(menu);
 s.original=original;s.canReload=()=>s.phase==='idle'&&!original.active;s.stop=()=>{if(original.active)throw Error('Return from original encounter before unloading the mod');stopEmergency();clearInterval(s.timer);cleanup();delete globalThis[KEY];};
 status();return s;
}
module.exports={start,context,attr,setAttr};
