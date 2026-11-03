"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const {prepare,verify,clone}=require('../src/EncounterSnapshot');
function sample(){return {PBZGameSystem:{CurrentLevelName:'Origin',CycleCount:3,CycleRecords:{0:{Ending:2}}},Player:{Dust:900},Inventory:{MainWeaponInfos:[{id:'sword',level:60}],Items:{x:10}},EventPipeline:{GlobalTags:['battle.phase1','battle.finished','sidequest.choice','achievement.old'],ComponentInfoJson:{'Target-Spawn':{EventTag:['battle.finished','sidequest.choice']},Other:{EventTag:['sidequest.choice']}},ExecuteNodeGuid:{A:true,'Target-Spawn_B':true,C:true},LoadedDataLayer:{Target:['later'],Origin:['normal']},UnLoadedDataLayer:{Target:['initial']}},AISystem:{SpawnerSaveData:{TargetSpawn:{Dead:true},Other:{Dead:true}}},LevelActorManager:{'Target-Spawn':{Destroyed:true},Other:{Destroyed:true}},Narrative:{History:['completed']}};}
const profile={map:'/Game/Maps/Target',entry:{location:{X:1,Y:2,Z:100},rotation:{Pitch:0,Yaw:90,Roll:0}},resetTags:['battle.phase1','battle.finished'],nodeGuids:['A','B'],owners:[],spawnerActors:['Spawn']};
test('private branch resets only encounter state and preserves equipment, side quests and history',()=>{
 const original=sample(),before=clone(original),branch=prepare(original,profile);
 assert.deepEqual(original,before);assert.deepEqual(branch.Inventory,before.Inventory);assert.deepEqual(branch.Narrative,before.Narrative);
 assert.deepEqual(branch.EventPipeline.GlobalTags,['sidequest.choice','achievement.old']);assert.deepEqual(branch.EventPipeline.ExecuteNodeGuid,{C:true});
 assert.deepEqual(branch.AISystem.SpawnerSaveData,{Other:{Dead:true}});assert.deepEqual(branch.LevelActorManager,{Other:{Destroyed:true}});
 assert.deepEqual(branch.EventPipeline.LoadedDataLayer,{Origin:['normal']});assert.deepEqual(branch.PBZGameSystem.CycleRecords,before.PBZGameSystem.CycleRecords);
 assert.equal(branch.PBZGameSystem.CurrentLevelName,'Target');verify(original,branch,profile.map);
});
test('incomplete checkpoint, changed inventory and wrong destination fail verification',()=>{
 assert.throws(()=>prepare({},profile));const source=sample(),branch=prepare(source,profile);
 branch.Inventory.MainWeaponInfos=[];assert.throws(()=>verify(source,branch,'Target'));assert.throws(()=>verify(source,source,'Target'));
});
