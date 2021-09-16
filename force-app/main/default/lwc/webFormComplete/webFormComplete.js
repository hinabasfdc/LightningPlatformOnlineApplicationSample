import { LightningElement, api } from "lwc";
import { fnAT_THANKYOUPAGEDESCRIPTION_FIELD } from "c/appTemplateSchema";

export default class WebFormComplete extends LightningElement {
  buttonPreviousEnabled = false;
  buttonNextEnabled = true;

  @api createdAppRecord;
  @api appTemplate;

  // 申請定義の各種項目値を返す getter
  get message() {
    return this.appTemplate[fnAT_THANKYOUPAGEDESCRIPTION_FIELD]
      ? this._decodeHtml(this.appTemplate[fnAT_THANKYOUPAGEDESCRIPTION_FIELD])
      : "";
  }

  /**
   * @description  : リッチテキストフィールドの特殊文字を元に戻す
   **/
  _decodeHtml(html) {
    const txtarea = document.createElement("textarea");
    txtarea.innerHTML = html;
    return txtarea.value;
  }

  /**
   * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPageNext() {
    this.dispatchEvent(new CustomEvent("changepagenext"));
  }
}
