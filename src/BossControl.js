"use strict";
const UE=require('ue'),p=require('puerts'),cpp=require('cpp');
const profile=require('./MoYuanProfile'),{BossComboController,ActivePlayClock}=require('./BossComboController');
const scaling=require('./BossScaling');
const KEY='__CodexBossControl',SOURCE='CodexBossControl';
const valid=o=>{try{return !!o&&UE.KismetSystemLibrary.IsValid(o);}catch(_){return false;}};
const path=o=>valid(o)?UE.KismetSystemLibrary.GetPathName(o):'';
const vec=o=>new UE.Vector(o.X,o.Y,o.Z);
const xyz=o=>({X:o.X,Y:o.Y,Z:o.Z});
function tag(name){const t=new UE.GameplayTag();t.TagName=name;return t;}
function attr(actor,name){return UE.PBZBlueprintFunctionLibrary.GetAttributeFromCharacter(actor,UE.PBZBlueprintFunctionLibrary.MakeAttribute(name,UE.BasicAttributeSet.StaticClass()));}
function setAttr(actor,name,value){UE.AttributeUtils.ModifyCharacterAttributeValue(actor,UE.PBZBlueprintFunctionLibrary.MakeAttribute(name,UE.BasicAttributeSet.StaticClass()),UE.EGameplayModOp.Override,value);}
function raw(){
 const world=UE.PuertsServerUtils.GetPlayWorld();if(!valid(world))return null;
 const gi=UE.GameplayStatics.GetGameInstance(world),pc=UE.GameplayStatics.GetPlayerController(world,0);if(!valid(gi)||!valid(pc))return null;
 return {world,gi,pc,pawn:pc.K2_GetPawn(),time:UE.GameplayStatics.GetTimeSeconds(world),loading:gi.IsLoadingLevel};
}
function start(config){
 if(globalThis[KEY])return globalThis[KEY];
 const s={active:false,phase:'off',classes:new Map(),errors:[],bindings:{toggle:'F7',panel:'F6',light:'LeftMouseButton',heavy:'RightMouseButton',dodge:'SpaceBar',lock:'MiddleMouseButton',nextTarget:'Tab',forward:'W',back:'S',left:'A',right:'D',slots:['Q','E','R','LeftControl']},keys:new Map(),generation:0,settingsSlot:0,settingsIndex:0};
 globalThis[KEY]=s;
 function error(e){const text=String(e.stack||e);if(s.errors.at(-1)!==text)s.errors.push(text);if(s.errors.length>12)s.errors.shift();}
 function key(c,name){const k=new UE.Key();const digits=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];k.KeyName=/^[0-9]$/.test(name)?digits[Number(name)]:name;return c.pc.IsInputKeyDown(k)||c.pc.WasInputKeyJustPressed(k);}
 function edge(c,name){const pressed=key(c,name),before=s.keys.get(name)||false;s.keys.set(name,pressed);return !!s.inputAllowed&&pressed&&!before;}
 function loadSettings(){
  const ref=p.$ref('');if(!UE.EasyCsv.LoadStringFromLocalFile(config.settingsFile,ref))return;
  try{const d=JSON.parse(p.$unref(ref));if(Array.isArray(d.slots))d.slots.slice(0,4).forEach((id,index)=>combo.assign(index,id));
   for(const [name,value] of Object.entries(d.bindings||{})){if(typeof s.bindings[name]==='string'&&typeof value==='string'&&/^[A-Za-z0-9_]{1,32}$/.test(value))s.bindings[name]=value;}
   if(Array.isArray(d.bindings?.slots)&&d.bindings.slots.length===4&&d.bindings.slots.every(v=>typeof v==='string'&&/^[A-Za-z0-9_]{1,32}$/.test(v)))s.bindings.slots=d.bindings.slots.slice();
  }catch(e){error(e);}
 }
 function saveSettings(){UE.EasyCsv.SaveStringToFileWithFullPath(JSON.stringify({version:config.version,slots:combo.slots,bindings:s.bindings},null,2),config.settingsFile);}
 function specFor(id){
  if(!valid(s.boss))return null;const items=s.boss.AbilitySystemComponent.ActivatableAbilities.Items;
  for(let i=0;i<items.Num();i++){const item=items.Get(i);if(path(item.Ability.GetClass())===profile.abilities[id]?.classPath)return item;}
  return null;
 }
 const port={
  isRunning(token){const item=specFor(token.id);return !!(item&&item.ActiveCount>0);},
  cooldown(description){return Math.max(3,Math.ceil(description.duration));},
  activate(description,chaining){
   if(!s.active||s.panel||!valid(s.boss))return null;
   const klass=s.classes.get(description.classPath);if(!valid(klass))return null;
   aim(s.target);
   const asc=s.boss.AbilitySystemComponent;
   let spec=specFor(description.id);if(!spec){asc.K2_GiveAbility(klass,1,-1);spec=specFor(description.id);}
   if(!spec)return null;
   let ok=false;
   if(chaining){
    const input=UE.Object.Load(description.input);ok=s.boss.GetAbilityInputComponent().TryActivateExternalActionAbilityByClass(klass,input,0);
    if(!ok&&combo.current){
     // Boss actions lack the player's external-input registrations. The
     // controller calls this only inside the native authored combo window.
     // End only our preceding action, then use normal activation checks.
     const previous=specFor(combo.current.id);
     if(previous&&previous.ActiveCount>0){const handle=new UE.GameplayAbilitySpecHandle();handle.Handle=previous.Handle.Handle;asc.ClearAbility(handle);}
     spec=specFor(description.id);if(!spec){asc.K2_GiveAbility(klass,1,-1);spec=specFor(description.id);}
     if(spec)ok=asc.TryActivateAbility(spec.Handle,true);
    }
   }
   else ok=asc.TryActivateAbility(spec.Handle,true);
   if(ok){
    let yaw=s.yaw;
    if(valid(s.target)){const a=s.boss.K2_GetActorLocation(),b=s.target.K2_GetActorLocation();yaw=Math.atan2(b.Y-a.Y,b.X-a.X)*180/Math.PI;}
    s.boss.K2_SetActorRotation(new UE.Rotator(0,yaw,0),false);
    s.lastCast=description.id;s.castCount=(s.castCount||0)+1;return {id:description.id};
   }return null;
  }
 };
 const combo=new BossComboController(port,profile);s.combo=combo;loadSettings();
 const playClock=new ActivePlayClock();
 function clearTip(){if(s.tipHandle&&valid(s.tipSystem))try{s.tipSystem.UnregisterExtension(s.tipHandle);}catch(_){}s.tipHandle=null;s.tipText=null;s.tipSystem=null;}
 function tip(c,text){
  if(text===s.tipText)return;if(!valid(s.tipClass))return;clearTip();
  const sys=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.UIExtensionSubsystem.StaticClass());
  const data=UE.NewObject(s.tipClass);data.ShowText=cpp.FText.FromString(text);
  s.tipSystem=sys;s.tipHandle=sys.K2_RegisterExtensionAsData(tag('UI.ExtensionPoint.TextTips'),data,500);s.tipText=text;
 }
 function preload(c){
  if(s.loadingAssets)return;s.loadingAssets=true;let pending=0;
  const paths=[profile.bossClass,...Object.values(profile.abilities).map(a=>a.classPath),'/Game/PBZContent/UI/FrontEnd/WB_TextTipsObj.WB_TextTipsObj_C'];
  for(const asset of paths){if(valid(s.classes.get(asset)))continue;pending++;
   UE.PBZAssetManager.AsyncLoadClass(c.gi,UE.KismetSystemLibrary.MakeSoftObjectPath(asset),p.toOneShotDelegate(klass=>{if(valid(klass)){s.classes.set(asset,klass);if(/WB_TextTipsObj/.test(asset))s.tipClass=klass;}else error(Error('Cannot load '+asset));if(--pending===0)s.loadingAssets=false;}));
  }
  if(!pending)s.loadingAssets=false;
 }
 function pausePeak(){
  const peak=globalThis.__CodexHunPeak_v1?.controller;s.peakWanted=!!peak?.enabled;
  if(peak?.enabled){peak.toggle();peak.tick();}
 }
 function resumePeak(restore){const peak=globalThis.__CodexHunPeak_v1?.controller;if(restore&&s.peakWanted&&peak&&!peak.enabled)peak.toggle();s.peakWanted=false;}
 function enter(){
  if(s.phase!=='off')return false;const c=raw();if(!c||c.loading||!valid(c.pawn)||! /BP_Renewal_Hun(?:_Climax|_Young)?\./i.test(path(c.pawn.GetClass()))||attr(c.pawn,'Health')<=1){s.enterDenied='player-not-ready';return false;}
  const seq=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.PBZLevelSequenceManager.StaticClass());
  if(UE.GameplayStatics.IsGamePaused(c.world)||(valid(seq)&&seq.IsInSequence())){s.enterDenied='paused-or-cinematic';return false;}s.enterDenied=null;
  preload(c);if(s.loadingAssets){s.pendingEnter=true;s.phase='loading';return true;}
  s.pendingEnter=false;s.generation++;s.world=c.world;s.worldPath=path(c.world);s.player=c.pawn;s.pc=c.pc;s.gi=c.gi;s.initialTime=c.time;s.target=null;s.targetBindings=new Map();s.lockBindings=new Map();s.nextTargetScan=0;
  s.save=UE.SubsystemBlueprintLibrary.GetGameInstanceSubsystem(c.world,UE.PBZSaveLoadSubsystem.StaticClass());
  s.save.EnterSaveVeto(SOURCE,UE.EPBZSaveVetoReason.ModeGate);s.veto=true;
  pausePeak();
  s.playerState={hidden:c.pawn.bHidden,collision:c.pawn.GetActorEnableCollision(),frozen:c.pawn.IsCharacterFrozen(),disableMovement:c.pawn.DisableMovement,disableCollision:c.pawn.DisableCollision,actorTick:c.pawn.IsActorTickEnabled(),movementTick:c.pawn.CharacterMovement.IsComponentTickEnabled(),movementMode:c.pawn.CharacterMovement.MovementMode,gravity:c.pawn.CharacterMovement.GravityScale,autoCamera:c.pc.bAutoManageActiveCameraTarget,showCursor:c.pc.bShowMouseCursor,ratio:attr(c.pawn,'Health')/attr(c.pawn,'Health_Max')};
  const t=new UE.Transform();t.SetLocation(c.pawn.K2_GetActorLocation());t.SetRotation(UE.KismetMathLibrary.Conv_RotatorToQuaternion(c.pawn.K2_GetActorRotation()));
  const boss=UE.SGameAIFunctionLibrary.SpawnActorDeferred(c.world,s.classes.get(profile.bossClass),t,UE.ESpawnActorCollisionHandlingMethod.AlwaysSpawn);
  s.boss=boss;boss.Tags.Add('CodexBossControlOwned');boss.bExcludeFromCodex=true;
  const exclude=UE.BlueprintGameplayTagLibrary.MakeGameplayTagContainerFromTag(tag('CharacterType.AI.ExcludeFromBossRecord'));UE.AbilitySystemBlueprintLibrary.AddLooseGameplayTags(boss,exclude,false);
  UE.GameplayStatics.FinishSpawningActor(boss,t);boss.SpawnDefaultController();
  s.ai=boss.GetController();if(valid(s.ai))s.ai.GetSGameAIComponent().StopAI();
  boss.SetActorHiddenInGame(true);boss.SetActorEnableCollision(false);s.phase='initializing';s.spawnTime=c.time;return true;
 }
 function initialize(c){
  if(!valid(s.boss))throw Error('Boss actor disappeared during initialization');
  if(c.time-s.spawnTime>20)throw Error('Boss initialization timed out');
  if(c.time-s.spawnTime<0.5||!s.boss.IsCompletedLoad()||attr(s.boss,'Health_Max')<=0)return;
  const b=s.boss,asc=b.AbilitySystemComponent,remove=[];
  const items=asc.ActivatableAbilities.Items;
  for(let i=0;i<items.Num();i++){const item=items.Get(i),name=path(item.Ability.GetClass());if(/GA_MoYuan_Passive|MonsterSubtitles|GA_MobUtilitiesPassive/.test(name))remove.push(item.Handle.Handle);}
  for(const value of remove){const handle=new UE.GameplayAbilitySpecHandle();handle.Handle=value;asc.ClearAbility(handle);}
  const effects=asc.GetActiveEffectsWithAllTags(new UE.GameplayTagContainer());
  for(let i=0;i<effects.Num();i++){const h=effects.Get(i),effect=UE.AbilitySystemBlueprintLibrary.GetGameplayEffectFromActiveEffectHandle(h);if(/\/GE_MoYuan_LockHealth\./.test(path(effect?.GetClass())))asc.RemoveActiveGameplayEffect(h,-1);}
  s.floorHandle=scaling.holdFloor(b);
  b.GetComponentByClass(UE.FactionComponent.StaticClass()).SetFaction(UE.FactionUtils.GetFaction(s.player));
  s.pc.Possess(b);if(s.pc.K2_GetPawn()!==b)throw Error('Player controller rejected boss possession');
  // Restart native input bindings with the new pawn; the Pawn argument is required.
  b.GetAbilityInputComponent().OnRestarted(b);
  const drivers=[];
  for(let i=0;i<asc.ActivatableAbilities.Items.Num();i++){const item=asc.ActivatableAbilities.Items.Get(i);if(/GA_LocomotionDriver/.test(path(item.Ability.GetClass())))drivers.push({handle:item.Handle.Handle,klass:item.Ability.GetClass()});}
  for(const driver of drivers){const handle=new UE.GameplayAbilitySpecHandle();handle.Handle=driver.handle;asc.ClearAbility(handle);const granted=asc.K2_GiveAbility(driver.klass,1,-1);asc.TryActivateAbility(granted,true);}
  // UnPossess runs the hero's native reset. Freeze only after it completes,
  // otherwise that reset re-enables gravity, collision and component ticks.
  s.player.FreezeCharacter(true);s.player.SetDisableMovement(true);s.player.SetDisableCollision(true);
  s.player.SetActorHiddenInGame(true);s.player.SetActorEnableCollision(false);s.player.CharacterMovement.StopMovementImmediately();s.player.CharacterMovement.DisableMovement();
  s.player.CharacterMovement.GravityScale=0;s.player.CharacterMovement.SetComponentTickEnabled(false);s.player.SetActorTickEnabled(false);
  UE.AbilitySystemBlueprintLibrary.RemoveLooseGameplayTags(b,UE.BlueprintGameplayTagLibrary.MakeGameplayTagContainerFromTag(tag('AI.ForceWalk')),false);
  const t=new UE.Transform();t.SetLocation(b.K2_GetActorLocation());s.camera=UE.GameplayStatics.FinishSpawningActor(UE.SGameAIFunctionLibrary.SpawnActorDeferred(c.world,UE.CameraActor.StaticClass(),t,UE.ESpawnActorCollisionHandlingMethod.AlwaysSpawn),t);
  s.camera.Tags.Add('CodexBossControlOwned');s.camera.CameraComponent.SetFieldOfView(80);
  const rotation=s.pc.GetControlRotation();s.yaw=rotation.Yaw;s.pitch=-12;
  s.pc.bAutoManageActiveCameraTarget=false;s.pc.bShowMouseCursor=false;s.pc.SetIgnoreLookInput(true);s.lookIgnored=true;
  s.pc.SetViewTargetWithBlend(s.camera,0,UE.EViewTargetBlendFunction.VTBlend_Linear,0,false);
  // Apply carried health after native possession/restart initialization.
  setAttr(b,'Health',attr(b,'Health_Max')*Math.max(0.001,s.playerState.ratio));
  b.SetActorHiddenInGame(false);b.SetActorEnableCollision(true);combo.reset();s.active=true;s.phase='active';s.lastTime=c.time;s.lastCast=null;s.castCount=0;
  for(const name of [s.bindings.light,s.bindings.heavy,s.bindings.dodge,s.bindings.lock,s.bindings.nextTarget,s.bindings.panel,'F8',...s.bindings.slots])s.keys.set(name,key(c,name));
 }
 function actors(c){const ref=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.PBZCharacter_NPC.StaticClass(),ref);const list=p.$unref(ref),out=[];
  for(let i=0;i<list.Num();i++){const a=list.Get(i);if(!valid(a)||a===s.boss||a.bHidden||attr(a,'Health')<=1)continue;if(UE.FactionUtils.GetFaction(a).TagName===UE.FactionUtils.GetFaction(s.boss).TagName)continue;out.push(a);}return out;
 }
 function target(c,next){
  if(valid(s.target)&&!next){s.target=null;aim(null);return;}
  const location=s.boss.K2_GetActorLocation(),candidates=actors(c).filter(a=>{const l=a.K2_GetActorLocation();return Math.hypot(l.X-location.X,l.Y-location.Y,l.Z-location.Z)<10000;});
  candidates.sort((a,b)=>{const aa=a.K2_GetActorLocation(),bb=b.K2_GetActorLocation();return Math.hypot(aa.X-location.X,aa.Y-location.Y)-Math.hypot(bb.X-location.X,bb.Y-location.Y);});
  const index=candidates.indexOf(s.target);s.target=candidates[next?(index+1)%Math.max(1,candidates.length):0]||null;aim(s.target);
 }
 function aim(actor){
  if(!valid(s.boss))return;const targeting=s.boss.GetTargetingComponent();if(!valid(targeting))return;
  // Native boss aim reads an AI blackboard, rather than player lock input.
  // Keep that data provider alive and feed it the player's selected opponent.
  const blackboard=valid(s.ai)?s.ai.Blackboard:null;
  for(const handler of [targeting.DefaultTargetHandler,targeting.CurrentHandler]){
   if(!valid(handler)||!/PBZ_TargetingHandler_AI/.test(path(handler.GetClass())))continue;
   if(valid(blackboard)){handler.Blackboard=blackboard;for(const name of [handler['Target Key'],handler.LastSensedActorKey]){const keyName=String(name||'');if(keyName&&keyName!=='None'&&keyName!=='undefined')blackboard.SetValueAsObject(keyName,valid(actor)?actor:null);}}
  }
  if(valid(actor)&&attr(actor,'Health')>1){const socket=new UE.ComponentSocket();socket.Component=actor.RootComponent;socket.SocketName='None';targeting.SetLockTarget(socket);}else{targeting.StopLockTarget();s.target=null;}
 }
 function retarget(c){
  if(c.time<s.nextTargetScan)return;s.nextTargetScan=c.time+0.5;
  const refs=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.PBZCharacter_NPC.StaticClass(),refs);const all=p.$unref(refs),hero=path(s.player),controlled=path(s.boss);
  for(let i=0;i<all.Num();i++){
   const actor=all.Get(i),controller=valid(actor)?actor.GetController():null;if(!valid(controller)||!controller.IsA(UE.AIController.StaticClass()))continue;
   const target=p.$ref(null);if(!UE.SGameAIFunctionLibrary.GetTargetActor(controller,target))continue;
   const current=path(p.$unref(target));if(current!==hero&&current!==controlled)continue;
   const bb=controller.Blackboard;if(!valid(bb))continue;let asset=bb.BlackboardAsset;const seen=new Set();
   while(valid(asset)&&!seen.has(path(asset))){seen.add(path(asset));
    for(let j=0;j<asset.Keys.Num();j++){const entry=asset.Keys.Get(j);if(!valid(entry.KeyType)||!entry.KeyType.IsA(UE.BlackboardKeyType_Object.StaticClass()))continue;
     const name=String(entry.EntryName);if(path(bb.GetValueAsObject(name))!==hero)continue;
     const id=path(bb)+'|'+name;if(!s.targetBindings.has(id))s.targetBindings.set(id,{bb,name});bb.SetValueAsObject(name,s.boss);
    }asset=asset.Parent;
   }
   if(path(actor.GetLockingTarget(false))===hero){const targeting=actor.GetTargetingComponent(),socket=new UE.ComponentSocket();socket.Component=s.boss.RootComponent;socket.SocketName='None';targeting.SetLockTarget(socket);s.lockBindings.set(path(actor),actor);}
  }
 }
 function restoreTargets(){
  if(valid(s.player)&&valid(s.boss)){
   const controlled=path(s.boss);
   for(const {bb,name} of s.targetBindings?.values()||[])if(valid(bb)&&path(bb.GetValueAsObject(name))===controlled)bb.SetValueAsObject(name,s.player);
   for(const actor of s.lockBindings?.values()||[])if(valid(actor)&&path(actor.GetLockingTarget(false))===controlled){const socket=new UE.ComponentSocket();socket.Component=s.player.RootComponent;socket.SocketName='None';actor.GetTargetingComponent().SetLockTarget(socket);}
  }
  s.targetBindings?.clear();s.lockBindings?.clear();
 }
 function cameraAndMovement(c,dt){
  const dx=p.$ref(0),dy=p.$ref(0);if(s.inputAllowed)c.pc.GetInputMouseDelta(dx,dy);s.yaw+=p.$unref(dx)*0.15;s.pitch=Math.max(-55,Math.min(35,s.pitch-p.$unref(dy)*0.15));
  const loc=s.boss.K2_GetActorLocation(),yaw=s.yaw*Math.PI/180,pitch=s.pitch*Math.PI/180,head={X:loc.X,Y:loc.Y,Z:loc.Z+100};
  if(valid(s.target)&&attr(s.target,'Health')>1){const l=s.target.K2_GetActorLocation();const desired=Math.atan2(l.Y-loc.Y,l.X-loc.X)*180/Math.PI;s.yaw+=(((desired-s.yaw+540)%360)-180)*Math.min(1,dt*7);}
  const y=s.yaw*Math.PI/180,desired={X:head.X-Math.cos(y)*Math.cos(pitch)*520,Y:head.Y-Math.sin(y)*Math.cos(pitch)*520,Z:head.Z-Math.sin(pitch)*520};
  const hit=p.$ref(new UE.HitResult()),ignore=UE.NewArray(UE.Actor);ignore.Add(s.boss);if(valid(s.player))ignore.Add(s.player);
  if(UE.KismetSystemLibrary.LineTraceSingle(c.world,vec(head),vec(desired),UE.ETraceTypeQuery.TraceTypeQuery1,false,ignore,UE.EDrawDebugTrace.None,hit,true)){const h=p.$unref(hit),n=h.ImpactNormal;desired.X=h.ImpactPoint.X+n.X*20;desired.Y=h.ImpactPoint.Y+n.Y*20;desired.Z=h.ImpactPoint.Z+n.Z*20;}
  s.camera.K2_SetActorLocation(vec(desired),false,p.$ref(new UE.HitResult()),true);s.camera.K2_SetActorRotation(new UE.Rotator(s.pitch,s.yaw,0),false);c.pc.SetControlRotation(new UE.Rotator(0,s.yaw,0));
  const f=Number(key(c,s.bindings.forward))-Number(key(c,s.bindings.back)),r=Number(key(c,s.bindings.right))-Number(key(c,s.bindings.left));
  if(s.inputAllowed&&(f||r)){const length=Math.max(1,Math.hypot(f,r));s.boss.AddMovementInput(new UE.Vector(Math.cos(y)*f-Math.sin(y)*r,Math.sin(y)*f+Math.cos(y)*r,0),1/length,true);}
 }
 function panel(c,open){
  if(open===!!s.panel)return;s.panel=open;
  if(open){s.pauseOwned=!UE.GameplayStatics.IsGamePaused(c.world);if(s.pauseOwned)UE.GameplayStatics.SetGamePaused(c.world,true);s.settingsIndex=Math.max(0,profile.skills.indexOf(combo.slots[s.settingsSlot]));}
  else{if(s.pauseOwned)UE.GameplayStatics.SetGamePaused(c.world,false);s.pauseOwned=false;saveSettings();clearTip();}
 }
 function restore(reason='已恢复主角',options={}){
  s.pendingEnter=false;if(s.phase==='off')return true;
  const c=raw();if(s.panel&&c)panel(c,false);s.generation++;
  if(s.moveIgnored&&valid(s.pc)){s.pc.SetIgnoreMoveInput(false);s.moveIgnored=false;}
  if(c&&c.world===s.world&&valid(s.player)&&valid(s.boss)&&c.pc.K2_GetPawn()===s.boss){
   const location=s.boss.K2_GetActorLocation(),rotation=s.boss.K2_GetActorRotation(),ratio=Math.max(0,Math.min(1,attr(s.boss,'Health')/attr(s.boss,'Health_Max')));
   s.boss.AbilitySystemComponent.ClearAllAbilities();c.pc.Possess(s.player);if(c.pc.K2_GetPawn()!==s.player)throw Error('Could not restore the original player');
   UE.PBZBlueprintFunctionLibrary.PBZActorTeleportTo(s.player,location,rotation,false,true);
   s.player.FreezeCharacter(s.playerState.frozen);s.player.SetDisableMovement(s.playerState.disableMovement);s.player.SetDisableCollision(s.playerState.disableCollision);
   s.player.CharacterMovement.GravityScale=s.playerState.gravity;s.player.CharacterMovement.SetMovementMode(s.playerState.movementMode,0);
   s.player.CharacterMovement.SetComponentTickEnabled(s.playerState.movementTick);s.player.SetActorTickEnabled(s.playerState.actorTick);
   s.player.SetActorHiddenInGame(s.playerState.hidden);s.player.SetActorEnableCollision(s.playerState.collision);setAttr(s.player,'Health',attr(s.player,'Health_Max')*ratio);
   s.lastRestore={bossRatio:ratio,mainHealth:attr(s.player,'Health'),mainMax:attr(s.player,'Health_Max')};
   c.pc.bAutoManageActiveCameraTarget=s.playerState.autoCamera;c.pc.bShowMouseCursor=s.playerState.showCursor;
   if(s.lookIgnored)c.pc.SetIgnoreLookInput(false);c.pc.SetViewTargetWithBlend(s.player,0,UE.EViewTargetBlendFunction.VTBlend_Linear,0,false);
  }else if(valid(s.player)&&s.playerState){s.player.FreezeCharacter(s.playerState.frozen);s.player.SetDisableMovement(s.playerState.disableMovement);s.player.SetDisableCollision(s.playerState.disableCollision);s.player.SetActorHiddenInGame(s.playerState.hidden);s.player.SetActorEnableCollision(s.playerState.collision);s.player.CharacterMovement.GravityScale=s.playerState.gravity;s.player.CharacterMovement.SetMovementMode(s.playerState.movementMode,0);s.player.CharacterMovement.SetComponentTickEnabled(s.playerState.movementTick);s.player.SetActorTickEnabled(s.playerState.actorTick);}
  restoreTargets();s.lookIgnored=false;s.active=false;clearTip();combo.reset();
  if(c&&c.world===s.world&&valid(s.boss)){
   const root=s.boss,refs=p.$ref(UE.NewArray(UE.Actor));UE.GameplayStatics.GetAllActorsOfClass(c.world,UE.Actor.StaticClass(),refs);const all=p.$unref(refs),children=[];
   for(let i=0;i<all.Num();i++){const a=all.Get(i);if(!valid(a)||a===root||a===s.player||a===c.pc||a===s.camera||a.IsA(UE.Pawn.StaticClass())||a.IsA(UE.Controller.StaticClass()))continue;
    const queue=[a],seen=new Set();let owned=false;
    while(queue.length&&seen.size<32){const item=queue.shift();if(item===root){owned=true;break;}if(!valid(item))continue;const id=path(item);if(seen.has(id))continue;seen.add(id);queue.push(item.GetOwner(),item.GetInstigator());}
    if(owned)children.push(a);
   }
   for(const child of children)if(valid(child))child.K2_DestroyActor();
  }
  if(valid(s.camera))s.camera.K2_DestroyActor();s.camera=null;
  if(valid(s.boss)){s.boss.SetActorEnableCollision(false);s.boss.K2_DestroyActor();}s.boss=null;s.floorHandle=null;
  if(valid(s.ai))s.ai.K2_DestroyActor();s.ai=null;
  if(s.veto&&valid(s.save))s.save.ExitSaveVeto(SOURCE);s.veto=false;
  resumePeak(options.restorePeak!==false);s.phase='off';s.result=reason;s.player=null;s.world=null;return true;
 }
 function status(){
  const c=raw(),data={mod:'CodexBossControl',version:config.version,at:new Date().toISOString(),active:s.active,phase:s.phase,result:s.result,enterDenied:s.enterDenied,rawPawn:valid(c?.pawn)?path(c.pawn.GetClass()):null,paused:c?UE.GameplayStatics.IsGamePaused(c.world):null,loading:c?.loading,boss:path(s.boss),player:path(s.player),hiddenHero:valid(s.player)?{health:attr(s.player,'Health'),location:xyz(s.player.K2_GetActorLocation()),frozen:s.player.IsCharacterFrozen(),movementTick:s.player.CharacterMovement.IsComponentTickEnabled()}:null,target:path(s.target),lastCast:s.lastCast,castCount:s.castCount||0,health:valid(s.boss)?attr(s.boss,'Health'):null,healthMax:valid(s.boss)?attr(s.boss,'Health_Max'):null,healthMin:valid(s.boss)?attr(s.boss,'Health_Min'):null,lastRestore:s.lastRestore,combo:combo.status(c?.time||0),panel:!!s.panel,saveVeto:!!s.veto,errors:s.errors.slice()};
  data.combo=combo.status(playClock.now);data.entryRatio=s.playerState?.ratio;data.rawHealth=valid(c?.pawn)?attr(c.pawn,'Health'):null;
  UE.EasyCsv.SaveStringToFileWithFullPath(JSON.stringify(data,null,2),config.statusFile);return data;
 }
 s.enter=enter;s.restore=restore;s.toggle=()=>s.phase==='off'?enter():restore();s.status=status;s.request=(kind,value)=>s.active&&combo.request(kind,value);s.canReload=()=>s.phase==='off';
 s.openSettings=()=>{const c=raw();if(!c||!s.active)return false;panel(c,!s.panel);return true;};
 let nextStatus=0;
 s.timer=setInterval(()=>{
  try{
   let c=raw();if(!c)return;playClock.update(c.world,c.time);s.inputAllowed=config.acceptPlayerInput!==false&&UE.PBZBlueprintFunctionLibrary.IsFocusOnViewport(c.pc);
   if(edge(c,s.bindings.toggle))s.toggle();
   if(s.phase==='loading'&&!s.loadingAssets){s.phase='off';if(s.pendingEnter)enter();}
   if(s.phase==='initializing'){initialize(c);c=raw();if(!c)return;}
   if(s.active){
   if(c.world!==s.world||c.time<s.initialTime||!valid(s.boss)||!valid(s.player)||c.pawn!==s.boss||c.loading){restore('场景变化，已退出堡主状态');return;}
    const seq=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.PBZLevelSequenceManager.StaticClass());
    if(valid(seq)&&seq.IsInSequence()){restore('剧情演出，已恢复主角');return;}
    const ignoreMovement=!s.inputAllowed||!!s.panel;if(ignoreMovement!==!!s.moveIgnored){c.pc.SetIgnoreMoveInput(ignoreMovement);s.moveIgnored=ignoreMovement;}
    if(edge(c,'F8')){restore('已恢复主角，可使用魂·巅峰',{restorePeak:false});return;}
    if(edge(c,s.bindings.panel))panel(c,!s.panel);
    if(s.panel){
     for(let i=0;i<4;i++)if(edge(c,String(i+1))){s.settingsSlot=i;s.settingsIndex=profile.skills.indexOf(combo.slots[i]);}
     if(edge(c,'Left'))s.settingsIndex=(s.settingsIndex+profile.skills.length-1)%profile.skills.length;
     if(edge(c,'Right'))s.settingsIndex=(s.settingsIndex+1)%profile.skills.length;
     if(edge(c,'Enter')){combo.assign(s.settingsSlot,profile.skills[s.settingsIndex]);saveSettings();}
     if(edge(c,'Escape'))panel(c,false);
     tip(c,'堡主技能配置：1–4 选择槽位，← → 选择招式，Enter 装备，F6 关闭\n槽位 '+(s.settingsSlot+1)+'：'+profile.skills[s.settingsIndex].replace('GA_MoTian_','')+'\n当前：'+combo.slots.map(n=>n.replace('GA_MoTian_','')).join(' / '));
    }else if(!UE.GameplayStatics.IsGamePaused(c.world)){
     if(edge(c,s.bindings.light))combo.request('light');if(edge(c,s.bindings.heavy))combo.request('heavy');
     s.bindings.slots.forEach((name,index)=>{if(edge(c,name))combo.request('slot',index);});
     if(edge(c,s.bindings.dodge)){const direction=key(c,s.bindings.back)?'B':key(c,s.bindings.left)?'L':key(c,s.bindings.right)?'R':'F';combo.request('dodge',direction);}
     if(edge(c,s.bindings.lock))target(c,false);if(edge(c,s.bindings.nextTarget))target(c,true);
     if(valid(s.target)&&attr(s.target,'Health')<=1){s.target=null;aim(null);}
     const dt=Math.max(0,Math.min(0.1,c.time-(s.lastTime||c.time)));s.lastTime=c.time;retarget(c);cameraAndMovement(c,dt);combo.tick(playClock.now);
     const view=combo.status(playClock.now);
     tip(c,'魔渊  生命 '+Math.ceil(attr(s.boss,'Health'))+' / '+Math.ceil(attr(s.boss,'Health_Max'))+'  杀气 '+Math.ceil(attr(s.boss,'Shachi'))+' / '+Math.ceil(attr(s.boss,'Shachi_Max'))+'\nF7 恢复主角 / F6 配置技能 / F9 返回\n左键逐段连招 / 右键重击 / 空格闪避\n'+combo.slots.map((n,i)=>s.bindings.slots[i]+': '+n.replace('GA_MoTian_','')+(view.cooldowns[n]?' ('+view.cooldowns[n]+'秒)':'')).join('  '));
     if(attr(s.boss,'Health')<=1){restore('堡主生命耗尽，已恢复主角');return;}
    }
   }
   if(Date.now()>=nextStatus){nextStatus=Date.now()+1500;status();}
  }catch(e){error(e);try{restore('堡主状态异常，已恢复主角');status();}catch(cleanupError){error(cleanupError);}}
 },16);
 s.stop=()=>{restore('Mod 已停止');clearInterval(s.timer);delete globalThis[KEY];};status();return s;
}
module.exports={start,raw,attr,setAttr};
