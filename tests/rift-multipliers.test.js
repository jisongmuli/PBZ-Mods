"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const math=require('../src/ReplayMath'),catalog=require('../src/BossCatalog');
const plans=require('../src/ChallengePlan');
const source=name=>fs.readFileSync(path.join(__dirname,'../src',name+'.js'),'utf8');
test('all 400 integer combinations scale health and native shachi independently, without changing the baseline',()=>{
 const player=Object.freeze({health:3085.5,attack:2400,amplification:0.65});
 const boss=Object.freeze({health:30000,shachi:312.5});
 const baseline=math.matchedHealth(player,boss.health);
 for(let health=1;health<=20;health++)for(let shachi=1;shachi<=20;shachi++){
  const chosen=Object.freeze({health,shachi}),result=math.challengeStats(player,boss,chosen);
  assert.equal(result.health,baseline*health);assert.equal(result.shachi,boss.shachi*shachi);
  assert.deepEqual(math.challengeStats(player,boss,chosen),result);
 }
 assert.equal(math.challengeStats(player,{health:30000,shachi:0},{health:20,shachi:20}).shachi,0);
});
test('invalid multipliers and uninitialized attributes are rejected before applying values',()=>{
 for(const value of [0,21,-1,1.5,NaN,Infinity,'20',null,undefined])assert.throws(()=>math.multiplier(value));
 const player={health:3000,attack:1500,amplification:0},chosen={health:1,shachi:1};
 for(const health of [0,-1,NaN,Infinity])assert.throws(()=>math.challengeStats(player,{health,shachi:100},chosen));
 for(const shachi of [-1,NaN,Infinity])assert.throws(()=>math.challengeStats(player,{health:30000,shachi},chosen));
});
function menuFixture(){
 const parent={children:[],IsA:()=>true,GetParent:()=>null,SetRenderOpacity(){},AddChild(b){this.children.push(b);}};
 const group={widgets:[],RemoveAll(){this.widgets=[];},AddWidget(b){this.widgets.push(b);}};
 const create=()=>{
  const event={listeners:new Set(),Add(fn){this.listeners.add(fn);},Remove(fn){this.listeners.delete(fn);}};
  return {OnButtonBaseClicked:event,SetButtonText(v){this.label=v;},SetVisibility(){},SetRenderOpacity(){},SetFocus(){},GetParent:()=>parent,GetClass:()=>({}),RemoveFromParent(){parent.children=parent.children.filter(b=>b!==this);}};
 };
 const menu={ItemUpgradeButton:create(),Image_102:create(),Image_50:create(),CurrentBellNameText:{SetRenderOpacity(){},SetText(v){this.text=v;}},StopAllAnimations(){},SetVisibility(){},GetButtonGroupByID:()=>group,GetOwningPlayer:()=>({}),DeactivateWidget(){this.closed=true;}};
 const selected=[],runtime={selection:[],musicEnabled:true,multipliers:{health:1,shachi:1,damage:1},
  addBoss(id){return plans.addBoss(this.selection,id,catalog);},removeBoss(index){return plans.removeBoss(this.selection,index);},clearSelection(){this.selection=[];return true;},
  setMusicEnabled(value){this.musicEnabled=value;return true;},returnToBell(){this.returned=true;},
  startMode(mode){selected.push({ids:this.selection.slice(),mode,...this.multipliers});return true;},setMultiplier(field,value){this.multipliers[field]=math.multiplier(value);return true;},returnOutside(){this.returned=true;}};
 const UE={ESlateVisibility:{Collapsed:1,Visible:2},VerticalBox:{StaticClass:()=>({})},WidgetBlueprintLibrary:{Create:create}};
 const context=vm.createContext({module:{exports:{}},require:n=>n==='ue'?UE:{FText:{FromString:x=>x}}});
 vm.runInContext(source('RiftMenu'),context);const api=context.module.exports;
 const buttons=()=>menu.__codexRiftChoices.items.map(x=>x.button);
 const click=label=>{
  const b=buttons().find(b=>b.label===label);assert.ok(b,'Missing button '+label);
  for(const fn of Array.from(b.OnButtonBaseClicked.listeners))fn();
  assert.ok(buttons().length<=8);assert.equal(parent.children.length,buttons().length);
 };
 api.attach(menu,runtime,catalog);return {menu,runtime,selected,api,buttons,click,parent};
}
test('boss selection opens setup, all 20 values are reachable for each field, and only Start queues a challenge',()=>{
 const f=menuFixture();f.click(catalog[0].name);f.click('挑战设置（1 / 5）');assert.equal(f.selected.length,0);
 for(const [field,label] of [['health','生命'],['shachi','杀气'],['damage','伤害（半伤基准）']]){
  f.click(label+'倍率：×1');const values=[];
  for(let page=0;page<5;page++){
   values.push(...f.buttons().map(b=>/^×(\d+)/.exec(b.label)).filter(Boolean).map(m=>Number(m[1])));
   if(page<4)f.click('下一页');
  }
  assert.deepEqual(values,Array.from({length:20},(_,i)=>i+1));
  f.click('×20');assert.equal(f.runtime.multipliers[field],20);assert.equal(f.selected.length,0);
 }
 f.click('下一步：选择挑战方式');assert.equal(f.selected.length,0);f.click('当前场地挑战');
 assert.deepEqual(f.selected,[{ids:[catalog[0].id],mode:'arena',health:20,shachi:20,damage:20}]);assert.equal(f.menu.closed,true);
});
test('back navigation and reopening retain choices and boss page while removed buttons lose their listeners',()=>{
 const f=menuFixture();f.click('下一页');f.click(catalog[4].name);f.click('挑战设置（1 / 5）');
 f.click('生命倍率：×1');f.click('下一页');f.click('×7');
 f.click('杀气倍率：×1');f.api.back(f.menu);assert.equal(f.menu.__codexRiftChoices.view.kind,'settings');
 const old=f.buttons();f.api.back(f.menu);assert.equal(f.runtime.lastMenuPage,1);
 for(const b of old)assert.equal(b.OnButtonBaseClicked.listeners.size,0);
 f.api.attach(f.menu,f.runtime,catalog,f.runtime.lastMenuPage);f.click('挑战设置（1 / 5）');
 assert.ok(f.buttons().some(b=>b.label==='生命倍率：×7'));assert.equal(f.selected.length,0);
 f.api.back(f.menu);f.api.back(f.menu);assert.equal(f.menu.closed,true);
 f.api.detach(f.menu);assert.equal(f.parent.children.length,0);
});
test('arena locks each challenge choice, rejects changes and duplicate selection while queued',()=>{
 const world={path:'world'},pawn={path:'player',GetClass:()=>({path:'/Game/BP_Renewal_Hun.BP_Renewal_Hun_C'}),K2_GetActorLocation:()=>({X:0,Y:0,Z:0})};
 const inventory={MainWeaponInfos:{Num:()=>28}},subsystems={inventory,pipeline:{},sequence:{IsInSequence:()=>false}};
 const attrs={Health:3000,Health_Max:3000,Health_Min:0};
 const UE={
  KismetSystemLibrary:{IsValid:x=>!!x,GetPathName:x=>x.path,MakeSoftObjectPath:x=>x},
  PuertsServerUtils:{GetPlayWorld:()=>world},
  GameplayStatics:{GetPlayerCharacter:()=>pawn,GetGameInstance:()=>({}),GetPlayerController:()=>({}),IsGamePaused:()=>false,GetTimeSeconds:()=>1,GetCurrentLevelName:()=> 'PBZ_Xigu_WP'},
  SubsystemBlueprintLibrary:{GetWorldSubsystem:(_,token)=>subsystems[token]},
  PBZBackPackSubsystem:{StaticClass:()=> 'inventory'},EventPipelineManager:{StaticClass:()=> 'pipeline'},PBZLevelSequenceManager:{StaticClass:()=> 'sequence'},
  BasicAttributeSet:{StaticClass:()=>({})},PBZBlueprintFunctionLibrary:{MakeAttribute:x=>x,GetAttributeFromCharacter:(_,key)=>attrs[key]},
  EasyCsv:{SaveStringToFileWithFullPath:()=>true},PBZAssetManager:{AsyncLoadClass:(_,__,fn)=>fn({path:'bossClass'})}
 };
 class FakeServices{status(){return {};}stop(){}}
 class FakeOriginal{get active(){return false;}status(){return {};}tick(){}}
 const modules={'ue':UE,'puerts':{toOneShotDelegate:x=>x},'cpp':{},'./ReplayMath':math,'./BossCatalog':catalog,'./ChallengePlan':plans,'./CombatServices':{CombatServices:FakeServices},'./BossScaling':{},'./EncounterCatalog':{},'./OriginalEncounter':{OriginalEncounter:FakeOriginal},'./EmergencyReturn':{start:()=>()=>{}}};
 const context=vm.createContext({module:{exports:{}},require:n=>modules[n],setInterval:()=>1,clearInterval(){}});
 vm.runInContext(source('RiftArena'),context);const s=context.module.exports.start({version:'test',arenaStatusFile:'unused'});
 s.closed=true;s.battle={location:{X:0,Y:0,Z:0}};s.arrival={location:{X:0,Y:0,Z:0}};
 assert.equal(s.setMultiplier('health',20),true);assert.equal(s.setMultiplier('shachi',7),true);
 for(const value of [0,21,1.5,'5'])assert.equal(s.setMultiplier('health',value),false);
 assert.equal(s.setMultiplier('other',5),false);
 assert.equal(s.select(catalog[0].id),true);assert.equal(s.phase,'queued');
 assert.equal(s.challengeMultipliers.health,20);assert.equal(s.challengeMultipliers.shachi,7);
 assert.equal(s.setMultiplier('health',2),false);assert.equal(s.select(catalog[1].id),false);
 s.multipliers.health=3;assert.equal(s.challengeMultipliers.health,20);
});
