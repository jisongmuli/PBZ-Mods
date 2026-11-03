"use strict";
const UE=require("ue");
const project=UE.BlueprintPathsLibrary.ConvertRelativePathToFull(UE.BlueprintPathsLibrary.ProjectDir()).replace(/\\/g,"/").replace(/\/?$/, "/");
const config={
  "version": "2.0.2"
};
config.arenaStatusFile=project+"Saved/CodexRiftArena/status.json";
config.encounterJournalFile=project+"Saved/CodexRiftArena/encounter-journal.json";
module.exports=config;
