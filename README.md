# 影之刃零：魂·巅峰 & 影境再战

两个互不依赖的 Windows / Steam Mod，可以单独安装，也可以同时使用。

## 下载

到 [v2.0.2 发布页](https://github.com/jisongmuli/PBZ-Mods/releases/tag/v2.0.2) 下载：

| 文件 | 内容 |
| --- | --- |
| [PBZ-HunPeak-v1.1.1.zip](https://github.com/jisongmuli/PBZ-Mods/releases/download/v2.0.2/PBZ-HunPeak-v1.1.1.zip) | 魂·巅峰独立版，F8 开关 |
| [PBZ-RiftArena-v2.0.2.zip](https://github.com/jisongmuli/PBZ-Mods/releases/download/v2.0.2/PBZ-RiftArena-v2.0.2.zip) | 影境再战独立版，F9 清场返回 |
| [PBZ-Mods-v2.0.2.zip](https://github.com/jisongmuli/PBZ-Mods/releases/download/v2.0.2/PBZ-Mods-v2.0.2.zip) | 上述两个独立 Mod，一次下载 |

## 安装

1. 正常退出游戏。建议先自行备份现有存档。
2. 将下载的 ZIP 解压到游戏安装根目录，让包内 `ProjectPBZ` 与游戏现有文件夹合并。
3. 确认三个同名前缀的 `.pak`、`.utoc`、`.ucas` 一起位于 `ProjectPBZ/Content/Paks/~mods`。
4. 保留包内 `ProjectPBZ/Saved/CodexHunPeak`、`ProjectPBZ/Saved/CodexRiftArena` 空文件夹，供本机诊断及恢复日志使用；没有的目录手动新建即可。
5. 重启游戏。路径会按实际安装位置自动解析，不要求 E 盘。

卸载时先退出挑战并正常关闭游戏，再移出所选 Mod 的三个文件。不要同时启用旧的 `zzz_CodexFinalForm_P` 合并测试包或 `zzzz_CodexRiftLab_P` 开发探针。

## 魂·巅峰

- F8 开启／关闭原生最终黑伤剑状态，使用已拥有的 HeiMoShang。
- 尊重手动换武器；只撤销本 Mod 新加的效果。
- 不包含再战、切图或存档槽修改功能。

[完整说明](docs/CodexHunPeak.md)

## 影境再战

- 首次三魔偶剧情结束、圣母像裂缝关闭后，可重复进入原来的三魔偶房间。
- 铃铛放在传送落脚点旁，挑战位于前方庭院。
- 87 个可选形态，最多 5 个相同或不同 Boss；阵容顺序决定配乐来源。
- 生命、杀气、伤害独立设置 1–20 整数倍率。伤害以原版的一半为基准：×1=50%，×2=100%，×20=1000%。
- 原生战斗配乐开关；当前场地按第一个 Boss 选曲，原剧情场地保留原生阶段配乐切换。
- 当前场地挑战、原剧情场地仅战斗、原剧情完整流程。两种原剧情模式限单 Boss，并保留原生转阶段。
- F9 清场回铃铛。原剧情模式使用独立挑战与返回快照，恢复挑战前装备和进度。
- 击败全部 Boss 后留在现场，玩家手动按 F9 返回；不会因胜利自动传送。玩家战败与加载失败仍保留恢复返回。

[完整说明](docs/CodexRiftArena.md)

## 测试范围

这是测试发布。当前源码通过 52 项自动检查，覆盖单 Boss、五 Boss（含重复选择）胜利停留、长时间等待、暂停、手动 F9 返回、异常结束及原剧情两种模式。此前玩法基线做过五 Boss 同场、倍率、配乐、原场地阶段切换与返回恢复的代表性隔离实测。

本次更新将当前场地的胜利结算与返回传送分开，胜利后保留现场，按 F9 才返回。新增行为已经自动回归，尚未完成本版实机验证。所有 87 个形态、支线分支、结局及实际 F9 键盘输入尚未逐一完整验证。未识别的演出会保留，以避免误跳转阶段。游戏更新、原生脚本改动或其他覆盖相同文件的 Mod 可能需要重新适配。

此仓库不附带个人存档、账号信息、运行日志、原生资源研究转储或解包工具。`src` 为 Mod 自编代码，`hooks` 为挂钩追加片段，`config-templates` 为可移植配置。游戏原生启动／菜单模块只存在于运行补丁包中，不作为独立源文件上传。

## 源码检查

安装 Node.js 后运行：

```sh
node --test tests/*.test.js
```

构建还需要匹配的游戏原生挂钩模块及 Unreal Pak / IoStore 打包工具；此仓库没有附带游戏原始文件或工具二进制。
