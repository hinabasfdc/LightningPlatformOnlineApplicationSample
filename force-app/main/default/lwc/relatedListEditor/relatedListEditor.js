import { LightningElement, api, wire, track } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { deleteRecord } from "lightning/uiRecordApi";

import getApplicationTemplateDetailRecordIds from "@salesforce/apex/DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecordIds";

//申請定義明細のオブジェクト・各項目のAPI参照名
import APPLICAATIONTEMPLATEDETAIL_OBJECT from "@salesforce/schema/objApplicationTemplateDetail__c";
import NAME_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.Name";
import DESCRIPTION_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.Description__c";
import CATEGORY_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.Category__c";
import STDCOLUMNNAME_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.StdColumnName__c";
import DATATYPE_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.DataType__c";
import REQUIRED_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.Required__c";
import OPTIONS_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.Options__c";
import VALUE_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.Value__c";
import SORTORDER_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.SortOrder__c";
import APPLICATIONTEMPLATE_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.objApplicationTemplate__c";

export default class RelatedListEditor extends LightningElement {
  @api recordId;
  objectApiNameApplicationTemplateDetail = APPLICAATIONTEMPLATEDETAIL_OBJECT;
  @track relatedRecords;

  // refreshApex で利用するための wire データ格納用変数
  wiredRelatedRecords;

  // 右画面表示パネル制御関連
  isRecordSelected = false;
  isCreateRecord = false;
  selectedRecordId;

  // 新規作成時の項目表示制御関連
  isStandardColumn = true;
  isCustomColumn = false;
  isCustomColumnPicklist = false;

  // html でも項目名を使えるように getter 化
  get fieldnameName() {
    return NAME_FIELD["fieldApiName"];
  }
  get fieldnameDescription() {
    return DESCRIPTION_FIELD["fieldApiName"];
  }
  get fieldnameCategory() {
    return CATEGORY_FIELD["fieldApiName"];
  }
  get fieldnameStdColumnName() {
    return STDCOLUMNNAME_FIELD["fieldApiName"];
  }
  get fieldnameDataType() {
    return DATATYPE_FIELD["fieldApiName"];
  }
  get fieldnameRequired() {
    return REQUIRED_FIELD["fieldApiName"];
  }
  get fieldnameOptions() {
    return OPTIONS_FIELD["fieldApiName"];
  }
  get fieldnameValue() {
    return VALUE_FIELD["fieldApiName"];
  }
  get fieldnameSortOrder() {
    return SORTORDER_FIELD["fieldApiName"];
  }
  get fieldnameApplicationTemplate() {
    return APPLICATIONTEMPLATE_FIELD["fieldApiName"];
  }

  // lightning-record-form で扱う項目の一覧を定義
  editRecordColumns = [
    this.fieldnameName,
    this.fieldnameDescription,
    this.fieldnameCategory,
    this.fieldnameStdColumnName,
    this.fieldnameDataType,
    this.fieldnameRequired,
    this.fieldnameOptions,
    this.fieldnameValue,
    this.fieldnameSortOrder
  ];

  /**
   * @description  : メニュー項目表示用に定義済み項目明細を取得する wire
   **/
  @wire(getApplicationTemplateDetailRecordIds, {
    recordId: "$recordId"
  })
  wiredGetApplicationTemplateDetailRecordIds(value) {
    this.wiredRelatedRecords = value;
    const { data, error } = value;

    if (data) {
      const array = JSON.parse(data);
      // メニュー表示用にプロパティを追加
      for (let i = 0; i < array.length; i++)
        array[i]["DisplayName"] =
          "(" +
          array[i][this.fieldnameSortOrder] +
          ") " +
          array[i][this.fieldnameName];

      this.relatedRecords = array;
    } else if (error) {
      console.log(error);
    }
  }

  /**
   * @description  : メニューの項目名がクリックされた場合の処理
   **/
  handleSelectRecord(evt) {
    const selected = evt.detail.name;
    this.isCreateRecord = false;
    this.isRecordSelected = false;

    if (selected === "new") {
      this.isCreateRecord = true;
    } else {
      this.selectedRecordId = selected;
      this.isRecordSelected = true;
    }
  }

  /**
   * @description  : 定義内容の保存処理
   **/
  handleSubmit(evt) {
    evt.preventDefault();
    const fields = evt.detail.fields;
    fields[this.fieldnameApplicationTemplate] = this.recordId;
    // フォームタグの submit を呼び出して登録
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }

  /**
   * @description  : 保存処理成功時に呼ばれる処理
   **/
  handleSuccess() {
    this._showToast("成功", "レコードの作成・更新に成功しました", "success");

    // 各状態値をデフォルトに
    this.selectedRecordId = null;
    this.isCreateRecord = true;
    this.isRecordSelected = false;
    this.isStandardColumn = true;
    this.isCustomColumn = false;

    // 更新された値を再読込
    refreshApex(this.wiredRelatedRecords);
  }

  /**
   * @description  : 定義項目削除ボタンが押された時の処理
   **/
  handleClickDeleteRecord() {
    // アラートで確認し、キャンセルであれば処理終了
    if (!window.confirm("項目を削除します。よろしいですか？")) return;

    // Lightning Data Service の delete メソッドを使用して項目削除
    deleteRecord(this.selectedRecordId)
      .then(() => {
        this._showToast("成功", "項目の削除に成功しました", "success");
        this.selectedRecordId = null;
        this.isCreateRecord = false;
        this.isRecordSelected = false;

        refreshApex(this.wiredRelatedRecords);
      })
      .catch((err) => {
        this._showToast("エラー", err.body.message, "error");
      });
  }

  /**
   * @description  : 項目カテゴリが選択された時の処理
   **/
  handleChangeCategory(evt) {
    this.isStandardColumn = false;
    this.isCustomColumn = false;

    if (evt.detail.value === "標準") this.isStandardColumn = true;
    else if (evt.detail.value === "カスタム") this.isCustomColumn = true;
  }

  /**
   * @description  : データ型が選択された時の処理
   **/
  handleChangeDataType(evt) {
    this.isCustomColumnPicklist = false;

    if (evt.detail.value === "選択リスト") this.isCustomColumnPicklist = true;
  }

  /**
   * @description  : トースト表示
   **/
  _showToast(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(evt);
  }
}
