// English / Japanese strings and formatting helpers shared by every page.
// Labels are kept short; the icons in ui.js carry most of the meaning.

const STORAGE_KEY = 'eatnow.lang';
const TIME_ZONE = 'Asia/Tokyo';

const dict = {
  ja: {
    'nav.forRestaurants': 'お店の方', 'nav.findTable': 'お店を探す', 'lang.label': '言語',
    'title.index': 'EatNow — 今すぐ入れるお店', 'title.restaurant': '{name} — 今すぐ予約 | EatNow',
    'title.owner': '店舗ダッシュボード | EatNow', 'title.signup': 'お店を登録 | EatNow',
    'title.studio': '動画スタジオ | EatNow',

    's.count': '今すぐ入れる {n}件', 's.loading': '空席を探しています…', 's.live': 'ライブ',
    's.none': '近くに空いているお店がありません', 's.noneHint': '範囲を広げてみてください',
    's.noVideos': '近くの空いているお店に、まだ動画がありません', 's.showList': 'リストで見る（{n}件）',
    'a.party': '人数', 'a.area': 'エリア', 'a.radius': '距離',
    'area.tokyo': '東京駅', 'area.shibuya': '渋谷', 'area.shinjuku': '新宿', 'area.ginza': '銀座', 'loc.current': '現在地',
    'loc.locating': '現在地を取得しています…', 'loc.failed': '現在地を取得できないため、東京駅を表示しています',
    'radius.m': '{n}m', 'radius.km': '{n}km',
    'people': '{n}名',
    'cuisine.any': 'すべて', 'cuisine.sushi': '寿司', 'cuisine.ramen': 'ラーメン', 'cuisine.izakaya': '居酒屋', 'cuisine.yakitori': '焼き鳥', 'cuisine.yakiniku': '焼肉',
    'cuisine.japanese': '和食', 'cuisine.italian': 'イタリアン', 'cuisine.french': 'フレンチ', 'cuisine.chinese': '中華',
    'cuisine.korean': '韓国', 'cuisine.indian': 'インド', 'cuisine.thai': 'タイ', 'cuisine.cafe': 'カフェ', 'cuisine.burger': 'バーガー', 'cuisine.bar': 'バー',
    'app.title': 'EatNowアプリ', 'app.body': 'iPhone・Androidのアプリで、もっと快適に', 'app.ios': 'App Store', 'app.android': 'Google Play', 'app.close': '閉じる',
    'v.label': '表示', 'v.feed': '動画', 'v.list': 'リスト',
    'c.best': 'おすすめ', 'c.walk': '{n}分', 'c.seats': '空席あり',
    'c.closes': 'あと{n}分', 'c.book': '予約', 'c.new': 'NEW', 'c.rating': '5点中{n}点',

    'rp.ok': '空席あり・今すぐ入れます',
    'rp.reason.NOT_BOOKABLE': 'Web予約は準備中です', 'rp.reason.CLOSED': '営業時間外です', 'rp.reason.CLOSING_SOON': 'まもなく閉店です',
    'rp.reason.NO_SEATS': '今は満席です',
    'rp.nearby': '近くで空いているお店', 'rp.map': 'Googleマップ', 'rp.route': '道順', 'rp.allDay': '24時間営業', 'rp.powered': '予約システム: EatNow',
    'rp.request': '席をリクエスト', 'rp.location': '場所', 'rp.hours': '営業時間',
    'rp.openNow': '営業中', 'rp.closedNow': '営業時間外', 'rp.about': 'お店について', 'rp.lunch': 'ランチ', 'rp.dinner': 'ディナー', 'rp.perPerson': '1人あたり',
    'feat.drinks': 'ビール・ワインが充実', 'feat.sake': '日本酒が豊富', 'feat.standing': '立ち飲み', 'feat.counter': 'カウンター席',
    'feat.vape_only': '加熱式たばこのみ可', 'feat.no_smoking': '全席禁煙', 'feat.cards': 'カード可', 'feat.english': '英語メニュー',

    'f.title': '予約', 'f.arrive': '到着まで', 'f.min': '{n}分', 'f.name': 'お名前', 'f.phone': '電話番号',
    'f.go.request': 'リクエストを送る', 'f.sending': '送信中…',
    'f.hint.request': 'お店が5分以内に返答します',
    'f.sms': 'SMSのコードを入力', 'f.smsSent': '{phone} に送りました', 'f.test': 'テスト用コード', 'f.verify': '確認して送る', 'f.resend': 'コードを再送',

    'b.wait.title': 'お店の返答待ち', 'b.wait.label': '返答まで', 'b.ok.title': '予約確定', 'b.ok.label': '到着期限まで',
    'b.ready': '{n}分後にご案内します', 'b.arrive': '{time}着', 'b.pin': '予約番号', 'b.showPin': 'お店でこの番号を見せてください',
    'b.here': '着きました', 'b.hereDone': '到着を連絡しました', 'b.route': '道順', 'b.cancel': 'キャンセル', 'b.cancelQ': 'キャンセルしますか？',
    'b.yes': 'はい', 'b.no': 'いいえ', 'b.findAnother': '別のお店を探す',
    'step.1': '送信', 'step.2': 'お店が確認', 'step.3': '確定',
    'b.end.seated': 'ごゆっくりどうぞ', 'b.end.declined': '今回はお受けできません', 'b.end.no_response': 'お店から返答がありませんでした',
    'b.end.expired': '確保期限が過ぎました', 'b.end.cancelled': 'キャンセルしました', 'b.end.no_show': '来店なしとして記録されました',
    'b.endBody.seated': '{name}に入店しました', 'b.endBody.declined': '{name}（{reason}）', 'b.endBody.no_response': 'リクエストは取り消されました',
    'b.endBody.expired': '予約は取り消されました', 'b.endBody.cancelled': '予約を取り消しました', 'b.endBody.no_show': 'お店が来店なしとして記録しました',
    'reason.full': '満席', 'reason.closing': '閉店間近', 'reason.party_size': '人数', 'reason.other': 'その他',
    'st.pending': '返答待ち', 'st.confirmed': '確定', 'st.seated': '来店', 'st.declined': 'お断り', 'st.no_response': '返答なし',
    'st.expired': '期限切れ', 'st.cancelled': 'キャンセル', 'st.no_show': '来店なし',

    'o.login': 'お店にログイン', 'o.email': 'メールアドレス', 'o.password': 'パスワード', 'o.go': 'ログイン',
    'o.demo': 'デモ: tomo-sushi@demo.test / demo1234', 'o.new': 'お店を登録する', 'o.logout': 'ログアウト',
    'o.live': 'ライブ', 'o.offline': '再接続中…',
    'o.req': 'リクエスト', 'o.reqNone': '新しいリクエストはありません', 'o.accept': '承認', 'o.plus10': '+10分', 'o.decline': 'お断り',
    'o.up': '来店予定', 'o.upNone': '来店予定はありません', 'o.seated': '来店', 'o.noShow': '来店なし', 'o.cancel': '取消',
    'o.cancelQ': 'この予約を取り消しますか？', 'o.yes': '取り消す', 'o.back': '戻る',
    'o.arrivedNear': '店の前に到着', 'o.arrived': '到着の連絡あり',
    'o.hist': '今日の履歴', 'o.histNone': 'まだありません', 'o.disputed': '要確認', 'o.autoSeated': '来店（自動）',
    'o.video': 'お店の動画', 'o.videoOptional': '任意', 'o.videoNone': '動画はなくても受付できます。ないあいだは、リストと店舗ページにだけ表示されます（動画表示には出ません）',
    'o.videoUpload': '動画をアップロード', 'o.videoReplace': '動画を差し替える', 'o.videoUploading': 'アップロード中…', 'o.videoAsk': '動画の制作を相談',
    'o.videoRemove': '動画を削除', 'o.videoRule': 'MP4・WebM・MOV、50MBまで。縦長（9:16）がおすすめ', 'o.videoDone': '動画を公開しました',
    'o.videoAskSubject': '【EatNow】動画制作の相談（{name}）',
    'o.videoAskBody': 'AnyNow ご担当者様\n\nEatNowに掲載している「{name}」です。お店の紹介動画の制作について相談させてください。\n\n店舗ID: {id}\n住所: {address}\nご希望の内容・時期:\n',
    'o.videoMake': '動画スタジオでつくる',

    // Video studio (/studio)
    'st.nav': 'ダッシュボード',
    'st.h1': 'ショート動画をつくる',
    'st.lead': 'スマホの写真や動画から、EatNowのフィード用の縦長動画をつくれます。3分ほどでできます。',
    'st.whoIn': '{name} として公開します', 'st.whoOut': 'ログインしていません。動画をつくって保存はできます。公開するにはログインしてください。', 'st.login': 'ログイン',
    'st.hasVideo': 'すでに動画があります。新しく公開すると入れ替わります。',
    'st.s1': '写真と動画', 'st.tip': '6〜8カット・20秒前後がおすすめ。お店の外観 → 料理 → 店内・人 → 最後は入口や店員さん。料理の写真はまとめてコラージュにもできます。',
    'st.add': '写真・動画を追加', 'st.sample': 'サンプル画像で試す', 'st.empty': 'まだ追加していません', 'st.emptyDrop': 'ここにドラッグ＆ドロップでも追加できます（まとめて何本でも）', 'st.dropHere': 'ドロップして追加',
    'st.caption': '画面に出す文字（料理名など）', 'st.len': '長さ', 'st.startAt': '{s} から使う',
    'st.up': '上へ', 'st.down': '下へ', 'st.del': '削除', 'st.show': 'プレビューで見る',
    'st.max': '写真と動画は{n}個まで', 'st.bad': '{name} はこのブラウザで開けませんでした',
    'st.image': '写真', 'st.video': '動画', 'st.collage': 'コラージュ',
    'st.same': '前と同じ文字を続ける', 'st.merge': '次の写真とまとめる', 'st.split': 'ばらす（{n}枚）',
    'st.lastNote': '最後のカットには、店名と「最後の画面」の文字が出ます',
    'st.s2': '文字', 'st.name': '店名', 'st.jname': '縦書きの日本語名（デザインが「上品」のとき）', 'st.jnamePh': '例: 伴寿司', 'st.catch': 'ひとこと', 'st.catchPh': '例: おまかせ5,500円〜・八重洲口から1分',
    'st.outro': '最後の画面', 'st.english': '見る人は海外からの旅行者が中心なので、英語がおすすめです。',
    'st.s3': 'デザインと音楽', 'st.look': 'デザイン', 'st.music': '音楽',
    'st.tpl.elegant': '上品', 'st.tpl.simple': 'シンプル', 'st.tpl.lively': '元気',
    'st.lookHint': '参考: 上品は寿司処 伴、シンプルは炭焼 てらまえ、元気はドラゴン・ボラーチョの動画',
    'st.transition': '切り替え', 'st.tr.fade': 'ふわっと', 'st.tr.cut': 'パッと',
    'st.m.upbeat': 'アップテンポ', 'st.m.chill': 'しっとり', 'st.m.japanese': '和風', 'st.m.none': 'なし',
    'st.musicHint': '音楽はアプリがつくるので、著作権の心配はありません。',
    'st.suggest': '文言を提案してもらう', 'st.suggestAgain': '別の案を出してもらう',
    'st.suggesting': '考えています…', 'st.suggestingAi': '映像を見て考えています（30秒ほど）…', 'st.suggestingLocal': '映像を見て考えています（1分ほど）…',
    'st.suggestAi': 'AI（Anthropic社のClaude）が各カットの静止画を見て、キャッチコピー・各カットの文字・最後の画面の言葉を考えます。静止画はAnthropic社に送られます。気に入った候補を選んで、自由に直せます。',
    'st.suggestLocal': 'AIが各カットの静止画を見て、キャッチコピー・各カットの文字・最後の画面の言葉を考えます。静止画はEatNowのサーバーの中だけで使い、外には送りません。候補は英語だけで、日本語の意味は付きません。気に入った候補を選んで、自由に直せます。',
    'st.suggestBasic': 'お店の料理の種類と場所をもとに、用意した文例から提案します（AIは使いません）。映像の中身は見ていないので、合う候補を選んで直してください。',
    'st.suggestFallback': 'AIに接続できなかったため、文例から提案しました。',
    'st.suggestLogin': 'ログインすると、映像に合わせた文言を提案できます。',
    'st.otherIdeas': 'ほかの案', 'st.suggestNeed': '先に写真や動画を入れてください。', 'st.suggestUndo': '提案の前に戻す', 'st.options': '候補',
    // The Mac/Windows app (desktop/): the same studio, with settings instead of a login.
    'st.suggestSetup': '設定でお店の情報を入れると、文言を提案できます。',
    'st.suggestLocalPc': 'このパソコンの中のAIが各カットの静止画を見て、キャッチコピー・各カットの文字・最後の画面の言葉を考えます。静止画は外に送りません。候補は英語だけで、日本語の意味は付きません。',
    'st.whoDesk': '{name} の動画をつくります', 'st.setupNeed': 'お店の情報を設定すると、店名が入り、文言の提案も使えます。', 'st.settings': '設定',
    'st.saveFile': 'ファイルに保存', 'st.saveAgain': '別の場所にも保存', 'st.savedTo': '保存しました: {path}', 'st.showFile': 'フォルダで表示',
    'dk.title': 'EatNow Studio', 'dk.leadWeb': 'スマホやパソコンの写真・動画から、縦長のショート動画をつくれます。動画づくりはすべてこのブラウザの中で行い、素材はどこにも送りません。', 'dk.aiOnlyNone': 'このページでは、用意した文例から提案します（AIは使いません）。映像を見て考えるAIは、Mac / Windows 版で選べます。', 'dk.lead': 'パソコンに取り込んだ写真や動画から、縦長のショート動画をつくれます。動画づくりはすべてこのパソコンの中で行います。',
    'dk.shop': 'お店の情報',
    'dk.nameEn': '店名（英語）', 'dk.nameJa': '店名（日本語）', 'dk.cuisine': '料理の種類',
    'dk.open': '開店', 'dk.close': '閉店',
    'dk.ai': '文言の提案',
    'dk.noTrain': 'どれを選んでも、AIの学習には使われません',
    'dk.specQ': '精度', 'dk.specS': '速さ', 'dk.specC': '料金', 'dk.specD': '映像の行き先',
    'dk.aiNone': 'AIなし', 'dk.noneTag': '用意した文例から選ぶ', 'dk.noneS': 'すぐ', 'dk.noneC': '無料', 'dk.noneD': 'PCの外に出ない',
    'dk.aiClaude': 'Claude', 'dk.claudeTag': '高精度・日本語訳つき', 'dk.claudeS': '10〜30秒', 'dk.claudeC': '約10円/回', 'dk.claudeD': 'Anthropicへ送信',
    'dk.key': 'APIキー', 'dk.keySaved': '保存済み（変えるときだけ入力）', 'dk.keyNote': '暗号化して、このPCだけに保存します', 'dk.keyClear': 'キーを消す',
    'dk.aiLocal': 'ローカルAI', 'dk.localTag': '英語のみ', 'dk.localS': '1〜2分', 'dk.localC': '無料', 'dk.localD': 'PCの外に出ない',
    'dk.localFirst': '保存すると準備を始めます（初回のみ約{size}をダウンロード・メモリ16GB以上）',
    'dk.localDisk': '空き容量が足りません（約{size}必要）',
    'dk.localReady': '準備できています', 'dk.localRemove': '削除して空き容量を戻す（{size}）',
    'dk.lpWait': '準備中…', 'dk.lpEngine': 'AI本体をダウンロード中 {p}%（{a} / {b}）', 'dk.lpUnpack': '展開中…',
    'dk.lpStart': '起動中…', 'dk.lpModel': 'モデルをダウンロード中 {p}%（{a} / {b}）',
    'dk.lpKeep': '閉じても準備は続きます',
    'err.LOCAL_AI_NOT_READY': 'ローカルAIの準備ができていません。設定でローカルAIを選んで保存してください',
    'err.LOCAL_AI_PREPARING': 'ローカルAIを準備しています。終わるまでお待ちください（進み具合は設定で見られます）',
    'err.LOCAL_AI_UNSUPPORTED': 'このパソコンではローカルAIを使えません（Mac、または64bitのWindowsが必要です）',
    'err.LOCAL_AI_MEMORY': 'このパソコンはメモリが足りないため、ローカルAIを使えません（16GB以上が必要です）',
    'err.LOCAL_AI_DISK': 'このパソコンの空き容量が足りません',
    'err.LOCAL_AI_DOWNLOAD': 'ダウンロードできませんでした。インターネット接続を確かめて、もう一度保存してください',
    'dk.save': '保存', 'dk.cancel': 'キャンセル', 'dk.needName': '店名（英語か日本語）を入れてください。', 'dk.needKey': 'APIキーを入れてください。',
    'err.NO_SECURE_STORAGE': 'このパソコンでは、キーを安全に保存できません', 'err.SAVE_FAILED': '保存できませんでした',
    'st.play': '再生', 'st.pause': '一時停止', 'st.overlay': 'アプリの表示を重ねる',
    'st.overlayHint': 'アプリは下の方に店名を出すので、文字は画面の中ほどに置いています。',
    'st.seats': '空席あり', 'st.walk': '3分',
    'st.s4': '書き出して公開', 'st.s4Desk': '書き出して保存', 'st.go': '動画を書き出す（{s}）',
    'st.keep': '書き出し中はこの画面を開いたままにしてください。動画の長さと同じ時間がかかります。',
    'st.rec': '書き出し中… {p}%', 'st.stop': '中止',
    'st.size': 'ファイルの大きさ', 'st.sizeAny': '上限なし', 'st.sizeMax': '{n}MBまで', 'st.sizeEst': '約{mb}MBになる見込みです。',
    'st.sizeLow': '画質がかなり下がります。動画を短くすると、きれいになります。',
    'st.sizeOver': '上限の{n}MBを少し超えました。もう一度書き出すと、少し小さくしてつくり直します。',
    'st.hidden': '画面を離れたため、書き出しを中止しました。もう一度お試しください。',
    'st.unsupported': 'このブラウザでは動画を書き出せません。最新のSafariかChromeをお使いください。',
    'st.need': '写真か動画を1つ以上追加してください。', 'st.long': '30秒を超えています。短い動画のほうが最後まで見てもらえます。',
    'st.tooLong': '60秒以内にしてください。',
    'st.ready': '動画ができました', 'st.post': 'EatNowに公開', 'st.posting': '公開しています…', 'st.loginToPost': 'ログインして公開',
    'st.posted': '公開しました。フィードとお店のページに表示されます。', 'st.page': 'お店のページを見る',
    'st.save': '端末に保存', 'st.again': '別のバージョンをつくる',
    'st.share': '共有・写真に保存', 'st.shareHint': 'iPhoneでは「共有・写真に保存」から「ビデオを保存」を選ぶと、写真アプリに入ります。', 'st.shareFail': '共有できませんでした。「端末に保存」で保存してください。',
    'st.sample1': 'きっとお好みの一皿が見つかります', 'st.sample2': '毎朝豊洲から', 'st.sample3': '全国の日本酒', 'st.sample4': 'カウンター8席',

    'o.seats': '今の空席', 'o.seatsYes': '空席あり', 'o.seatsNo': '満席',
    'o.seatsYesHint': 'お客様からリクエストが届きます。5分以内に返答してください',
    'o.seatsNoHint': 'リクエストは届きません。席が空いたら「空席あり」に',
    'o.link': 'Googleマップ用リンク', 'o.copy': 'コピー', 'o.copied': 'コピーしました', 'o.open': '開く',
    'o.party': '{n}名', 'o.by': '{time}着',
    'o.alert.request': '新しいリクエスト', 'o.alert.booked': '新しい予約',

    'bill.title': 'お支払い', 'bill.status.unpaid': 'カード未登録', 'bill.status.active': '利用中', 'bill.status.payment_required': '停止中',
    'bill.balance': '残高', 'bill.card': 'カード', 'bill.rule': '来店1件 ¥200 ・ 残高が¥200未満で¥1,000を自動チャージ',
    'bill.topUp': 'チャージ', 'bill.pay': 'カードを登録', 'bill.replace': 'カードを登録し直す', 'bill.history': '入出金',
    'bill.entry.deposit': 'デポジット', 'bill.entry.topup': 'チャージ', 'bill.entry.fee': '来店手数料',
    'bill.alert.unpaid': 'カードなしで受付できます', 'bill.alert.unpaid.body': '最初の予約が確定した日のうちに登録してください',
    'bill.alert.due': '今日{time}までにカード登録', 'bill.alert.due.body': '過ぎると新しい予約が止まります',
    'bill.alert.missed': 'カード未登録のため受付停止中', 'bill.alert.missed.body': '登録するとすぐ再開します',
    'bill.alert.payment_required': 'チャージ失敗のため受付停止中', 'bill.alert.payment_required.body': '登録し直すとすぐ再開します',
    'bill.owed': '未払い {owed}', 'bill.done': '支払いが完了しました。「空席あり」にすると受付が始まります', 'bill.cancelled': '支払いはキャンセルされました',

    'su.title': 'お店を登録', 'su.haveAccount': 'ログイン', 'su.testMode': 'テストモード: 店舗情報・電話・決済は模擬動作です',
    'su.step.search': '探す', 'su.step.verify': '電話', 'su.step.details': '情報', 'su.step.payment': 'カード',
    'su.hint': 'Googleマップに載っているお店だけ登録できます', 'su.ph': '店名・エリア（例: 蕎麦 渋谷）', 'su.go': '検索',
    'su.registered': '登録済み', 'su.closed': '閉業', 'su.pick': '登録', 'su.none': '見つかりませんでした', 'su.back': '戻る',
    'su.call.body': '{phone} に自動音声でコードを伝えます', 'su.call.go': '電話を受ける', 'su.code': 'コード', 'su.check': '確認',
    'su.test': 'テスト用コード', 'su.resend': 'もう一度電話する',
    'su.nameJa': '店名', 'su.nameEn': '店名（英語）', 'su.cuisine': 'ジャンル', 'su.price': '価格帯', 'su.hours': '営業時間', 'su.allDay': '24時間',
    'su.email': 'メール（ログイン用）', 'su.password': 'パスワード（8文字以上）',
    'su.submit': '登録する',
    'su.pay.title': 'カードは今でも、あとでもOK', 'su.pay.deposit': 'デポジット', 'su.pay.fee': '来店1件', 'su.pay.zero': '来店なし',
    'su.pay.later': 'あとで登録して受付を始める',

    'err.NO_SEATS': 'このお店は今満席です', 'err.ACTIVE_BOOKING_EXISTS': 'この電話番号ですでに予約中のお店があります',
    'err.CLOSING_SOON': '閉店時間に近いため予約できません',
    'err.VIDEO_TYPE': '動画ファイル（MP4・WebM・MOV）を選んでください', 'err.VIDEO_TOO_LARGE': '50MBまでの動画にしてください',
    'err.NOT_BOOKABLE': 'このお店は今Web予約を受け付けていません', 'err.INVALID_INPUT': '入力内容を確認してください',
    'err.INVALID_PHONE': '電話番号を確認してください（海外は+から）', 'err.CODE_INVALID': 'コードが違うか、期限切れです',
    'err.RATE_LIMITED': '試行回数が多すぎます。少し待ってください', 'err.PHONE_BLOCKED': 'この電話番号は今は予約できません',
    'err.PHONE_BLOCKED_UNTIL': 'この電話番号は{date}まで予約できません', 'err.PHONE_NOT_VERIFIED': '電話番号の確認が必要です',
    'err.VERIFY_FAILED': 'コードを送れませんでした', 'err.INVALID_STATE': 'この予約はすでに更新されています',
    'err.INVALID_LOGIN': 'メールアドレスかパスワードが違います', 'err.LOCKED': '誤りが続いたため、1分後にお試しください',
    'err.UNAUTHORIZED': 'もう一度ログインしてください', 'err.NOT_FOUND': '見つかりませんでした',
    'err.PLACE_NOT_FOUND': 'Googleマップでお店が見つかりませんでした', 'err.PLACE_CLOSED': '閉業のお店は登録できません',
    'err.PLACE_REGISTERED': 'すでに登録されています。ログインしてください', 'err.PLACE_NO_PHONE': '電話番号が載っていないため確認できません',
    'err.SIGNUP_EXPIRED': '時間切れです。最初からやり直してください', 'err.NOT_VERIFIED': '先に電話で確認してください',
    'err.INVALID_EMAIL': 'メールアドレスを確認してください', 'err.EMAIL_TAKEN': 'このメールアドレスは使われています',
    'err.WEAK_PASSWORD': 'パスワードは8文字以上にしてください', 'err.NETWORK': '通信エラーです。もう一度お試しください',
    'err.UNKNOWN': 'エラーが発生しました',
  },

  en: {
    'nav.forRestaurants': 'Restaurants', 'nav.findTable': 'Find a table', 'lang.label': 'Language',
    'title.index': 'EatNow — tables free right now', 'title.restaurant': '{name} — book now | EatNow',
    'title.owner': 'Restaurant dashboard | EatNow', 'title.signup': 'Register | EatNow',
    'title.studio': 'Video studio | EatNow',

    's.count': '{n} free now', 's.loading': 'Looking for tables…', 's.live': 'Live',
    's.none': 'No free tables nearby', 's.noneHint': 'Try a wider area',
    's.noVideos': 'None of the free places nearby has a video yet', 's.showList': 'See the list ({n})',
    'a.party': 'Guests', 'a.area': 'Area', 'a.radius': 'Distance',
    'area.tokyo': 'Tokyo Stn', 'area.shibuya': 'Shibuya', 'area.shinjuku': 'Shinjuku', 'area.ginza': 'Ginza', 'loc.current': 'Near me',
    'loc.locating': 'Finding your location…', 'loc.failed': "Couldn't get your location, so showing Tokyo Station",
    'radius.m': '{n} m', 'radius.km': '{n} km',
    'people': '{n} people', 'people.one': '1 person',
    'cuisine.any': 'All', 'cuisine.sushi': 'Sushi', 'cuisine.ramen': 'Ramen', 'cuisine.izakaya': 'Izakaya', 'cuisine.yakitori': 'Yakitori', 'cuisine.yakiniku': 'BBQ',
    'cuisine.japanese': 'Japanese', 'cuisine.italian': 'Italian', 'cuisine.french': 'French', 'cuisine.chinese': 'Chinese',
    'cuisine.korean': 'Korean', 'cuisine.indian': 'Indian', 'cuisine.thai': 'Thai', 'cuisine.cafe': 'Café', 'cuisine.burger': 'Burgers', 'cuisine.bar': 'Bar',
    'app.title': 'EatNow app', 'app.body': 'Get the iPhone or Android app for a smoother ride', 'app.ios': 'App Store', 'app.android': 'Google Play', 'app.close': 'Close',
    'v.label': 'View', 'v.feed': 'Videos', 'v.list': 'List',
    'c.best': 'Best', 'c.walk': '{n} min', 'c.seats': 'Seats free',
    'c.closes': 'Closes in {n}', 'c.book': 'Book', 'c.new': 'NEW', 'c.rating': 'Rated {n} of 5',

    'rp.ok': 'Seats free — come now',
    'rp.reason.NOT_BOOKABLE': 'Online booking coming soon', 'rp.reason.CLOSED': 'Closed now', 'rp.reason.CLOSING_SOON': 'Closing soon',
    'rp.reason.NO_SEATS': 'Full right now',
    'rp.nearby': 'Free tables nearby', 'rp.map': 'Google Maps', 'rp.route': 'Directions', 'rp.allDay': 'Open 24 hours', 'rp.powered': 'Bookings by EatNow',
    'rp.request': 'Request table', 'rp.location': 'Location', 'rp.hours': 'Hours',
    'rp.openNow': 'Open now', 'rp.closedNow': 'Closed now', 'rp.about': 'About', 'rp.lunch': 'Lunch', 'rp.dinner': 'Dinner', 'rp.perPerson': 'per person',
    'feat.drinks': 'Beer & wine', 'feat.sake': 'Japanese sake', 'feat.standing': 'Standing bar', 'feat.counter': 'Counter seats',
    'feat.vape_only': 'Vape only', 'feat.no_smoking': 'No smoking', 'feat.cards': 'Cards accepted', 'feat.english': 'English menu',

    'f.title': 'Book table', 'f.arrive': 'Arriving in', 'f.min': '{n} min', 'f.name': 'Your name', 'f.phone': 'Phone number',
    'f.go.request': 'Send request', 'f.sending': 'Sending…',
    'f.hint.request': 'The restaurant replies within 5 min',
    'f.sms': 'Enter the SMS code', 'f.smsSent': 'Sent to {phone}', 'f.test': 'Test code', 'f.verify': 'Confirm and send', 'f.resend': 'Resend code',

    'b.wait.title': 'Waiting for the restaurant', 'b.wait.label': 'Reply in', 'b.ok.title': 'Confirmed', 'b.ok.label': 'Arrive within',
    'b.ready': 'Ready in {n} min', 'b.arrive': 'arrive {time}', 'b.pin': 'Booking code', 'b.showPin': 'Show this code at the door',
    'b.here': "I'm here", 'b.hereDone': 'Arrival sent', 'b.route': 'Directions', 'b.cancel': 'Cancel', 'b.cancelQ': 'Cancel this booking?',
    'b.yes': 'Yes', 'b.no': 'No', 'b.findAnother': 'Find another table',
    'step.1': 'Sent', 'step.2': 'Restaurant', 'step.3': 'Confirmed',
    'b.end.seated': 'Enjoy your meal!', 'b.end.declined': "They can't take you this time", 'b.end.no_response': 'No reply from the restaurant',
    'b.end.expired': 'Your hold expired', 'b.end.cancelled': 'Cancelled', 'b.end.no_show': 'Recorded as a no-show',
    'b.endBody.seated': "You're seated at {name}", 'b.endBody.declined': '{name} ({reason})', 'b.endBody.no_response': 'Your request was withdrawn',
    'b.endBody.expired': 'Your booking was cancelled', 'b.endBody.cancelled': 'Your booking was cancelled', 'b.endBody.no_show': 'The restaurant marked a no-show',
    'reason.full': 'full', 'reason.closing': 'closing', 'reason.party_size': 'party size', 'reason.other': 'other',
    'st.pending': 'Waiting', 'st.confirmed': 'Confirmed', 'st.seated': 'Visited', 'st.declined': 'Declined', 'st.no_response': 'No reply',
    'st.expired': 'Expired', 'st.cancelled': 'Cancelled', 'st.no_show': 'No-show',

    'o.login': 'Sign in', 'o.email': 'Email', 'o.password': 'Password', 'o.go': 'Sign in',
    'o.demo': 'Demo: tomo-sushi@demo.test / demo1234', 'o.new': 'Register a restaurant', 'o.logout': 'Sign out',
    'o.live': 'Live', 'o.offline': 'Reconnecting…',
    'o.req': 'Requests', 'o.reqNone': 'No new requests', 'o.accept': 'Accept', 'o.plus10': '+10 min', 'o.decline': 'Decline',
    'o.up': 'Arriving', 'o.upNone': 'Nobody on the way', 'o.seated': 'Arrived', 'o.noShow': 'No-show', 'o.cancel': 'Cancel',
    'o.cancelQ': 'Cancel this booking?', 'o.yes': 'Cancel it', 'o.back': 'Back',
    'o.arrivedNear': 'At your door', 'o.arrived': 'Says they arrived',
    'o.hist': 'Today', 'o.histNone': 'Nothing yet', 'o.disputed': 'Check', 'o.autoSeated': 'Arrived (auto)',
    'o.video': 'Restaurant video', 'o.videoOptional': 'Optional', 'o.videoNone': 'You can take requests without a video. Until you add one, you appear in the list and on your page, but not in the video feed',
    'o.videoUpload': 'Upload video', 'o.videoReplace': 'Replace video', 'o.videoUploading': 'Uploading…', 'o.videoAsk': 'Ask us to make one',
    'o.videoRemove': 'Remove video', 'o.videoRule': 'MP4, WebM or MOV, up to 50 MB. Portrait (9:16) works best', 'o.videoDone': 'Your video is live',
    'o.videoAskSubject': '[EatNow] Video for {name}',
    'o.videoAskBody': 'Hello AnyNow team,\n\nThis is {name} on EatNow. We would like to talk about making a video for our restaurant.\n\nRestaurant ID: {id}\nAddress: {address}\nWhat we have in mind / timing:\n',
    'o.videoMake': 'Make one in the video studio',

    // Video studio (/studio)
    'st.nav': 'Dashboard',
    'st.h1': 'Make a short video',
    'st.lead': 'Turn photos and clips from your phone into a vertical video for the EatNow feed. It takes about 3 minutes.',
    'st.whoIn': 'Posting as {name}', 'st.whoOut': 'Not logged in. You can make and save a video; log in to post it.', 'st.login': 'Log in',
    'st.hasVideo': 'You already have a video. Posting a new one replaces it.',
    'st.s1': 'Photos and clips', 'st.tip': 'About 6–8 shots and 20 seconds works best: outside → food → inside and people → end on the entrance or your staff. Dish photos can share one screen as a collage.',
    'st.add': 'Add photos or videos', 'st.sample': 'Try with sample pictures', 'st.empty': 'Nothing added yet', 'st.emptyDrop': 'Or drag and drop them here, as many as you like at once', 'st.dropHere': 'Drop to add',
    'st.caption': 'Words on screen (e.g. dish name)', 'st.len': 'Length', 'st.startAt': 'Start at {s}',
    'st.up': 'Move up', 'st.down': 'Move down', 'st.del': 'Remove', 'st.show': 'Show in preview',
    'st.max': 'Up to {n} pictures and clips', 'st.bad': "Couldn't open {name} in this browser",
    'st.image': 'Photo', 'st.video': 'Video', 'st.collage': 'Collage',
    'st.same': 'Keep the same words', 'st.merge': 'Combine with the next photo', 'st.split': 'Split ({n} photos)',
    'st.lastNote': 'The last shot shows your name and the closing line',
    'st.s2': 'Words', 'st.name': 'Shop name', 'st.jname': 'Japanese name, written top to bottom (Elegant look)', 'st.jnamePh': 'e.g. 伴寿司', 'st.catch': 'One line about you', 'st.catchPh': 'e.g. Omakase from ¥5,500 · 1 min from Yaesu exit',
    'st.outro': 'Last screen', 'st.english': 'Most viewers are visiting from abroad, so English works best.',
    'st.s3': 'Look and music', 'st.look': 'Look', 'st.music': 'Music',
    'st.tpl.elegant': 'Elegant', 'st.tpl.simple': 'Simple', 'st.tpl.lively': 'Lively',
    'st.lookHint': 'Based on the Tomo Sushi (Elegant), Teramae (Simple) and Dragon Borracho (Lively) videos',
    'st.transition': 'Transition', 'st.tr.fade': 'Fade', 'st.tr.cut': 'Cut',
    'st.m.upbeat': 'Upbeat', 'st.m.chill': 'Chill', 'st.m.japanese': 'Japanese', 'st.m.none': 'None',
    'st.musicHint': 'The music is made by the app, so there are no copyright worries.',
    'st.suggest': 'Suggest the words', 'st.suggestAgain': 'Suggest something else',
    'st.suggesting': 'Thinking…', 'st.suggestingAi': 'Looking at your shots (about 30 seconds)…', 'st.suggestingLocal': 'Looking at your shots (about a minute)…',
    'st.suggestAi': 'AI (Claude, by Anthropic) looks at a still from each shot and writes the catchphrase, a caption for each shot and the words for the last screen. The stills are sent to Anthropic. Pick the ones you like and change them freely.',
    'st.suggestLocal': "AI looks at a still from each shot and writes the catchphrase, a caption for each shot and the words for the last screen. The stills stay on EatNow's own server. Pick the ones you like and change them freely.",
    'st.suggestBasic': "Suggestions come from ready-made phrases chosen by your cuisine and area (no AI). They don't look at the shots, so pick the ones that fit and adjust them.",
    'st.suggestFallback': "Couldn't reach the AI, so these come from ready-made phrases.",
    'st.suggestLogin': 'Sign in to get words suggested for your shots.',
    'st.otherIdeas': 'Other ideas', 'st.suggestNeed': 'Add photos or clips first.', 'st.suggestUndo': 'Go back to before the suggestions', 'st.options': 'Options',
    'st.suggestSetup': 'Add your restaurant in the settings to get words suggested.',
    'st.suggestLocalPc': 'An AI on this computer looks at a still from each shot and writes the catchphrase, a caption for each shot and the words for the last screen. The stills stay on this computer. English only.',
    'st.whoDesk': 'Making a video for {name}', 'st.setupNeed': 'Add your restaurant in the settings to fill in the name and get words suggested.', 'st.settings': 'Settings',
    'st.saveFile': 'Save to a file', 'st.saveAgain': 'Save another copy', 'st.savedTo': 'Saved: {path}', 'st.showFile': 'Show in folder',
    'dk.title': 'EatNow Studio', 'dk.leadWeb': 'Turn photos and clips from your phone or computer into a short vertical video. Everything is made right here in the browser; your files are not sent anywhere.', 'dk.aiOnlyNone': 'On this page, suggestions come from ready-made phrases (no AI). The AI that looks at your shots is in the Mac / Windows app.', 'dk.lead': 'Turn photos and clips on this computer into a short vertical video. Everything is made right here on the computer.',
    'dk.shop': 'Your restaurant',
    'dk.nameEn': 'Name (English)', 'dk.nameJa': 'Name (Japanese)', 'dk.cuisine': 'Cuisine',
    'dk.open': 'Opens', 'dk.close': 'Closes',
    'dk.ai': 'Word suggestions',
    'dk.noTrain': 'Whichever you pick, nothing is used to train AI',
    'dk.specQ': 'Quality', 'dk.specS': 'Speed', 'dk.specC': 'Cost', 'dk.specD': 'Where your shots go',
    'dk.aiNone': 'No AI', 'dk.noneTag': 'Picks ready-made phrases', 'dk.noneS': 'Instant', 'dk.noneC': 'Free', 'dk.noneD': 'Stays on this PC',
    'dk.aiClaude': 'Claude', 'dk.claudeTag': 'Best, with Japanese', 'dk.claudeS': '10–30 s', 'dk.claudeC': '~¥10 each', 'dk.claudeD': 'Sent to Anthropic',
    'dk.key': 'API key', 'dk.keySaved': 'Saved (type only to change it)', 'dk.keyNote': 'Stored encrypted, only on this computer', 'dk.keyClear': 'Remove the key',
    'dk.aiLocal': 'Local AI', 'dk.localTag': 'English only', 'dk.localS': '1–2 min', 'dk.localC': 'Free', 'dk.localD': 'Stays on this PC',
    'dk.localFirst': 'Saving sets it up (a one-time {size} download; 16GB memory needed)',
    'dk.localDisk': 'Not enough free space ({size} needed)',
    'dk.localReady': 'Ready', 'dk.localRemove': 'Remove and free the space ({size})',
    'dk.lpWait': 'Getting ready…', 'dk.lpEngine': 'Downloading the AI {p}% ({a} / {b})', 'dk.lpUnpack': 'Unpacking the AI…',
    'dk.lpStart': 'Starting the AI…', 'dk.lpModel': 'Downloading the model {p}% ({a} / {b})',
    'dk.lpKeep': 'Closing this won’t stop it',
    'err.LOCAL_AI_NOT_READY': "The local AI isn't set up. Choose it in the settings and save",
    'err.LOCAL_AI_PREPARING': 'The local AI is still being set up. Please wait (see the settings for progress)',
    'err.LOCAL_AI_UNSUPPORTED': "This computer can't run the local AI (it needs a Mac or 64-bit Windows)",
    'err.LOCAL_AI_MEMORY': "This computer doesn't have enough memory for the local AI (16GB or more needed)",
    'err.LOCAL_AI_DISK': 'Not enough free space on this computer',
    'err.LOCAL_AI_DOWNLOAD': "Couldn't download. Check the internet connection and save again",
    'dk.save': 'Save', 'dk.cancel': 'Cancel', 'dk.needName': 'Enter the name in English or Japanese.', 'dk.needKey': 'Enter the API key.',
    'err.NO_SECURE_STORAGE': "This computer can't store the key securely", 'err.SAVE_FAILED': "Couldn't save the file",
    'st.play': 'Play', 'st.pause': 'Pause', 'st.overlay': 'Show app labels',
    'st.overlayHint': 'The app shows your name at the bottom, so words sit in the middle.',
    'st.seats': 'Seats free', 'st.walk': '3 min',
    'st.s4': 'Make and post', 'st.s4Desk': 'Make and save', 'st.go': 'Make the video ({s})',
    'st.keep': 'Keep this screen open while it records. It takes as long as the video.',
    'st.rec': 'Recording… {p}%', 'st.stop': 'Stop',
    'st.size': 'File size', 'st.sizeAny': 'No limit', 'st.sizeMax': 'Up to {n}MB', 'st.sizeEst': 'About {mb}MB.',
    'st.sizeLow': 'The picture will be quite rough; a shorter video looks better.',
    'st.sizeOver': 'It came out a little over {n}MB. Make it again and it will be made a bit smaller.',
    'st.hidden': 'Recording stopped because you left the screen. Please try again.',
    'st.unsupported': "This browser can't make videos. Please use the latest Safari or Chrome.",
    'st.need': 'Add at least one photo or clip.', 'st.long': 'Over 30 seconds. Shorter videos get watched to the end more often.',
    'st.tooLong': 'Keep it under 60 seconds.',
    'st.ready': 'Your video is ready', 'st.post': 'Post to EatNow', 'st.posting': 'Posting…', 'st.loginToPost': 'Log in to post',
    'st.posted': 'Posted. It now shows in the feed and on your page.', 'st.page': 'See your page',
    'st.save': 'Save to phone', 'st.again': 'Make another version',
    'st.share': 'Share or save to Photos', 'st.shareHint': 'On iPhone, choose “Save Video” under “Share or save to Photos” to put it in the Photos app.', 'st.shareFail': "Couldn't share. Use “Save to phone” instead.",
    'st.sample1': "You're bound to find a dish you love", 'st.sample2': 'Fish from Toyosu every morning', 'st.sample3': 'Sake from all over Japan', 'st.sample4': '8 counter seats',

    'o.seats': 'Seats now', 'o.seatsYes': 'Seats free', 'o.seatsNo': 'Full',
    'o.seatsYesHint': 'Guests can send requests. Reply within 5 minutes',
    'o.seatsNoHint': 'No requests come in. Switch to "Seats free" when a table opens',
    'o.link': 'Google Maps link', 'o.copy': 'Copy', 'o.copied': 'Copied', 'o.open': 'Open',
    'o.party': '{n}', 'o.by': 'by {time}',
    'o.alert.request': 'New request', 'o.alert.booked': 'New booking',

    'bill.title': 'Billing', 'bill.status.unpaid': 'No card', 'bill.status.active': 'Active', 'bill.status.payment_required': 'Paused',
    'bill.balance': 'Balance', 'bill.card': 'Card', 'bill.rule': '¥200 per visit · ¥1,000 auto top-up below ¥200',
    'bill.topUp': 'Top up', 'bill.pay': 'Add card', 'bill.replace': 'Add card again', 'bill.history': 'Payments',
    'bill.entry.deposit': 'Deposit', 'bill.entry.topup': 'Top-up', 'bill.entry.fee': 'Visit fee',
    'bill.alert.unpaid': 'You can take bookings without a card', 'bill.alert.unpaid.body': 'Add one on the day your first booking is confirmed',
    'bill.alert.due': 'Add a card by {time} today', 'bill.alert.due.body': 'After that, new bookings stop',
    'bill.alert.missed': 'Paused: no card added in time', 'bill.alert.missed.body': 'Add a card to resume right away',
    'bill.alert.payment_required': 'Paused: top-up failed', 'bill.alert.payment_required.body': 'Add a card again to resume',
    'bill.owed': 'Owed {owed}', 'bill.done': 'Paid. Switch to "Seats free" to start taking requests', 'bill.cancelled': 'Payment cancelled',

    'su.title': 'Register', 'su.haveAccount': 'Sign in', 'su.testMode': 'Test mode: listings, calls and payments are simulated',
    'su.step.search': 'Find', 'su.step.verify': 'Phone', 'su.step.details': 'Details', 'su.step.payment': 'Card',
    'su.hint': 'Only restaurants on Google Maps can register', 'su.ph': 'Name and area (e.g. Soba Shibuya)', 'su.go': 'Search',
    'su.registered': 'On EatNow', 'su.closed': 'Closed', 'su.pick': 'Register', 'su.none': 'Nothing found', 'su.back': 'Back',
    'su.call.body': "We'll call {phone} with a code", 'su.call.go': 'Call me', 'su.code': 'Code', 'su.check': 'Confirm',
    'su.test': 'Test code', 'su.resend': 'Call again',
    'su.nameJa': 'Name (Japanese)', 'su.nameEn': 'Name (English)', 'su.cuisine': 'Cuisine', 'su.price': 'Price', 'su.hours': 'Hours', 'su.allDay': '24 hours',
    'su.email': 'Email (sign-in)', 'su.password': 'Password (8+ characters)',
    'su.submit': 'Register',
    'su.pay.title': 'Add a card now or later', 'su.pay.deposit': 'Deposit', 'su.pay.fee': 'Per visit', 'su.pay.zero': 'No-show',
    'su.pay.later': 'Later — start taking bookings',

    'err.NO_SEATS': 'This restaurant is full right now', 'err.ACTIVE_BOOKING_EXISTS': 'This number already has an active booking',
    'err.CLOSING_SOON': 'Too close to closing time',
    'err.VIDEO_TYPE': 'Choose a video file (MP4, WebM or MOV)', 'err.VIDEO_TOO_LARGE': 'Use a video up to 50 MB',
    'err.NOT_BOOKABLE': 'Not taking online bookings now', 'err.INVALID_INPUT': 'Please check what you entered',
    'err.INVALID_PHONE': 'Check the phone number (overseas: start with +)', 'err.CODE_INVALID': 'Wrong or expired code',
    'err.RATE_LIMITED': 'Too many tries. Please wait a little', 'err.PHONE_BLOCKED': "This number can't book right now",
    'err.PHONE_BLOCKED_UNTIL': "This number can't book until {date}", 'err.PHONE_NOT_VERIFIED': 'Please confirm your phone',
    'err.VERIFY_FAILED': "Couldn't send the code", 'err.INVALID_STATE': 'This booking was already updated',
    'err.INVALID_LOGIN': 'Wrong email or password', 'err.LOCKED': 'Too many tries. Wait a minute',
    'err.UNAUTHORIZED': 'Please sign in again', 'err.NOT_FOUND': 'Not found',
    'err.PLACE_NOT_FOUND': 'Not found on Google Maps', 'err.PLACE_CLOSED': 'Closed places cannot register',
    'err.PLACE_REGISTERED': 'Already on EatNow. Please sign in', 'err.PLACE_NO_PHONE': 'No phone number on the listing',
    'err.SIGNUP_EXPIRED': 'Timed out. Please start again', 'err.NOT_VERIFIED': 'Confirm by phone first',
    'err.INVALID_EMAIL': 'Check the email address', 'err.EMAIL_TAKEN': 'This email is already in use',
    'err.WEAK_PASSWORD': 'Use at least 8 characters', 'err.NETWORK': 'Connection problem. Please try again',
    'err.UNKNOWN': 'Something went wrong',
  },
};

