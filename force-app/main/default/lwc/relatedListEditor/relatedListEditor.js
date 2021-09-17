import { LightningElement, api, wire, track } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import {
  formatPages,
  formatPagesForSave,
  addNewPage,
  addNewRow,
  addNewColumn,
  STATUS_DRAFT,
  findAnyDraft,
  sortOrder
} from "./utils";
import { showToast } from "c/webFormUtils";
import getApplicationTemplateDetailRecords from "@salesforce/apex/DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecords";
import saveApplicationTemplateDetails from "@salesforce/apex/DAF_RelatedListEditorApexController.saveApplicationTemplateDetails";
import deletePage from "@salesforce/apex/DAF_RelatedListEditorApexController.deletePage";
import deleteRow from "@salesforce/apex/DAF_RelatedListEditorApexController.deletePage";
import deleteColumn from "@salesforce/apex/DAF_RelatedListEditorApexController.deleteColumn";
import APPLICATION_OBJECT from "@salesforce/schema/objApplication__c";

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
import APPLICATIONTEMPLATE_FIELD from "@salesforce/schema/objApplicationTemplateDetail__c.objApplicationTemplate__c";

const PAGE_DELETE_CONFIRM =
  "ページと項目を削除します。よろしいですか？\nこの操作は取り消せません。";
const ROW_DELETE_CONFIRM = "行を削除します。\nよろしいですか？";
const ROW_DELETE_CONFIRM_WITH_PAGE =
  "ページと行を削除します。\nよろしいですか？";

export default class RelatedListEditor extends LightningElement {
  @api recordId;
  @track pages = [];
  @track selectedPage = null;
  @track selectedRow = null;
  @track selectedColumn = null;

  sobjApplicationFields = null;

  // refreshApex で利用するための wire データ格納用変数
  wiredDetailRecords;

  // fields
  objectApiNameApplicationTemplateDetail = APPLICAATIONTEMPLATEDETAIL_OBJECT;
  fieldnameName = NAME_FIELD.fieldApiName;
  fieldnameDescription = DESCRIPTION_FIELD.fieldApiName;
  fieldnameCategory = CATEGORY_FIELD.fieldApiName;
  fieldnameStdColumnName = STDCOLUMNNAME_FIELD.fieldApiName;
  fieldnameDataType = DATATYPE_FIELD.fieldApiName;
  fieldnameRequired = REQUIRED_FIELD.fieldApiName;
  fieldnameOptions = OPTIONS_FIELD.fieldApiName;
  fieldnameValue = VALUE_FIELD.fieldApiName;
  fieldnameApplicationTemplate = APPLICATIONTEMPLATE_FIELD.fieldApiName;

  /**
   * @description  : メニュー項目表示用に定義済み項目明細を取得する wire
   **/
  @wire(getApplicationTemplateDetailRecords, {
    recordId: "$recordId"
  })
  wiredGetApplicationTemplateDetailRecords(value) {
    this.wiredDetailRecords = value;
    const { data, error } = value;
    if (data && data.length > 0) {
      const pages = formatPages(data);
      if (!pages || pages.length === 0) {
        console.log("No detail records found");
        return;
      }
      this.pages = pages;
      this.selectedPage = this.pages[0] ?? null;
      this.selectedRow = this.selectedPage?.rows[0] ?? null;
      this.selectedColumn = this.selectedRow?.columns[0] ?? null;
      console.log(this.selectedPage, this.selectedRow, this.selectedColumn);
    } else if (error) {
      console.error(error);
    }
  }

  @wire(getObjectInfo, { objectApiName: APPLICATION_OBJECT })
  sobjAppData({ data, error }) {
    if (data) {
      this.sobjApplicationFields = Object.values(data);
    } else if (error) {
      console.error(error);
    }
  }

  /**
   * @description  : メニューの項目名がクリックされた場合の処理
   **/
  handleSelectPage(e) {
    if (!e.detail.name) {
      return;
    }
    const pageOrder = parseInt(e.detail.name, 10);
    if (this.selectedPage?.order === pageOrder) {
      return;
    }
    const page = this.pages?.find((p) => p.order === pageOrder);
    if (!page) {
      return;
    }
    this.selectedPage = page;
    this.selectedRow = page.rows.length > 0 ? page.rows[0] : null;
    if (!this.selectedRow) {
      return;
    }
    this.selectedColumn =
      this.selectedRow.columns.length > 0 ? this.selectedRow.columns[0] : 0;
  }

