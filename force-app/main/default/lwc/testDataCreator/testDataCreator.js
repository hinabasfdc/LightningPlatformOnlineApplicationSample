import { LightningElement } from "lwc";
import { showToast } from "c/webFormUtils";
import createTestTemplate from "@salesforce/apex/DAF_TestTemplateCreator.createTestTemplate";

export default class TestDataCreator extends LightningElement {
  handleClickCreateTestData() {
    createTestTemplate()
      .then((ret) => {
        showToast(this, "成功", ret, "success");
        console.log(ret);
      })
      .catch((err) => {
        showToast(this, "エラー", err, "error");
        console.error(err);
      });
  }
}
