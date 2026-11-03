"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
for(const name of ['CodexHunPeak','CodexRiftArena','CodexBossControl'])for(const root of ['D:/Games/PBZ/ProjectPBZ/','F:/Steam Library/PBZ/ProjectPBZ','//server/games/PBZ/ProjectPBZ/'])
test(name+' resolves diagnostics under '+root,()=>{
 const UE={BlueprintPathsLibrary:{ProjectDir:()=>root,ConvertRelativePathToFull:v=>v}},c=vm.createContext({module:{exports:{}},require:()=>UE});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../config-templates',name+'.js'),'utf8'),c);const config=c.module.exports,project=root.replace(/\/?$/,'/');
 assert.equal(config.statusFile||config.arenaStatusFile,project+'Saved/'+name+'/status.json');
 if(name==='CodexRiftArena')assert.equal(config.encounterJournalFile,project+'Saved/CodexRiftArena/encounter-journal.json');
 if(name==='CodexBossControl')assert.equal(config.settingsFile,project+'Saved/CodexBossControl/settings.json');
});