  /**
   * @description  : ページを削除
   **/
  handleClickDeletePage = async () => {
    if (!this.selectedPage) {
      return;
    }

    if (!window.confirm(PAGE_DELETE_CONFIRM)) {
      return;
    }

    // レコードに存在するなら最初に削除
    if (this.selectedPage.id) {
      const isSuccess = await deletePage({
        pageId: this.selectedPage.id
      });
      if (!isSuccess) {
        showToast(this, "失敗", "ページの削除に失敗しました", "error");
        return;
      }
    }
    this.pages = this.pages.filter((p) => p.order !== this.selectedPage.order);
    this.selectedPage = this.pages.length > 0 ? this.pages[0] : null;
    this.selectedRow = this.selectedPage ? this.selectedPage.rows[0] : null;
    this.selectedColumn = this.selectedRow ? this.selectedRow.columns[0] : null;
    showToast(this, "成功", "ページと項目を削除しました", "success");
    // その他の修正が未確定なので、refreshは行わない。
  };

  handleClickDeleteRow = async (e) => {
    const rowOrder = parseInt(e.currentTarget.dataset.rowOrder, 10);
    if (!this.selectedPage || !this.selectedRow || !rowOrder) {
      return;
    }
    const targetRow = this.selectedPage.rows.find((r) => r.order === rowOrder);
    if (!targetRow) {
      return;
    }

    // レコードとして存在すれば、削除する
    // 行のないページは存在させないので、一緒に消す。
    const shouldDeletePage = this.selectedPage.rows.length === 1;
    if (
      !window.confirm(
        shouldDeletePage ? ROW_DELETE_CONFIRM_WITH_PAGE : ROW_DELETE_CONFIRM
      )
    ) {
      return;
    }

    if (targetRow.id) {
      const isSuccess = await deleteRow({
        rowId: targetRow.id,
        shouldDeletePage
      });
      if (!isSuccess) {
        showToast(this, "失敗", "行の削除に失敗しました", "error");
        return;
      }
    }

    if (shouldDeletePage) {
      this.pages = this.pages.filter(
        (p) => p.order !== this.selectedPage.order
      );
      this.selectedPage = this.pages.length > 0 ? this.pages[0] : null;
    } else {
      // 行を削除する。
      this.pages = this.pages.map((p) => {
        if (p.order !== this.selectedPage.order) {
          return p;
        }
        p.rows = p.rows.filter((r) => r.order !== targetRow.order);
        return p;
      });
    }

    // 現在選択中の行の場合、別の行を選択する。
    if (this.selectedRow.order === targetRow.order) {
      this.selectedRow = this.selectedPage?.rows[0] ?? null;
      this.selectedColumn = this.selectedRow
        ? this.selectedRow.columns[0]
        : null;
    }

    showToast(
      this,
      "成功",
      shouldDeletePage ? "ページと行を削除しました" : "行を削除しました",
      "success"
    );
  };

