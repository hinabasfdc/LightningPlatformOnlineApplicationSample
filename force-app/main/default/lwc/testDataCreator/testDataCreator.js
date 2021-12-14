import { LightningElement } from "lwc";
import { showToast } from "c/webFormUtils";
import createTestTemplate from "@salesforce/apex/DAF_TestTemplateCreator.createTestTemplate";

export default class TestDataCreator extends LightningElement {
  async handleClickCreateTestData() {
    try {
      const message = await createTestTemplate();
      showToast(this, "成功", message, "success");
      console.log(message);
    } catch (err) {
      showToast(this, "エラー", err.body.message, "error");
      console.error(err);
    }
  }
}
