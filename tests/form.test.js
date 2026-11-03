"use strict";
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FormController } = require('../src/FormController');
function harness() {
    let ctx = { key:'world1|pawn1', time:10, weapon:'Tang', slot:0, alive:true, blocked:false };
    let effects = [], id = 0, applies = 0, failure = null, exits=0;
    const port = {
        context: () => ctx,
        ready: () => true,
        effects: () => effects.slice(),
        equip: (_,weapon,slot) => Object.assign(ctx,{weapon,slot}),
        leaveForm:()=>{exits++;ctx.weapon='Normal';return true;},
        applyEffect: (_,path) => { applies++; if (path===failure) throw Error('rejected'); effects.push({id:++id,path}); },
        removeEffect: (_,handle) => { effects=effects.filter(e=>e.id!==handle); }
    };
    const c = new FormController(port,{weapon:'HeiMoShang',effects:['black','prime']});
    return {c, ctx, get effects(){return effects;}, get applies(){return applies;},get exits(){return exits;},
        natural(path){ effects.push({id:++id,path}); }, clear(){effects=[];}, fail(path){failure=path;} };
}
test('activation is idempotent and disables only effects the mod owns',()=>{
    const h=harness(); h.natural('black'); h.c.tick(); h.c.tick();
    for(let i=0;i<50;i++) h.c.tick();
    assert.equal(h.applies,1); assert.equal(h.c.phase,'active');
    h.c.toggle(); h.c.tick();
    assert.deepEqual(h.effects.map(e=>e.path),['black']); assert.equal(h.ctx.weapon,'Tang');
});
test('manual switch removes enhancement without forcing the selected weapon',()=>{
    const h=harness(); h.c.tick(); h.c.tick(); h.ctx.weapon='Other'; h.c.tick();
    assert.equal(h.effects.length,0); assert.equal(h.ctx.weapon,'Other');
    h.c.toggle(); h.c.tick(); assert.equal(h.ctx.weapon,'Other');
});
test('death, cinematics and pause suspend mutation; respawn restores missing effects once',()=>{
    const h=harness(); h.c.tick(); h.c.tick(); h.clear(); h.ctx.alive=false;
    h.c.tick(); assert.equal(h.effects.length,0);
    h.ctx.alive=true; h.ctx.blocked=true; h.c.tick(); assert.equal(h.effects.length,0);
    h.ctx.blocked=false; h.c.tick(); h.c.tick(); assert.equal(h.effects.length,2); assert.equal(h.applies,4);
});
test('same-map reload never removes effects belonging to the new pawn',()=>{
    const h=harness(); h.c.tick(); h.c.tick(); h.clear(); h.ctx.time=0; h.natural('black');
    h.c.tick(); h.c.toggle(); h.c.tick(); assert.deepEqual(h.effects.map(e=>e.path),['black']);
});
test('partial activation rolls back its effects and equipment; failure latches',()=>{
    const h=harness(); h.fail('prime'); h.c.tick(); h.c.tick();
    assert.equal(h.c.phase,'error'); assert.equal(h.effects.length,0); assert.equal(h.ctx.weapon,'Tang');
    h.c.tick(); assert.equal(h.applies,2);
    h.c.toggle(); h.c.tick(); h.fail(null); h.c.toggle(); h.c.tick(); h.c.tick();
    assert.equal(h.c.phase,'active');
});
test('partial inventory initialization waits without equipping or latching an ownership error',()=>{
    const h=harness();h.ctx.inventoryReady=false;
    for(let i=0;i<10;i++)h.c.tick();
    assert.equal(h.c.phase,'waiting-for-inventory');assert.equal(h.ctx.weapon,'Tang');
    assert.equal(h.applies,0);assert.equal(h.c.error,null);
    h.ctx.inventoryReady=true;h.c.tick();h.c.tick();assert.equal(h.c.phase,'active');
});
test('new pawn is equipped once after initialization and never inherits old equipment rollback',()=>{
    const h=harness();h.c.tick();h.c.tick();
    h.ctx.key='world2|pawn2';h.ctx.time=0;h.ctx.weapon='Other';h.ctx.inventoryReady=false;h.clear();h.c.tick();
    assert.equal(h.c.previous,null);assert.equal(h.ctx.weapon,'Other');
    h.ctx.inventoryReady=true;h.c.tick();h.c.tick();assert.equal(h.c.phase,'active');
    h.c.toggle();h.c.tick();assert.equal(h.ctx.weapon,'Other');
});
test('stop between world replacement and next tick cannot remove a new pawn effect',()=>{
    const h=harness();h.c.tick();h.c.tick();
    h.ctx.key='world2|pawn2';h.clear();h.natural('black');h.c.restore(h.ctx);
    assert.deepEqual(h.effects.map(e=>e.path),['black']);assert.equal(h.c.previous,null);
});
test('F8 exits a final-blade state loaded from disk even when no previous weapon was recorded',()=>{
    const h=harness();h.ctx.weapon='HeiMoShang';h.natural('black');h.c.tick();h.c.tick();
    assert.equal(h.c.previous,null);h.c.toggle();h.c.tick();
    assert.equal(h.ctx.weapon,'Normal');assert.equal(h.exits,1);
    h.c.tick();assert.equal(h.exits,1);
    h.c.toggle();h.c.tick();h.c.tick();assert.equal(h.c.phase,'active');
});
