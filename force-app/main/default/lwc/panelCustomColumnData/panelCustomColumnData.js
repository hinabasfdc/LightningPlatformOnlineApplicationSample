import { LightningElement, api, wire } from "lwc";
import getApplicationCustomColumns from "@salesforce/apex/DAF_RecordOperationApexController.getApplicationCustomColumns";
import updateApplicationDetails from "@salesforce/apex/DAF_RecordOperationApexController.updateApplicationDetails";
import { refreshApex } from "@salesforce/apex";
const nsPrefix = "";

//申請定義明細のオブジェクト・各項目のAPI参照名
const fnATD_OPTIONS_FIELD = nsPrefix + "Options__c";
const fnATD_DATATYPE_FIELD = nsPrefix + "DataType__c";
const fnAD_TEXT_FIELD = nsPrefix + "Text__c";
const fnAD_LONGTEXTAREA_FIELD = nsPrefix + "LongTextArea__c";

const fnATD_Relation = nsPrefix + "objApplicationTemplateDetail__r";

export default class PanelCustomColumnData extends LightningElement {
  @api recordId;

  // レコードの値格納用変数
  appDetails;
  originalAppDetailsStr;

  // 表示状態設定用変数
  isViewMode = true;

  /**
   * @description  : 申請のカスタム項目データを取得する wire
   **/
  @wire(getApplicationCustomColumns, {
    recordId: "$recordId"
  })
  wiredGetApplicationCustomColumns({ data, error }) {
    this.wireDetails = data;
    if (data) {
      this.appDetails = data.map((detail) => {
        const d = { ...detail };
        d.isRecordValueChanged = false;
        // 画面表示切替え用。デフォルト値設定後にデータ型に応じて true に設定
        const dt = d[fnATD_DATATYPE_FIELD];

        // チェックボックスの場合の画面表示切替え用
        if (dt === "チェックボックス") {
          d.isCheckboxChecked = d[fnAD_TEXT_FIELD] === "true";
        }

        // データ型が選択リストの場合は、選択肢を生成
        if (dt === "選択リスト") {
          //カンマ区切りをオブジェクトの配列に変換
          d.PickListValues = d[fnATD_Relation][fnATD_OPTIONS_FIELD]
            .split(",")
            .map((o) => {
              return {
                label: o,
                value: o
              };
            });
        }
        return d;
      });

      console.log("WIRED", this.appDetails);
    } else if (error) {
      console.error(error);
    }
  }

  /**
   * @description  : 画面上で値が変更された場合に格納用変数に設定
   **/
  handleChangeValue(evt) {
    const { id, value, checked } = evt.detail;
    const targetDetail = this.appDetails.find((d) => d.Id === id);
    if (!targetDetail) {
      return;
    }

    // データタイプごとに適した格納項目に値を設定
    const dt = targetDetail[fnATD_DATATYPE_FIELD];
    if (dt === "チェックボックス") {
      targetDetail[fnAD_TEXT_FIELD] = "" + checked;
      targetDetail.isCheckboxChecked = checked;
    } else if (dt === "数値" || dt === "通貨") {
      targetDetail.Number__c = value;
    } else if (dt === "ロングテキストエリア" || dt === "URL") {
      targetDetail[fnAD_LONGTEXTAREA_FIELD] = value;
    } else {
      targetDetail[fnAD_TEXT_FIELD] = value;
    }
    // 変更があったことを記録
    targetDetail.isRecordValueChanged = true;
  }

  /**
   * @description  : 画面表示を編集モードに変更
   **/
  handleClickEditMode() {
    // キャンセルボタンを押した時に元に戻せるように変更前の値を退避
    this.originalAppDetailsStr = JSON.stringify(this.appDetails);
    // 表示変更
    this.isViewMode = false;
  }

  /**
   * @description  : キャンセルボタンが押されたときの処理
   **/
  handleClickCancel() {
    // 退避させておいた値で上書き
    this.appDetails = JSON.parse(this.originalAppDetailsStr);
    // 表示変更
    this.isViewMode = true;
  }

  /**
   * @description  : 保存ボタンが押されたときの処理
   **/
  async handleClickSave() {
    const appDetails = this.appDetails.filter((d) => d.isRecordValueChanged);

    if (appDetails.length === 0) {
      return;
    }
    try {
      await updateApplicationDetails({ appDetails });
      this.isViewMode = true;
      this.originalAppDetailsStr = null;
      refreshApex(this.wiredDetailRecords);
      console.log(this.appDetails);
    } catch (e) {
      console.error(e);
    }
  }
}
