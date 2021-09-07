import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getRecord } from "lightning/uiRecordApi";
import {
  fnAT_DESCRIPTION_FIELD,
  fnAT_CONDITION_FIELD,
  GETRECORD_FIELDS,
  fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD
} from "../webForm/schema";

export default class WebFormAppOverview extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = false;

  @api recordId;
  applicationTemplate;
  noAppTemplate = false;

  // 取得した申請定義の内容説明と条件を取得(特殊文字が変換されているので html 表示ができるように元に戻す(LDS の仕様？))
  get description() {
    return this.applicationTemplate.fields[fnAT_DESCRIPTION_FIELD].value
      ? this._decodeHtml(
          this.applicationTemplate.fields[fnAT_DESCRIPTION_FIELD].value
        )
      : "";
  }
  get condition() {
    return this.applicationTemplate.fields[fnAT_CONDITION_FIELD].value
      ? this._decodeHtml(
          this.applicationTemplate.fields[fnAT_CONDITION_FIELD].value
        )
      : "";
  }

  /**
   * @description : 選択された申請手続きのレコードを取得する(実運用においては状態や有効期限をチェックして処理を行うべき。その場合は uiRecordApi ではなくカスタム Apex メソッドの方が適しているかもしれない)
   */
  @wire(getRecord, { recordId: "$recordId", fields: GETRECORD_FIELDS })
  wiredGetRecord({ data, error }) {
    if (data) {
      // 申請定義が見つかった場合
      this.noAppTemplate = false;
      this.applicationTemplate = { ...data };

      // 同意チェックが必要ない場合は「次へ」ボタンを有効化
      if (
        !this.applicationTemplate.fields[fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD]
          .value
      )
        this.buttonNextEnabled = true;
    } else if (error) {
      console.log(error);
      this._showToast("wiredGetRecordId", error, "error");
    } else {
      // 申請定義が見つからなかった場合
      this.noAppTemplate = true;
    }
  }

  /**
   * @description : html の特殊文字を元に戻す
   */
  _decodeHtml(html) {
    let txtarea = document.createElement("textarea");
    txtarea.innerHTML = html;
    return txtarea.value;
  }

  /**
   * @description : 同意チェックのチェックボックス動作を「次へ」ボタンの有効化に反映させる
   */
  handleChangeAgreementCheck(evt) {
    this.buttonNextEnabled = evt.target.checked;
  }

  /**
   * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPagePrevious() {
    this.dispatchEvent(
      new CustomEvent("changepageprevious", {
        detail: {
          currentpage: "overview"
        }
      })
    );
  }

  /**
   * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPageNext() {
    this.dispatchEvent(
      new CustomEvent("changepagenext", {
        detail: {
          data: this.applicationTemplate
        }
      })
    );
  }

  /**
   * @description  : トースト表示
   **/
  _showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }
}
