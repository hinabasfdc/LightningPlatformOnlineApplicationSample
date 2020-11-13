import { LightningElement, wire } from 'lwc';
import getApplicationTemplates from '@salesforce/apex/DAF_ExportApplicationDataApexController.getApplicationTemplates';
import getApplicationData from '@salesforce/apex/DAF_ExportApplicationDataApexController.getApplicationData';

//申請定義明細のオブジェクト・各項目のAPI参照名
import TEXT_FIELD from '@salesforce/schema/objApplicationDetail__c.Text__c';
import LONGTEXTAREA_FIELD from '@salesforce/schema/objApplicationDetail__c.LongTextArea__c';
import NUMBER_FIELD from '@salesforce/schema/objApplicationDetail__c.Number__c';

export default class ExportApplicationData extends LightningElement {
  // ドロップダウンリストの選択肢(有効な申請一覧)
  options;
  // 選択された申請の定義 ID
  selectedApplicationTemlateId;
  // 加工出力したデータ保管用変数
  exportData;
  // ボタン状態変更
  isButtonDisabled = true;

  // 各所で項目名を使えるように getter 化
  get fieldnameApplicationDetailR() { return 'objApplicationDetail__r' }; // 参照関係はスキーマ定義から取得できないのでここで定義
  get fieldnameText() { return TEXT_FIELD['fieldApiName'] };
  get fieldnameLongTextArea() { return LONGTEXTAREA_FIELD['fieldApiName'] };
  get fieldnameNumber() { return NUMBER_FIELD['fieldApiName'] };

  /**
  * @description  : 申請一覧を取得する wire
  **/
  @wire(getApplicationTemplates)
  wiredapplicationtemplates({ data, error }) {
    if (data) {
      // 取得した JSON をオブジェクト化し、combobox の選択肢として使えるように加工
      const a = JSON.parse(data);
      let localOptions = [];
      for (let i = 0; i < a.length; i++) {
        let o = {};
        o['value'] = a[i].Id;
        o['label'] = a[i].Name;

        localOptions.push(o);
      }

      // データ保管用変数に代入
      this.options = localOptions;
    } else if (error) {
      console.log(error);
    }
  }

  /**
  * @description  : 選択リストで申請が選ばれた場合の処理
  **/
  handleChangeApplicationSelection(evt) {
    // 選択された申請の定義 ID を格納
    this.selectedApplicationTemlateId = evt.detail.value;
    this.isButtonDisabled = false;
  }

  /**
  * @description  : データの取得処理
  **/
  handleClickGetApplicationData() {
    if (!this.selectedApplicationTemlateId) return;

    const params = {
      recordId: this.selectedApplicationTemlateId
    };
    getApplicationData(params)
      .then((ret) => {
        if (ret) this.exportData = this._json2lines(ret);
      })
      .catch((err) => {
        console.log(err);
      })
  }

  /**
  * @description  : 一部オブジェクト形式がネストされているデータの一列化する処理
  **/
  _json2lines(json) {
    // レコードごとに結果を加工し CSV 形式として lines に代入
    let lines = '';
    let a = JSON.parse(json);
    for (let i = 0; i < a.length; i++) {
      // 一レコードの処理。オブジェクトの要素名(key)を配列化してループ
      let line = ''
      const keys = Object.keys(a[i]);
      for (let j = 0; j < keys.length; j++) {
        // attribute 要素はスキップ
        if (keys[j] === 'attributes') continue;

        // 明細側(カスタム)の項目(オブジェクトの配列になっているので、再度ループ処理)
        if (keys[j] === this.fieldnameApplicationDetailR) {
          const records = a[i][this.fieldnameApplicationDetailR]['records'];
          for (let k = 0; k < records.length; k++) {
            if (this.fieldnameText in records[k]) line += '"' + records[k][this.fieldnameText] + '",';
            else if (this.fieldnameLongTextArea in records[k]) line += '"' + records[k][this.fieldnameLongTextArea] + '",';
            else if (this.fieldnameNumber in records[k]) line += '"' + records[k][this.fieldnameNumber] + '",';
            else line += '"",'; // 桁を揃えるため空の場合でも追記
          }
          // 通常(標準)の項目
        } else {
          line += '"' + a[i][keys[j]] + '",'
        }
      }
      // 末尾のカンマを削除して追加
      lines += line.slice(0, -1) + '\n';
    }
    return lines;
  }
}