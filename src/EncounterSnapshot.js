"use strict";
function clone(v){return JSON.parse(JSON.stringify(v));}
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v);}
function healthy(data){return !!data?.PBZGameSystem&&!!data?.Inventory&&Object.keys(data.Inventory).length>0&&!!data?.Player;}
function prepare(source,profile){
 if(!healthy(source)||!profile?.entry?.location)throw Error('A complete player snapshot and native entry are required');
 const data=clone(source),system=data.PBZGameSystem,map=profile.map.split('/').pop(),transform={Location:clone(profile.entry.location),Rotation:clone(profile.entry.rotation)};
 system.CurrentLevelName=map;system.LastSaveActorID='None';system.GameModeOptions='';
 system.PlayerTransform=clone(transform);system.StartGameTransform=clone(transform);system.ReviveTransform=clone(transform);system.ReviveCameraRotation=clone(transform.Rotation);
 const pipe=data.EventPipeline||{},tags=new Set(profile.resetTags),nodes=new Set(profile.nodeGuids);
 const actors=[...(profile.owners||[]).map(v=>v.name),...(profile.spawnerActors||[]),...(profile.domainActors||[])];
 const ownedKey=key=>actors.some(name=>key===name||key===map+'-'+name||key===map+name||key.startsWith(map+'-'+name+'_'));
 pipe.GlobalTags=(pipe.GlobalTags||[]).filter(t=>!tags.has(t));
 for(const value of profile.entryTags||[])if(!pipe.GlobalTags.includes(value))pipe.GlobalTags.push(value);
 for(const value of Object.values(pipe.ComponentInfoJson||{}))if(value.EventTag)value.EventTag=value.EventTag.filter(t=>!tags.has(t));
 for(const key of ['ComponentInfoJson','ComponentsOwnerActorInfo','SaveInfoJson'])for(const name of Object.keys(pipe[key]||{}))if(ownedKey(name))delete pipe[key][name];
 for(const key of Object.keys(pipe.ExecuteNodeGuid||{}))if(ownedKey(key)||[...nodes].some(g=>key===g||key.endsWith('_'+g)))delete pipe.ExecuteNodeGuid[key];
 for(const field of ['LoadedDataLayer','UnLoadedDataLayer'])if(pipe[field])delete pipe[field][map];
 pipe.CurrentPlayingID=0;pipe.CurrentPlayerClass='';pipe.PreSpawnPlayerClass='';pipe.PreSpawnPlayerMap='';pipe.FlowPlaySeqID='';pipe.FlowTags=[];
 for(const key of Object.keys(data.AISystem?.SpawnerSaveData||{}))if(ownedKey(key))delete data.AISystem.SpawnerSaveData[key];
 for(const key of Object.keys(data.LevelActorManager||{}))if(ownedKey(key))delete data.LevelActorManager[key];
 if(stable(data.Inventory)!==stable(source.Inventory))throw Error('Encounter preparation changed equipment');
 return data;
}
function verify(source,loaded,map){
 if(!healthy(loaded)||stable(source.Inventory)!==stable(loaded.Inventory))throw Error('Native snapshot verification failed: equipment differs');
 if(map&&loaded.PBZGameSystem.CurrentLevelName!==map.split('/').pop())throw Error('Native snapshot verification failed: map differs');
 return true;
}
module.exports={prepare,verify,healthy,stable,clone};
