"use strict";
const UE=require('ue'),p=require('puerts'),snap=require('./EncounterSnapshot');
const SOURCE='CodexRiftOriginalSession';
function valid(v){try{return !!v&&UE.KismetSystemLibrary.IsValid(v);}catch(_){return false;}}
function parse(value){const ok=p.$ref(false),out=p.$ref(new UE.JsonObjectWrapper());UE.JSONUtility.ParseStringToJson(JSON.stringify(value),ok,out);if(!p.$unref(ok))throw Error('Native JSON parsing failed');return p.$unref(out);}
function stringify(wrapper){const ok=p.$ref(false),out=p.$ref('');UE.JSONUtility.JsonToString(wrapper,ok,out);if(!p.$unref(ok))throw Error('Native JSON serialization failed');return String(p.$unref(out));}
function saveSubsystem(world){return UE.SubsystemBlueprintLibrary.GetGameInstanceSubsystem(world,UE.PBZSaveLoadSubsystem.StaticClass());}
class EncounterStorage {
 constructor(config){this.config=config;}
 checkpoint(c,done){
  const save=saveSubsystem(c.world),param=new UE.SaveGameParam();param.SaveSlotName='CodexRiftReturn';param.bSaveAdvanced=false;param.bShowSaveTip=false;
  this.save=save;this.continueSlot=String(save.GetContinueSlotName());this.returnSlot=param.SaveSlotName;
  // A prior interrupted instance may have left this mod's named gate registered.
  // Never remove gates owned by the game or another mod.
  save.ExitSaveVeto(SOURCE);this.hasVeto=false;
  this.advanced=JSON.parse(stringify(save.GetAdvancedSaveJsonObject()));
  const result=save.ForceSave(UE.EPBZSaveReason.ManualSave,param,p.toOneShotDelegate((slot,json,index,ok)=>{
   try{if(!ok)throw Error('Return checkpoint could not be saved');const snapshot=this.read(slot);if(!snap.healthy(snapshot))throw Error('Return checkpoint is incomplete');save.MarkLoadedSlotAsContinue(this.continueSlot);done(null,snapshot);}catch(e){done(e);}
  }));
  if(result===UE.EPBZForceSaveResult.RejectedDeathWindow||result===UE.EPBZForceSaveResult.RejectedShutdown)throw Error('Native game refused the return checkpoint');
 }
 read(slot){const wrapper=p.$ref(new UE.JsonObjectWrapper());if(!this.save.LoadGameFromSlot(slot,wrapper))throw Error('Could not read native slot '+slot);return JSON.parse(stringify(p.$unref(wrapper)));}
 stage(snapshot,profile,done){
  const branch=snap.prepare(snapshot,profile),param=new UE.SaveGameParam();param.SaveSlotName='CodexRiftEncounter';param.bSaveAdvanced=false;param.bShowSaveTip=false;
  const result=this.save.ReplaceSaveString(param,p.toOneShotDelegate((slot,json,index,ok)=>{
   try{if(!ok)throw Error('Native encounter snapshot could not be saved');snap.verify(snapshot,this.read(slot),profile.map);this.save.MarkLoadedSlotAsContinue(this.continueSlot);done(null,slot);}catch(e){done(e);}
  }),JSON.stringify(branch));
  if(result.ResultType!==UE.ESaveLoadResultType.Success)throw Error('Native encounter snapshot was rejected');
 }
 veto(){if(!this.hasVeto){this.save.EnterSaveVeto(SOURCE,UE.EPBZSaveVetoReason.ModeGate);this.hasVeto=true;}}
 travel(c,slot){
  const out=p.$ref(new UE.LoadGameResultParam());c.gi.LoadGame(slot,out);const result=p.$unref(out);
  if(result.ResultType!==UE.ESaveLoadResultType.Success)throw Error('Native player load failed');
  this.save.MarkLoadedSlotAsContinue(this.continueSlot);this.veto();
  c.gi.SetLoadingScreen('PBZ_WP');UE.GameplayStatics.OpenLevel(c.world,String(result.LevelName),true,String(result.GameModeOptions));
 }
 restoreAdvanced(){
  const current=this.save.GetAdvancedSaveJsonObject(),now=JSON.parse(stringify(current));
  for(const name of Object.keys(now))if(!Object.prototype.hasOwnProperty.call(this.advanced,name)){
   const ok=p.$ref(false),out=p.$ref(new UE.JsonObjectWrapper());UE.JSONUtility.RemoveJsonField(current,name,ok,out);if(!p.$unref(ok))throw Error('Could not restore advanced progress section');
  }
  for(const [name,value] of Object.entries(this.advanced)){
   if(snap.stable(now[name])===snap.stable(value))continue;
   const ok=p.$ref(false),out=p.$ref(new UE.JsonObjectWrapper());
   if(typeof value==='boolean')UE.JSONUtility.SetBoolField(current,name,value,ok,out);
   else if(typeof value==='number')UE.JSONUtility.SetNumberField(current,name,value,ok,out);
   else if(typeof value==='string')UE.JSONUtility.SetStringField(current,name,value,ok,out);
   else if(value&&typeof value==='object'&&!Array.isArray(value))UE.JSONUtility.SetObjectField(current,parse(value),name,ok,out);
   else throw Error('Unsupported native advanced progress field: '+name);
   if(!p.$unref(ok))throw Error('Could not restore advanced progress field: '+name);
  }
  const actual=JSON.parse(stringify(this.save.GetAdvancedSaveJsonObject()));if(snap.stable(actual)!==snap.stable(this.advanced))throw Error('Advanced progress readback differs');
  this.save.MarkAdvancedSaveDirty();return !!this.save.SaveAdvancedSaveGameNow();
 }
 release(){this.save.MarkLoadedSlotAsContinue(this.continueSlot);if(this.hasVeto){this.save.ExitSaveVeto(SOURCE);this.hasVeto=false;}}
 journal(data){
  const file=this.config.encounterJournalFile;if(!file)throw Error('Original encounter journal path is missing');
  const result=UE.EasyCsv.SaveStringToFileWithFullPath(JSON.stringify(data),file);if(result===false)throw Error('Could not persist encounter recovery journal');
 }
 recover(){
  if(!this.config.encounterJournalFile)return null;const ref=p.$ref('');if(!UE.EasyCsv.LoadStringFromLocalFile(this.config.encounterJournalFile,ref))return null;
  const data=JSON.parse(p.$unref(ref));return data.active?data:null;
 }
 resume(c,journal){this.save=saveSubsystem(c.world);this.continueSlot=journal.continueSlot;this.returnSlot='CodexRiftReturn';this.advanced=journal.advanced;this.veto();}
}
module.exports={EncounterStorage,parse,stringify};
