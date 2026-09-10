"""Build curated photo annotations and vocabulary. Source photos remain in pic/.
Run with dictionary JSON files downloaded from g0v/moedict-data-twblg.
"""
import json, sys, unicodedata
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
rows = json.loads(Path(sys.argv[1]).read_text()) + json.loads(Path(sys.argv[2]).read_text())
definitions = [
 ('fan','電風扇','電風'),('banana','香蕉','弓蕉'),('dog','狗','狗'),
 ('phone','電話','電話'),('tv','電視','電視'),('fridge','冰箱','冰箱'),
 ('ac','冷氣','冷氣'),('mirror','鏡子','鏡'),('book','書','冊'),
 ('computer','電腦','電腦'),('bed','床','床'),('window','窗戶','窗',1),
 ('sink','水槽','水槽'),('faucet','水龍頭','水道頭'),('microwave','微波爐','微波爐'),
 ('egg','雞蛋','雞卵'),('slippers','拖鞋','淺拖仔'),('shoes','鞋子','鞋'),
 ('mushroom','香菇','香菇'),('mask','口罩','喙罨'),('thermos','保溫杯','保溫杯'),
 ('scale','體重計','磅仔'),('hairdryer','吹風機','吹風機'),('hotwater','熱水瓶','滾水罐'),
 ('kettle','茶壺','茶罐'),('altar','神桌','神桌'),('calendar','月曆','曆日'),
]
words = {}
for definition in definitions:
 key,zh,tw,*variant = definition
 row = next(r for r in rows if r['title']==tw)
 h = row['heteronyms'][variant[0] if variant else 0]
 audio_id = h.get('audio_id',h['id']).zfill(5)
 words[key] = dict(zh=zh,tw=tw,roman=unicodedata.normalize('NFC',h['trs']),audioId=audio_id,
  zhAudio=f'/assets/audio/zh/{key}.mp3',twAudio=f'/assets/audio/tw/{audio_id}.mp3',
  source='moe',sourceUrl='https://www.moedict.tw/\u0027'+tw,
  recordingUrl=f'https://r2-assets.moedict.tw/audio/t/{audio_id}.mp3')
for key,zh,tw,roman in [('bp','血壓計','磅血壓的','pōng hueh-ap--ê'),('remote','遙控器','遙控器','iâu-khòng-khì')]:
 words[key] = dict(zh=zh,tw=tw,roman=roman,zhAudio=f'/assets/audio/zh/{key}.mp3',
  twAudio=f'/assets/audio/tw/{key}.mp3',source='itaigi',sourceUrl='https://itaigi.tw/k/'+zh,
  recordingUrl='https://hapsing.itaigi.tw/bangtsam?taibun='+roman)

def photo(number,title,alt,*objects):
 image=Image.open(ROOT/'dist/assets/photos'/f'IMG_{number}.webp')
 return dict(id=f'IMG_{number}',title=title,alt=alt,width=image.width,height=image.height,objects=[dict(word=w,box=b) for w,b in objects])

photos = [
 photo(4327,'家裡的電風扇','一台淺藍色立式電風扇',('fan',[6,9,83,83])),
 photo(4334,'桌上的水果','桌上放著一串黃色香蕉',('banana',[3,43,80,39])),
 photo(4315,'可愛的狗','一隻穿著粉紅色衣服的白色小狗',('dog',[9,29,63,49])),
 photo(4335,'打電話','木桌上放著一支紅色電話',('phone',[8,20,76,70])),
 photo(4319,'看電視','櫃子上放著黑色電視，旁邊有電風扇',('tv',[23,31,57,27])),
 photo(4331,'喝水的杯子','桌上放著綠色與銀色保溫杯',('thermos',[21,33,31,55])),
 photo(4332,'出門戴口罩','桌上放著淺藍色口罩，旁邊是保溫杯',('mask',[19,36,61,54])),
 photo(4333,'看電視用的物品','桌上放著黑色電視遙控器',('remote',[27,31,60,66])),
 photo(4328,'穿拖鞋','地板上有一雙裝在透明袋裡的拖鞋',('slippers',[30,46,43,37])),
 photo(4326,'出門穿鞋','架子上放著白色鞋子和藍白色拖鞋',('shoes',[10,22,53,36]),('slippers',[61,39,36,32])),
 photo(4325,'吹乾頭髮','紙箱裡放著一支粉紅色吹風機',('hairdryer',[28,40,51,37])),
 photo(4329,'煮菜的食材','袋子裡裝著多朵乾香菇',('mushroom',[36,17,56,60])),
 photo(4323,'冰箱裡的雞蛋','打開的冰箱門架上放著雞蛋',('egg',[66,32,22,13])),
 photo(4324,'打開冰箱','打開的冰箱冷凍室裡裝著食材',('fridge',[2,14,96,84])),
 photo(4322,'廚房的家電','廚房架子下層放著米色微波爐',('microwave',[29,60,42,28])),
 photo(4321,'洗東西的地方','廚房的不鏽鋼水槽和水龍頭',('sink',[2,70,49,24]),('faucet',[28,53,18,17])),
 photo(4313,'桌上的日用品','木桌上有金屬茶壺及白色熱水瓶',('kettle',[2,57,37,28]),('hotwater',[10,39,20,18])),
 photo(4336,'倒一杯熱水','白色電熱水瓶放在桌上',('hotwater',[7,10,79,77])),
 photo(4314,'書桌上的物品','書桌上有一排書和黑色電腦螢幕',('book',[30,40,28,20]),('computer',[69,40,30,24])),
 photo(4317,'房間的牆上','牆上裝著冷氣，下方掛著月曆',('ac',[33,4,61,37]),('calendar',[27,47,42,49])),
 photo(4320,'休息的地方','窗邊是一張鋪著彩色床單的床',('bed',[5,57,92,37]),('window',[44,14,55,38])),
 photo(4318,'照照鏡子','梳妝台上有一面方形鏡子',('mirror',[25,25,48,34])),
 photo(4316,'家裡的神桌','供奉神明的深色木製神桌',('altar',[3,62,78,32])),
 photo(4330,'量血壓的物品','桌上放著白色電子血壓計',('bp',[15,35,43,43])),
 photo(4337,'量體重的物品','地板上放著灰色電子體重計',('scale',[19,29,70,48])),
]
(ROOT/'dist/data.json').write_text(json.dumps(dict(words=words,photos=photos),ensure_ascii=False,indent=2)+'\n')
print(f'{len(photos)} photos, {len(words)} words, {sum(len(p["objects"]) for p in photos)} labeled objects')
