import { LightningElement, api } from "lwc";

export default class WebFormAppSelector extends LightningElement {
  @api includeDraftApp;
  @api applications;

  /**
   * @description  : 申請手続きを選択したボタンをクリックした時の処理
   **/
  handleClickAppProcedure(evt) {
    this.dispatchEvent(
      new CustomEvent("changepagenext", {
        detail: {
          data: evt.target.dataset.id
        }
      })
    );
  }
}
