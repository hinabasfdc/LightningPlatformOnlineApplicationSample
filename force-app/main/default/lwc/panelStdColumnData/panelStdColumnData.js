import { LightningElement, api, wire } from "lwc";

import getApplicationStdColumns from "@salesforce/apex/DAF_RecordOperationApexController.getApplicationStdColumns";

export default class DisplayEntryDataByApp extends LightningElement {
  @api recordId;
  @api objectApiName;
  stdColumnNames;

  /**
   * @description  : 定義された標準項目の一覧を取得する wire
   **/
  @wire(getApplicationStdColumns, {
    recordId: "$recordId"
  })
  wiredGetApplicationStdColumns({ data, error }) {
    if (data && data.length > 0) {
      this.stdColumnNames = data;
    } else if (error) {
      console.error(error);
    }
  }
}
