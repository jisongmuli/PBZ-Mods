"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('emergency return catches short key pulses, debounces holds, and works without a pawn or unpaused game',()=>{
 let poll,enabled=true,count=0,down=false,edge=false,interval,cleared=false;
 const UE={Key:class{},PuertsServerUtils:{GetPlayWorld:()=>({})},KismetSystemLibrary:{IsValid:()=>true},GameplayStatics:{GetPlayerController:()=>({IsInputKeyDown:()=>down,WasInputKeyJustPressed:()=>edge})}};
 const c=vm.createContext({module:{exports:{}},require:()=>UE,setInterval:(fn,ms)=>{poll=fn;interval=ms;return 10;},clearInterval:()=>cleared=true});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/EmergencyReturn.js'),'utf8'),c);const stop=c.module.exports.start(()=>enabled,()=>count++);
 assert.equal(interval,10);edge=true;poll();poll();assert.equal(count,1);edge=false;poll();down=true;poll();poll();assert.equal(count,2);
 down=false;poll();enabled=false;edge=true;poll();assert.equal(count,2);stop();assert.equal(cleared,true);
});
