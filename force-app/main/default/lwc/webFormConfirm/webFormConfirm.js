import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import upsertApplication from '@salesforce/apex/DAF_RecordOperationApexController.upsertApplication';
import upsertApplicationDetails from '@salesforce/apex/DAF_RecordOperationApexController.upsertApplicationDetails';
import createContentDocumentLink from '@salesforce/apex/DAF_FileAttachementApexController.createContentDocumentLink';

// 名前空間、項目の API 参照名を定義
const nsPrefix = '';
const fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD = nsPrefix + 'isConfirmationCheckboxEnabled__c';
const fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD = nsPrefix + 'ConfirmationCheckDescription__c';
const fnAT_ISFILEUPLOADACCEPTED_FIELD = nsPrefix + 'isFileUploadAccepted__c';
const onAPPLICATION_OBJECT = nsPrefix + 'objApplication__c';
const fnATD_VALUE_FIELD = nsPrefix + 'Value__c';
const fnATD_CATEGORY_FIELD = nsPrefix + 'Category__c';
const fnATD_STDCOLUMNNAME_FIELD = nsPrefix + 'StdColumnName__c';
const fnATD_ISTEXT_FIELD = nsPrefix + 'isText__c';
const fnATD_ISLONGTEXTAREA_FIELD = nsPrefix + 'isLongTextArea__c';
const fnATD_ISNUMBER_FIELD = nsPrefix + 'isNumber__c';
const fnATD_ISMAIL_FIELD = nsPrefix + 'isMail__c';
const fnATD_ISURL_FIELD = nsPrefix + 'isURL__c';
const fnATD_ISDATE_FIELD = nsPrefix + 'isDate__c';
const fnATD_ISTIME_FIELD = nsPrefix + 'isTime__c';
const fnATD_ISCURRENCY_FIELD = nsPrefix + 'isCurrency__c';
const fnATD_ISCHECKBOX_FIELD = nsPrefix + 'isCheckbox__c';
const fnATD_ISPICKLIST_FIELD = nsPrefix + 'isPicklist__c';
const fnAD_TEXT_FIELD = nsPrefix + 'Text__c';
const fnAD_LONGTEXTAREA_FIELD = nsPrefix + 'LongTextArea__c';
const fnAD_NUMBER_FIELD = nsPrefix + 'Number__c';
const fnAD_APP_FIELD = nsPrefix + 'objApplication__c'
const fnAD_APPTEMPDET_FIELD = nsPrefix + 'objApplicationTemplateDetail__c'
const fnA_APPTEMP_FIELD = nsPrefix + 'objApplicationTemplate__c';

