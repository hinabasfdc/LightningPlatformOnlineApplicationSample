import { LightningElement, api, wire, track } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { deleteRecord } from "lightning/uiRecordApi";
import { formatPages, formatPagesForSave, STATUS_DRAFT } from "./utils";
import { showToast } from "c/webFormUtils";
import getApplicationTemplateDetailRecordIds from "@salesforce/apex/DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecordIds";
import saveApplicationTemplateDetails from "@salesforce/apex/DAF_RelatedListEditorApexController.saveApplicationTemplateDetails";

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
import PAGE_NUMBER_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.PageNumber__c";
import ROW_NUMBER_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.RowNumber__c";
import SORTORDER_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.SortOrder__c";
import APPLICATIONTEMPLATE_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.objApplicationTemplate__c";

export default class RelatedListEditor extends LightningElement {
  @api recordId;
  objectApiNameApplicationTemplateDetail = APPLICAATIONTEMPLATEDETAIL_OBJECT;

  @track pages = [];
  @track selectedPage;
  @track selectedField;

  // refreshApex で利用するための wire データ格納用変数
  wiredRelatedRecords;

  // 右画面表示パネル制御関連
  selectedFieldName;

  // html でも項目名を使えるように getter 化
  get fieldnameName() {
    return NAME_FIELD.fieldApiName;
  }
  get fieldnameDescription() {
    return DESCRIPTION_FIELD.fieldApiName;
  }
  get fieldnameCategory() {
    return CATEGORY_FIELD.fieldApiName;
  }
  get fieldnameStdColumnName() {
    return STDCOLUMNNAME_FIELD.fieldApiName;
  }
  get fieldnameDataType() {
    return DATATYPE_FIELD.fieldApiName;
  }
  get fieldnameRequired() {
    return REQUIRED_FIELD.fieldApiName;
  }
  get fieldnameOptions() {
    return OPTIONS_FIELD.fieldApiName;
  }
  get fieldnameValue() {
    return VALUE_FIELD.fieldApiName;
  }
  get fieldnameSortOrder() {
    return SORTORDER_FIELD.fieldApiName;
  }
  get fieldnameApplicationTemplate() {
    return APPLICATIONTEMPLATE_FIELD.fieldApiName;
  }
  get fieldnameRowNumber() {
    return ROW_NUMBER_FIELD.fieldApiName;
  }
  get fieldnamePageNumber() {
    return PAGE_NUMBER_FIELD.fieldApiName;
  }

  // 新規作成時の項目表示制御関連
  get isStandardColumn() {
    return this.selectedField?.data?.Category__c === "標準";
  }
  get isCustomColumn() {
    return this.selectedField?.data?.Category__c === "カスタム";
  }

