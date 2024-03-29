import { LightningElement, wire } from "lwc";
import getApplicationTemplates from "@salesforce/apex/DAF_ExportApplicationDataApexController.getApplicationTemplates";
import getApplicationData from "@salesforce/apex/DAF_ExportApplicationDataApexController.getApplicationData";
import {
  fnAD_TEXT_FIELD,
  fnAD_LONGTEXTAREA_FIELD,
  fnAD_NUMBER_FIELD,
  fnA_RELATION
} from "c/appTemplateSchema";

export default class ExportApplicationData extends LightningElement {
  // ドロップダウンリストの選択肢(有効な申請一覧)
  options;
  // 選択された申請の定義 ID
  selectedApplicationTemlateId;
  // 加工出力したデータ保管用変数
  exportData;

  /**
   * @description  : 申請一覧を取得する wire
   **/
  @wire(getApplicationTemplates)
  wiredapplicationtemplates({ data, error }) {
    if (data) {
      // データ保管用変数に代入
      this.options = data.map((d) => {
        return {
          label: d.Name,
          value: d.Id
        };
      });
    } else if (error) {
      console.error(error);
    }
  }

  /**
   * @description  : 選択リストで申請が選ばれた場合の処理
   **/
  handleChangeApplicationSelection(evt) {
    // 選択された申請の定義 ID を格納
    this.selectedApplicationTemlateId = evt.detail.value;
  }

  /**
   * @description  : データの取得処理
   **/
  async handleClickGetApplicationData() {
    if (!this.selectedApplicationTemlateId) return;

    try {
      const apps = await getApplicationData({
        recordId: this.selectedApplicationTemlateId
      });
      console.log(apps);
      if (apps) {
        this.exportData = this._list2lines(apps);
      }
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * @description  : 一部オブジェクト形式がネストされているデータの一列化する処理
   **/
  _list2lines(list) {
    // レコードごとに結果を加工し CSV 形式として lines に代入
    let lines = "";
    for (let i = 0; i < list.length; i++) {
      // 一レコードの処理。オブジェクトの要素名(key)を配列化してループ
      let line = "";
      const keys = Object.keys(list[i]);
      for (let j = 0; j < keys.length; j++) {
        // attribute 要素はスキップ
        if (keys[j] === "attributes") continue;

        // 明細側(カスタム)の項目(オブジェクトの配列になっているので、再度ループ処理)
        if (keys[j] === fnA_RELATION) {
          const records = list[i][fnA_RELATION];
          for (let k = 0; k < records.length; k++) {
            if (fnAD_TEXT_FIELD in records[k])
              line += '"' + records[k][fnAD_TEXT_FIELD] + '",';
            else if (fnAD_LONGTEXTAREA_FIELD in records[k])
              line += '"' + records[k][fnAD_LONGTEXTAREA_FIELD] + '",';
            else if (fnAD_NUMBER_FIELD in records[k])
              line += '"' + records[k][fnAD_NUMBER_FIELD] + '",';
            else line += '"",'; // 桁を揃えるため空の場合でも追記
          }
          // 通常(標準)の項目
        } else {
          line += '"' + list[i][keys[j]] + '",';
        }
      }
      // 末尾のカンマを削除して追加
      lines += line.slice(0, -1) + "\n";
    }
    return lines;
  }

  // ボタン状態変更
  get isButtonDisabled() {
    return !this.selectedApplicationTemlateId;
  }
}
