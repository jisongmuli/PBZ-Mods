"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const snapshots=require('../src/EncounterSnapshot');
function fixture(){
 const calls=[],snapshot={PBZGameSystem:{CurrentLevelName:'Origin'},Inventory:{MainWeaponInfos:{sword:{level:60}}},Player:{Dust:10}},world={},pawn={};
 class Storage{
  constructor(){this.returnSlot='return';this.continueSlot='original';this.advanced={};this.save={SaveJsonObjectToString:()=>JSON.stringify(snapshot)};}
  recover(){return null;}checkpoint(c,done){this.checkpointDone=done;}stage(source,profile,done){this.stageDone=done;}
  journal(data){calls.push(['journal',data.active]);}veto(){calls.push(['veto']);}travel(c,slot){calls.push(['travel',slot]);}
  restoreAdvanced(){if(this.restoreError)throw Error('restore failed');calls.push(['advanced']);}release(){calls.push(['release']);}
 }
 class Services{status(){return {};}start(){calls.push(['services']);}stop(){calls.push(['stop']);}tick(){}}
 const UE={KismetSystemLibrary:{IsValid:()=>true},PuertsServerUtils:{GetPlayWorld:()=>world},GameplayStatics:{GetGameInstance:()=>({}),GetPlayerController:()=>({})}};
 const modules={ue:UE,puerts:{},'./EncounterStorage':{EncounterStorage:Storage},'./EncounterSnapshot':snapshots,'./BossScaling':{attribute:(_,name)=>name==='Health'?100:0,set(){},holdFloor(){return {};},releaseFloor(){}},'./CombatServices':{CombatServices:Services}};
 const ctx=vm.createContext({module:{exports:{}},require:n=>modules[n],Date,Map,Set});vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/OriginalEncounter.js'),'utf8'),ctx);
 const result=new ctx.module.exports.OriginalEncounter({},reason=>calls.push(['done',reason]));
 const c={world,pawn,key:'Origin|pawn',map:'Origin',inv:{MainWeaponInfos:{Num:()=>28}}},plan={entries:[{}],mode:'original-story'},profile={map:'/Game/Target'};
 return {result,c,plan,profile,snapshot,calls};
}
test('cancel during asynchronous staging returns only to verified return slot and ignores stale callbacks',()=>{
 const f=fixture(),r=f.result;r.start(f.c,f.plan,f.profile);r.storage.checkpointDone(null,f.snapshot);assert.equal(r.phase,'staging');r.requestReturn('cancel');
 const late=r.storage.stageDone;late(null,'encounter');assert.equal(r.phase,'returning');assert.deepEqual(f.calls.filter(c=>c[0]==='travel'),[['travel','return']]);
 late(null,'encounter');assert.equal(f.calls.filter(c=>c[0]==='travel').length,1);assert.equal(f.calls.some(c=>c[0]==='release'),false);
 r.tick(f.c);assert.equal(r.phase,'idle');assert.ok(f.calls.some(c=>c[0]==='release'));assert.ok(f.calls.some(c=>c[0]==='journal'&&c[1]===false));
});
test('cancel before checkpoint completion is immediate and late completion cannot begin travel',()=>{
 const f=fixture(),r=f.result;r.start(f.c,f.plan,f.profile);const done=r.storage.checkpointDone;r.requestReturn('cancel');assert.equal(r.phase,'idle');done(null,f.snapshot);assert.equal(r.phase,'idle');assert.equal(f.calls.some(c=>c[0]==='travel'),false);
});
test('failed checkpoint never travels; failed private branch restores checkpoint before releasing save veto',()=>{
 const f=fixture();f.result.start(f.c,f.plan,f.profile);f.result.storage.checkpointDone(Error('disk unavailable'));assert.equal(f.result.phase,'idle');assert.equal(f.calls.some(c=>c[0]==='travel'),false);
 const g=fixture();g.result.start(g.c,g.plan,g.profile);g.result.storage.checkpointDone(null,g.snapshot);g.result.storage.stageDone(Error('inventory mismatch'));assert.equal(g.result.phase,'returning');
 assert.equal(g.calls.some(c=>c[0]==='release'),false);g.result.tick(g.c);assert.equal(g.result.phase,'idle');
});
test('return from loading is idempotent and failed advanced restoration remains protected until retried',()=>{
 const f=fixture(),r=f.result;r.start(f.c,f.plan,f.profile);r.storage.checkpointDone(null,f.snapshot);r.storage.stageDone(null,'encounter');assert.equal(r.phase,'travelling');
 r.storage.restoreError=true;assert.equal(r.requestReturn(),false);assert.equal(r.phase,'return-failed');assert.equal(f.calls.some(c=>c[0]==='release'),false);
 r.storage.restoreError=false;assert.equal(r.requestReturn(),true);r.requestReturn();assert.equal(f.calls.filter(c=>c[0]==='travel'&&c[1]==='return').length,1);r.tick(f.c);assert.equal(r.phase,'idle');
});
test('original modes reject multiple selected bosses before any save or travel',()=>{const f=fixture();assert.equal(f.result.start(f.c,{entries:[{},{}]},f.profile),false);assert.equal(f.result.phase,'idle');assert.deepEqual(f.calls,[]);});
test('native form replacement or stage travel rebinds combat services without ending the encounter',()=>{
 const f=fixture(),r=f.result;r.start(f.c,f.plan,f.profile);r.storage.checkpointDone(null,f.snapshot);r.storage.stageDone(null,'encounter');
 r.phase='encounter';r.playerKey='old|pawn';r.seenCombat=true;r.nextScan=Infinity;r.sequences=()=>{};
 r.tick({...f.c,key:'new-stage|climax',map:'LaterStage'});assert.equal(r.phase,'encounter');assert.equal(r.playerKey,'new-stage|climax');assert.ok(f.calls.some(c=>c[0]==='services'));assert.equal(f.calls.some(c=>c[0]==='travel'&&c[1]==='return'),false);
});
