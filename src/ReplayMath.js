"use strict";
function matchedHealth(player,bossBaseHealth) {
    for(const key of ['health','attack','amplification'])
        if(!Number.isFinite(player[key])) throw Error('Invalid player attribute: '+key);
    if(player.health<=0 || player.attack<=0) throw Error('Player attributes are not initialized');
    // About 75 ordinary attack units, with a health floor and a bounded native boss weighting.
    const weight=Math.max(0.8,Math.min(1.5,Math.sqrt(Math.max(1,bossBaseHealth)/30000)));
    const damage=player.attack*Math.max(0.1,1+player.amplification);
    return Math.round(Math.max(player.health*8,damage*75)*weight);
}
function multiplier(value) {
    if(!Number.isInteger(value)||value<1||value>20)throw Error('Multiplier must be an integer from 1 to 20');
    return value;
}
function challengeStats(player,boss,chosen) {
    const multipliers={health:multiplier(chosen.health),shachi:multiplier(chosen.shachi)};
    if(!Number.isFinite(boss.health)||boss.health<=0)throw Error('Boss health is not initialized');
    if(!Number.isFinite(boss.shachi)||boss.shachi<0)throw Error('Invalid boss shachi');
    return {
        health:matchedHealth(player,boss.health)*multipliers.health,
        // Keep native zero-bar mechanics intact; never fabricate a new resource.
        shachi:boss.shachi*multipliers.shachi,
        multipliers
    };
}
module.exports={matchedHealth,multiplier,challengeStats};
