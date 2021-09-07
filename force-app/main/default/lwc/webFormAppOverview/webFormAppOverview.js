import { LightningElement, api } from "lwc";
import {
  fnAT_DESCRIPTION_FIELD,
  fnAT_CONDITION_FIELD,
  fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD
} from "c/appTemplateSchema";

export default class WebFormAppOverview extends LightningElement {
  buttonPreviousEnabled = true;

  @api recordId;
  @api appTemplate;
  @api isLoading = false;
  agreementButtonChecked = false;

  // 取得した申請定義の内容説明と条件を取得(特殊文字が変換されているので html 表示ができるように元に戻す(LDS の仕様？))
  get description() {
    return this.appTemplate.fields[fnAT_DESCRIPTION_FIELD].value
      ? this._decodeHtml(this.appTemplate.fields[fnAT_DESCRIPTION_FIELD].value)
      : "";
  }
  get condition() {
    return this.appTemplate.fields[fnAT_CONDITION_FIELD].value
      ? this._decodeHtml(this.appTemplate.fields[fnAT_CONDITION_FIELD].value)
      : "";
  }

  get buttonNextEnabled() {
    return (
      this.agreementButtonChecked ||
      !this.appTemplate?.fields[fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD]
    );
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
    this.agreementButtonChecked = evt.target.checked;
  }

  /**
   * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPagePrevious() {
    this.dispatchEvent(new CustomEvent("changepageprevious"));
  }

  /**
   * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPageNext() {
    this.dispatchEvent(new CustomEvent("changepagenext"));
  }
}
