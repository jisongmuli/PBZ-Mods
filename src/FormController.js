"use strict";
// Engine-independent lifecycle. Only primitive IDs are retained across ticks.
class FormController {
    constructor(port, config) {
        this.port = port;
        this.config = config;
        this.enabled = true;
        this.pendingEquip = true;
        this.previous = null;
        this.owned = [];
        this.world = null;
        this.lastTime = -1;
        this.error = null;
        this.phase = "waiting-for-player";
    }
    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.pendingEquip = true;
            this.error = null;
        }
    }
    removeOwned(ctx) {
        // A natural effect of the same class is deliberately not owned by us.
        const present = this.port.effects(ctx);
        for (const item of this.owned) {
            if (present.some(e => e.id === item.id && e.path === item.path))
                this.port.removeEffect(ctx, item.id);
        }
        this.owned = [];
    }
    restore(ctx) {
        // Handles and previous equipment belong to a single initialized pawn.
        if(ctx.key!==this.world || ctx.time<this.lastTime-0.5) {
            this.owned=[];this.previous=null;return;
        }
        this.removeOwned(ctx);
        if (this.previous && ctx.weapon === this.config.weapon && ctx.slot === this.previous.slot) {
            this.port.equip(ctx, this.previous.weapon, this.previous.slot);
        } else if (!this.enabled && ctx.weapon === this.config.weapon && this.port.leaveForm) {
            // A loaded save may already equip the final blade, so no earlier
            // weapon was recorded by this runtime. Exit through native gear switching.
            this.port.leaveForm(ctx, this.config.weapon);
        }
        this.previous = null;
    }
    tick() {
        let ctx;
        try {
            ctx = this.port.context();
            if (!ctx) { this.phase = "waiting-for-player"; return; }
            // Includes same-map reload, where UE object paths can be reused.
            if (ctx.key !== this.world || ctx.time < this.lastTime - 0.5) {
                this.owned = [];
                this.previous = null;
                this.pendingEquip = this.enabled;
                this.error = null;
                this.world = ctx.key;
            }
            this.lastTime = ctx.time;
            if (!ctx.alive || ctx.blocked) { this.phase = "suspended"; return; }
            if (!this.enabled || this.error) {
                this.restore(ctx);
                this.phase = this.error ? "error" : "disabled";
                return;
            }
            if(ctx.inventoryReady===false) {this.phase='waiting-for-inventory';return;}
            if (!this.port.ready(ctx)) { this.phase = "loading-effects"; return; }
            if (this.pendingEquip) {
                if (ctx.weapon !== this.config.weapon) {
                    this.previous = { weapon: ctx.weapon, slot: ctx.slot };
                    this.port.equip(ctx, this.config.weapon, ctx.slot);
                }
                this.pendingEquip = false;
                this.phase = "equipping";
                return;
            }
            // Manual weapon switching is respected; only the target weapon is enhanced.
            if (ctx.weapon !== this.config.weapon) {
                this.removeOwned(ctx);
                this.phase = "other-weapon";
                return;
            }
            let effects = this.port.effects(ctx);
            this.owned = this.owned.filter(o => effects.some(e => e.id === o.id && e.path === o.path));
            for (const path of this.config.effects) {
                if (effects.some(e => e.path === path)) continue;
                const before = new Set(effects.map(e => e.id));
                this.port.applyEffect(ctx, path);
                effects = this.port.effects(ctx);
                const added = effects.filter(e => e.path === path && !before.has(e.id));
                this.owned.push(...added);
                if (!effects.some(e => e.path === path)) throw new Error("Native effect was not applied: " + path);
            }
            this.phase = "active";
        } catch (e) {
            this.error = String(e && e.message || e);
            this.phase = "error";
            if (ctx) {
                try { this.restore(ctx); } catch (_) { /* next safe tick retries cleanup */ }
            }
        }
    }
    status() {
        return { enabled: this.enabled, phase: this.phase, error: this.error,
            world: this.world, ownedEffects: this.owned.slice(), previousWeapon: this.previous };
    }
}
module.exports = { FormController };
