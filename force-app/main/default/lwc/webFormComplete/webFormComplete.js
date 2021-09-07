import { LightningElement, api, wire } from "lwc";
import { getRecord } from "lightning/uiRecordApi";

// 名前空間、項目の API 参照名を定義
const nsPrefix = "";
const fnA_NAME_FIELD = "Name";
const fnAT_THANKYOUPAGEDESCRIPTION_FIELD =
  nsPrefix + "ThankyouPageDescription__c";

// getRecord で取得するようにオブジェクト名を付加した配列を生成
const GETRECORD_FIELDS = ["objApplication__c." + fnA_NAME_FIELD];

export default class WebFormComplete extends LightningElement {
  buttonPreviousEnabled = false;
  buttonNextEnabled = true;

  @api createdAppRecordId;
  @api applicationTemplate;
  askcode;

  // 申請定義の各種項目値を返す getter
  get message() {
    return this.applicationTemplate.fields[fnAT_THANKYOUPAGEDESCRIPTION_FIELD]
      .value
      ? this._decodeHtml(
          this.applicationTemplate.fields[fnAT_THANKYOUPAGEDESCRIPTION_FIELD]
            .value
        )
      : false;
  }

  /**
   * @description : 自動採番される Name 項目の値を取得
   */
  @wire(getRecord, {
    recordId: "$createdAppRecordId",
    fields: GETRECORD_FIELDS
  })
  wiredGetRecord({ data, error }) {
    if (data) {
      this.askcode = data.fields[fnA_NAME_FIELD].value;
    } else if (error) {
      console.log(error);
    }
  }

  /**
   * @description  : リッチテキストフィールドの特殊文字を元に戻す
   **/
  _decodeHtml(html) {
    let txtarea = document.createElement("textarea");
    txtarea.innerHTML = html;
    return txtarea.value;
  }

  /**
   * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPagePrevious() {
    this.dispatchEvent(
      new CustomEvent("changepageprevious", {
        detail: {
          currentpage: "complete"
        }
      })
    );
  }

  /**
   * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPageNext() {
    this.dispatchEvent(
      new CustomEvent("changepagenext")
    );
  }
}
