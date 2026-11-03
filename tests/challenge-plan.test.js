"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const plans=require('../src/ChallengePlan');
const catalog=[{id:'a',name:'A',classPath:'a'},{id:'b',name:'B',classPath:'b'}];
test('mixed and repeated selections preserve order and share the five-instance limit',()=>{
 const selection=[];for(const id of ['b','a','a','b','a'])assert.equal(plans.addBoss(selection,id,catalog),true);
 assert.deepEqual(selection,['b','a','a','b','a']);assert.equal(plans.addBoss(selection,'b',catalog),false);
 assert.equal(plans.addBoss(selection,'unknown',catalog),false);assert.equal(selection.length,5);
 assert.equal(plans.removeBoss(selection,1),true);assert.deepEqual(selection,['b','a','b','a']);
 assert.equal(plans.removeBoss(selection,-1),false);assert.equal(plans.removeBoss(selection,4),false);
});
test('a challenge locks its ordered instances, first music boss and independent half-damage multiplier',()=>{
 for(let damage=1;damage<=20;damage++){
  const ids=['b','a','b'],chosen={health:20,shachi:7,damage};const plan=plans.snapshot(ids,catalog,chosen,true);
  ids.reverse();chosen.health=1;
  assert.deepEqual(plan.entries.map(e=>e.boss.id),['b','a','b']);assert.equal(plan.musicBoss.id,'b');
  assert.equal(plan.multipliers.health,20);assert.equal(plan.damageFactor,damage*0.5);assert.ok(Object.isFrozen(plan));
 }
 for(const ids of [[],Array(6).fill('a'),['unknown']])assert.throws(()=>plans.snapshot(ids,catalog,{health:1,shachi:1,damage:1},true));
});
test('formations keep up to five distinct spawn points around the shared arena center',()=>{
 for(let count=1;count<=5;count++){
  const center={X:4000,Y:289000,Z:1999400},points=plans.formation(center,90,count,400);
  assert.equal(new Set(points.map(p=>JSON.stringify(p))).size,count);
  for(const p of points){assert.ok(Math.hypot(p.X-center.X,p.Y-center.Y)<=1900.001);assert.equal(p.Z,center.Z);}
 }
});
