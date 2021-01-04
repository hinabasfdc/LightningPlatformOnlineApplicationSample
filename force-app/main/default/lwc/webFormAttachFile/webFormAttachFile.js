import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getContentVersionListJson from '@salesforce/apex/DAF_FileAttachementApexController.getContentVersionListJson';
import deleteFile from '@salesforce/apex/DAF_FileAttachementApexController.deleteFile';

// 名前空間、項目の API 参照名を定義
const nsPrefix = 'jpseps__';
const fnAT_ISFILEUPLOADACCEPTED_FIELD = nsPrefix + 'isFileUploadAccepted__c';
const fnAT_FILEUPLOADDESCRIPTION_FIELD = nsPrefix + 'FileUploadDescription__c';

// 標準のプレビュー表示用(全ファイル共通とするため rendition に THUMB720BY480 を指定)
const BASEURL_THUMNAILIMAGE = '/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=';
const BASEURL_ORIGINALFILE = '/sfc/servlet.shepherd/version/download/';

export default class WebFormAttachFile extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = true;

  @api applicationTemplate;
  @api uploadedFileDocumentIds; // 一度アップロード後に、前後の画面に移動して戻ってきた場合にはここに値が入る
  files;
  documentIds = []; // アップロードしたファイルの ID を格納

  // preview 表示に使用
  isDisplayModal = false;
  previewUrl;

  // 取得した申請定義の項目を返す(特殊文字が変換されているので html 表示ができるように元に戻す(LDS の仕様？))  
  get message() {
    return (this.applicationTemplate.fields[fnAT_FILEUPLOADDESCRIPTION_FIELD].value) ? this._decodeHtml(this.applicationTemplate.fields[fnAT_FILEUPLOADDESCRIPTION_FIELD].value) : false;
  }
  get isFileUploadAccepted() {
    return (this.applicationTemplate.fields[fnAT_ISFILEUPLOADACCEPTED_FIELD].value) ? true : false;
  }

  /**
  * @description : 初期化関数。アップロードしたファイルの ID が渡された場合は、リストを取得
  */
  connectedCallback() {
    if (this.uploadedFileDocumentIds) {
      this.documentIds = [...JSON.parse(this.uploadedFileDocumentIds)];
      if (this.documentIds.length > 0) this._updateList();
    }
  }

  /**
  * @description  : ファイルの削除処理
  **/
  handleClickDelete(evt) {
    let ans = confirm(`ファイル ${evt.target.name} を削除します。よろしいですか？`);
    const cdid = evt.target.dataset.cdid;

    if (ans) {
      const params = {
        recordId: cdid
      };
      deleteFile(params)
        .then(() => {
          this._showToast('成功', 'ファイルの削除に成功しました', 'success');
          // ファイル一覧を更新
          const idx = this.documentIds.indexOf(cdid);
          if (idx >= 0) this.documentIds.splice(idx, 1);

          if(this.documentIds.length > 0){
            this._updateList();
          }else{
            this.files = [];
          }

        })
        .catch((err) => {
          this._showToast('エラー', 'ファイルの削除に失敗しました ' + err.body.message, 'error');
        });
    }
    return;
  }

  /**
  * @description  : ファイルのプレビュー処理
  **/
  handleClickPreview(evt) {
    this.previewUrl = BASEURL_ORIGINALFILE + evt.target.dataset.cvid;
    this.isDisplayModal = true;
  }

  /**
  * @description  : プレビュー用モーダルの非表示
  **/
  handleClickCloseModal() {
    this.isDisplayModal = false;
    this.previewUrl = null;
  }

  /**
  * @description  : ファイルアップロード完了時の処理
  **/
  handleUploadFinished(evt) {
    let localDocumentIds = [];
    for (let i = 0; i < evt.detail.files.length; i++) localDocumentIds.push(evt.detail.files[i]['documentId']);
    this.documentIds = [...this.documentIds, ...localDocumentIds];
    this._updateList();
  }

  /**
  * @description  : リストの更新
  **/
  _updateList() {
    const params = {
      documentIdsJson: JSON.stringify(this.documentIds)
    }
    getContentVersionListJson(params)
      .then((ret) => {
        // 画面表示用に値加工
        let localFiles = JSON.parse(ret);
        for (let i = 0; i < localFiles.length; i++) {
          localFiles[i]['downloadUrl'] = BASEURL_ORIGINALFILE + localFiles[i].Id;
          localFiles[i]['isImage'] = false;
          localFiles[i]['ContentModifiedDate'] = Date.parse(localFiles[i]['ContentModifiedDate']);
          localFiles[i]['ContentSize'] = Number.parseFloat(Number.parseInt(localFiles[i]['ContentSize']) / 1024).toFixed(2);

          // リストでのアイコン表示用設定
          localFiles[i]['IconName'] = 'doctype:unknown';
          if (localFiles[i]['FileType'] === 'PDF') localFiles[i]['IconName'] = 'doctype:pdf';
          else if (localFiles[i]['FileType'] === 'JPG' || localFiles[i]['FileType'] === 'PNG') localFiles[i]['IconName'] = 'doctype:image';
          else if (localFiles[i]['FileType'] === 'CSV') localFiles[i]['IconName'] = 'doctype:csv';
          else if (localFiles[i]['FileType'] === 'EXCEL' || localFiles[i]['FileType'] === 'EXCEL_X') localFiles[i]['IconName'] = 'doctype:excel';
          else if (localFiles[i]['FileType'] === 'WORD' || localFiles[i]['FileType'] === 'WORD_X') localFiles[i]['IconName'] = 'doctype:word';
          else if (localFiles[i]['FileType'] === 'POWER_POINT' || localFiles[i]['FileType'] === 'POWER_POINT__X') localFiles[i]['IconName'] = 'doctype:ppt';

          // 画像の場合のフラグ設定
          if (localFiles[i]['FileType'] === 'JPG' || localFiles[i]['FileType'] === 'PNG' || localFiles[i]['FileType'] === 'HEIC') localFiles[i]['isImage'] = true;
        }
        this.files = [...localFiles];
      })
      .catch((err) => {
        console.log(err);
      })
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
  * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
  */
  handleClickPagePrevious() {
    this.dispatchEvent(new CustomEvent("changepageprevious", {
      detail: {
        currentpage: 'attachfile',
      }
    }))
  }

  /**
  * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
  */
  handleClickPageNext() {
    this.dispatchEvent(new CustomEvent("changepagenext", {
      detail: {
        currentpage: 'attachfile',
        uploadedFileDocumentIds: JSON.stringify(this.documentIds)
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