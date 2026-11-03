"use strict";
const UE=require('ue');
const musicCatalog=require('./MusicCatalog');
function valid(o){try{return !!o&&UE.KismetSystemLibrary.IsValid(o);}catch(_){return false;}}
function tag(name){const value=new UE.GameplayTag();value.TagName=name;return value;}
class CombatServices {
 constructor(){this.info={active:false,modifiedHits:0,errors:[]};}
 start(c,plan,entries,isOwned){
  this.stop(c);this.active=true;this.worldKey=c.key;
  this.info={active:true,enabled:plan.musicEnabled,boss:plan.musicBoss.name,damageFactor:plan.damageFactor,modifiedHits:0,errors:[]};
  const action=UE.AbilityAsync_WaitGameplayEvent.WaitGameplayEventToActor(c.pawn,tag('GameplayEvent.Damage.Pretake'),false,true);
  if(!valid(action))throw Error('Native damage listener could not be created');
  this.damageAction=action;
  this.onDamage=event=>{
   if(!this.active)return;
   try{
    const payload=event.OptionalObject;
    if(!valid(payload)||!payload.IsA(UE.DamagePreTakePayload.StaticClass())||payload.TargetActor!==c.pawn||!isOwned(payload.GetDamageSourceOwner()))return;
    payload.ApplyModifyToChildren(tag('Damage.Damage.Target.GeneralDamage'),UE.EGenericValueModifyType.Mult,plan.damageFactor);
    this.info.modifiedHits++;
   }catch(e){const error=String(e);if(!this.info.errors.includes(error))this.info.errors.push(error);}
  };
  action.EventReceived.Add(this.onDamage);action.Activate();
  this.startMusic(c,plan);
 }
 startMusic(c,plan){
  const profile=musicCatalog[plan.musicBoss.id];
  const music=UE.SubsystemBlueprintLibrary.GetWorldSubsystem(c.world,UE.MusicSubsystem.StaticClass());
  if(!valid(music))throw Error('Native music subsystem is unavailable');
  this.music=music;this.previousUiFlag=music.bDisableBossMusicOnUI;music.bDisableBossMusicOnUI=false;
  if(plan.originalMap&&plan.musicEnabled){this.info.nativeMapMusic=true;return;}
  if(!plan.musicEnabled){music.DisableGameplayMusic(true);this.mutedOwned=true;}
  if(plan.musicEnabled&&!profile)throw Error('Original boss music profile is unavailable: '+plan.musicBoss.id);
  const transform=new UE.Transform();transform.SetLocation(c.pawn.K2_GetActorLocation());
  const volume=UE.SGameAIFunctionLibrary.SpawnActorDeferred(c.world,UE.PBZMusicVolume.StaticClass(),transform,UE.ESpawnActorCollisionHandlingMethod.AlwaysSpawn);
  if(!valid(volume))throw Error('Native music volume could not be created');
  this.volume=volume;volume.Tags.Add('CodexRiftArenaOwned');volume.SetActorEnableCollision(false);
  volume.Priority=100000;volume.bUseCombatSetting=true;volume.bEnableMusicConfig=true;volume.bEnableTagOverride=false;
  volume.bBackToNormalWhenSpecialEnemyCleared=false;volume.bKeepNormalBattleMusicOnLeave=false;
  if(plan.musicEnabled){
   const event=UE.Object.Load(profile.event),state=UE.Object.Load(profile.state);
   if(!valid(event)||!valid(state))throw Error('Original boss music assets could not be loaded');
   volume.SoundEvent=event;volume.StateValue=state;volume.EnemyStateValue=state;volume.NoEnemyStateValue=state;
   this.event=event;this.state=state;this.info.event=profile.event;this.info.state=profile.state;this.info.sourceVolume=profile.sourceVolume;
  }
  UE.GameplayStatics.FinishSpawningActor(volume,transform);volume.SetActorHiddenInGame(true);music.AddMusicVolume(volume);music.UpdateGameplayMusic(false);
  if(plan.musicEnabled)music.PlayMusicAndSetState(this.event,this.state,UE.EMusicType.CombatMusic,true);
  else music.ClearMusic(0.15,true,false);
  this.nextMusicCheck=0;
 }
 tick(c){
  if(!this.active||!valid(this.music)||!c||c.key!==this.worldKey||Date.now()<this.nextMusicCheck)return;
  this.nextMusicCheck=Date.now()+500;
  if(this.info.nativeMapMusic)return;
  if(this.info.enabled){
   if(this.music.CurPlayingEvent_Gameplay!==this.event)this.music.PlayMusicAndSetState(this.event,this.state,UE.EMusicType.CombatMusic,true);
   else this.music.SetMusicState(this.state,UE.EMusicType.CombatMusic,true);
  }else{this.music.DisableGameplayMusic(true);if(this.music.CurPlayingID_Gameplay)this.music.ClearMusic(0.15,true,false);}
 }
 stop(c){
  this.active=false;
  const action=this.damageAction;this.damageAction=null;
  if(valid(action)){try{if(this.onDamage)action.EventReceived.Remove(this.onDamage);}catch(_){}try{action.EndAction();}catch(_){}}
  this.onDamage=null;
  const music=this.music,volume=this.volume;this.music=null;this.volume=null;
  if(valid(music)){
   if(this.mutedOwned)try{music.DisableGameplayMusic(false);}catch(_){}
   try{if(valid(volume))music.RemoveMusicVolume(volume,true);}catch(_){}
   if(c&&c.key===this.worldKey){try{music.bDisableBossMusicOnUI=this.previousUiFlag;music.UpdateGameplayMusic(true);}catch(_){}}
  }
  if(valid(volume))try{volume.K2_DestroyActor();}catch(_){}
  this.event=null;this.state=null;this.info.active=false;
  this.mutedOwned=false;
 }
 status(){return {...this.info,playingId:valid(this.music)?this.music.CurPlayingID_Gameplay:null,errors:this.info.errors.slice()};}
}
module.exports={CombatServices};
