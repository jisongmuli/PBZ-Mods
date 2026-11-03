// Only the custom challenge menu uses these handlers. Ordinary bells keep their native path.
{
 const runtime=()=>globalThis.__CodexRiftArena;
 for(const [name,method] of [['BP_OnActivated','onMenu'],['BP_OnDeactivated','onMenuClosed'],['Destruct','onMenuClosed'],['HandleOverrideBackInputAction','onMenuBack']]){
  const original=BellMenuMinXinInterface.prototype[name];
  BellMenuMinXinInterface.prototype[name]=function(...args){
   if(this.__codexRiftArenaMenu){try{return runtime()?.[method]?.(this);}catch(e){console.error('[RiftArena menu] '+e);return;}}
   return original?.apply(this,args);
  };
 }
}

try { require("../../Mods/CodexRiftArena/RiftArena").start(require("../../Mods/CodexRiftArena/config")); } catch(e) { console.error("[CodexRiftArena] " + e); }
