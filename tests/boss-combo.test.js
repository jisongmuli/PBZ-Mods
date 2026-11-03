"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const {BossComboController,ActivePlayClock}=require('../src/BossComboController'),profile=require('../src/MoYuanProfile');
function fixture(){const calls=[],running=new Set();let allowed=true;const port={activate(d,chaining){if(!allowed)return null;const token={id:d.id};calls.push({id:d.id,chaining,token});running.add(token);return token;},isRunning:t=>running.has(t),cooldown:()=>5};return {controller:new BossComboController(port,profile),calls,running,allow(v){allowed=v;}};}
test('each input advances exactly one native stage; holding or waiting never plays the remaining chain',()=>{
 const f=fixture(),c=f.controller;assert.equal(c.request('light'),true);c.tick(0);assert.equal(f.calls.length,1);assert.equal(c.step,1);
 for(let i=1;i<500;i++)c.tick(i/100);assert.equal(f.calls.length,1);
 c.request('light');assert.equal(c.request('light'),false);f.running.clear();c.tick(5);assert.equal(f.calls.length,2);assert.equal(c.step,2);
 f.running.clear();c.tick(6);c.tick(8);c.request('light');c.tick(8);assert.equal(c.step,1);
});
test('one buffered input can chain only inside the native combo window and never interrupts the attack startup',()=>{
 const f=fixture(),c=f.controller;c.request('light');c.tick(0);c.request('light');
 const first=profile.abilities[profile.chain[0]];c.tick(Math.max(0,first.comboAt-0.01));assert.equal(f.calls.length,1);
 c.tick((first.comboAt+first.comboEnd)/2);assert.equal(f.calls.length,2);assert.equal(f.calls[1].chaining,true);assert.equal(c.step,2);
});
test('native rejection preserves the single buffered request until the current action finishes',()=>{
 const f=fixture(),c=f.controller;c.request('light');c.tick(0);c.request('heavy');f.allow(false);
 c.tick(profile.abilities[profile.chain[0]].comboAt+0.01);assert.equal(f.calls.length,1);assert.equal(c.pending.kind,'heavy');
 f.running.clear();f.allow(true);c.tick(4);assert.equal(f.calls.length,2);assert.equal(c.pending,null);
});
test('skill cooldowns survive F7 lifecycle resets and a repeated slot binding shares the same cooldown',()=>{
 const f=fixture(),c=f.controller,id=c.slots[0];c.assign(1,id);c.request('slot',0);c.tick(0);assert.equal(f.calls.length,1);
 c.reset();c.request('slot',1);c.tick(1);assert.equal(f.calls.length,1);assert.equal(c.pending,null);c.request('slot',1);c.tick(6);assert.equal(f.calls.length,2);
});
test('active skills keep their commitment and configuration rejects unknown skills and invalid slots',()=>{
 const f=fixture(),c=f.controller;c.request('slot',0);c.tick(0);c.request('dodge','B');c.tick(100);assert.equal(f.calls.length,1);
 f.running.clear();c.tick(101);assert.equal(f.calls.length,2);
 for(const slot of [-1,4,1.5])assert.equal(c.assign(slot,profile.skills[0]),false);assert.equal(c.assign(0,'unknown'),false);assert.equal(c.request('unknown'),false);
});
test('all authored combo, heavy, directional dodge and configurable slot paths resolve to native timing data',()=>{
 for(const id of [...profile.chain,profile.heavy,...Object.values(profile.heavyBranches),...Object.values(profile.dodge),...profile.skills,...profile.defaultSlots]){
  const a=profile.abilities[id];assert.ok(a,id);assert.ok(a.classPath.startsWith('/PBZCombatAsset/ActorData/Mobs/067_MoTian/'));assert.ok(a.duration>0);assert.ok(a.comboAt>=0&&a.comboAt<=a.comboEnd&&a.comboEnd<=a.duration);
 }
});
test('cooldown time remains monotonic across map travel, same-map reload and paused game time',()=>{
 const c=new ActivePlayClock();assert.equal(c.update('first',100),0);assert.equal(c.update('first',101),1);assert.equal(c.update('first',101),1);
 assert.equal(c.update('second',0),1);assert.equal(c.update('second',2),3);assert.equal(c.update('second',0),3);assert.equal(c.update('second',1),4);
});
