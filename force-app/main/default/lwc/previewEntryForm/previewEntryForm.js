import { LightningElement, api, wire } from 'lwc';

import getApplicationTemplate from '@salesforce/apex/DAF_RecordOperationApexController.getApplicationTemplate';
import getApplicationTemplateDetails from '@salesforce/apex/DAF_RecordOperationApexController.getApplicationTemplateDetails';

// 各項目のAPI参照名
import ATD_DATATYPE_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.DataType__c';
import ATD_OPTIONS_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.Options__c';
import ATD_VALUE_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.Value__c';

export default class PreviewEntryForm extends LightningElement {
  @api recordId = 'a021m000003ZtroAAC';

  get fnATD_DATATYPE_FIELD() { return ATD_DATATYPE_FIELD['fieldApiName'] };
  get fnATD_OPTIONS_FIELD() { return ATD_OPTIONS_FIELD['fieldApiName'] };
  get fnATD_VALUE_FIELD() { return ATD_VALUE_FIELD['fieldApiName'] };

  applicationtemplate;
  detailids = [];
  columns;

  /**
  * @description  : 申請定義情報を読み込むための wire
  **/
  @wire(getApplicationTemplate, { recordId: '$recordId' })
  wiredGetApplicationTemplate({ data, error }) {
    if (data) {
      this.applicationtemplate = JSON.parse(data);
    } else if (error) {
      console.log(error);
    }
  }

  /**
  * @description  : 項目定義情報を読み込んで表示
  **/
  handleClickRecordUpdate() {
    const params = {
      recordId: this.recordId
    };
    getApplicationTemplateDetails(params)
      .then((ret) => {
        let customcolumns = JSON.parse(ret);
        for (let i = 0; i < customcolumns.length; i++) {

          // 項目が選択リストだった場合は、選択肢の項目値からコンボボックスの選択肢形式に変換
          if (customcolumns[i][this.fnATD_DATATYPE_FIELD] === '選択リスト') {
            let options = [];
            let arrayOptions = customcolumns[i][this.fnATD_OPTIONS_FIELD].split(',');
            for (let j = 0; j < arrayOptions.length; j++) {
              let option = {
                label: arrayOptions[j],
                value: arrayOptions[j]
              }
              options.push(option);
            }
            customcolumns[i]['PicklistValues'] = options;
          }

          // 格納変数内での位置検索用に配列に ID を代入
          this.detailids.push(customcolumns[i]['Id']);
        }

        this.columns = customcolumns;
      })
      .catch((err) => {
        console.log(err);
      })

  }

  /**
  * @description  : 入力ページで各項目に値を入力した場合の処理
  **/
  handleChangeValue(evt) {
    // 入力された項目の格納変数内での位置を確認。もし見つからなければ終了
    const idx = this.detailids.indexOf(evt.target.dataset.id);
    if (idx < 0) return;

    // 変更フラグを true に設定
    this.ischanged = true;
    // データタイプがチェックボックスだった場合のみ、設定する値の取り方を変更
    let datatype = this.columns[idx][this.fnATD_DATATYPE_FIELD];
    if (datatype === 'チェックボックス') this.columns[idx][this.fnATD_VALUE_FIELD] = evt.target.checked;
    else this.columns[idx][this.fnATD_VALUE_FIELD] = evt.target.value;
  }

}