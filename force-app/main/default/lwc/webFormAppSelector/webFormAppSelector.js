import { LightningElement, api, wire } from "lwc";
import { showToast } from "c/webFormUtils";

import getActiveApplications from "@salesforce/apex/DAF_RecordOperationApexController.getActiveApplications";

export default class WebFormAppSelector extends LightningElement {
  @api includeDraftApp = false;
  applications = [];

  /**
   * @description  : 選択できる申請手続きを取得
   **/
  @wire(getActiveApplications, { includeDraftApp: "$includeDraftApp" })
  wiredActiveApplications({ data, error }) {
    if (data) {
      console.log(data);

      this.applications = data
        .reduce((apps, a) => {
          const o = {
            Id: a.Id,
            label: a.Name,
            description: a.Description__c
          };
          const c = apps.find((app) => app.category === a.Category__c);
          if (c) {
            c.apps.push(o);
          } else {
            apps.push({
              category: a.Category__c,
              apps: [o]
            });
          }
          return apps;
        }, [])
        .map((a) => {
          a.label = `${a.category}(${a.apps.length})`;
          return a;
        });
    } else if (error) {
      console.log(error);
      showToast(this,"wiredActiveApplications", error, "error");
    }
  }

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
