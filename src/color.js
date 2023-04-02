// vim:fdm=syntax
// by tuberry
/* exported DARK LIGHT random */
'use strict';
const Me = imports.misc.extensionUtils.getCurrentExtension();
const { lot } = Me.imports.util;

var DARK = [0.14, 0.14, 0.14, 1];
var LIGHT = [0.9, 0.9, 0.9, 1];

function random(dark, alpha = 1) {
    let { rgb, name } = lot(dark === undefined ? ModerateColors : dark ? LightColors : DarkColors);
    return { color: rgb.map(x => x / 255).concat(alpha), name };
}
// from https://github.com/unicar9/jizhi/blob/master/src/constants/wavesColors.json
const Colors = [
    { rgb: [249, 244, 228], name: '乳白' },
    { rgb: [249, 236, 195], name: '杏仁黄' },
    { rgb: [248, 223, 114], name: '茉莉黄' },
    { rgb: [248, 223, 112], name: '麦秆黄' },
    { rgb: [251, 218, 65],  name: '油菜花黄' },
    { rgb: [254, 215, 26],  name: '佛手黄' },
    { rgb: [247, 222, 152], name: '篾黄' },
    { rgb: [248, 216, 106], name: '葵扇黄' },
    { rgb: [252, 211, 55],  name: '柠檬黄' },
    { rgb: [252, 210, 23],  name: '金瓜黄' },
    { rgb: [254, 209, 16],  name: '藤黄' },
    { rgb: [246, 222, 148], name: '酪黄' },
    { rgb: [247, 218, 148], name: '香水玫瑰黄' },
    { rgb: [249, 211, 103], name: '淡密黄' },
    { rgb: [251, 205, 49],  name: '大豆黄' },
    { rgb: [252, 203, 22],  name: '素馨黄' },
    { rgb: [254, 204, 17],  name: '向日葵黄' },
    { rgb: [251, 200, 47],  name: '雅梨黄' },
    { rgb: [252, 197, 21],  name: '黄连黄' },
    { rgb: [252, 195, 7],   name: '金盏黄' },
    { rgb: [248, 195, 135], name: '蛋壳黄' },
    { rgb: [247, 193, 115], name: '肉色' },
    { rgb: [251, 185, 41],  name: '鹅掌黄' },
    { rgb: [251, 182, 18],  name: '鸡蛋黄' },
    { rgb: [252, 183, 10],  name: '鼬黄' },
    { rgb: [249, 166, 51],  name: '榴萼黄' },
    { rgb: [251, 164, 20],  name: '淡橘橙' },
    { rgb: [252, 161, 6],   name: '枇杷黄' },
    { rgb: [252, 161, 4],   name: '橙皮黄' },
    { rgb: [252, 140, 35],  name: '北瓜黄' },
    { rgb: [250, 142, 22],  name: '杏黄' },
    { rgb: [255, 153, 0],   name: '雄黄' },
    { rgb: [251, 139, 5],   name: '万寿菊黄' },
    { rgb: [233, 221, 182], name: '菊蕾黄' },
    { rgb: [238, 208, 69],  name: '秋葵黄' },
    { rgb: [242, 206, 43],  name: '硫华黄' },
    { rgb: [241, 202, 23],  name: '柚黄' },
    { rgb: [221, 200, 113], name: '芒果黄' },
    { rgb: [223, 194, 67],  name: '蒿黄' },
    { rgb: [226, 192, 39],  name: '姜黄' },
    { rgb: [228, 191, 17],  name: '香蕉黄' },
    { rgb: [210, 180, 44],  name: '草黄' },
    { rgb: [210, 177, 22],  name: '新禾绿' },
    { rgb: [183, 174, 143], name: '月灰' },
    { rgb: [173, 158, 85],  name: '淡灰绿' },
    { rgb: [142, 128, 75],  name: '草灰绿' },
    { rgb: [136, 115, 34],  name: '苔绿' },
    { rgb: [134, 112, 24],  name: '碧螺春绿' },
    { rgb: [104, 94,  72],  name: '燕羽灰' },
    { rgb: [105, 94,  69],  name: '蟹壳灰' },
    { rgb: [100, 88,  34],  name: '潭水绿' },
    { rgb: [94,  83,  20],  name: '橄榄绿' },
    { rgb: [249, 241, 219], name: '蚌肉白' },
    { rgb: [248, 232, 193], name: '豆汁黄' },
    { rgb: [248, 215, 112], name: '淡茧黄' },
    { rgb: [255, 201, 12],  name: '乳鸭黄' },
    { rgb: [242, 230, 206], name: '荔肉白' },
    { rgb: [240, 214, 149], name: '象牙黄' },
    { rgb: [244, 206, 105], name: '炒米黄' },
    { rgb: [246, 196, 48],  name: '鹦鹉冠黄' },
    { rgb: [249, 193, 22],  name: '木瓜黄' },
    { rgb: [249, 189, 16],  name: '浅烙黄' },
    { rgb: [229, 211, 170], name: '莲子白' },
    { rgb: [232, 176, 4],   name: '谷黄' },
    { rgb: [235, 177, 13],  name: '栀子黄' },
    { rgb: [217, 164, 14],  name: '芥黄' },
    { rgb: [181, 170, 144], name: '银鼠灰' },
    { rgb: [182, 164, 118], name: '尘灰' },
    { rgb: [183, 141, 18],  name: '枯绿' },
    { rgb: [135, 114, 62],  name: '鲛青' },
    { rgb: [135, 104, 24],  name: '粽叶绿' },
    { rgb: [138, 105, 19],  name: '灰绿' },
    { rgb: [74,  64,  53],  name: '鹤灰' },
    { rgb: [77,  64,  48],  name: '淡松烟' },
    { rgb: [88,  71,  23],  name: '暗海水绿' },
    { rgb: [91,  73,  19],  name: '棕榈绿' },
    { rgb: [249, 223, 205], name: '米色' },
    { rgb: [248, 224, 176], name: '淡肉色' },
    { rgb: [249, 210, 125], name: '麦芽糖黄' },
    { rgb: [254, 186, 7],   name: '琥珀黄' },
    { rgb: [243, 191, 76],  name: '甘草黄' },
    { rgb: [248, 188, 49],  name: '初熟杏黄' },
    { rgb: [226, 193, 124], name: '浅驼色' },
    { rgb: [229, 183, 81],  name: '沙石黄' },
    { rgb: [234, 173, 26],  name: '虎皮黄' },
    { rgb: [214, 160, 29],  name: '土黄' },
    { rgb: [180, 169, 146], name: '百灵鸟灰' },
    { rgb: [183, 139, 38],  name: '山鸡黄' },
    { rgb: [130, 107, 72],  name: '龟背黄' },
    { rgb: [128, 99,  50],  name: '苍黄' },
    { rgb: [129, 95,  37],  name: '莱阳梨黄' },
    { rgb: [131, 94,  29],  name: '蜴蜊绿' },
    { rgb: [79,  64,  50],  name: '松鼠灰' },
    { rgb: [80,  62,  42],  name: '橄榄灰' },
    { rgb: [81,  60,  32],  name: '蟹壳绿' },
    { rgb: [83,  60,  27],  name: '古铜绿' },
    { rgb: [85,  59,  24],  name: '焦茶绿' },
    { rgb: [251, 242, 227], name: '粉白' },
    { rgb: [249, 232, 208], name: '落英淡粉' },
    { rgb: [249, 203, 139], name: '瓜瓤粉' },
    { rgb: [251, 185, 87],  name: '蜜黄' },
    { rgb: [255, 166, 15],  name: '金叶黄' },
    { rgb: [244, 168, 58],  name: '金莺黄' },
    { rgb: [227, 189, 141], name: '鹿角棕' },
    { rgb: [231, 162, 63],  name: '凋叶棕' },
    { rgb: [218, 164, 90],  name: '玳瑁黄' },
    { rgb: [222, 158, 68],  name: '软木黄' },
    { rgb: [220, 145, 35],  name: '风帆黄' },
    { rgb: [192, 147, 81],  name: '桂皮淡棕' },
    { rgb: [151, 132, 108], name: '猴毛灰' },
    { rgb: [152, 101, 36],  name: '山鸡褐' },
    { rgb: [102, 70,  42],  name: '驼色' },
    { rgb: [93,  61,  33],  name: '茶褐' },
    { rgb: [92,  55,  25],  name: '古铜褐' },
    { rgb: [251, 236, 222], name: '荷花白' },
    { rgb: [248, 179, 127], name: '玫瑰粉' },
    { rgb: [249, 125, 28],  name: '橘橙' },
    { rgb: [250, 126, 35],  name: '美人焦橙' },
    { rgb: [247, 205, 188], name: '润红' },
    { rgb: [246, 206, 193], name: '淡桃红' },
    { rgb: [240, 148, 93],  name: '海螺橙' },
    { rgb: [240, 173, 160], name: '桃红' },
    { rgb: [238, 170, 156], name: '颊红' },
    { rgb: [238, 160, 140], name: '淡罂粟红' },
    { rgb: [234, 137, 88],  name: '晨曦红' },
    { rgb: [242, 118, 53],  name: '蟹壳红' },
    { rgb: [248, 107, 29],  name: '金莲花橙' },
    { rgb: [239, 111, 72],  name: '草莓红' },
    { rgb: [239, 99,  43],  name: '龙睛鱼红' },
    { rgb: [241, 68,  29],  name: '蜻蜓红' },
    { rgb: [240, 75,  34],  name: '大红' },
    { rgb: [242, 72,  27],  name: '柿红' },
    { rgb: [243, 71,  24],  name: '榴花红' },
    { rgb: [244, 62,  6],   name: '银朱' },
    { rgb: [237, 81,  38],  name: '朱红' },
    { rgb: [240, 156, 90],  name: '鲑鱼红' },
    { rgb: [242, 123, 31],  name: '金黄' },
    { rgb: [217, 145, 86],  name: '鹿皮褐' },
    { rgb: [219, 133, 64],  name: '醉瓜肉' },
    { rgb: [222, 118, 34],  name: '麂棕' },
    { rgb: [193, 178, 163], name: '淡银灰' },
    { rgb: [190, 126, 74],  name: '淡赭' },
    { rgb: [193, 101, 26],  name: '槟榔棕' },
    { rgb: [145, 128, 114], name: '银灰' },
    { rgb: [154, 136, 120], name: '海鸥灰' },
    { rgb: [148, 88,  51],  name: '淡咖啡' },
    { rgb: [150, 77,  34],  name: '岩石棕' },
    { rgb: [149, 68,  22],  name: '芒果棕' },
    { rgb: [98,  73,  65],  name: '石板灰' },
    { rgb: [100, 72,  61],  name: '珠母灰' },
    { rgb: [113, 54,  29],  name: '丁香棕' },
    { rgb: [117, 49,  23],  name: '咖啡' },
    { rgb: [115, 46,  18],  name: '笋皮棕' },
    { rgb: [252, 99,  21],  name: '燕颔红' },
    { rgb: [232, 180, 154], name: '玉粉红' },
    { rgb: [228, 104, 40],  name: '金驼' },
    { rgb: [216, 89,  22],  name: '铁棕' },
    { rgb: [183, 160, 145], name: '蛛网灰' },
    { rgb: [183, 81,  29],  name: '淡可可棕' },
    { rgb: [139, 97,  77],  name: '中红灰' },
    { rgb: [140, 75,  49],  name: '淡土黄' },
    { rgb: [135, 61,  36],  name: '淡豆沙' },
    { rgb: [136, 58,  30],  name: '椰壳棕' },
    { rgb: [91,  66,  58],  name: '淡铁灰' },
    { rgb: [96,  61,  48],  name: '中灰驼' },
    { rgb: [103, 52,  36],  name: '淡栗棕' },
    { rgb: [101, 43,  28],  name: '可可棕' },
    { rgb: [105, 42,  27],  name: '柞叶棕' },
    { rgb: [251, 153, 104], name: '野蔷薇红' },
    { rgb: [252, 121, 48],  name: '菠萝红' },
    { rgb: [237, 195, 174], name: '藕荷' },
    { rgb: [225, 103, 35],  name: '陶瓷红' },
    { rgb: [212, 196, 183], name: '晓灰' },
    { rgb: [207, 117, 67],  name: '余烬红' },
    { rgb: [205, 98,  39],  name: '火砖红' },
    { rgb: [170, 106, 76],  name: '火泥棕' },
    { rgb: [166, 82,  44],  name: '绀红' },
    { rgb: [119, 61,  49],  name: '橡树棕' },
    { rgb: [72,  51,  50],  name: '海报灰' },
    { rgb: [175, 46,  43],  name: '玫瑰灰' },
    { rgb: [72,  37,  34],  name: '火山棕' },
    { rgb: [72,  30,  28],  name: '豆沙' },
    { rgb: [251, 238, 226], name: '淡米粉' },
    { rgb: [246, 220, 206], name: '初桃粉红' },
    { rgb: [247, 207, 186], name: '介壳淡粉红' },
    { rgb: [246, 173, 143], name: '淡藏花红' },
    { rgb: [246, 140, 96],  name: '瓜瓤红' },
    { rgb: [249, 114, 61],  name: '芙蓉红' },
    { rgb: [250, 93,  25],  name: '莓酱红' },
    { rgb: [238, 128, 85],  name: '法螺红' },
    { rgb: [207, 72,  19],  name: '落霞红' },
    { rgb: [184, 148, 133], name: '淡玫瑰灰' },
    { rgb: [177, 75,  40],  name: '蟹蝥红' },
    { rgb: [134, 48,  32],  name: '火岩棕' },
    { rgb: [134, 38,  23],  name: '赭石' },
    { rgb: [89,  38,  32],  name: '暗驼棕' },
    { rgb: [90,  31,  27],  name: '酱棕' },
    { rgb: [92,  30,  25],  name: '栗棕' },
    { rgb: [244, 199, 186], name: '洋水仙红' },
    { rgb: [241, 118, 102], name: '谷鞘红' },
    { rgb: [241, 86,  66],  name: '苹果红' },
    { rgb: [245, 57,  28],  name: '铁水红' },
    { rgb: [242, 90,  71],  name: '桂红' },
    { rgb: [243, 59,  31],  name: '极光红' },
    { rgb: [242, 185, 178], name: '粉红' },
    { rgb: [241, 151, 144], name: '舌红' },
    { rgb: [240, 90,  70],  name: '曲红' },
    { rgb: [242, 62,  35],  name: '红汞红' },
    { rgb: [242, 202, 201], name: '淡绯' },
    { rgb: [239, 175, 173], name: '无花果红' },
    { rgb: [241, 144, 140], name: '榴子红' },
    { rgb: [240, 63,  36],  name: '胭脂红' },
    { rgb: [240, 161, 168], name: '合欢红' },
    { rgb: [241, 147, 156], name: '春梅红' },
    { rgb: [240, 124, 130], name: '香叶红' },
    { rgb: [240, 74,  58],  name: '珊瑚红' },
    { rgb: [241, 60,  34],  name: '萝卜红' },
    { rgb: [231, 124, 142], name: '淡茜红' },
    { rgb: [237, 90,  101], name: '艳红' },
    { rgb: [237, 72,  69],  name: '淡菽红' },
    { rgb: [237, 59,  47],  name: '鱼鳃红' },
    { rgb: [237, 51,  33],  name: '樱桃红' },
    { rgb: [238, 72,  102], name: '淡蕊香红' },
    { rgb: [238, 72,  99],  name: '石竹红' },
    { rgb: [239, 71,  93],  name: '草茉莉红' },
    { rgb: [238, 63,  77],  name: '茶花红' },
    { rgb: [237, 51,  51],  name: '枸枢红' },
    { rgb: [236, 43,  36],  name: '秋海棠红' },
    { rgb: [235, 38,  26],  name: '丽春红' },
    { rgb: [222, 42,  24],  name: '夕阳红' },
    { rgb: [212, 37,  23],  name: '鹤顶红' },
    { rgb: [171, 55,  47],  name: '鹅血石红' },
    { rgb: [172, 31,  24],  name: '覆盆子红' },
    { rgb: [93,  49,  49],  name: '貂紫' },
    { rgb: [92,  34,  35],  name: '暗玉紫' },
    { rgb: [90,  25,  27],  name: '栗紫' },
    { rgb: [90,  18,  22],  name: '葡萄酱紫' },
    { rgb: [238, 162, 164], name: '牡丹粉红' },
    { rgb: [237, 85,  106], name: '山茶红' },
    { rgb: [240, 55,  82],  name: '海棠红' },
    { rgb: [192, 72,  81],  name: '玉红' },
    { rgb: [192, 44,  56],  name: '高粱红' },
    { rgb: [167, 83,  90],  name: '满江红' },
    { rgb: [124, 24,  35],  name: '枣红' },
    { rgb: [76,  31,  36],  name: '葡萄紫' },
    { rgb: [77,  16,  24],  name: '酱紫' },
    { rgb: [238, 39,  70],  name: '淡曙红' },
    { rgb: [222, 28,  49],  name: '唐菖蒲红' },
    { rgb: [209, 26,  45],  name: '鹅冠红' },
    { rgb: [196, 90,  101], name: '莓红' },
    { rgb: [194, 31,  48],  name: '枫叶红' },
    { rgb: [166, 27,  41],  name: '苋菜红' },
    { rgb: [137, 78,  84],  name: '烟红' },
    { rgb: [130, 32,  43],  name: '暗紫苑红' },
    { rgb: [130, 17,  31],  name: '殷红' },
    { rgb: [84,  30,  36],  name: '猪肝紫' },
    { rgb: [80,  10,  22],  name: '金鱼紫' },
    { rgb: [248, 235, 230], name: '草珠红' },
    { rgb: [236, 118, 150], name: '淡绛红' },
    { rgb: [239, 52,  115], name: '品红' },
    { rgb: [234, 114, 147], name: '凤仙花红' },
    { rgb: [236, 155, 173], name: '粉团花红' },
    { rgb: [235, 80,  126], name: '夹竹桃红' },
    { rgb: [237, 47,  106], name: '榅桲红' },
    { rgb: [238, 184, 195], name: '姜红' },
    { rgb: [234, 81,  127], name: '莲瓣红' },
    { rgb: [241, 196, 205], name: '水红' },
    { rgb: [236, 138, 164], name: '报春红' },
    { rgb: [206, 87,  109], name: '月季红' },
    { rgb: [237, 157, 178], name: '豇豆红' },
    { rgb: [239, 130, 160], name: '霞光红' },
    { rgb: [235, 60,  112], name: '松叶牡丹红' },
    { rgb: [236, 44,  100], name: '喜蛋红' },
    { rgb: [227, 180, 184], name: '鼠鼻红' },
    { rgb: [204, 22,  58],  name: '尖晶玉红' },
    { rgb: [194, 124, 136], name: '山黎豆红' },
    { rgb: [191, 53,  83],  name: '锦葵红' },
    { rgb: [115, 87,  92],  name: '鼠背灰' },
    { rgb: [98,  22,  36],  name: '甘蔗紫' },
    { rgb: [99,  7,   28],  name: '石竹紫' },
    { rgb: [54,  40,  43],  name: '苍蝇灰' },
    { rgb: [48,  22,  28],  name: '卵石紫' },
    { rgb: [43,  18,  22],  name: '李紫' },
    { rgb: [45,  12,  19],  name: '茄皮紫' },
    { rgb: [206, 94,  138], name: '吊钟花红' },
    { rgb: [236, 78,  138], name: '兔眼红' },
    { rgb: [238, 44,  121], name: '紫荆红' },
    { rgb: [149, 28,  72],  name: '菜头紫' },
    { rgb: [98,  29,  52],  name: '鹞冠紫' },
    { rgb: [98,  16,  46],  name: '葡萄酒红' },
    { rgb: [56,  33,  41],  name: '磨石紫' },
    { rgb: [56,  25,  36],  name: '檀紫' },
    { rgb: [51,  20,  30],  name: '火鹅紫' },
    { rgb: [49,  15,  27],  name: '墨紫' },
    { rgb: [238, 166, 183], name: '晶红' },
    { rgb: [239, 73,  139], name: '扁豆花红' },
    { rgb: [222, 120, 151], name: '白芨红' },
    { rgb: [222, 63,  124], name: '嫩菱红' },
    { rgb: [209, 60,  116], name: '菠根红' },
    { rgb: [197, 112, 139], name: '酢酱草红' },
    { rgb: [168, 69,  107], name: '洋葱紫' },
    { rgb: [75,  30,  47],  name: '海象紫' },
    { rgb: [70,  22,  41],  name: '绀紫' },
    { rgb: [68,  14,  37],  name: '古铜紫' },
    { rgb: [240, 201, 207], name: '石蕊红' },
    { rgb: [235, 160, 179], name: '芍药耕红' },
    { rgb: [236, 45,  122], name: '藏花红' },
    { rgb: [225, 108, 150], name: '初荷红' },
    { rgb: [237, 227, 231], name: '马鞭草紫' },
    { rgb: [233, 215, 223], name: '丁香淡紫' },
    { rgb: [210, 86,  140], name: '丹紫红' },
    { rgb: [210, 53,  125], name: '玫瑰红' },
    { rgb: [209, 194, 211], name: '淡牵牛紫' },
    { rgb: [200, 173, 196], name: '凤信紫' },
    { rgb: [192, 142, 175], name: '萝兰紫' },
    { rgb: [186, 47,  123], name: '玫瑰紫' },
    { rgb: [128, 118, 163], name: '藤萝紫' },
    { rgb: [128, 109, 158], name: '槿紫' },
    { rgb: [129, 92,  148], name: '蕈紫' },
    { rgb: [129, 60,  133], name: '桔梗紫' },
    { rgb: [126, 22,  113], name: '魏紫' },
    { rgb: [233, 204, 211], name: '芝兰紫' },
    { rgb: [210, 118, 163], name: '菱锰红' },
    { rgb: [204, 85,  149], name: '龙须红' },
    { rgb: [230, 210, 213], name: '蓟粉红' },
    { rgb: [195, 86,  145], name: '电气石红' },
    { rgb: [192, 111, 152], name: '樱草紫' },
    { rgb: [189, 174, 173], name: '芦穗灰' },
    { rgb: [181, 152, 161], name: '隐红灰' },
    { rgb: [155, 30,  100], name: '苋菜紫' },
    { rgb: [133, 109, 114], name: '芦灰' },
    { rgb: [79,  56,  62],  name: '暮云灰' },
    { rgb: [72,  41,  54],  name: '斑鸠灰' },
    { rgb: [242, 231, 229], name: '淡藤萝紫' },
    { rgb: [224, 200, 209], name: '淡青紫' },
    { rgb: [188, 132, 168], name: '青蛤壳紫' },
    { rgb: [173, 101, 152], name: '豆蔻紫' },
    { rgb: [163, 92,  143], name: '扁豆紫' },
    { rgb: [152, 54,  128], name: '芥花紫' },
    { rgb: [139, 38,  113], name: '青莲' },
    { rgb: [137, 66,  118], name: '芓紫' },
    { rgb: [126, 32,  101], name: '葛巾紫' },
    { rgb: [104, 23,  82],  name: '牵牛紫' },
    { rgb: [93,  63,  81],  name: '紫灰' },
    { rgb: [78,  42,  64],  name: '龙睛鱼紫' },
    { rgb: [65,  28,  53],  name: '荸荠紫' },
    { rgb: [54,  41,  47],  name: '古鼎灰' },
    { rgb: [30,  19,  29],  name: '鸟梅紫' },
    { rgb: [28,  13,  26],  name: '深牵牛紫' },
    { rgb: [241, 240, 237], name: '银白' },
    { rgb: [226, 225, 228], name: '芡食白' },
    { rgb: [204, 204, 214], name: '远山紫' },
    { rgb: [167, 168, 189], name: '淡蓝紫' },
    { rgb: [97,  100, 159], name: '山梗紫' },
    { rgb: [116, 117, 155], name: '螺甸紫' },
    { rgb: [207, 204, 201], name: '玛瑙灰' },
    { rgb: [82,  82,  136], name: '野菊紫' },
    { rgb: [46,  49,  124], name: '满天星紫' },
    { rgb: [122, 115, 116], name: '锌灰' },
    { rgb: [48,  47,  75],  name: '野葡萄紫' },
    { rgb: [62,  56,  65],  name: '剑锋紫' },
    { rgb: [50,  47,  59],  name: '龙葵紫' },
    { rgb: [34,  32,  46],  name: '暗龙胆紫' },
    { rgb: [31,  32,  64],  name: '晶石紫' },
    { rgb: [19,  17,  36],  name: '暗蓝紫' },
    { rgb: [39,  117, 182], name: '景泰蓝' },
    { rgb: [36,  116, 181], name: '尼罗蓝' },
    { rgb: [208, 223, 230], name: '远天蓝' },
    { rgb: [147, 181, 207], name: '星蓝' },
    { rgb: [97,  154, 195], name: '羽扇豆蓝' },
    { rgb: [35,  118, 183], name: '花青' },
    { rgb: [86,  152, 195], name: '睛蓝' },
    { rgb: [33,  119, 184], name: '虹蓝' },
    { rgb: [176, 213, 223], name: '湖水蓝' },
    { rgb: [138, 188, 209], name: '秋波蓝' },
    { rgb: [102, 169, 201], name: '涧石蓝' },
    { rgb: [41,  131, 187], name: '潮蓝' },
    { rgb: [23,  114, 180], name: '群青' },
    { rgb: [99,  187, 208], name: '霁青' },
    { rgb: [92,  179, 204], name: '碧青' },
    { rgb: [36,  134, 185], name: '宝石蓝' },
    { rgb: [22,  119, 179], name: '天蓝' },
    { rgb: [18,  107, 174], name: '柏林蓝' },
    { rgb: [34,  162, 195], name: '海青' },
    { rgb: [26,  148, 188], name: '钴蓝' },
    { rgb: [21,  139, 184], name: '鸢尾蓝' },
    { rgb: [17,  119, 176], name: '牵牛花蓝' },
    { rgb: [15,  89,  164], name: '飞燕草蓝' },
    { rgb: [43,  115, 175], name: '品蓝' },
    { rgb: [205, 209, 211], name: '银鱼白' },
    { rgb: [49,  112, 167], name: '安安蓝' },
    { rgb: [94,  97,  109], name: '鱼尾灰' },
    { rgb: [71,  81,  100], name: '鲸鱼灰' },
    { rgb: [255, 254, 250], name: '海参灰' },
    { rgb: [53,  51,  60],  name: '沙鱼灰' },
    { rgb: [15,  20,  35],  name: '钢蓝' },
    { rgb: [186, 204, 217], name: '云水蓝' },
    { rgb: [143, 178, 201], name: '晴山蓝' },
    { rgb: [22,  97,  171], name: '靛青' },
    { rgb: [196, 203, 207], name: '大理石灰' },
    { rgb: [21,  85,  154], name: '海涛蓝' },
    { rgb: [78,  124, 161], name: '蝶翅蓝' },
    { rgb: [52,  108, 156], name: '海军蓝' },
    { rgb: [47,  47,  53],  name: '水牛灰' },
    { rgb: [45,  46,  54],  name: '牛角灰' },
    { rgb: [19,  24,  36],  name: '燕颔蓝' },
    { rgb: [216, 227, 231], name: '云峰白' },
    { rgb: [195, 215, 223], name: '井天蓝' },
    { rgb: [47,  144, 185], name: '云山蓝' },
    { rgb: [23,  129, 181], name: '釉蓝' },
    { rgb: [199, 210, 212], name: '鸥蓝' },
    { rgb: [17,  101, 154], name: '搪磁蓝' },
    { rgb: [192, 196, 195], name: '月影白' },
    { rgb: [178, 187, 190], name: '星灰' },
    { rgb: [94,  121, 135], name: '淡蓝灰' },
    { rgb: [20,  74,  116], name: '鷃蓝' },
    { rgb: [116, 120, 122], name: '嫩灰' },
    { rgb: [73,  92,  105], name: '战舰灰' },
    { rgb: [71,  72,  76],  name: '瓦罐灰' },
    { rgb: [43,  51,  62],  name: '青灰' },
    { rgb: [28,  41,  56],  name: '鸽蓝' },
    { rgb: [20,  35,  52],  name: '钢青' },
    { rgb: [16,  31,  48],  name: '暗蓝' },
    { rgb: [238, 247, 242], name: '月白' },
    { rgb: [198, 230, 232], name: '海天蓝' },
    { rgb: [147, 213, 220], name: '清水蓝' },
    { rgb: [81,  196, 211], name: '瀑布蓝' },
    { rgb: [41,  183, 203], name: '蔚蓝' },
    { rgb: [14,  176, 201], name: '孔雀蓝' },
    { rgb: [16,  174, 194], name: '甸子蓝' },
    { rgb: [87,  195, 194], name: '石绿' },
    { rgb: [185, 222, 201], name: '竹篁绿' },
    { rgb: [131, 203, 172], name: '粉绿' },
    { rgb: [18,  170, 156], name: '美蝶绿' },
    { rgb: [102, 193, 140], name: '毛绿' },
    { rgb: [93,  190, 138], name: '蔻梢绿' },
    { rgb: [85,  187, 138], name: '麦苗绿' },
    { rgb: [69,  183, 135], name: '蛙绿' },
    { rgb: [43,  174, 133], name: '铜绿' },
    { rgb: [27,  167, 132], name: '竹绿' },
    { rgb: [18,  161, 130], name: '蓝绿' },
    { rgb: [196, 215, 214], name: '穹灰' },
    { rgb: [30,  158, 179], name: '翠蓝' },
    { rgb: [15,  149, 176], name: '胆矾蓝' },
    { rgb: [20,  145, 168], name: '㭴鸟蓝' },
    { rgb: [124, 171, 177], name: '闪蓝' },
    { rgb: [164, 172, 167], name: '冰山蓝' },
    { rgb: [134, 157, 157], name: '虾壳青' },
    { rgb: [100, 142, 147], name: '晚波蓝' },
    { rgb: [59,  129, 140], name: '蜻蜓蓝' },
    { rgb: [18,  110, 130], name: '玉鈫蓝' },
    { rgb: [115, 124, 123], name: '垩灰' },
    { rgb: [97,  113, 114], name: '夏云灰' },
    { rgb: [19,  72,  87],  name: '苍蓝' },
    { rgb: [71,  75,  76],  name: '黄昏灰' },
    { rgb: [33,  55,  61],  name: '灰蓝' },
    { rgb: [19,  44,  51],  name: '深灰蓝' },
    { rgb: [164, 202, 182], name: '玉簪绿' },
    { rgb: [44,  150, 120], name: '青矾绿' },
    { rgb: [154, 190, 175], name: '草原远绿' },
    { rgb: [105, 167, 148], name: '梧枝绿' },
    { rgb: [146, 179, 165], name: '浪花绿' },
    { rgb: [36,  128, 103], name: '海王绿' },
    { rgb: [66,  134, 117], name: '亚丁绿' },
    { rgb: [159, 163, 154], name: '镍灰' },
    { rgb: [138, 152, 142], name: '明灰' },
    { rgb: [112, 136, 125], name: '淡绿灰' },
    { rgb: [73,  117, 104], name: '飞泉绿' },
    { rgb: [93,  101, 95],  name: '狼烟灰' },
    { rgb: [49,  74,  67],  name: '绿灰' },
    { rgb: [34,  62,  54],  name: '苍绿' },
    { rgb: [26,  59,  50],  name: '深海绿' },
    { rgb: [54,  52,  51],  name: '长石灰' },
    { rgb: [31,  38,  35],  name: '苷蓝绿' },
    { rgb: [20,  30,  27],  name: '莽丛绿' },
    { rgb: [198, 223, 200], name: '淡翠绿' },
    { rgb: [158, 204, 171], name: '明绿' },
    { rgb: [104, 184, 142], name: '田园绿' },
    { rgb: [32,  161, 98],  name: '翠绿' },
    { rgb: [97,  172, 133], name: '淡绿' },
    { rgb: [64,  160, 112], name: '葱绿' },
    { rgb: [34,  148, 83],  name: '孔雀绿' },
    { rgb: [202, 211, 195], name: '艾绿' },
    { rgb: [60,  149, 102], name: '蟾绿' },
    { rgb: [32,  137, 77],  name: '宫殿绿' },
    { rgb: [131, 167, 141], name: '松霜绿' },
    { rgb: [87,  149, 114], name: '蛋白石绿' },
    { rgb: [32,  127, 76],  name: '薄荷绿' },
    { rgb: [110, 139, 116], name: '瓦松绿' },
    { rgb: [26,  104, 64],  name: '荷叶绿' },
    { rgb: [94,  102, 91],  name: '田螺绿' },
    { rgb: [72,  91,  77],  name: '白屈菜绿' },
    { rgb: [57,  55,  51],  name: '河豚灰' },
    { rgb: [55,  56,  52],  name: '蒽油绿' },
    { rgb: [43,  49,  44],  name: '槲寄生绿' },
    { rgb: [21,  35,  27],  name: '云杉绿' },
    { rgb: [240, 245, 229], name: '嫩菊绿' },
    { rgb: [223, 236, 213], name: '艾背绿' },
    { rgb: [173, 213, 162], name: '嘉陵水绿' },
    { rgb: [65,  179, 73],  name: '玉髓绿' },
    { rgb: [67,  178, 68],  name: '鲜绿' },
    { rgb: [65,  174, 60],  name: '宝石绿' },
    { rgb: [226, 231, 191], name: '海沫绿' },
    { rgb: [208, 222, 170], name: '姚黄' },
    { rgb: [178, 207, 135], name: '橄榄石绿' },
    { rgb: [140, 194, 105], name: '水绿' },
    { rgb: [183, 208, 122], name: '芦苇绿' },
    { rgb: [210, 217, 122], name: '槐花黄绿' },
    { rgb: [186, 207, 101], name: '苹果绿' },
    { rgb: [150, 194, 78],  name: '芽绿' },
    { rgb: [226, 216, 73],  name: '蝶黄' },
    { rgb: [190, 201, 54],  name: '橄榄黄绿' },
    { rgb: [91,  174, 35],  name: '鹦鹉绿' },
    { rgb: [37,  61,  36],  name: '油绿' },
    { rgb: [255, 254, 248], name: '象牙白' },
    { rgb: [248, 244, 237], name: '汉白玉' },
    { rgb: [255, 254, 249], name: '雪白' },
    { rgb: [247, 244, 237], name: '鱼肚白' },
    { rgb: [228, 223, 215], name: '珍珠灰' },
    { rgb: [218, 212, 203], name: '浅灰' },
    { rgb: [187, 181, 172], name: '铅灰' },
    { rgb: [187, 181, 172], name: '中灰' },
    { rgb: [134, 126, 118], name: '瓦灰' },
    { rgb: [132, 124, 116], name: '夜灰' },
    { rgb: [128, 118, 110], name: '雁灰' },
    { rgb: [129, 119, 110], name: '深灰' },
];

// group https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/group#browser_compatibility
const lightness = ([r, g, b]) =>  0.2126 * r + 0.7152 * g + 0.0722 * b;
const DarkColors = Colors.filter(x => lightness(x.rgb) <= 128);
const LightColors = Colors.filter(x => lightness(x.rgb) > 128);
const ModerateColors = Colors.filter(x => (l => l > 60 && l < 195)(lightness(x.rgb)));