  get isCustomColumnPicklist() {
    return this.selectedField?.data?.DataType__c === "選択リスト";
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

  onDragStartPageNav(e) {
    console.log("onDragStartPageNav", e.currentTarget);
    // e.dataTransfer.setData("text/plain", e.target.id);
  }

  onDragOverPageNav(e) {
    console.log("onDragOverPageNav");
  }

  onDropPageNav(e) {
    console.log("onDropPageNav");
  }

  onChangePageName(e) {
    console.log(e.detail.value);
  }

  /**
   * @description  : メニュー項目表示用に定義済み項目明細を取得する wire
   **/
  @wire(getApplicationTemplateDetailRecordIds, {
    recordId: "$recordId"
  })
  wiredGetApplicationTemplateDetailRecordIds(value) {
    this.wiredRelatedRecords = value;
    const { data, error } = value;

    console.log("wiredGetApplicationTemplateDetailRecordIds called", data);
    if (data) {
      const array = JSON.parse(data);
      if (!array || array.length === 0) {
        return;
      }

      this.pages = formatPages(array);
      this.selectedPage = this.pages[0] ?? null;
      console.log(
        "wiredGetApplicationTemplateDetailRecordIds",
        array,
        this.pages,
        this.selectedPage
      );
    } else if (error) {
      console.error(error);
    }
  }

  /**
   * @description  : メニューの項目名がクリックされた場合の処理
   **/
  handleSelectPage(evt) {
    const selected = evt.detail.name;
    const page = this.pages?.find((p) => p.id === selected);
    this.selectedPage = page ?? null;
    this.selectedFieldName = this.selectedPage?.rows[0]?.fields[0]?.id;
    this.selectedField = this.selectedPage?.rows[0]?.fields[0];
  }

  /**
   * @description  : メニューの項目名がクリックされた場合の処理
   **/
  handleSelectField(evt) {
    const fieldId = evt.detail.name;
    let target = null;
    this.selectedPage?.rows?.forEach((r) => {
      r?.fields?.forEach((f) => {
        if (f.id === fieldId) {
          target = f;
        }
      });
    });
    if (!target) {
      return;
    }
    this.selectedFieldName = target.id;
    this.selectedField = target;
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
    showToast(this, "成功", "レコードの作成・更新に成功しました", "success");
    // 更新された値を再読込
    refreshApex(this.wiredRelatedRecords);
  }

  /**
   * @description  : 定義項目削除ボタンが押された時の処理
   **/
  async handleClickDeleteField() {
    if (!this.selectedPage) {
      return;
    }

    // アラートで確認し、キャンセルであれば処理終了
    if (!window.confirm("項目を削除します。よろしいですか？")) {
      return;
    }

    console.log("hello deliting");

    // delete field
    const index = { i: null, j: null, detailId: null };
    for (let i = 0; i < this.selectedPage?.rows.length; i++) {
      if (!this.selectedPage?.rows[i]?.fields) {
        continue;
      }
      for (let j = 0; j < this.selectedPage?.rows[i]?.fields.length; j++) {
        if (this.selectedPage.rows[i].fields[j].id === this.selectedFieldName) {
          if (this.selectedPage.rows[i].fields[j].status === "saved") {
            index.detailId = this.selectedPage.rows[i].fields[j].data.Id;
          }
          index.i = i;
          index.j = j;
          break;
        }
      }
    }

    try {
      if (index.detailId) {
        await deleteRecord(index.detailId);
        refreshApex(this.wiredRelatedRecords);
      }
      // 項目削除
      this.selectedPage.rows[index.i].fields.splice(index.j, 1);
      // 項目数０の列は消す。
      if (this.selectedPage.rows[index.i].fields.length === 0) {
        this.selectedPage.rows.splice(index.i, 1);
      }
      // 項目選択
      this.selectedField =
        this.selectedPage.rows.length > 0
          ? this.selectedPage.rows[0].fields[0]
          : null;
      this.selectedFieldName =
        this.selectedPage.rows.length > 0
          ? this.selectedPage.rows[0].fields[0].id
          : null;
      showToast(this, "成功", "項目を削除しました", "success");
    } catch (err) {
      console.error(err);
      // showToast(this, "エラー", err.body.message, "error");
    }
  }

  handleClickDeletePage() {
    console.log("delete page");

    // アラートで確認し、キャンセルであれば処理終了
    if (!window.confirm("ページを削除します。よろしいですか？")) {
      return;
    }

    // delete page
    const index = { i: null, detailId: null };
    for (let i = 0; i < this.pages.length; i++) {
      if (this.pages[i].page === this.selectedPage.page) {
        index.i = i;
        break;
      }
    }

    if (!index.i) {
      return;
    }

    this.pages.splice(index.i, 1);
    // ページがあるか
    if (this.pages.length > 0) {
      // あれば０ページ目
      this.selectedPage = this.pages[0];
      // 項目があるか
      if (this.selectedPage.rows.length > 0) {
        this.selectedField = this.selectedPage.rows[0].fields[0];
        this.selectedFieldName = this.selectedPage.rows[0].fields[0].id;
      } else {
        this.selectedField = null;
        this.selectedFieldName = null;
      }
    } else {
      this.selectedPage = null;
      this.selectedField = null;
      this.selectedFieldName = null;
    }
  }

  handleClickNewPage() {
    const nextPageNumber = this.pages.length + 1;
    this.pages.push({
      id: `page${nextPageNumber}`,
      page: nextPageNumber,
      status: STATUS_DRAFT,
      rows: [],
      name: `入力ページ${nextPageNumber}`,
      fieldCount: 0
    });
    this.selectedPage = this.pages[nextPageNumber - 1];

    this.handleClickNewField();
  }

  // 新規項目
  handleClickNewField() {
    if (!this.selectedPage) {
      return;
    }

    const nextRowNumber = this.selectedPage?.rows?.length + 1;
    this.selectedPage?.rows?.push({
      row: nextRowNumber,
      fields: [
        {
          id: `field${this.selectedPage.page}_${nextRowNumber}_1`,
          order: 1,
          displayName: `新規項目`,
          data: {},
          status: STATUS_DRAFT
        }
      ]
    });

    this.selectedFieldName = `field${this.selectedPage.page}_${nextRowNumber}_1`;
    this.selectedField = this.selectedPage?.rows[nextRowNumber - 1];
  }

  handleNewFieldInputChange(e) {
    const field = e.currentTarget?.dataset?.fieldName;
    const { value, checked } = e.detail;

    console.log(
      "handleNewFieldInputChange",
      field,
      value,
      checked,
      this.selectedField,
      this.selectedField?.data?.Category__c
    );
    if (!field || (!value && !checked)) {
      return;
    }
    this.selectedPage.rows.forEach((r) => {
      r.fields.forEach((f) => {
        if (f.id === this.selectedFieldName) {
          const v = field === this.fieldnameRequired ? checked : value;
          console.log(f.data[field], "vs", v);
          const valueChanged = f.data[field] !== v;
          f.data[field] = v;
          if (valueChanged) {
            f.status = STATUS_DRAFT;
          }
          if (field === this.fieldnameName) {
            f.displayName = value ?? "新規項目";
          }
          console.log(field, value, checked, this.fieldnameRequired, f);
        }
      });
    });
  }

  handlePageNameInputChange(e) {
    if (this.selectedPage.name !== e.detail.value) {
      this.selectedPage.status = STATUS_DRAFT;
    }
    this.selectedPage.name = e.detail.value;
  }

  async handleClickSave() {
    console.log(this.pages);
    const data = formatPagesForSave(this.pages);
    console.log("submitting", data);
    const saveResult = await saveApplicationTemplateDetails({
      ...data,
      recordId: this.recordId
    });
    console.log("saveResult", saveResult);
    refreshApex(this.wiredRelatedRecords);
  }

  handleClickCancel() {
    refreshApex(this.wiredRelatedRecords);

    const { data } = this.wiredRelatedRecords;
    console.log(data, "hello");
    if (data) {
      const array = JSON.parse(data);
      if (!array || array.length === 0) {
        return;
      }
      this.pages = formatPages(array);
      this.selectedPage = this.pages[0] ?? null;
    } else {
      this.pages = [];
      this.selectedPage = null;
    }
  }

  handleSort(e) {
    e.stopPropagation();
    const { sortType, sortDirection, id } = e.currentTarget.dataset;
    console.log(sortType, sortDirection, id);
  }

  get newFieldValueName() {
    return this.selectedField?.data?.Name ?? null;
  }
  get newFieldValueDescription() {
    return this.selectedField?.data?.Description__c ?? null;
  }
  get newFieldValueCategory() {
    return this.selectedField?.data?.Category__c ?? null;
  }
  get newFieldValueStdColumnName() {
    return this.selectedField?.data?.StdColumnName__c ?? null;
  }
  get newFieldValueDataType() {
    return this.selectedField?.data?.DataType__c ?? null;
  }
  get newFieldValueOptions() {
    return this.selectedField?.data?.Options__c ?? null;
  }
  get newFieldValueRequired() {
    return this.selectedField?.data?.Required__c ?? null;
  }
  get newFieldValueDefaultValue() {
    return this.selectedField?.data?.Value__c ?? null;
  }

  get selectedPageName() {
    return this.selectedPage?.id ?? null;
  }

  get isPageNameEdited() {
    return true;
  }

  get hasPages() {
    return !!this.pages && this.pages.length > 0;
  }

  get hasAnyDraft() {
    return !!this.pages.find((p) => {
      return (
        p.status === STATUS_DRAFT ||
        !!p.rows.find((r) => r.fields.find((f) => f.status === STATUS_DRAFT))
      );
    });
  }
}
