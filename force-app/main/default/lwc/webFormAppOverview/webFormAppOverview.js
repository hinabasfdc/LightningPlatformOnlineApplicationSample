import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';

// 名前空間の前置詞、および各項目の API 参照名を定義
const nsPrefix = 'jpseps__';
const fnAT_TITLE_FIELD = 'Name';
const fnAT_CATEGORY_FIELD = nsPrefix + 'Category__c';
const fnAT_DESCRIPTION_FIELD = nsPrefix + 'Description__c';
const fnAT_CONDITION_FIELD = nsPrefix + 'Condition__c';
const fnAT_CLOSEDATE_FIELD = nsPrefix + 'CloseDate__c';
const fnAT_STATUS_FIELD = nsPrefix + 'Status__c';
const fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD = nsPrefix + 'isAgreementCheckboxEnabled__c';
const fnAT_AGREEMENTCHECKBOXTEXT_FIELD = nsPrefix + 'AgreementCheckText__c';
const fnAT_ISFILEUPLOADACCEPTED_FIELD = nsPrefix + 'isFileUploadAccepted__c';
const fnAT_FILEUPLOADDESCRIPTION_FIELD = nsPrefix + 'FileUploadDescription__c';
const fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD = nsPrefix + 'isConfirmationCheckboxEnabled__c';
const fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD = nsPrefix + 'ConfirmationCheckDescription__c';
const fnAT_THANKYOUPAGEDESCRIPTION_FIELD = nsPrefix + 'ThankyouPageDescription__c';

// getRecord で取得するようにオブジェクト名を付加した配列を生成
const GETRECORD_FIELDS = [
  'jpseps__objApplicationTemplate__c.' + fnAT_TITLE_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_CATEGORY_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_DESCRIPTION_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_CONDITION_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_CLOSEDATE_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_STATUS_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_AGREEMENTCHECKBOXTEXT_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_ISFILEUPLOADACCEPTED_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_FILEUPLOADDESCRIPTION_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD,
  'jpseps__objApplicationTemplate__c.' + fnAT_THANKYOUPAGEDESCRIPTION_FIELD,
];

export default class WebFormAppOverview extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = false;

  @api recordId;
  applicationTemplate;

  // 取得した申請定義の内容説明と条件を取得(特殊文字が変換されているので html 表示ができるように元に戻す(LDS の仕様？))
  get description() {
    return (this.applicationTemplate.fields[fnAT_DESCRIPTION_FIELD].value) ? this._decodeHtml(this.applicationTemplate.fields[fnAT_DESCRIPTION_FIELD].value) : '';
  }
  get condition() {
    return (this.applicationTemplate.fields[fnAT_CONDITION_FIELD].value) ? this._decodeHtml(this.applicationTemplate.fields[fnAT_CONDITION_FIELD].value) : '';
  }

  /**
  * @description : 選択された申請手続きのレコードを取得する
  */
  @wire(getRecord, { recordId: '$recordId', fields: GETRECORD_FIELDS })
  wiredGetRecord({ data, error }) {
    if (data) {
      this.applicationTemplate = { ...data };

      // 同意チェックが必要ない場合は「次へ」ボタンを有効化
      if(!this.applicationTemplate.fields[fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD].value) this.buttonNextEnabled = true;
    } else if (error) {
      console.log(error);
      this._showToast('wiredGetRecordId', error, 'error');
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
    this.dispatchEvent(new CustomEvent("changepageprevious", {
      detail: {
        currentpage: 'overview',
      }
    }))
  }

  /**
  * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
  */
  handleClickPageNext() {
    this.dispatchEvent(new CustomEvent("changepagenext", {
      detail: {
        currentpage: 'overview',
        applicationTemplate: this.applicationTemplate,
      }
    }))
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