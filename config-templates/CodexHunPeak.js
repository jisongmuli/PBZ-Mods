"use strict";
const UE=require("ue");
const project=UE.BlueprintPathsLibrary.ConvertRelativePathToFull(UE.BlueprintPathsLibrary.ProjectDir()).replace(/\\/g,"/").replace(/\/?$/, "/");
const config={
  "weapon": "HeiMoShang",
  "toggleKey": "F8",
  "effects": [
    "/PBZCombatAsset/ActorData/Players/Hun/Weapon/HeiMoShang/GE_Hun_HeiMoShang_Buff_Infinity.GE_Hun_HeiMoShang_Buff_Infinity_C"
  ],
  "version": "1.1.2-standalone"
};
config.statusFile=project+"Saved/CodexHunPeak/status.json";
module.exports=config;
