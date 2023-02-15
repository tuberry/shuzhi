// vim:fdm=syntax
// by tuberry
/* exported DARK LIGHT random */
'use strict';

var DARK = [0.14, 0.14, 0.14, 1];
var LIGHT = [0.9, 0.9, 0.9, 1];

// from https://github.com/unicar9/jizhi/blob/master/src/constants/wavesColors.json
const Colors = [
    { 'RGB': [249, 244, 228], 'name': '乳白' },
    { 'RGB': [249, 236, 195], 'name': '杏仁黄' },
    { 'RGB': [248, 223, 114], 'name': '茉莉黄' },
    { 'RGB': [248, 223, 112], 'name': '麦秆黄' },
    { 'RGB': [251, 218, 65],  'name': '油菜花黄' },
    { 'RGB': [254, 215, 26],  'name': '佛手黄' },
    { 'RGB': [247, 222, 152], 'name': '篾黄' },
    { 'RGB': [248, 216, 106], 'name': '葵扇黄' },
    { 'RGB': [252, 211, 55],  'name': '柠檬黄' },
    { 'RGB': [252, 210, 23],  'name': '金瓜黄' },
    { 'RGB': [254, 209, 16],  'name': '藤黄' },
    { 'RGB': [246, 222, 148], 'name': '酪黄' },
    { 'RGB': [247, 218, 148], 'name': '香水玫瑰黄' },
    { 'RGB': [249, 211, 103], 'name': '淡密黄' },
    { 'RGB': [251, 205, 49],  'name': '大豆黄' },
    { 'RGB': [252, 203, 22],  'name': '素馨黄' },
    { 'RGB': [254, 204, 17],  'name': '向日葵黄' },
    { 'RGB': [251, 200, 47],  'name': '雅梨黄' },
    { 'RGB': [252, 197, 21],  'name': '黄连黄' },
    { 'RGB': [252, 195, 7],   'name': '金盏黄' },
    { 'RGB': [248, 195, 135], 'name': '蛋壳黄' },
    { 'RGB': [247, 193, 115], 'name': '肉色' },
    { 'RGB': [251, 185, 41],  'name': '鹅掌黄' },
    { 'RGB': [251, 182, 18],  'name': '鸡蛋黄' },
    { 'RGB': [252, 183, 10],  'name': '鼬黄' },
    { 'RGB': [249, 166, 51],  'name': '榴萼黄' },
    { 'RGB': [251, 164, 20],  'name': '淡橘橙' },
    { 'RGB': [252, 161, 6],   'name': '枇杷黄' },
    { 'RGB': [252, 161, 4],   'name': '橙皮黄' },
    { 'RGB': [252, 140, 35],  'name': '北瓜黄' },
    { 'RGB': [250, 142, 22],  'name': '杏黄' },
    { 'RGB': [255, 153, 0],   'name': '雄黄' },
    { 'RGB': [251, 139, 5],   'name': '万寿菊黄' },
    { 'RGB': [233, 221, 182], 'name': '菊蕾黄' },
    { 'RGB': [238, 208, 69],  'name': '秋葵黄' },
    { 'RGB': [242, 206, 43],  'name': '硫华黄' },
    { 'RGB': [241, 202, 23],  'name': '柚黄' },
    { 'RGB': [221, 200, 113], 'name': '芒果黄' },
    { 'RGB': [223, 194, 67],  'name': '蒿黄' },
    { 'RGB': [226, 192, 39],  'name': '姜黄' },
    { 'RGB': [228, 191, 17],  'name': '香蕉黄' },
    { 'RGB': [210, 180, 44],  'name': '草黄' },
    { 'RGB': [210, 177, 22],  'name': '新禾绿' },
    { 'RGB': [183, 174, 143], 'name': '月灰' },
    { 'RGB': [173, 158, 85],  'name': '淡灰绿' },
    { 'RGB': [142, 128, 75],  'name': '草灰绿' },
    { 'RGB': [136, 115, 34],  'name': '苔绿' },
    { 'RGB': [134, 112, 24],  'name': '碧螺春绿' },
    { 'RGB': [104, 94,  72],  'name': '燕羽灰' },
    { 'RGB': [105, 94,  69],  'name': '蟹壳灰' },
    { 'RGB': [100, 88,  34],  'name': '潭水绿' },
    { 'RGB': [94,  83,  20],  'name': '橄榄绿' },
    { 'RGB': [249, 241, 219], 'name': '蚌肉白' },
    { 'RGB': [248, 232, 193], 'name': '豆汁黄' },
    { 'RGB': [248, 215, 112], 'name': '淡茧黄' },
    { 'RGB': [255, 201, 12],  'name': '乳鸭黄' },
    { 'RGB': [242, 230, 206], 'name': '荔肉白' },
    { 'RGB': [240, 214, 149], 'name': '象牙黄' },
    { 'RGB': [244, 206, 105], 'name': '炒米黄' },
    { 'RGB': [246, 196, 48],  'name': '鹦鹉冠黄' },
    { 'RGB': [249, 193, 22],  'name': '木瓜黄' },
    { 'RGB': [249, 189, 16],  'name': '浅烙黄' },
    { 'RGB': [229, 211, 170], 'name': '莲子白' },
    { 'RGB': [232, 176, 4],   'name': '谷黄' },
    { 'RGB': [235, 177, 13],  'name': '栀子黄' },
    { 'RGB': [217, 164, 14],  'name': '芥黄' },
    { 'RGB': [181, 170, 144], 'name': '银鼠灰' },
    { 'RGB': [182, 164, 118], 'name': '尘灰' },
    { 'RGB': [183, 141, 18],  'name': '枯绿' },
    { 'RGB': [135, 114, 62],  'name': '鲛青' },
    { 'RGB': [135, 104, 24],  'name': '粽叶绿' },
    { 'RGB': [138, 105, 19],  'name': '灰绿' },
    { 'RGB': [74,  64,  53],  'name': '鹤灰' },
    { 'RGB': [77,  64,  48],  'name': '淡松烟' },
    { 'RGB': [88,  71,  23],  'name': '暗海水绿' },
    { 'RGB': [91,  73,  19],  'name': '棕榈绿' },
    { 'RGB': [249, 223, 205], 'name': '米色' },
    { 'RGB': [248, 224, 176], 'name': '淡肉色' },
    { 'RGB': [249, 210, 125], 'name': '麦芽糖黄' },
    { 'RGB': [254, 186, 7],   'name': '琥珀黄' },
    { 'RGB': [243, 191, 76],  'name': '甘草黄' },
    { 'RGB': [248, 188, 49],  'name': '初熟杏黄' },
    { 'RGB': [226, 193, 124], 'name': '浅驼色' },
    { 'RGB': [229, 183, 81],  'name': '沙石黄' },
    { 'RGB': [234, 173, 26],  'name': '虎皮黄' },
    { 'RGB': [214, 160, 29],  'name': '土黄' },
    { 'RGB': [180, 169, 146], 'name': '百灵鸟灰' },
    { 'RGB': [183, 139, 38],  'name': '山鸡黄' },
    { 'RGB': [130, 107, 72],  'name': '龟背黄' },
    { 'RGB': [128, 99,  50],  'name': '苍黄' },
    { 'RGB': [129, 95,  37],  'name': '莱阳梨黄' },
    { 'RGB': [131, 94,  29],  'name': '蜴蜊绿' },
    { 'RGB': [79,  64,  50],  'name': '松鼠灰' },
    { 'RGB': [80,  62,  42],  'name': '橄榄灰' },
    { 'RGB': [81,  60,  32],  'name': '蟹壳绿' },
    { 'RGB': [83,  60,  27],  'name': '古铜绿' },
    { 'RGB': [85,  59,  24],  'name': '焦茶绿' },
    { 'RGB': [251, 242, 227], 'name': '粉白' },
    { 'RGB': [249, 232, 208], 'name': '落英淡粉' },
    { 'RGB': [249, 203, 139], 'name': '瓜瓤粉' },
    { 'RGB': [251, 185, 87],  'name': '蜜黄' },
    { 'RGB': [255, 166, 15],  'name': '金叶黄' },
    { 'RGB': [244, 168, 58],  'name': '金莺黄' },
    { 'RGB': [227, 189, 141], 'name': '鹿角棕' },
    { 'RGB': [231, 162, 63],  'name': '凋叶棕' },
    { 'RGB': [218, 164, 90],  'name': '玳瑁黄' },
    { 'RGB': [222, 158, 68],  'name': '软木黄' },
    { 'RGB': [220, 145, 35],  'name': '风帆黄' },
    { 'RGB': [192, 147, 81],  'name': '桂皮淡棕' },
    { 'RGB': [151, 132, 108], 'name': '猴毛灰' },
    { 'RGB': [152, 101, 36],  'name': '山鸡褐' },
    { 'RGB': [102, 70,  42],  'name': '驼色' },
    { 'RGB': [93,  61,  33],  'name': '茶褐' },
    { 'RGB': [92,  55,  25],  'name': '古铜褐' },
    { 'RGB': [251, 236, 222], 'name': '荷花白' },
    { 'RGB': [248, 179, 127], 'name': '玫瑰粉' },
    { 'RGB': [249, 125, 28],  'name': '橘橙' },
    { 'RGB': [250, 126, 35],  'name': '美人焦橙' },
    { 'RGB': [247, 205, 188], 'name': '润红' },
    { 'RGB': [246, 206, 193], 'name': '淡桃红' },
    { 'RGB': [240, 148, 93],  'name': '海螺橙' },
    { 'RGB': [240, 173, 160], 'name': '桃红' },
    { 'RGB': [238, 170, 156], 'name': '颊红' },
    { 'RGB': [238, 160, 140], 'name': '淡罂粟红' },
    { 'RGB': [234, 137, 88],  'name': '晨曦红' },
    { 'RGB': [242, 118, 53],  'name': '蟹壳红' },
    { 'RGB': [248, 107, 29],  'name': '金莲花橙' },
    { 'RGB': [239, 111, 72],  'name': '草莓红' },
    { 'RGB': [239, 99,  43],  'name': '龙睛鱼红' },
    { 'RGB': [241, 68,  29],  'name': '蜻蜓红' },
    { 'RGB': [240, 75,  34],  'name': '大红' },
    { 'RGB': [242, 72,  27],  'name': '柿红' },
    { 'RGB': [243, 71,  24],  'name': '榴花红' },
    { 'RGB': [244, 62,  6],   'name': '银朱' },
    { 'RGB': [237, 81,  38],  'name': '朱红' },
    { 'RGB': [240, 156, 90],  'name': '鲑鱼红' },
    { 'RGB': [242, 123, 31],  'name': '金黄' },
    { 'RGB': [217, 145, 86],  'name': '鹿皮褐' },
    { 'RGB': [219, 133, 64],  'name': '醉瓜肉' },
    { 'RGB': [222, 118, 34],  'name': '麂棕' },
    { 'RGB': [193, 178, 163], 'name': '淡银灰' },
    { 'RGB': [190, 126, 74],  'name': '淡赭' },
    { 'RGB': [193, 101, 26],  'name': '槟榔棕' },
    { 'RGB': [145, 128, 114], 'name': '银灰' },
    { 'RGB': [154, 136, 120], 'name': '海鸥灰' },
    { 'RGB': [148, 88,  51],  'name': '淡咖啡' },
    { 'RGB': [150, 77,  34],  'name': '岩石棕' },
    { 'RGB': [149, 68,  22],  'name': '芒果棕' },
    { 'RGB': [98,  73,  65],  'name': '石板灰' },
    { 'RGB': [100, 72,  61],  'name': '珠母灰' },
    { 'RGB': [113, 54,  29],  'name': '丁香棕' },
    { 'RGB': [117, 49,  23],  'name': '咖啡' },
    { 'RGB': [115, 46,  18],  'name': '笋皮棕' },
    { 'RGB': [252, 99,  21],  'name': '燕颔红' },
    { 'RGB': [232, 180, 154], 'name': '玉粉红' },
    { 'RGB': [228, 104, 40],  'name': '金驼' },
    { 'RGB': [216, 89,  22],  'name': '铁棕' },
    { 'RGB': [183, 160, 145], 'name': '蛛网灰' },
    { 'RGB': [183, 81,  29],  'name': '淡可可棕' },
    { 'RGB': [139, 97,  77],  'name': '中红灰' },
    { 'RGB': [140, 75,  49],  'name': '淡土黄' },
    { 'RGB': [135, 61,  36],  'name': '淡豆沙' },
    { 'RGB': [136, 58,  30],  'name': '椰壳棕' },
    { 'RGB': [91,  66,  58],  'name': '淡铁灰' },
    { 'RGB': [96,  61,  48],  'name': '中灰驼' },
    { 'RGB': [103, 52,  36],  'name': '淡栗棕' },
    { 'RGB': [101, 43,  28],  'name': '可可棕' },
    { 'RGB': [105, 42,  27],  'name': '柞叶棕' },
    { 'RGB': [251, 153, 104], 'name': '野蔷薇红' },
    { 'RGB': [252, 121, 48],  'name': '菠萝红' },
    { 'RGB': [237, 195, 174], 'name': '藕荷' },
    { 'RGB': [225, 103, 35],  'name': '陶瓷红' },
    { 'RGB': [212, 196, 183], 'name': '晓灰' },
    { 'RGB': [207, 117, 67],  'name': '余烬红' },
    { 'RGB': [205, 98,  39],  'name': '火砖红' },
    { 'RGB': [170, 106, 76],  'name': '火泥棕' },
    { 'RGB': [166, 82,  44],  'name': '绀红' },
    { 'RGB': [119, 61,  49],  'name': '橡树棕' },
    { 'RGB': [72,  51,  50],  'name': '海报灰' },
    { 'RGB': [175, 46,  43],  'name': '玫瑰灰' },
    { 'RGB': [72,  37,  34],  'name': '火山棕' },
    { 'RGB': [72,  30,  28],  'name': '豆沙' },
    { 'RGB': [251, 238, 226], 'name': '淡米粉' },
    { 'RGB': [246, 220, 206], 'name': '初桃粉红' },
    { 'RGB': [247, 207, 186], 'name': '介壳淡粉红' },
    { 'RGB': [246, 173, 143], 'name': '淡藏花红' },
    { 'RGB': [246, 140, 96],  'name': '瓜瓤红' },
    { 'RGB': [249, 114, 61],  'name': '芙蓉红' },
    { 'RGB': [250, 93,  25],  'name': '莓酱红' },
    { 'RGB': [238, 128, 85],  'name': '法螺红' },
    { 'RGB': [207, 72,  19],  'name': '落霞红' },
    { 'RGB': [184, 148, 133], 'name': '淡玫瑰灰' },
    { 'RGB': [177, 75,  40],  'name': '蟹蝥红' },
    { 'RGB': [134, 48,  32],  'name': '火岩棕' },
    { 'RGB': [134, 38,  23],  'name': '赭石' },
    { 'RGB': [89,  38,  32],  'name': '暗驼棕' },
    { 'RGB': [90,  31,  27],  'name': '酱棕' },
    { 'RGB': [92,  30,  25],  'name': '栗棕' },
    { 'RGB': [244, 199, 186], 'name': '洋水仙红' },
    { 'RGB': [241, 118, 102], 'name': '谷鞘红' },
    { 'RGB': [241, 86,  66],  'name': '苹果红' },
    { 'RGB': [245, 57,  28],  'name': '铁水红' },
    { 'RGB': [242, 90,  71],  'name': '桂红' },
    { 'RGB': [243, 59,  31],  'name': '极光红' },
    { 'RGB': [242, 185, 178], 'name': '粉红' },
    { 'RGB': [241, 151, 144], 'name': '舌红' },
    { 'RGB': [240, 90,  70],  'name': '曲红' },
    { 'RGB': [242, 62,  35],  'name': '红汞红' },
    { 'RGB': [242, 202, 201], 'name': '淡绯' },
    { 'RGB': [239, 175, 173], 'name': '无花果红' },
    { 'RGB': [241, 144, 140], 'name': '榴子红' },
    { 'RGB': [240, 63,  36],  'name': '胭脂红' },
    { 'RGB': [240, 161, 168], 'name': '合欢红' },
    { 'RGB': [241, 147, 156], 'name': '春梅红' },
    { 'RGB': [240, 124, 130], 'name': '香叶红' },
    { 'RGB': [240, 74,  58],  'name': '珊瑚红' },
    { 'RGB': [241, 60,  34],  'name': '萝卜红' },
    { 'RGB': [231, 124, 142], 'name': '淡茜红' },
    { 'RGB': [237, 90,  101], 'name': '艳红' },
    { 'RGB': [237, 72,  69],  'name': '淡菽红' },
    { 'RGB': [237, 59,  47],  'name': '鱼鳃红' },
    { 'RGB': [237, 51,  33],  'name': '樱桃红' },
    { 'RGB': [238, 72,  102], 'name': '淡蕊香红' },
    { 'RGB': [238, 72,  99],  'name': '石竹红' },
    { 'RGB': [239, 71,  93],  'name': '草茉莉红' },
    { 'RGB': [238, 63,  77],  'name': '茶花红' },
    { 'RGB': [237, 51,  51],  'name': '枸枢红' },
    { 'RGB': [236, 43,  36],  'name': '秋海棠红' },
    { 'RGB': [235, 38,  26],  'name': '丽春红' },
    { 'RGB': [222, 42,  24],  'name': '夕阳红' },
    { 'RGB': [212, 37,  23],  'name': '鹤顶红' },
    { 'RGB': [171, 55,  47],  'name': '鹅血石红' },
    { 'RGB': [172, 31,  24],  'name': '覆盆子红' },
    { 'RGB': [93,  49,  49],  'name': '貂紫' },
    { 'RGB': [92,  34,  35],  'name': '暗玉紫' },
    { 'RGB': [90,  25,  27],  'name': '栗紫' },
    { 'RGB': [90,  18,  22],  'name': '葡萄酱紫' },
    { 'RGB': [238, 162, 164], 'name': '牡丹粉红' },
    { 'RGB': [237, 85,  106], 'name': '山茶红' },
    { 'RGB': [240, 55,  82],  'name': '海棠红' },
    { 'RGB': [192, 72,  81],  'name': '玉红' },
    { 'RGB': [192, 44,  56],  'name': '高粱红' },
    { 'RGB': [167, 83,  90],  'name': '满江红' },
    { 'RGB': [124, 24,  35],  'name': '枣红' },
    { 'RGB': [76,  31,  36],  'name': '葡萄紫' },
    { 'RGB': [77,  16,  24],  'name': '酱紫' },
    { 'RGB': [238, 39,  70],  'name': '淡曙红' },
    { 'RGB': [222, 28,  49],  'name': '唐菖蒲红' },
    { 'RGB': [209, 26,  45],  'name': '鹅冠红' },
    { 'RGB': [196, 90,  101], 'name': '莓红' },
    { 'RGB': [194, 31,  48],  'name': '枫叶红' },
    { 'RGB': [166, 27,  41],  'name': '苋菜红' },
    { 'RGB': [137, 78,  84],  'name': '烟红' },
    { 'RGB': [130, 32,  43],  'name': '暗紫苑红' },
    { 'RGB': [130, 17,  31],  'name': '殷红' },
    { 'RGB': [84,  30,  36],  'name': '猪肝紫' },
    { 'RGB': [80,  10,  22],  'name': '金鱼紫' },
    { 'RGB': [248, 235, 230], 'name': '草珠红' },
    { 'RGB': [236, 118, 150], 'name': '淡绛红' },
    { 'RGB': [239, 52,  115], 'name': '品红' },
    { 'RGB': [234, 114, 147], 'name': '凤仙花红' },
    { 'RGB': [236, 155, 173], 'name': '粉团花红' },
    { 'RGB': [235, 80,  126], 'name': '夹竹桃红' },
    { 'RGB': [237, 47,  106], 'name': '榅桲红' },
    { 'RGB': [238, 184, 195], 'name': '姜红' },
    { 'RGB': [234, 81,  127], 'name': '莲瓣红' },
    { 'RGB': [241, 196, 205], 'name': '水红' },
    { 'RGB': [236, 138, 164], 'name': '报春红' },
    { 'RGB': [206, 87,  109], 'name': '月季红' },
    { 'RGB': [237, 157, 178], 'name': '豇豆红' },
    { 'RGB': [239, 130, 160], 'name': '霞光红' },
    { 'RGB': [235, 60,  112], 'name': '松叶牡丹红' },
    { 'RGB': [236, 44,  100], 'name': '喜蛋红' },
    { 'RGB': [227, 180, 184], 'name': '鼠鼻红' },
    { 'RGB': [204, 22,  58],  'name': '尖晶玉红' },
    { 'RGB': [194, 124, 136], 'name': '山黎豆红' },
    { 'RGB': [191, 53,  83],  'name': '锦葵红' },
    { 'RGB': [115, 87,  92],  'name': '鼠背灰' },
    { 'RGB': [98,  22,  36],  'name': '甘蔗紫' },
    { 'RGB': [99,  7,   28],  'name': '石竹紫' },
    { 'RGB': [54,  40,  43],  'name': '苍蝇灰' },
    { 'RGB': [48,  22,  28],  'name': '卵石紫' },
    { 'RGB': [43,  18,  22],  'name': '李紫' },
    { 'RGB': [45,  12,  19],  'name': '茄皮紫' },
    { 'RGB': [206, 94,  138], 'name': '吊钟花红' },
    { 'RGB': [236, 78,  138], 'name': '兔眼红' },
    { 'RGB': [238, 44,  121], 'name': '紫荆红' },
    { 'RGB': [149, 28,  72],  'name': '菜头紫' },
    { 'RGB': [98,  29,  52],  'name': '鹞冠紫' },
    { 'RGB': [98,  16,  46],  'name': '葡萄酒红' },
    { 'RGB': [56,  33,  41],  'name': '磨石紫' },
    { 'RGB': [56,  25,  36],  'name': '檀紫' },
    { 'RGB': [51,  20,  30],  'name': '火鹅紫' },
    { 'RGB': [49,  15,  27],  'name': '墨紫' },
    { 'RGB': [238, 166, 183], 'name': '晶红' },
    { 'RGB': [239, 73,  139], 'name': '扁豆花红' },
    { 'RGB': [222, 120, 151], 'name': '白芨红' },
    { 'RGB': [222, 63,  124], 'name': '嫩菱红' },
    { 'RGB': [209, 60,  116], 'name': '菠根红' },
    { 'RGB': [197, 112, 139], 'name': '酢酱草红' },
    { 'RGB': [168, 69,  107], 'name': '洋葱紫' },
    { 'RGB': [75,  30,  47],  'name': '海象紫' },
    { 'RGB': [70,  22,  41],  'name': '绀紫' },
    { 'RGB': [68,  14,  37],  'name': '古铜紫' },
    { 'RGB': [240, 201, 207], 'name': '石蕊红' },
    { 'RGB': [235, 160, 179], 'name': '芍药耕红' },
    { 'RGB': [236, 45,  122], 'name': '藏花红' },
    { 'RGB': [225, 108, 150], 'name': '初荷红' },
    { 'RGB': [237, 227, 231], 'name': '马鞭草紫' },
    { 'RGB': [233, 215, 223], 'name': '丁香淡紫' },
    { 'RGB': [210, 86,  140], 'name': '丹紫红' },
    { 'RGB': [210, 53,  125], 'name': '玫瑰红' },
    { 'RGB': [209, 194, 211], 'name': '淡牵牛紫' },
    { 'RGB': [200, 173, 196], 'name': '凤信紫' },
    { 'RGB': [192, 142, 175], 'name': '萝兰紫' },
    { 'RGB': [186, 47,  123], 'name': '玫瑰紫' },
    { 'RGB': [128, 118, 163], 'name': '藤萝紫' },
    { 'RGB': [128, 109, 158], 'name': '槿紫' },
    { 'RGB': [129, 92,  148], 'name': '蕈紫' },
    { 'RGB': [129, 60,  133], 'name': '桔梗紫' },
    { 'RGB': [126, 22,  113], 'name': '魏紫' },
    { 'RGB': [233, 204, 211], 'name': '芝兰紫' },
    { 'RGB': [210, 118, 163], 'name': '菱锰红' },
    { 'RGB': [204, 85,  149], 'name': '龙须红' },
    { 'RGB': [230, 210, 213], 'name': '蓟粉红' },
    { 'RGB': [195, 86,  145], 'name': '电气石红' },
    { 'RGB': [192, 111, 152], 'name': '樱草紫' },
    { 'RGB': [189, 174, 173], 'name': '芦穗灰' },
    { 'RGB': [181, 152, 161], 'name': '隐红灰' },
    { 'RGB': [155, 30,  100], 'name': '苋菜紫' },
    { 'RGB': [133, 109, 114], 'name': '芦灰' },
    { 'RGB': [79,  56,  62],  'name': '暮云灰' },
    { 'RGB': [72,  41,  54],  'name': '斑鸠灰' },
    { 'RGB': [242, 231, 229], 'name': '淡藤萝紫' },
    { 'RGB': [224, 200, 209], 'name': '淡青紫' },
    { 'RGB': [188, 132, 168], 'name': '青蛤壳紫' },
    { 'RGB': [173, 101, 152], 'name': '豆蔻紫' },
    { 'RGB': [163, 92,  143], 'name': '扁豆紫' },
    { 'RGB': [152, 54,  128], 'name': '芥花紫' },
    { 'RGB': [139, 38,  113], 'name': '青莲' },
    { 'RGB': [137, 66,  118], 'name': '芓紫' },
    { 'RGB': [126, 32,  101], 'name': '葛巾紫' },
    { 'RGB': [104, 23,  82],  'name': '牵牛紫' },
    { 'RGB': [93,  63,  81],  'name': '紫灰' },
    { 'RGB': [78,  42,  64],  'name': '龙睛鱼紫' },
    { 'RGB': [65,  28,  53],  'name': '荸荠紫' },
    { 'RGB': [54,  41,  47],  'name': '古鼎灰' },
    { 'RGB': [30,  19,  29],  'name': '鸟梅紫' },
    { 'RGB': [28,  13,  26],  'name': '深牵牛紫' },
    { 'RGB': [241, 240, 237], 'name': '银白' },
    { 'RGB': [226, 225, 228], 'name': '芡食白' },
    { 'RGB': [204, 204, 214], 'name': '远山紫' },
    { 'RGB': [167, 168, 189], 'name': '淡蓝紫' },
    { 'RGB': [97,  100, 159], 'name': '山梗紫' },
    { 'RGB': [116, 117, 155], 'name': '螺甸紫' },
    { 'RGB': [207, 204, 201], 'name': '玛瑙灰' },
    { 'RGB': [82,  82,  136], 'name': '野菊紫' },
    { 'RGB': [46,  49,  124], 'name': '满天星紫' },
    { 'RGB': [122, 115, 116], 'name': '锌灰' },
    { 'RGB': [48,  47,  75],  'name': '野葡萄紫' },
    { 'RGB': [62,  56,  65],  'name': '剑锋紫' },
    { 'RGB': [50,  47,  59],  'name': '龙葵紫' },
    { 'RGB': [34,  32,  46],  'name': '暗龙胆紫' },
    { 'RGB': [31,  32,  64],  'name': '晶石紫' },
    { 'RGB': [19,  17,  36],  'name': '暗蓝紫' },
    { 'RGB': [39,  117, 182], 'name': '景泰蓝' },
    { 'RGB': [36,  116, 181], 'name': '尼罗蓝' },
    { 'RGB': [208, 223, 230], 'name': '远天蓝' },
    { 'RGB': [147, 181, 207], 'name': '星蓝' },
    { 'RGB': [97,  154, 195], 'name': '羽扇豆蓝' },
    { 'RGB': [35,  118, 183], 'name': '花青' },
    { 'RGB': [86,  152, 195], 'name': '睛蓝' },
    { 'RGB': [33,  119, 184], 'name': '虹蓝' },
    { 'RGB': [176, 213, 223], 'name': '湖水蓝' },
    { 'RGB': [138, 188, 209], 'name': '秋波蓝' },
    { 'RGB': [102, 169, 201], 'name': '涧石蓝' },
    { 'RGB': [41,  131, 187], 'name': '潮蓝' },
    { 'RGB': [23,  114, 180], 'name': '群青' },
    { 'RGB': [99,  187, 208], 'name': '霁青' },
    { 'RGB': [92,  179, 204], 'name': '碧青' },
    { 'RGB': [36,  134, 185], 'name': '宝石蓝' },
    { 'RGB': [22,  119, 179], 'name': '天蓝' },
    { 'RGB': [18,  107, 174], 'name': '柏林蓝' },
    { 'RGB': [34,  162, 195], 'name': '海青' },
    { 'RGB': [26,  148, 188], 'name': '钴蓝' },
    { 'RGB': [21,  139, 184], 'name': '鸢尾蓝' },
    { 'RGB': [17,  119, 176], 'name': '牵牛花蓝' },
    { 'RGB': [15,  89,  164], 'name': '飞燕草蓝' },
    { 'RGB': [43,  115, 175], 'name': '品蓝' },
    { 'RGB': [205, 209, 211], 'name': '银鱼白' },
    { 'RGB': [49,  112, 167], 'name': '安安蓝' },
    { 'RGB': [94,  97,  109], 'name': '鱼尾灰' },
    { 'RGB': [71,  81,  100], 'name': '鲸鱼灰' },
    { 'RGB': [255, 254, 250], 'name': '海参灰' },
    { 'RGB': [53,  51,  60],  'name': '沙鱼灰' },
    { 'RGB': [15,  20,  35],  'name': '钢蓝' },
    { 'RGB': [186, 204, 217], 'name': '云水蓝' },
    { 'RGB': [143, 178, 201], 'name': '晴山蓝' },
    { 'RGB': [22,  97,  171], 'name': '靛青' },
    { 'RGB': [196, 203, 207], 'name': '大理石灰' },
    { 'RGB': [21,  85,  154], 'name': '海涛蓝' },
    { 'RGB': [78,  124, 161], 'name': '蝶翅蓝' },
    { 'RGB': [52,  108, 156], 'name': '海军蓝' },
    { 'RGB': [47,  47,  53],  'name': '水牛灰' },
    { 'RGB': [45,  46,  54],  'name': '牛角灰' },
    { 'RGB': [19,  24,  36],  'name': '燕颔蓝' },
    { 'RGB': [216, 227, 231], 'name': '云峰白' },
    { 'RGB': [195, 215, 223], 'name': '井天蓝' },
    { 'RGB': [47,  144, 185], 'name': '云山蓝' },
    { 'RGB': [23,  129, 181], 'name': '釉蓝' },
    { 'RGB': [199, 210, 212], 'name': '鸥蓝' },
    { 'RGB': [17,  101, 154], 'name': '搪磁蓝' },
    { 'RGB': [192, 196, 195], 'name': '月影白' },
    { 'RGB': [178, 187, 190], 'name': '星灰' },
    { 'RGB': [94,  121, 135], 'name': '淡蓝灰' },
    { 'RGB': [20,  74,  116], 'name': '鷃蓝' },
    { 'RGB': [116, 120, 122], 'name': '嫩灰' },
    { 'RGB': [73,  92,  105], 'name': '战舰灰' },
    { 'RGB': [71,  72,  76],  'name': '瓦罐灰' },
    { 'RGB': [43,  51,  62],  'name': '青灰' },
    { 'RGB': [28,  41,  56],  'name': '鸽蓝' },
    { 'RGB': [20,  35,  52],  'name': '钢青' },
    { 'RGB': [16,  31,  48],  'name': '暗蓝' },
    { 'RGB': [238, 247, 242], 'name': '月白' },
    { 'RGB': [198, 230, 232], 'name': '海天蓝' },
    { 'RGB': [147, 213, 220], 'name': '清水蓝' },
    { 'RGB': [81,  196, 211], 'name': '瀑布蓝' },
    { 'RGB': [41,  183, 203], 'name': '蔚蓝' },
    { 'RGB': [14,  176, 201], 'name': '孔雀蓝' },
    { 'RGB': [16,  174, 194], 'name': '甸子蓝' },
    { 'RGB': [87,  195, 194], 'name': '石绿' },
    { 'RGB': [185, 222, 201], 'name': '竹篁绿' },
    { 'RGB': [131, 203, 172], 'name': '粉绿' },
    { 'RGB': [18,  170, 156], 'name': '美蝶绿' },
    { 'RGB': [102, 193, 140], 'name': '毛绿' },
    { 'RGB': [93,  190, 138], 'name': '蔻梢绿' },
    { 'RGB': [85,  187, 138], 'name': '麦苗绿' },
    { 'RGB': [69,  183, 135], 'name': '蛙绿' },
    { 'RGB': [43,  174, 133], 'name': '铜绿' },
    { 'RGB': [27,  167, 132], 'name': '竹绿' },
    { 'RGB': [18,  161, 130], 'name': '蓝绿' },
    { 'RGB': [196, 215, 214], 'name': '穹灰' },
    { 'RGB': [30,  158, 179], 'name': '翠蓝' },
    { 'RGB': [15,  149, 176], 'name': '胆矾蓝' },
    { 'RGB': [20,  145, 168], 'name': '㭴鸟蓝' },
    { 'RGB': [124, 171, 177], 'name': '闪蓝' },
    { 'RGB': [164, 172, 167], 'name': '冰山蓝' },
    { 'RGB': [134, 157, 157], 'name': '虾壳青' },
    { 'RGB': [100, 142, 147], 'name': '晚波蓝' },
    { 'RGB': [59,  129, 140], 'name': '蜻蜓蓝' },
    { 'RGB': [18,  110, 130], 'name': '玉鈫蓝' },
    { 'RGB': [115, 124, 123], 'name': '垩灰' },
    { 'RGB': [97,  113, 114], 'name': '夏云灰' },
    { 'RGB': [19,  72,  87],  'name': '苍蓝' },
    { 'RGB': [71,  75,  76],  'name': '黄昏灰' },
    { 'RGB': [33,  55,  61],  'name': '灰蓝' },
    { 'RGB': [19,  44,  51],  'name': '深灰蓝' },
    { 'RGB': [164, 202, 182], 'name': '玉簪绿' },
    { 'RGB': [44,  150, 120], 'name': '青矾绿' },
    { 'RGB': [154, 190, 175], 'name': '草原远绿' },
    { 'RGB': [105, 167, 148], 'name': '梧枝绿' },
    { 'RGB': [146, 179, 165], 'name': '浪花绿' },
    { 'RGB': [36,  128, 103], 'name': '海王绿' },
    { 'RGB': [66,  134, 117], 'name': '亚丁绿' },
    { 'RGB': [159, 163, 154], 'name': '镍灰' },
    { 'RGB': [138, 152, 142], 'name': '明灰' },
    { 'RGB': [112, 136, 125], 'name': '淡绿灰' },
    { 'RGB': [73,  117, 104], 'name': '飞泉绿' },
    { 'RGB': [93,  101, 95],  'name': '狼烟灰' },
    { 'RGB': [49,  74,  67],  'name': '绿灰' },
    { 'RGB': [34,  62,  54],  'name': '苍绿' },
    { 'RGB': [26,  59,  50],  'name': '深海绿' },
    { 'RGB': [54,  52,  51],  'name': '长石灰' },
    { 'RGB': [31,  38,  35],  'name': '苷蓝绿' },
    { 'RGB': [20,  30,  27],  'name': '莽丛绿' },
    { 'RGB': [198, 223, 200], 'name': '淡翠绿' },
    { 'RGB': [158, 204, 171], 'name': '明绿' },
    { 'RGB': [104, 184, 142], 'name': '田园绿' },
    { 'RGB': [32,  161, 98],  'name': '翠绿' },
    { 'RGB': [97,  172, 133], 'name': '淡绿' },
    { 'RGB': [64,  160, 112], 'name': '葱绿' },
    { 'RGB': [34,  148, 83],  'name': '孔雀绿' },
    { 'RGB': [202, 211, 195], 'name': '艾绿' },
    { 'RGB': [60,  149, 102], 'name': '蟾绿' },
    { 'RGB': [32,  137, 77],  'name': '宫殿绿' },
    { 'RGB': [131, 167, 141], 'name': '松霜绿' },
    { 'RGB': [87,  149, 114], 'name': '蛋白石绿' },
    { 'RGB': [32,  127, 76],  'name': '薄荷绿' },
    { 'RGB': [110, 139, 116], 'name': '瓦松绿' },
    { 'RGB': [26,  104, 64],  'name': '荷叶绿' },
    { 'RGB': [94,  102, 91],  'name': '田螺绿' },
    { 'RGB': [72,  91,  77],  'name': '白屈菜绿' },
    { 'RGB': [57,  55,  51],  'name': '河豚灰' },
    { 'RGB': [55,  56,  52],  'name': '蒽油绿' },
    { 'RGB': [43,  49,  44],  'name': '槲寄生绿' },
    { 'RGB': [21,  35,  27],  'name': '云杉绿' },
    { 'RGB': [240, 245, 229], 'name': '嫩菊绿' },
    { 'RGB': [223, 236, 213], 'name': '艾背绿' },
    { 'RGB': [173, 213, 162], 'name': '嘉陵水绿' },
    { 'RGB': [65,  179, 73],  'name': '玉髓绿' },
    { 'RGB': [67,  178, 68],  'name': '鲜绿' },
    { 'RGB': [65,  174, 60],  'name': '宝石绿' },
    { 'RGB': [226, 231, 191], 'name': '海沫绿' },
    { 'RGB': [208, 222, 170], 'name': '姚黄' },
    { 'RGB': [178, 207, 135], 'name': '橄榄石绿' },
    { 'RGB': [140, 194, 105], 'name': '水绿' },
    { 'RGB': [183, 208, 122], 'name': '芦苇绿' },
    { 'RGB': [210, 217, 122], 'name': '槐花黄绿' },
    { 'RGB': [186, 207, 101], 'name': '苹果绿' },
    { 'RGB': [150, 194, 78],  'name': '芽绿' },
    { 'RGB': [226, 216, 73],  'name': '蝶黄' },
    { 'RGB': [190, 201, 54],  'name': '橄榄黄绿' },
    { 'RGB': [91,  174, 35],  'name': '鹦鹉绿' },
    { 'RGB': [37,  61,  36],  'name': '油绿' },
    { 'RGB': [255, 254, 248], 'name': '象牙白' },
    { 'RGB': [248, 244, 237], 'name': '汉白玉' },
    { 'RGB': [255, 254, 249], 'name': '雪白' },
    { 'RGB': [247, 244, 237], 'name': '鱼肚白' },
    { 'RGB': [228, 223, 215], 'name': '珍珠灰' },
    { 'RGB': [218, 212, 203], 'name': '浅灰' },
    { 'RGB': [187, 181, 172], 'name': '铅灰' },
    { 'RGB': [187, 181, 172], 'name': '中灰' },
    { 'RGB': [134, 126, 118], 'name': '瓦灰' },
    { 'RGB': [132, 124, 116], 'name': '夜灰' },
    { 'RGB': [128, 118, 110], 'name': '雁灰' },
    { 'RGB': [129, 119, 110], 'name': '深灰' },
];

// group https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/group#browser_compatibility
const DarkColors = Colors.filter(x => light(x.RGB) <= 128);
const LightColors = Colors.filter(x => light(x.RGB) > 128);
const ModerateColors = Colors.filter(x => (l => l > 60 && l < 195)(light(x.RGB)));

function random(dark, alpha = 1) {
    let color = (x => x[Math.floor(Math.random() * x.length)])(dark === undefined ? ModerateColors : dark ? LightColors : DarkColors);
    return { color: color.RGB.map(x => x / 255).concat(alpha), name: color.name };
}

function light(rgb) {
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
