import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getActiveApplications from '@salesforce/apex/DAF_RecordOperationApexController.getActiveApplications';

export default class WebFormAppSelector extends LightningElement {
  @api includeDraftApp = false;
  applications = [];

  /**
  * @description  : 選択できる申請手続きを取得
  **/
  @wire(getActiveApplications, { includeDraftApp: '$includeDraftApp' })
  wiredActiveApplications({ data, error }) {
    if (data) {
      console.log(data);
      let localCategories = [];
      let localApplications = [];
      for (let i = 0; i < data.length; i++) {
        const o = {
          Id: data[i]['Id'],
          label: data[i]['Name'],
          description: data[i]['Description__c']
        }

        const categoryIdx = localCategories.indexOf(data[i].Category__c);
        if (categoryIdx >= 0) {
          localApplications[categoryIdx]['apps'].push(o);
          localApplications[categoryIdx]['numofapps']++;
          localApplications[categoryIdx]['label'] = localApplications[categoryIdx]['category'] + '(' + localApplications[categoryIdx]['numofapps'] + ')';
        } else {
          localCategories.push(data[i].Category__c);
          const c = {
            category: data[i].Category__c,
            numofapps: 1,
            label: data[i].Category__c + '(' + 1 + ')',
            apps: []
          }
          c['apps'].push(o);
          localApplications.push(c);
        }
      }

      this.applications = [...localApplications];
    } else if (error) {
      console.log(error);
      this._showToast('wiredActiveApplications', error, 'error');
    }
  }

  /**
  * @description  : 申請手続きを選択したボタンをクリックした時の処理
  **/
  handleClickAppProcedure(evt) {
    this.dispatchEvent(new CustomEvent("changepagenext", {
      detail: {
        currentpage: 'selector',
        selectedappid: evt.target.dataset.id
      }
    }))
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