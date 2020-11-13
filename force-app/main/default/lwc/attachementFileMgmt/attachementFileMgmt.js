import { LightningElement, api, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getAttachedFileList from '@salesforce/apex/DAF_FileAttachementApexController.getAttachedFileList';
import deleteFile from '@salesforce/apex/DAF_FileAttachementApexController.deleteFile';

// 標準のプレビュー表示用(全ファイル共通とするため rendition に THUMB720BY480 を指定)
const BASEURL_THUMNAILIMAGE = '/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=';

export default class AttachementFileMgmt extends LightningElement {
  @api recordId;
  @track records;

  // refreshApex で利用するための wire データ格納用変数
  wiredAttachedFiles;

  // preview 表示に使用
  isDisplayModal = false;
  previewUrl;

  /**
  * @description  : 添付ファイルの一覧を取得する wire
  **/
  @wire(getAttachedFileList, { recordId: '$recordId' })
  wiredGetAttachedFileList(value) {
    this.wiredAttachedFiles = value;
    const { data, error } = value;
    if (data) {
      // 画面表示用に値加工
      let records = JSON.parse(data);
      for (let i = 0; i < records.length; i++) {
        records[i]['imgsrc'] = BASEURL_THUMNAILIMAGE + records[i].Id;
        records[i]['ContentModifiedDate'] = Date.parse(records[i]['ContentModifiedDate']);
        records[i]['ContentSize'] = Number.parseFloat(Number.parseInt(records[i]['ContentSize']) / 1024).toFixed(2);

        // リストでのアイコン表示用設定
        records[i]['IconName'] = 'doctype:unknown';
        if (records[i]['FileType'] === 'PDF') records[i]['IconName'] = 'doctype:pdf';
        else if (records[i]['FileType'] === 'JPG' || records[i]['FileType'] === 'PNG') records[i]['IconName'] = 'doctype:image';
        else if (records[i]['FileType'] === 'CSV') records[i]['IconName'] = 'doctype:csv';
        else if (records[i]['FileType'] === 'EXCEL' || records[i]['FileType'] === 'EXCEL_X') records[i]['IconName'] = 'doctype:excel';
        else if (records[i]['FileType'] === 'WORD' || records[i]['FileType'] === 'WORD_X') records[i]['IconName'] = 'doctype:word';
        else if (records[i]['FileType'] === 'POWER_POINT' || records[i]['FileType'] === 'POWER_POINT__X') records[i]['IconName'] = 'doctype:ppt';
      }
      this.records = records;
    } else if (error) {
      console.log(error);
    } else {
      // 添付ファイルが存在しない場合は null を設定
      this.records = null;
    }
  }

  /**
  * @description  : ファイルの削除処理
  **/
  handleClickDelete(evt) {
    let ans = confirm(`ファイル ${evt.target.name} を削除します。よろしいですか？`);

    if (ans) {
      const params = {
        recordId: evt.target.dataset.cdid
      };
      deleteFile(params)
        .then(() => {
          this._showToast('成功', 'ファイルの削除に成功しました', 'success');
          // ファイル一覧を更新
          refreshApex(this.wiredAttachedFiles);
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
    this.previewUrl = BASEURL_THUMNAILIMAGE + evt.target.dataset.cvid;
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
  handleUploadFinished() {
    // ファイル一覧を更新
    refreshApex(this.wiredAttachedFiles);
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