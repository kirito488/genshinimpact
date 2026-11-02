export const DIMENSIONS = [
  { id: 'social', name: '社交能量', low: '独处充电', high: '主动联结', hint: ['你会在安静中整理感受，深度相处比热闹更能为你充电。', '你习惯通过交流获得能量，也愿意主动打开一段关系。'] },
  { id: 'care', name: '关怀方式', low: '理性务实', high: '共情陪伴', hint: ['你倾向用清晰分析和实际帮助表达关心。', '你善于察觉他人的情绪，愿意先理解，再一起找办法。'] },
  { id: 'order', name: '行动节奏', low: '灵活随兴', high: '规划有序', hint: ['你会给变化留位置，愿意边走边调整路线。', '你习惯做好准备，用稳定的节奏把承诺落到实处。'] },
  { id: 'drive', name: '决策姿态', low: '审慎协调', high: '果断引领', hint: ['你愿意先观察、听取意见，再选择合适的行动时机。', '当局面需要推动时，你愿意作出选择并承担责任。'] },
  { id: 'curiosity', name: '探索倾向', low: '熟悉深耕', high: '好奇开拓', hint: ['你珍惜熟悉事物的深度，在长期投入中发现价值。', '未知会激起你的兴趣，你愿意试试地图以外的可能。'] },
  { id: 'autonomy', name: '相处边界', low: '共同协作', high: '独立自主', hint: ['你看重一起完成事情的联结感，愿意协调彼此的步调。', '你重视独立判断与个人空间，也尊重他人的选择。'] },
];

export const REGIONS = [
  { id:'mondstadt', name:'蒙德', english:'MONDSTADT', element:'风', theme:'自由之风', accent:'#73cdb5', dark:'#174e4d', subtitle:'让风带来你的答案', description:'从风起地的树荫出发，在自由与责任之间，找到属于你的风向。', icon:'wind', chapters:['风起地的邀约','城门边的相遇','骑士团的委托','风花节的心事','向风而行'], keyHash:'513761b23b77a1be3f4b39a73ccd7398aa0050a8087af0da6c7d1cc2d0f2acdb' },
  { id:'liyue', name:'璃月', english:'LIYUE', element:'岩', theme:'山海之约', accent:'#e7b565', dark:'#775231', subtitle:'山海有约，心自有光', description:'走过港口与山间，让一盏海灯照见你珍视的承诺与日常。', icon:'mountain', chapters:['港口的新委托','山间的同行人','契约之外的选择','海灯下的愿望','山海为证'], keyHash:'b06a550261762a4f18eb1372d28d3e1036f7670612ca09479540b7269ea5836d' },
  { id:'inazuma', name:'稻妻', english:'INAZUMA', element:'雷', theme:'樱雷之境', accent:'#bba0ed', dark:'#514275', subtitle:'在变化中听见自己', description:'穿过鸣神的樱雨，在坚持与改变之间，书写自己的答案。', icon:'bolt', chapters:['离岛的来信','樱树下的相处','雷雨中的决定','祭典前的一夜','心之所向'], keyHash:'5f5afcc244f995cfbda0ba91f2345ea8495f4f6d1d5adc66ad99b1bb75a255c1' },
  { id:'sumeru', name:'须弥', english:'SUMERU', element:'草', theme:'林间之思', accent:'#b5cd7d', dark:'#4b603c', subtitle:'每一次好奇，都是新芽', description:'从雨林到书页，把理性与感受交给一场没有标准答案的探索。', icon:'leaf', chapters:['雨林里的问候','智慧宫的午后','沙海中的抉择','梦境里的回声','属于你的智慧'], keyHash:'9e8775d3d5c0c595fcf3524f8576bbc1c565d65b3bfbbe1904cdc7b794ba93e9' },
  { id:'fontaine', name:'枫丹', english:'FONTAINE', element:'水', theme:'水色之幕', accent:'#8dbbe7', dark:'#315d80', subtitle:'幕起，成为真实的自己', description:'在水道、舞台与日常之间，发现你如何表达、倾听与守护。', icon:'drop', chapters:['水道上的初见','聚光灯与幕后','天平两端的选择','深水中的回声','谢幕后的真心'], keyHash:'0f8b14fe06d0de917844c00c077b31ee000061852bb7ffb6f9a3f9fdf3114fc2' },
  { id:'natlan', name:'纳塔', english:'NATLAN', element:'火', theme:'炽热之旅', accent:'#ed9d7f', dark:'#84482f', subtitle:'让热爱，为旅途点火', description:'跟随伙伴走过原野与温泉，寻找勇气、归属与自己的步伐。', icon:'flame', chapters:['原野上的邀请','伙伴与营火','赛场之外的勇气','温泉边的独白','把火种带回家'], keyHash:'78b99a1d7c8d11b578e4260d4a2b051e34d6c6d8c5c971d194f141e5fd5dd6c9' },
  { id:'nodkrai', name:'挪德卡莱', english:'NOD-KRAI', element:'月', theme:'月下之途', accent:'#9acbd8', dark:'#365b70', subtitle:'月光之下，自有归途', description:'走进北境的自治之地，在工坊、灯火与月色之间，寻找心的坐标。', icon:'moon', chapters:['月下的入境信','工坊里的新伙伴','灯火旁的选择','北境长夜的心声','你的月光坐标'], keyHash:'4ebfd7a7f57988e30c129b0725b3df47390bbdc6f6dc754f20df83a4581d6f4e' },
];
export const getRegion = id => REGIONS.find(region => region.id === id);