export default class WebFormConfirm extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = false;

  @api inputData;
  @api selectedAppId;
  @api uploadedFileDocumentIds;
  @api applicationTemplate;
  columns;
  objectApiName = onAPPLICATION_OBJECT;
  createdAppRecordId;

  // 申請定義の各種項目値を返す getter
  get checkboxConfirmEnabled() {
    return (this.applicationTemplate.fields[fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD].value) ? true : false;
  }
  get checkboxConfirmText() {
    return (this.applicationTemplate.fields[fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD].value) ? this.applicationTemplate.fields[fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD].value : '内容を確認しました';
  }
  get isFileUploadAccepted() {
    return (this.applicationTemplate.fields[fnAT_ISFILEUPLOADACCEPTED_FIELD].value) ? true : false;
  }
  get numOfUploadedFiled() {
    const a = JSON.parse(this.uploadedFileDocumentIds);
    return a.length;
  }

  /**
  * @description : 初期化処理。データをコンポーネントの columns に展開 
  */
  connectedCallback() {
    if (this.inputData) {
      this.columns = JSON.parse(this.inputData);
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
  * @description  : データ登録(標準項目)を実行 await で呼び出されるので Promise を返す
  **/
  _upsertApplicationSync() {
    return new Promise((resolve, reject) => {

      // 標準項目のデータ登録用オブジェクト作成し、申請手続き ID と、すでに登録されていた場合は ID を設定
      let std = {};
      std[fnA_APPTEMP_FIELD] = this.selectedAppId;

      // 値格納変数から、標準項目の値を抽出し、データ登録用オブジェクトに追加
      for (let i = 0; i < this.columns.length; i++) if (this.columns[i][fnATD_CATEGORY_FIELD] === '標準' && this.columns[i][fnATD_STDCOLUMNNAME_FIELD] && this.columns[i][fnATD_VALUE_FIELD]) std[this.columns[i][fnATD_STDCOLUMNNAME_FIELD]] = this.columns[i][fnATD_VALUE_FIELD];

      // データ登録用オブジェクトを JSON 化して、Apex メソッドを呼び出し
      const params = {
        std: JSON.stringify(std)
      };
      upsertApplication(params)
        .then((ret) => {
          if (ret) {
            resolve(ret);
          } else {
            reject('_upsertApplicationSync: no record id.');
          }
        })
        .catch((err) => {
          reject(err);
        })

    })
  }

  /**
  * @description  : データ登録(カスタム項目)を実行 await で呼び出されるので Promise を返す
  **/
  _upsertApplicationDetailsSync(recordId) {
    return new Promise((resolve, reject) => {
      console.log('[DEBUG] _upsertApplicationDetails');

      // レコードIDが無い場合は終了
      if (!recordId) resolve();

      // データ登録用の配列を設定
      let customs = [];
      for (let i = 0; i < this.columns.length; i++) {
        if (this.columns[i][fnATD_CATEGORY_FIELD] === 'カスタム') {
          // 一項目分のデータを格納するオブジェクトを作成し、申請および申請定義明細のレコード ID を設定
          let custom = {};
          custom[fnAD_APP_FIELD] = recordId;
          custom[fnAD_APPTEMPDET_FIELD] = this.columns[i]['Id'];
          // データがすでに作成されている場合は更新用に ID を設定
          if (this.columns[i]['detailRecordId']) custom['Id'] = this.columns[i]['detailRecordId'];

          // データ型に応じて、適切な項目に値を代入
          if (this.columns[i][fnATD_ISTEXT_FIELD]) custom[fnAD_TEXT_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISLONGTEXTAREA_FIELD]) custom[fnAD_LONGTEXTAREA_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISNUMBER_FIELD]) custom[fnAD_NUMBER_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISMAIL_FIELD]) custom[fnAD_TEXT_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISURL_FIELD]) custom[fnAD_LONGTEXTAREA_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISDATE_FIELD]) custom[fnAD_TEXT_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISTIME_FIELD]) custom[fnAD_TEXT_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISCURRENCY_FIELD]) custom[fnAD_NUMBER_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISCHECKBOX_FIELD]) custom[fnAD_TEXT_FIELD] = this.columns[i][fnATD_VALUE_FIELD];
          else if (this.columns[i][fnATD_ISPICKLIST_FIELD]) custom[fnAD_TEXT_FIELD] = this.columns[i][fnATD_VALUE_FIELD];

          customs.push(custom);
        }
      }

      // カスタム項目が無い場合は終了
      if (customs.length === 0) resolve();

      // データ登録用オブジェクトの配列を JSON 化して、Apex メソッドを呼び出し
      const params = {
        customs: JSON.stringify(customs)
      };
      upsertApplicationDetails(params)
        .then((ret) => {
          const retvals = JSON.parse(ret);

          // 申請明細定義のレコード ID と作成された申請明細レコード ID のマッピングを作成
          let createdRecords = {};
          for (let i = 0; i < retvals.length; i++) createdRecords[retvals[i][fnAD_APPTEMPDET_FIELD]] = retvals[i]['Id'];

          // データ保管用オブジェクト配列に作成された申請明細レコードの ID を設定
          for (let j = 0; j < this.columns.length; j++) if (this.columns[j][fnATD_CATEGORY_FIELD] === 'カスタム') this.columns[j]['detailRecordId'] = createdRecords[this.columns[j]['Id']];

          resolve();
        })
        .catch((err) => {
          reject(err);
        })
    })
  }

  /**
  * @description  : データ登録(ファイル添付)を実行 await で呼び出されるので Promise を返す
  **/
  _createAttachmentFileLink() {
    return new Promise((resolve, reject) => {
      const params = {
        recordId: this.createdAppRecordId,
        documentIdsJson: this.uploadedFileDocumentIds
      }
      createContentDocumentLink(params)
        .then((ret) => {
          resolve(ret);
        })
        .catch((err) => {
          reject(err);
        })
    })
  }

  /**
  * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
  */
  handleClickPagePrevious() {
    this.dispatchEvent(new CustomEvent("changepageprevious", {
      detail: {
        currentpage: 'confirm',
      }
    }))
  }

  /**
  * @description : 「次へ」ボタンを押した時の処理(データの登録処理を実行した後に、WebForm のメソッドをコール)
  */
  async handleClickPageNext() {
    try {
      //recordId 取得のため、申請オブジェクトへレコードへの書き込み完了を待つ

      // 親の申請レコード
      this.createdAppRecordId = await this._upsertApplicationSync();
      // 子の申請明細レコード
      await this._upsertApplicationDetailsSync(this.createdAppRecordId);
      // ファイルの紐付け      
      if (this.uploadedFileDocumentIds) {
        const a = JSON.parse(this.uploadedFileDocumentIds);
        if (a.length > 0) await this._createAttachmentFileLink();
      }

      // WebForm のメソッドを呼び出し
      this.dispatchEvent(new CustomEvent("changepagenext", {
        detail: {
          currentpage: 'confirm',
          createdAppRecordId: this.createdAppRecordId
        }
      }))
    } catch (err) {
      console.log(err);
    }
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