import { LightningElement, api, track } from "lwc";
import {
  onAPPLICATION_OBJECT,
  fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD,
  fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD,
  fnAT_ISFILEUPLOADACCEPTED_FIELD
} from "c/appTemplateSchema";
import { flattenAppTemplate } from "c/webFormUtils";

export default class WebFormConfirm extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = false;

  @api uploadedFileDocumentIds;
  @api appTemplate;
  @track details;
  objectApiName = onAPPLICATION_OBJECT;

  // 申請定義の各種項目値を返す getter
  get checkboxConfirmEnabled() {
    return !!this.appTemplate[fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD];
  }
  get checkboxConfirmText() {
    return (
      this.appTemplate[fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD] ??
      "内容を確認しました"
    );
  }
  get isFileUploadAccepted() {
    return !!this.appTemplate[fnAT_ISFILEUPLOADACCEPTED_FIELD];
  }
  get numOfUploadedFiled() {
    const files = JSON.parse(this.uploadedFileDocumentIds);
    return files.length;
  }

  /**
   * @description : 初期化処理。データをコンポーネントの details に展開
   */
  connectedCallback() {
    if (this.appTemplate) {
      this.details = flattenAppTemplate(this.appTemplate);
    }

    if (!this.checkboxConfirmEnabled) {
      this.buttonNextEnabled = true;
    }
  }

  /**
   * @description : 同意チェックボックスの有効化を「次へ」ボタンに連動
   */
  handleChangeConfirmCheck(evt) {
    this.buttonNextEnabled = evt.target.checked;
  }

  /**
   * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPagePrevious() {
    this.dispatchEvent(new CustomEvent("changepageprevious"));
  }

  /**
   * @description : 「次へ」ボタンを押した時の処理(データの登録処理を実行した後に、WebForm のメソッドをコール)
   */
  handleClickPageNext() {
    this.dispatchEvent(new CustomEvent("submit"));
  }
}
