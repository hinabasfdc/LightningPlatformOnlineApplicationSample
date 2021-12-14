# オンライン申請 手続き定義・審査機能の実装イメージ(サンプルパッケージ)

## 特徴

- 専用画面での申請手続き内容定義
- 手続き数が増えていってもデータ格納オブジェクトは二つで OK

## 注意

このコンポーネント、およびソースコードは実装サンプル・例として共有するものです。(改変自由) 動作を保証・サポートするものではありませんので、あらかじめご了承ください。

## インストール

sfdx が使えるようになっている必要があります。インストール、設定方法などは次を参照してください。[Trailhead : Salesforce DX の設定](https://trailhead.salesforce.com/ja/content/learn/modules/sfdx_app_dev/sfdx_app_dev_setup_dx)
デフォルトの DevHub も設定された状態で次のコマンドを実行します。

1. ダウンロード

```
% git clone https://github.com/hinabasfdc/LightningPlatformOnlineApplicationSample.git
% cd LightningPlatformOnlineApplicationSample
```

2. スクラッチ組織の作成

```
sfdx force:org:create -s -f config/project-scratch-def.json --nonamespace -a OnlineAppSample01
```

3. ソースの入れ込み

```
sfdx force:source:push
```

4. 権限セットの割り当て(ログイン後に GUI で設定しても良い)

```
 sfdx force:user:permset:assign --permsetname permsetOnlineApplication --targetusername [[ログインユーザ名に置き換え]]
```

5. スクラッチ組織にログイン

```
sfdx force:org:open
```

6. 操作
```
アプリケーション"オンライン申請デモパッケージ"を選択
タブ"テストデータ"→「作成」ボタンを押す
タブ"入力フォーム"から確認(初回表示は少し時間がかかる)
```

## ライセンス

- MIT
