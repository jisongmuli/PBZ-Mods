"use strict";
const UE = require("ue");
const puerts = require("puerts");
function norm(path) { return String(path).toLowerCase(); }
function valid(obj) {
    try { return obj && UE.KismetSystemLibrary.IsValid(obj); }
    catch (_) { return false; }
}
class NativePort {
    constructor(config) {
        this.config = config;
        this.classes = new Map();
        this.loading = false;
        this.loadError = null;
        this.loadStart = 0;
        this.lastContext = null;
        this.key = new UE.Key();
        this.key.KeyName = config.toggleKey;
    }
    getWorld() { return UE.PuertsServerUtils.GetPlayWorld(); }
    keyDown() {
        const world = this.getWorld();
        if (!valid(world)) return false;
        const pc = UE.GameplayStatics.GetPlayerController(world, 0);
        return valid(pc) && pc.IsInputKeyDown(this.key);
    }
    namedKeyDown(name) {
        const world=this.getWorld();if(!valid(world))return false;
        const pc=UE.GameplayStatics.GetPlayerController(world,0);if(!valid(pc))return false;
        const key=new UE.Key();key.KeyName=name;return pc.IsInputKeyDown(key);
    }
    context() {
        const world = this.getWorld();
        if (!valid(world)) return null;
        const pawn = UE.GameplayStatics.GetPlayerCharacter(world, 0);
        if (!valid(pawn)) return null;
        // Do not apply player effects to possessed NPCs or preview actors.
        const pawnClass = UE.KismetSystemLibrary.GetPathName(pawn.GetClass());
        if (!/BP_Renewal_Hun(?:_Climax|_Young)?\./i.test(pawnClass)) return null;
        const asc = UE.AbilitySystemBlueprintLibrary.GetAbilitySystemComponent(pawn);
        const backpack = UE.SubsystemBlueprintLibrary.GetWorldSubsystem(world, UE.PBZBackPackSubsystem.StaticClass());
        if (!valid(asc) || !valid(backpack)) return null;
        const slot = backpack.GetCurrentMainWeaponIndex();
        if (slot < 0 || !backpack.MainWeapons.IsValidIndex(slot)) return null;
        const weapon = String(backpack.MainWeapons.Get(slot));
        if (!weapon || weapon.toLowerCase() === "none") return null;
        const sequence = UE.SubsystemBlueprintLibrary.GetWorldSubsystem(world, UE.PBZLevelSequenceManager.StaticClass());
        const health = UE.PBZBlueprintFunctionLibrary.GetAttributeFromCharacter(pawn,
            UE.PBZBlueprintFunctionLibrary.MakeAttribute("Health", UE.BasicAttributeSet.StaticClass()));
        const healthMax = UE.PBZBlueprintFunctionLibrary.GetAttributeFromCharacter(pawn,
            UE.PBZBlueprintFunctionLibrary.MakeAttribute("Health_Max", UE.BasicAttributeSet.StaticClass()));
        const inventoryReady=ctxInventoryReady(backpack,this.config.weapon);
        const result = {
            world, pawn, asc, backpack, slot, weapon,
            key: UE.KismetSystemLibrary.GetPathName(world) + "|" + UE.KismetSystemLibrary.GetPathName(pawn),
            time: UE.GameplayStatics.GetTimeSeconds(world),
            alive: health > 0 && healthMax > 0,
            inventoryReady,
            blocked: UE.GameplayStatics.IsGamePaused(world) || (valid(sequence) && sequence.IsInSequence())
        };
        // Persist only primitives for diagnostics, never a pawn/world wrapper.
        this.lastContext = { key: result.key, time: result.time, weapon, slot, pawnClass,
            health, healthMax, inventoryReady, weaponCount:backpack.MainWeaponInfos.Num(),
            alive: result.alive, blocked: result.blocked };
        return result;
    }
    ready(ctx) {
        if (this.loadError) throw new Error(this.loadError);
        for(const [path,klass] of this.classes)if(!valid(klass)){this.classes.delete(path);this.loading=false;}
        if (this.classes.size === this.config.effects.length) return true;
        if (this.loading) {
            if (Date.now() - this.loadStart > 30000) throw new Error("Timed out loading native gameplay effects");
            return false;
        }
        this.loading = true;
        this.loadStart = Date.now();
        const outer = UE.GameplayStatics.GetGameInstance(ctx.world);
        for (const path of this.config.effects) {
            UE.PBZAssetManager.AsyncLoadClass(outer, UE.KismetSystemLibrary.MakeSoftObjectPath(path),
                puerts.toOneShotDelegate(klass => {
                    if (valid(klass)) this.classes.set(path, klass);
                    else this.loadError = "Could not load native effect: " + path;
                }));
        }
        return false;
    }
    equip(ctx, id, slot) {
        const info = ctx.backpack.MainWeaponInfos.Get(id);
        if (!info) throw new Error("Weapon is not owned: " + id);
        for(let i=0;i<ctx.backpack.MainWeapons.Num();i++){
            if(i!==slot && String(ctx.backpack.MainWeapons.Get(i))===id){
                ctx.backpack.SetCurrentWeaponByIndex(i);
                if(ctx.backpack.GetCurrentMainWeaponIndex()!==i)throw new Error('Native weapon switch rejected');
                return;
            }
        }
        ctx.backpack.ReplaceWeaponByIndex(id, slot);
        if (String(ctx.backpack.MainWeapons.Get(slot)) !== id) throw new Error("Native equip rejected: " + id);
    }
    leaveForm(ctx,target) {
        const equipped=new Set();
        for(let i=0;i<ctx.backpack.MainWeapons.Num();i++){
            const id=String(ctx.backpack.MainWeapons.Get(i));equipped.add(id);
            if(i!==ctx.slot && id && id!=='None' && id!==target){
                ctx.backpack.SetCurrentWeaponByIndex(i);return true;
            }
        }
        const rows=ctx.backpack.MainWeaponInfos;
        for(let i=0;i<rows.Num();i++){
            const id=String(rows.GetKey(i));
            if(id!==target && id!=='None' && !equipped.has(id)){this.equip(ctx,id,ctx.slot);return true;}
        }
        return false;
    }
    effects(ctx) {
        const handles = ctx.asc.GetActiveEffectsWithAllTags(new UE.GameplayTagContainer());
        const result = [];
        for (let i = 0; i < handles.Num(); i++) {
            const handle = handles.Get(i);
            const effect = UE.AbilitySystemBlueprintLibrary.GetGameplayEffectFromActiveEffectHandle(handle);
            if (valid(effect)) result.push({ id: handle.Handle,
                path: norm(UE.KismetSystemLibrary.GetPathName(effect.GetClass())) });
        }
        this.lastEffects=result.filter(e=>this.config.effects.includes(e.path));
        return result;
    }
    applyEffect(ctx, path) {
        const klass = this.classes.get(path);
        if (!valid(klass)) throw new Error("Gameplay effect class is no longer valid");
        ctx.pawn.ApplyGamePlayEffect(klass);
    }
    removeEffect(ctx, id) {
        const handles = ctx.asc.GetActiveEffectsWithAllTags(new UE.GameplayTagContainer());
        for (let i = 0; i < handles.Num(); i++) {
            const handle = handles.Get(i);
            if (handle.Handle === id) { ctx.asc.RemoveActiveGameplayEffect(handle, -1); return; }
        }
    }
    writeStatus(data) {
        return UE.EasyCsv.SaveStringToFileWithFullPath(JSON.stringify(data, null, 2), this.config.statusFile);
    }
}
function ctxInventoryReady(backpack,weapon) {
    return backpack.MainWeaponInfos.Num()>0 && !!backpack.MainWeaponInfos.Get(weapon);
}
module.exports = { NativePort, norm };
