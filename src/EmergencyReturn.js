"use strict";
const UE=require('ue');
function start(enabled,callback,onError){
 const key=new UE.Key();key.KeyName='F9';let down=false;
 const timer=setInterval(()=>{
  try{
   const world=UE.PuertsServerUtils.GetPlayWorld();if(!world||!UE.KismetSystemLibrary.IsValid(world))return;
   const pc=UE.GameplayStatics.GetPlayerController(world,0);if(!pc||!UE.KismetSystemLibrary.IsValid(pc))return;
   const pressed=pc.IsInputKeyDown(key)||pc.WasInputKeyJustPressed(key);
   if(pressed&&!down&&enabled())callback();down=pressed;
  }catch(e){onError?.(e);}
 },10);
 return ()=>clearInterval(timer);
}
module.exports={start};