// EatNow is for visitors to Japan, so English comes first; Japanese is one tap away.
function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ja') return saved;
  } catch {}
  return 'en';
}

let lang = detect();
const listeners = new Set();

export const getLang = () => lang;

export function t(key, vars = {}) {
  const text = dict[lang][key] ?? dict.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

// Like t(), but uses the ".one" variant when n is 1 and this language has one
// (Japanese has no singular form, so it never does).
export function tn(key, n, vars = {}) {
  const k = n === 1 && dict[lang][`${key}.one`] ? `${key}.one` : key;
  return t(k, { n, ...vars });
}

// An empty name in this language (a restaurant with no Japanese name yet) falls back to English.
export const pick = (obj) => obj?.[lang] || obj?.en || '';

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.querySelectorAll('[data-lang]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
}

export function setLang(next) {
  if (next === lang || !dict[next]) return;
  lang = next;
  try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  document.documentElement.lang = next;
  applyI18n();
  listeners.forEach((fn) => fn());
}

export const onLangChange = (fn) => listeners.add(fn);

export function initI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach((b) => {
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });
  applyI18n();
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Restaurants are in Tokyo, so clock times are always shown in Tokyo time.
export function fmtClock(iso) {
  return new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

// Like t(), but for HTML: the template is escaped and vars are inserted as given (pre-escaped).
export function th(key, vars = {}) {
  const text = dict[lang][key] ?? dict.en[key] ?? key;
  return text
    .split(/(\{\w+\})/)
    .map((part) => {
      const m = part.match(/^\{(\w+)\}$/);
      return m ? String(vars[m[1]] ?? '') : escapeHtml(part);
    })
    .join('');
}

// User-facing text for an API error code.
export function errText(code) {
  const key = `err.${code}`;
  return dict[lang][key] ?? dict.en[key] ?? t('err.UNKNOWN');
}

export const e = (key, vars) => escapeHtml(t(key, vars));
export const en = (key, n, vars) => escapeHtml(tn(key, n, vars));

// Any element with data-until="<ISO time>" shows a live m:ss countdown.
export function startCountdowns() {
  const tick = () => {
    document.querySelectorAll('[data-until]').forEach((el) => {
      el.textContent = fmtCountdown(Date.parse(el.dataset.until) - Date.now());
    });
  };
  tick();
  return setInterval(tick, 1000);
}

export function fmtCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtRadius(m) {
  return m >= 1000 ? t('radius.km', { n: m / 1000 }) : t('radius.m', { n: m });
}

export function fmtHours(hours) {
  if (hours.open === '00:00' && hours.close === '24:00') return t('rp.allDay');
  return `${hours.open}–${hours.close}`;
}

export const priceText = (level) => '¥'.repeat(level);
