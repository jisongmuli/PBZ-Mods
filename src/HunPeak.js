"use strict";
// Standalone shape module: no travel, save-slot, boss, menu or development code.
const {FormController}=require('./FormController');
const {NativePort,norm}=require('./NativePort');
const config=require('./config');
function start() {
    const key='__CodexHunPeak_v1';
    if(globalThis[key])return globalThis[key];
    config.effects=config.effects.map(norm);
    const port=new NativePort(config),controller=new FormController(port,config);
    const runtime={controller};globalThis[key]=runtime;
    let down=false,nextTick=0,nextStatus=0,errors=0,lastError=null;
    const status=()=>port.writeStatus({mod:'CodexHunPeak',name:'魂·巅峰',version:config.version,
        updatedAt:new Date().toISOString(),...controller.status(),player:port.lastContext,
        presentEffects:port.lastEffects,pollingErrors:errors,lastPollingError:lastError});
    runtime.timer=setInterval(()=>{
        try {
            const pressed=port.keyDown();
            if(pressed&&!down){globalThis.__CodexBossControl?.restore('切换魂·巅峰前已恢复主角',{restorePeak:false});controller.toggle();nextTick=0;nextStatus=0;}
            down=pressed;
            const now=Date.now();
            if(now>=nextTick){controller.tick();nextTick=now+750;}
            if(now>=nextStatus){status();nextStatus=now+3000;}
        }catch(e){errors++;lastError=String(e.stack||e);}
    },25);
    runtime.stop=()=>{
        clearInterval(runtime.timer);
        const ctx=port.context();if(ctx)controller.restore(ctx);
        delete globalThis[key];
    };
    status();return runtime;
}
module.exports={start};
