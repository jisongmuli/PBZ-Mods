"use strict";
const UE=require('ue'),cpp=require('cpp');
const NATIVE=['TeleportBtn_BrokenBell','TeleportBtn','ItemUpgradeButton','ShopButton','AbilityCultivation','ManualSave','JhsyButton','CloseBtn','HeartRepair'];
function detach(menu){const s=menu.__codexRiftChoices;if(!s)return;for(const x of s.items){try{x.button.OnButtonBaseClicked.Remove(x.fn);x.button.RemoveFromParent();}catch(_){}}s.items=[];}
const PAGE_SIZE=4;
function render(menu,runtime,catalog,view){
 detach(menu);const state=menu.__codexRiftChoices||(menu.__codexRiftChoices={items:[]});
 state.runtime=runtime;state.catalog=catalog;state.view=view;
 menu.StopAllAnimations();menu.Image_102.SetRenderOpacity(0);menu.Image_50.SetRenderOpacity(0);
 for(const name of NATIVE)if(menu[name])menu[name].SetVisibility(UE.ESlateVisibility.Collapsed);
 let parent=menu.ItemUpgradeButton.GetParent();while(parent&&!parent.IsA(UE.VerticalBox.StaticClass()))parent=parent.GetParent();
 if(!parent)throw Error('Native bell menu has no vertical list');
 for(let node=parent;node;node=node.GetParent())node.SetRenderOpacity(1);
 menu.CurrentBellNameText.SetRenderOpacity(1);menu.SetVisibility(UE.ESlateVisibility.Visible);
 const group=menu.GetButtonGroupByID('BellMenu');group.RemoveAll();group.bBindButtonNavigation=true;
 const add=(label,fn)=>{
  const button=UE.WidgetBlueprintLibrary.Create(menu,menu.ItemUpgradeButton.GetClass(),menu.GetOwningPlayer());
  button.SetButtonText(cpp.FText.FromString(label));if(button.RedPointBox)button.RedPointBox.SetVisibility(UE.ESlateVisibility.Collapsed);
  parent.AddChild(button);button.SetVisibility(UE.ESlateVisibility.Visible);button.SetRenderOpacity(1);button.OnButtonBaseClicked.Add(fn);group.AddWidget(button);state.items.push({button,fn});
  return button;
 };
 const title=text=>menu.CurrentBellNameText.SetText(cpp.FText.FromString(text));
 const show=next=>render(menu,runtime,catalog,next);
 let focus;
 if(view.kind==='settings'){
  title('挑战设置：'+runtime.selection.length+' / 5 个 Boss');
  for(const [field,label] of [['health','生命'],['shachi','杀气'],['damage','伤害（半伤基准）']]){
   add(label+'倍率：×'+runtime.multipliers[field],()=>show({kind:'multiplier',field,page:Math.floor((runtime.multipliers[field]-1)/PAGE_SIZE)}));
  }
  add('原版战斗配乐：'+(runtime.musicEnabled?'开启':'关闭'),()=>{if(runtime.setMusicEnabled(!runtime.musicEnabled))show(view);});
  add('编辑阵容（'+runtime.selection.length+' / 5）',()=>show({kind:'roster'}));
  add('继续添加 Boss',()=>show({kind:'bosses',page:runtime.lastMenuPage||0}));
  add('下一步：选择挑战方式',()=>show({kind:'modes'}));
  add('清空挑战并返回铃铛',()=>{menu.DeactivateWidget();runtime.returnToBell();});
 }else if(view.kind==='roster'){
  title('阵容顺序：'+runtime.selection.length+' / 5（配乐取第一个）');
  runtime.selection.forEach((id,index)=>add('移除 #'+(index+1)+' '+catalog.find(x=>x.id===id).name,()=>{if(runtime.removeBoss(index))show(view);}));
  add('清空所选阵容',()=>{if(runtime.clearSelection())show(view);});
  add('继续添加 Boss',()=>show({kind:'bosses',page:runtime.lastMenuPage||0}));
  add('返回挑战设置',()=>show({kind:'settings'}));
 }else if(view.kind==='modes'){
  title(view.notice||('选择挑战方式（已选 '+runtime.selection.length+' 个 Boss）'));
  const begin=mode=>{
   if(runtime.startMode(mode))menu.DeactivateWidget();
   else show({...view,notice:runtime.result||'请先选择 1–5 个 Boss'});
  };
  add('当前场地挑战',()=>begin('arena'));
  if(runtime.selection.length===1){
   add('原剧情场地：仅战斗（含转阶段）',()=>begin('original-battle'));
   add('原剧情完整流程（含转阶段）',()=>begin('original-story'));
  }
  add('返回挑战设置',()=>show({kind:'settings'}));
  add('清空挑战并返回铃铛',()=>{menu.DeactivateWidget();runtime.returnToBell();});
  add('关闭',()=>menu.DeactivateWidget());
 }else if(view.kind==='multiplier'&&['health','shachi','damage'].includes(view.field)){
  const page=Math.max(0,Math.min(4,view.page||0)),field=view.field,label=field==='health'?'生命':field==='shachi'?'杀气':'伤害（半伤基准）';
  state.view={...view,page};
  title(label+'：×'+runtime.multipliers[field]+(field==='damage'?' = 原伤 '+(runtime.multipliers[field]*50)+'%':'')+'（'+(page+1)+' / 5）');
  for(let value=page*PAGE_SIZE+1;value<=Math.min(20,(page+1)*PAGE_SIZE);value++){
   const button=add('×'+value+(runtime.multipliers[field]===value?'（当前）':''),()=>{if(runtime.setMultiplier(field,value))show({kind:'settings'});});
   if(runtime.multipliers[field]===value)focus=button;
  }
  if(page>0)add('上一页',()=>show({...view,page:page-1}));
  if(page<4)add('下一页',()=>show({...view,page:page+1}));
  add('返回挑战设置',()=>show({kind:'settings'}));
  add('关闭',()=>menu.DeactivateWidget());
 }else{
  const pages=Math.ceil(catalog.length/PAGE_SIZE),page=Math.max(0,Math.min(pages-1,view.page||0));
  state.view={kind:'bosses',page};runtime.lastMenuPage=page;
  title((view.notice||'影境再战')+' '+(page+1)+' / '+pages+'（阵容 '+runtime.selection.length+' / 5）');
  for(const item of catalog.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)){
   const count=runtime.selection.filter(id=>id===item.id).length;
   add(item.name+(count?'（已选 ×'+count+'）':''),()=>{const ok=runtime.addBoss(item.id);show({...state.view,notice:ok?undefined:'最多选择 5 个 Boss'});});
  }
  if(page>0)add('上一页',()=>show({kind:'bosses',page:page-1}));
  if(page+1<pages)add('下一页',()=>show({kind:'bosses',page:page+1}));
  add('挑战设置（'+runtime.selection.length+' / 5）',()=>show({kind:'settings'}));
  add('返回裂缝外',()=>{menu.DeactivateWidget();runtime.returnOutside();});
 }
 (focus||state.items[0]?.button)?.SetFocus();
}
function attach(menu,runtime,catalog,page=0){render(menu,runtime,catalog,{kind:'bosses',page});}
function back(menu){
 const s=menu.__codexRiftChoices;
 if(['multiplier','roster','modes'].includes(s?.view.kind))render(menu,s.runtime,s.catalog,{kind:'settings'});
 else if(s?.view.kind==='settings')render(menu,s.runtime,s.catalog,{kind:'bosses',page:s.runtime.lastMenuPage||0});
 else menu.DeactivateWidget();
 return true;
}
module.exports={attach,detach,back};
