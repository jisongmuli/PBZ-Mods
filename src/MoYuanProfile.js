"use strict";
// Native paths and timing, with authored player controls.
module.exports={
  "bossClass": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/BP_Monster_MoTian.BP_Monster_MoTian_C",
  "chain": [
    "GA_MoTian_LightAttack_02",
    "GA_MoTian_SpecialAttack_01",
    "GA_MoTian_SpecialAttack_17",
    "GA_MoTian_SpecialAttack_02",
    "GA_MoTian_Skill_04"
  ],
  "heavy": "GA_MoTian_HeavyAttack_01",
  "heavyBranches": {
    "1": "GA_MoTian_SpecialAttack_04",
    "3": "GA_MoTian_SpecialAttack_03",
    "heavy": "GA_MoTian_Skill_05"
  },
  "dodge": {
    "F": "GA_MoTian_Dodge_F_02",
    "L": "GA_MoTian_Dodge_L_02",
    "R": "GA_MoTian_Dodge_R_02",
    "B": "GA_MoTian_Dodge_B_03"
  },
  "skills": [
    "GA_MoTian_Skill_01",
    "GA_MoTian_Skill_02",
    "GA_MoTian_Skill_03",
    "GA_MoTian_Skill_05",
    "GA_MoTian_Skill_06",
    "GA_MoTian_Skill_07",
    "GA_MoTian_Skill_08",
    "GA_MoTian_Skill_09",
    "GA_MoTian_Skill_10",
    "GA_MoTian_Skill_11",
    "GA_MoTian_Skill_12",
    "GA_MoTian_Skill_14",
    "GA_MoTian_Skill_15",
    "GA_MoTian_SpecialAttack_03",
    "GA_MoTian_SpecialAttack_04",
    "GA_MoTian_SpecialAttack_05",
    "GA_MoTian_SpecialAttack_06",
    "GA_MoTian_SpecialAttack_07",
    "GA_MoTian_SpecialAttack_08",
    "GA_MoTian_SpecialAttack_09",
    "GA_MoTian_SpecialAttack_10",
    "GA_MoTian_SpecialAttack_11",
    "GA_MoTian_SpecialAttack_12",
    "GA_MoTian_SpecialAttack_13",
    "GA_MoTian_SpecialAttack_14",
    "GA_MoTian_SpecialAttack_15",
    "GA_MoTian_SpecialAttack_16"
  ],
  "defaultSlots": [
    "GA_MoTian_Skill_06",
    "GA_MoTian_SpecialAttack_08",
    "GA_MoTian_Skill_10",
    "GA_MoTian_SpecialAttack_11"
  ],
  "abilities": {
    "GA_MoTian_SpecialAttack_06": {
      "id": "GA_MoTian_SpecialAttack_06",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_06.GA_MoTian_SpecialAttack_06_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_01_Montage.MoYuan_Skill_01_Montage",
      "duration": 3.7833,
      "comboAt": 2.144,
      "comboEnd": 3.1039
    },
    "GA_MoTian_SpecialAttack_01": {
      "id": "GA_MoTian_SpecialAttack_01",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_01.GA_MoTian_SpecialAttack_01_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_AA_Montage.MoYuan_AA_Montage",
      "duration": 2.1333,
      "comboAt": 0.8481,
      "comboEnd": 1.5611
    },
    "GA_MoTian_SpecialAttack_17": {
      "id": "GA_MoTian_SpecialAttack_17",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_17.GA_MoTian_SpecialAttack_17_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_AAA_Montage.MoYuan_AAA_Montage",
      "duration": 3.9333,
      "comboAt": 1.6545,
      "comboEnd": 2.8013
    },
    "GA_MoTian_SpecialAttack_02": {
      "id": "GA_MoTian_SpecialAttack_02",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_02.GA_MoTian_SpecialAttack_02_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_AAAA_Montage.MoYuan_AAAA_Montage",
      "duration": 3.7667,
      "comboAt": 1.6644,
      "comboEnd": 2.6234
    },
    "GA_MoTian_HeavyAttack_01": {
      "id": "GA_MoTian_HeavyAttack_01",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_HeavyAttack_01.GA_MoTian_HeavyAttack_01_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_SpecialAttack_03_A_Montage.MoTian_SpecialAttack_03_A_Montage",
      "duration": 2.1667,
      "comboAt": 0.8368,
      "comboEnd": 1.4892
    },
    "GA_MoTian_Skill_14": {
      "id": "GA_MoTian_Skill_14",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_14.GA_MoTian_Skill_14_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_12_Montage.MoYuan_Skill_12_Montage",
      "duration": 6.7333,
      "comboAt": 4.9256,
      "comboEnd": 5.9234
    },
    "GA_MoTian_SpecialAttack_12": {
      "id": "GA_MoTian_SpecialAttack_12",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_12.GA_MoTian_SpecialAttack_12_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_SpecialAttack_03_Montage.MoYuan_SpecialAttack_03_Montage",
      "duration": 3.4333,
      "comboAt": 1.7095,
      "comboEnd": 2.7351
    },
    "GA_MoTian_SpecialAttack_11": {
      "id": "GA_MoTian_SpecialAttack_11",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_11.GA_MoTian_SpecialAttack_11_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_SpecialAttack_04_Montage.MoYuan_SpecialAttack_04_Montage",
      "duration": 4.1333,
      "comboAt": 2.1512,
      "comboEnd": 3.5563
    },
    "GA_MoTian_Skill_15": {
      "id": "GA_MoTian_Skill_15",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_15.GA_MoTian_Skill_15_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_11_Montage.MoYuan_Skill_11_Montage",
      "duration": 2.8667,
      "comboAt": 1.6409,
      "comboEnd": 2.355
    },
    "GA_MoTian_Skill_05": {
      "id": "GA_MoTian_Skill_05",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_05.GA_MoTian_Skill_05_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_AAABB_Montage.MoYuan_AAABB_Montage",
      "duration": 4.6333,
      "comboAt": 2.2731,
      "comboEnd": 3.634
    },
    "GA_MoTian_SpecialAttack_14": {
      "id": "GA_MoTian_SpecialAttack_14",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_14.GA_MoTian_SpecialAttack_14_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/Retarget/MoTian_SpecialAttack_01_Placeholder_Montage.MoTian_SpecialAttack_01_Placeholder_Montage",
      "duration": 2.8333,
      "comboAt": 1.1675,
      "comboEnd": 2.1098
    },
    "GA_MoTian_Skill_01": {
      "id": "GA_MoTian_Skill_01",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_01.GA_MoTian_Skill_01_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_SpecialAttack_03_Montage.MoTian_SpecialAttack_03_Montage",
      "duration": 4.6333,
      "comboAt": 2.0845,
      "comboEnd": 3.0969
    },
    "GA_MoTian_Skill_11": {
      "id": "GA_MoTian_Skill_11",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_11.GA_MoTian_Skill_11_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_SpecialAttack_01_Montage.MoYuan_SpecialAttack_01_Montage",
      "duration": 3.4,
      "comboAt": 2.1632,
      "comboEnd": 2.9149
    },
    "GA_MoTian_Skill_12": {
      "id": "GA_MoTian_Skill_12",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_12.GA_MoTian_Skill_12_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_SwiftExecution_01_Montage.MoYuan_SwiftExecution_01_Montage",
      "duration": 3.15,
      "comboAt": 1.2982,
      "comboEnd": 1.8447
    },
    "GA_MoTian_Skill_04": {
      "id": "GA_MoTian_Skill_04",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_04.GA_MoTian_Skill_04_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_AAAAA_Montage.MoYuan_AAAAA_Montage",
      "duration": 3.7,
      "comboAt": 1.665,
      "comboEnd": 2.7924
    },
    "GA_MoTian_SpecialAttack_04": {
      "id": "GA_MoTian_SpecialAttack_04",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_04.GA_MoTian_SpecialAttack_04_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_ABB_Montage.MoYuan_ABB_Montage",
      "duration": 4.0667,
      "comboAt": 1.8125,
      "comboEnd": 3.0031
    },
    "GA_MoTian_SpecialAttack_10": {
      "id": "GA_MoTian_SpecialAttack_10",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_10.GA_MoTian_SpecialAttack_10_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_SpecialAttack_02_Montage.MoYuan_SpecialAttack_02_Montage",
      "duration": 4.2667,
      "comboAt": 2.5392,
      "comboEnd": 3.6243
    },
    "GA_MoTian_Skill_07": {
      "id": "GA_MoTian_Skill_07",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_07.GA_MoTian_Skill_07_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_06_Montage.MoYuan_Skill_06_Montage",
      "duration": 5.7,
      "comboAt": 3.2997,
      "comboEnd": 4.934
    },
    "GA_MoTian_Skill_10": {
      "id": "GA_MoTian_Skill_10",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_10.GA_MoTian_Skill_10_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_10_Montage.MoYuan_Skill_10_Montage",
      "duration": 4.2167,
      "comboAt": 2.1142,
      "comboEnd": 3.4626
    },
    "GA_MoTian_LightAttack_01": {
      "id": "GA_MoTian_LightAttack_01",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_LightAttack_01.GA_MoTian_LightAttack_01_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_SpecialAttack_02_A_Montage.MoTian_SpecialAttack_02_A_Montage",
      "duration": 2.6667,
      "comboAt": 1.0531,
      "comboEnd": 1.5611
    },
    "GA_MoTian_SpecialAttack_03": {
      "id": "GA_MoTian_SpecialAttack_03",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_03.GA_MoTian_SpecialAttack_03_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_AAAB_Montage.MoYuan_AAAB_Montage",
      "duration": 4.15,
      "comboAt": 2.0335,
      "comboEnd": 3.3909
    },
    "GA_MoTian_SpecialAttack_05": {
      "id": "GA_MoTian_SpecialAttack_05",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_05.GA_MoTian_SpecialAttack_05_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_03_Montage.MoYuan_Skill_03_Montage",
      "duration": 3.5833,
      "comboAt": 1.4972,
      "comboEnd": 2.2963
    },
    "GA_MoTian_LightAttack_02": {
      "id": "GA_MoTian_LightAttack_02",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_LightAttack_02.GA_MoTian_LightAttack_02_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_A_Montage.MoYuan_A_Montage",
      "duration": 2.8167,
      "comboAt": 1.0158,
      "comboEnd": 1.6645
    },
    "GA_MoTian_Skill_06": {
      "id": "GA_MoTian_Skill_06",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_06.GA_MoTian_Skill_06_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_02_Montage.MoYuan_Skill_02_Montage",
      "duration": 6.5,
      "comboAt": 5.0704,
      "comboEnd": 5.5907
    },
    "GA_MoTian_Skill_02": {
      "id": "GA_MoTian_Skill_02",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_02.GA_MoTian_Skill_02_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_SpecialAttack_02_Montage.MoTian_SpecialAttack_02_Montage",
      "duration": 4.2167,
      "comboAt": 2.1707,
      "comboEnd": 2.7615
    },
    "GA_MoTian_SpecialAttack_08": {
      "id": "GA_MoTian_SpecialAttack_08",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_08.GA_MoTian_SpecialAttack_08_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_04_Montage.MoYuan_Skill_04_Montage",
      "duration": 3.95,
      "comboAt": 1.324,
      "comboEnd": 2.3653
    },
    "GA_MoTian_SpecialAttack_13": {
      "id": "GA_MoTian_SpecialAttack_13",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_13.GA_MoTian_SpecialAttack_13_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_SpecialAttack_05_Montage.MoYuan_SpecialAttack_05_Montage",
      "duration": 3.3333,
      "comboAt": 1.0522,
      "comboEnd": 2.47
    },
    "GA_MoTian_SwitchPhase": {
      "id": "GA_MoTian_SwitchPhase",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SwitchPhase.GA_MoTian_SwitchPhase_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_13_Montage.MoYuan_Skill_13_Montage",
      "duration": 3.7333,
      "comboAt": 2.2091,
      "comboEnd": 2.5441
    },
    "GA_MoTian_SpecialAttack_16": {
      "id": "GA_MoTian_SpecialAttack_16",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_16.GA_MoTian_SpecialAttack_16_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_09_B_Montage.MoYuan_Skill_09_B_Montage",
      "duration": 4.3,
      "comboAt": 1.9746,
      "comboEnd": 2.8086
    },
    "GA_MoTian_Skill_08": {
      "id": "GA_MoTian_Skill_08",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_08.GA_MoTian_Skill_08_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_07_Montage.MoYuan_Skill_07_Montage",
      "duration": 13.55,
      "comboAt": 10.2252,
      "comboEnd": 11.5133
    },
    "GA_MoTian_Skill_03": {
      "id": "GA_MoTian_Skill_03",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_03.GA_MoTian_Skill_03_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_SpecialAttack_01_Montage.MoTian_SpecialAttack_01_Montage",
      "duration": 3.7,
      "comboAt": 1.7828,
      "comboEnd": 2.0038
    },
    "GA_MoTian_SpecialAttack_07": {
      "id": "GA_MoTian_SpecialAttack_07",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_07.GA_MoTian_SpecialAttack_07_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_01_B_Montage.MoYuan_Skill_01_B_Montage",
      "duration": 3.35,
      "comboAt": 1.4367,
      "comboEnd": 2.4097
    },
    "GA_MoTian_SpecialAttack_09": {
      "id": "GA_MoTian_SpecialAttack_09",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_09.GA_MoTian_SpecialAttack_09_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_05_Montage.MoYuan_Skill_05_Montage",
      "duration": 6.5667,
      "comboAt": 2.6653,
      "comboEnd": 5.3313
    },
    "GA_MoTian_Skill_09": {
      "id": "GA_MoTian_Skill_09",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_Skill_09.GA_MoTian_Skill_09_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_08_Montage.MoYuan_Skill_08_Montage",
      "duration": 11.6333,
      "comboAt": 8.9183,
      "comboEnd": 10.3268
    },
    "GA_MoTian_SpecialAttack_15": {
      "id": "GA_MoTian_SpecialAttack_15",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/GA_MoTian_SpecialAttack_15.GA_MoTian_SpecialAttack_15_C",
      "input": "/PBZInput/InputActions/IA_AttackH_Press.IA_AttackH_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Skill_09_Montage.MoYuan_Skill_09_Montage",
      "duration": 1.9833,
      "comboAt": 0.8734,
      "comboEnd": 1.539
    },
    "GA_MoTian_Dodge_R_02": {
      "id": "GA_MoTian_Dodge_R_02",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Dodge_R_02.GA_MoTian_Dodge_R_02_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Dodge_R_Montage.MoYuan_Dodge_R_Montage",
      "duration": 1.6667,
      "comboAt": 0.6554,
      "comboEnd": 1.0333
    },
    "GA_MoTian_Dodge_L_02": {
      "id": "GA_MoTian_Dodge_L_02",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Dodge_L_02.GA_MoTian_Dodge_L_02_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Dodge_L_Montage.MoYuan_Dodge_L_Montage",
      "duration": 2.0333,
      "comboAt": 0.8717,
      "comboEnd": 1.2009
    },
    "GA_MoTian_Dodge_F": {
      "id": "GA_MoTian_Dodge_F",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Dodge_F.GA_MoTian_Dodge_F_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_Dodge_F_Montage.MoTian_Dodge_F_Montage",
      "duration": 3.5,
      "comboAt": 0.9126,
      "comboEnd": 1.8764
    },
    "GA_MoTian_Dodge_F_02": {
      "id": "GA_MoTian_Dodge_F_02",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Dodge_F_02.GA_MoTian_Dodge_F_02_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Dodge_F_Montage.MoYuan_Dodge_F_Montage",
      "duration": 2.4667,
      "comboAt": 1.2497,
      "comboEnd": 1.8764
    },
    "GA_MoTian_Dodge_R": {
      "id": "GA_MoTian_Dodge_R",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Dodge_R.GA_MoTian_Dodge_R_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_Dodge_R_Montage.MoTian_Dodge_R_Montage",
      "duration": 3.3333,
      "comboAt": 0.5975,
      "comboEnd": 1.3501
    },
    "GA_MoTian_Walk_F": {
      "id": "GA_MoTian_Walk_F",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Walk_F.GA_MoTian_Walk_F_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Battle_Walk_Fwd_Stop_Montage.MoYuan_Battle_Walk_Fwd_Stop_Montage",
      "duration": 4.0333,
      "comboAt": 0.5377,
      "comboEnd": 3.5663
    },
    "GA_MoTian_Dodge_B_03": {
      "id": "GA_MoTian_Dodge_B_03",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Dodge_B_03.GA_MoTian_Dodge_B_03_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoYuan_Dodge_B_01_Montage.MoYuan_Dodge_B_01_Montage",
      "duration": 2.45,
      "comboAt": 0.8497,
      "comboEnd": 1.6241
    },
    "GA_MoTian_Dodge_L": {
      "id": "GA_MoTian_Dodge_L",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Dodge_L.GA_MoTian_Dodge_L_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_Dodge_L_Montage.MoTian_Dodge_L_Montage",
      "duration": 1.6333,
      "comboAt": 0.5033,
      "comboEnd": 0.8286
    },
    "GA_MoTian_Dodge_B": {
      "id": "GA_MoTian_Dodge_B",
      "classPath": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Ability/Dodge/GA_MoTian_Dodge_B.GA_MoTian_Dodge_B_C",
      "input": "/PBZInput/InputActions/IA_AttackL_Press.IA_AttackL_Press",
      "montage": "/PBZCombatAsset/ActorData/Mobs/067_MoTian/Montage/MoTian_Dodge_B_BanBen2_Montage.MoTian_Dodge_B_BanBen2_Montage",
      "duration": 2.2667,
      "comboAt": 0.6738,
      "comboEnd": 1.0726
    }
  }
};