  /**
   * @description  : 定義項目削除ボタンが押された時の処理
   **/
  handleClickDeleteColumn = async (e) => {
    const colOrder = parseInt(e.currentTarget.dataset.columnOrder, 10);
    if (
      !this.selectedPage ||
      !this.selectedRow ||
      !this.selectedColumn ||
      !colOrder
    ) {
      return;
    }
    const targetCol = this.selectedRow.columns.find(
      (c) => c.ColumnOrder__c === colOrder
    );
    if (!targetCol) {
      return;
    }

    // レコードとして存在すれば、削除する
    // 項目のない行、行のないページは存在させないので、一緒に消す。
    const shouldDeletePage = this.selectedPage.rows.length === 1;
    const shouldDeleteRow = this.selectedRow.columns.length === 1;

    // アラートで確認し、キャンセルであれば処理終了
    const targets = ["項目"];
    if (shouldDeleteRow) targets.unshift("行");
    if (shouldDeletePage) targets.unshift("ページ");
    if (
      !window.confirm(`${targets.join("・")}を削除します。よろしいですか？`)
    ) {
      return;
    }

    if (targetCol.Id) {
      // call apex, delete record
      const isSuccess = await deleteColumn({
        columnId: targetCol.Id,
        shouldDeleteRow,
        shouldDeletePage
      });
      if (!isSuccess) {
        showToast(this, "失敗", "項目の削除に失敗しました", "error");
        return;
      }
    }

    if (shouldDeletePage) {
      this.pages = this.pages.filter(
        (p) => p.order !== this.selectedPage.order
      );
      this.selectedPage = this.pages.length > 0 ? this.pages[0] : null;
    } else if (shouldDeleteRow) {
      // 行を削除する。
      this.pages = this.pages.map((p) => {
        if (p.order !== this.selectedPage.order) {
          return p;
        }
        p.rows = p.rows.filter((r) => r.order !== this.selectedRow.order);
        return p;
      });
      this.selectedRow =
        this.selectedPage.rows.length > 0 ? this.selectedPage.rows[0] : null;
    } else {
      // 項目を削除する
      this.pages = this.pages.map((p) => {
        if (p.order !== this.selectedPage.order) {
          return p;
        }
        p.rows = p.rows.map((r) => {
          if (r.order !== this.selectedRow.order) {
            return r;
          }
          r.columns = r.columns.filter(
            (c) => c.ColumnOrder__c !== targetCol.ColumnOrder__c
          );
          return r;
        });
        return p;
      });
    }

    // 現在選択中の行の場合、別の行を選択する。
    if (this.selectedColumn.ColumnOrder__c === targetCol.ColumnOrder__c) {
      this.selectedColumn = this.selectedRow?.columns[0] ?? null;
    }

    showToast(this, "成功", `${targets.join("・")}を削除しました`, "success");
  };

  /**** 新規ページ・行・項目の追加 *****/
  /**
   * @description  : ページ追加
   **/
  handleClickNewPage() {
    this.pages = addNewPage(this.pages);
    this.selectedPage = this.pages[this.pages.length - 1];
    this.handleClickNewRow();
  }

  /**
   * @description  : 行を追加
   **/
  handleClickNewRow() {
    this.selectedPage.rows = addNewRow(this.selectedPage.rows);
    this.selectedRow =
      this.selectedPage.rows[this.selectedPage.rows.length - 1];
    this.openRowAccordion(this.selectedRow.order);
    this.handleClickNewColumn();
  }

  /**
   * @description  : 項目をUIから追加
   **/
  handleClickNewColumnToRow(e) {
    const rowOrder = parseInt(e.currentTarget.dataset.rowOrder, 10);
    this.selectedRow = this.selectedPage.rows.find((r) => r.order === rowOrder);
    this.openRowAccordion(this.selectedRow.order);
    this.handleClickNewColumn();
  }

  /**
   * @description  : 項目を追加
   **/
  handleClickNewColumn() {
    this.selectedRow.columns = addNewColumn(this.selectedRow.columns);
    this.selectedColumn =
      this.selectedRow.columns[this.selectedRow.columns.length - 1];
    this.openColumnAccordion(
      this.selectedRow.order,
      this.selectedColumn.ColumnOrder__c
    );
  }

  /**
   * @description  : 行のアコーディオンを開ける
   **/
  openRowAccordion(order) {
    const accordion = this.template.querySelector(`.row-accordion`);
    this.openAccordion(accordion, order);
  }
  /**
   * @description  : 項目のアコーディオンを開ける
   **/
  openColumnAccordion(rowOrder, colOrder) {
    const accordion = this.template.querySelector(
      `.column-accordion[data-row-order="${rowOrder}"]`
    );
    this.openAccordion(accordion, colOrder);
  }

  /**
   * @description  : アコーディオンを開ける
   * アコーディオンに新しい要素を追加してすぐに選択ができなかったため、ワークアラウンド
   * renderCallbackも試したが機能しなかったためsetTimeoutで対応。
   **/
  openAccordion(accordion, order) {
    if (!accordion) {
      return;
    }
    setTimeout(() => {
      accordion.activeSectionName = order;
    }, 100);
  }

  /**
   * @description  : 行のアコーディオンセクションが選択された時
   **/
  handleToggleRow(e) {
    const selectedRowOrder = parseInt(e.detail.openSections, 10);
    this.selectedRow = this.selectedPage.rows.find(
      (r) => r.order === selectedRowOrder
    );
    this.selectedColumn = this.selectedRow.columns[0] ?? null;
  }

