"use strict";
const UE=require("ue");
const project=UE.BlueprintPathsLibrary.ConvertRelativePathToFull(UE.BlueprintPathsLibrary.ProjectDir()).replace(/\\/g,"/").replace(/\/?$/, "/");
const config={
  "version": "0.1.0-alpha"
};
config.statusFile=project+"Saved/CodexBossControl/status.json";
config.settingsFile=project+"Saved/CodexBossControl/settings.json";
module.exports=config;
