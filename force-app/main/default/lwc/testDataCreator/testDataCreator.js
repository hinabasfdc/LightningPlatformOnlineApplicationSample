import { LightningElement, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import createTestTemplate from "@salesforce/apex/DAF_TestTemplateCreator.createTestTemplate";

export default class TestDataCreator extends LightningElement {
  handleClickCreateTestData() {
    createTestTemplate()
      .then((ret) => {
        this._showToast("成功", ret, "success");
        console.log(ret);
      })
      .catch((err) => {
        this._showToast("エラー", err, "error");
        console.log(err);
      });
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