  /**
   * @description  : 項目のアコーディオンセクションが選択された時
   **/
  handleToggleColumn(e) {
    const selectedColOrder = parseInt(e.detail.openSections, 10);
    this.selectedColumn = this.selectedRow.columns.find(
      (c) => c.ColumnOrder__c === selectedColOrder
    );
  }

  /**
   * @description  : 項目の入力内容が変更された時
   **/
  handleColumnInputChange(e) {
    const field = e.currentTarget?.dataset?.fieldName;
    const { value, checked } = e.detail;
    if (!field || (!value && !checked)) {
      return;
    }
    const v = field === this.fieldnameRequired ? checked : value;
    const valueChanged = this.selectedColumn[field] !== v;
    this.selectedColumn[field] = v;
    if (valueChanged) {
      this.selectedColumn.status = STATUS_DRAFT;
    }
  }

  /**
   * @description  : 選択されたページ名が変更された時
   **/
  handlePageNameChange(e) {
    if (this.selectedPage.name !== e.detail.value) {
      this.selectedPage.status = STATUS_DRAFT;
    }
    this.selectedPage.name = e.detail.value;
  }

  /**
   * @description  : 定義全体の変更を保存
   **/
  async handleClickSave() {
    const data = formatPagesForSave(this.pages);
    console.log("saving...", data);
    const saveResult = await saveApplicationTemplateDetails({
      ...data,
      recordId: this.recordId
    });
    console.log(saveResult);
    showToast(this, "成功", "申請定義の更新に成功しました", "success");
    refreshApex(this.wiredDetailRecords);
  }

  /**
   * @description  : 定義全体の変更をキャンセル・リセット
   **/
  handleClickCancel() {
    refreshApex(this.wiredDetailRecords);

    const { data } = this.wiredDetailRecords;
    if (data && data.length > 0) {
      this.pages = formatPages(data);
      this.selectedPage = this.pages[0] ?? null;
    } else {
      this.pages = [];
      this.selectedPage = null;
    }
  }

  /**
   * @description  : 順番を変更
   **/
  handleSort(e) {
    e.stopPropagation();
    const {
      sortType,
      sortDirection,
      order: orderStr
    } = e.currentTarget.dataset;
    const order = parseInt(orderStr, 10);

    const targetArray =
      sortType === "column"
        ? this.selectedRow.columns
        : sortType === "row"
        ? this.selectedPage.rows
        : this.pages;
    const orderKey = sortType === "column" ? "ColumnOrder__c" : "order";

    sortOrder(sortDirection, order, targetArray, orderKey);
  }

  get activeRowName() {
    return this.selectedRow?.order;
  }
  get activeColumnName() {
    return this.selectedColumn?.ColumnOrder__c;
  }

  // 新規作成時の項目表示制御関連
  get isStandardColumn() {
    return this.selectedColumn?.Category__c === "標準";
  }
  get isCustomColumn() {
    return this.selectedColumn?.Category__c === "カスタム";
  }

  get isCustomColumnPicklist() {
    return this.selectedColumn?.DataType__c === "選択リスト";
  }

  //
  get newFieldValueName() {
    return this.selectedColumn?.Name ?? null;
  }
  get newFieldValueDescription() {
    return this.selectedColumn?.Description__c ?? null;
  }
  get newFieldValueCategory() {
    return this.selectedColumn?.Category__c ?? null;
  }
  get newFieldValueStdColumnName() {
    return this.selectedColumn?.StdColumnName__c ?? null;
  }
  get newFieldValueDataType() {
    return this.selectedColumn?.DataType__c ?? null;
  }
  get newFieldValueOptions() {
    return this.selectedColumn?.Options__c ?? null;
  }
  get newFieldValueRequired() {
    return this.selectedColumn?.Required__c ?? null;
  }
  get newFieldValueDefaultValue() {
    return this.selectedColumn?.Value__c ?? null;
  }

  get selectedPageOrder() {
    return this.selectedPage?.order ?? 0;
  }

  get isPageNameEdited() {
    return true;
  }

  get hasPages() {
    return !!this.pages && this.pages.length > 0;
  }

  get hasAnyDraft() {
    return findAnyDraft(this.pages);
  }
}
