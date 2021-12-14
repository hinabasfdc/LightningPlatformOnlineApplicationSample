import { api, LightningElement } from "lwc";

export default class PanelCustomColumnItem extends LightningElement {
  @api isViewMode;
  @api item;

  handleChangeValue(e) {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          id: e.target.dataset.id,
          value: e.target.value,
          checked: e.target.checked
        }
      })
    );
  }

  handleClickEditMode() {
    this.dispatchEvent(new CustomEvent("toggleedit"));
  }

  get isText() {
    return (
      this.item.DataType__c === "メール" || this.item.DataType__c === "テキスト"
    );
  }
  get isLongTextArea() {
    return (
      this.item.DataType__c === "ロングテキストエリア" ||
      this.item.DataType__c === "URL"
    );
  }
  get isNumber() {
    return this.item.DataType__c === "数値";
  }
  get isCurrency() {
    return this.item.DataType__c === "通貨";
  }
  get isDate() {
    return this.item.DataType__c === "日付";
  }
  get isTime() {
    return this.item.DataType__c === "時間";
  }
  get isCheckbox() {
    return this.item.DataType__c === "チェックボックス";
  }
  get isPicklist() {
    return this.item.DataType__c === "選択リスト";
  }
}
