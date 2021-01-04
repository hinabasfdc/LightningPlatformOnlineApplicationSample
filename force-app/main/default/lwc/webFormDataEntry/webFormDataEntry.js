import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getApplicationTemplateDetailsJson from '@salesforce/apex/DAF_RecordOperationApexController.getApplicationTemplateDetailsJson';

// 名前空間、オブジェクト・項目の API 参照名を定義
const nsPrefix = 'jpseps__';
const onAPPLICATION_OBJECT = nsPrefix + 'objApplication__c';
const fnATD_DATATYPE_FIELD = nsPrefix + 'DataType__c';
const fnATD_OPTIONS_FIELD = nsPrefix + 'Options__c';
const fnATD_VALUE_FIELD = nsPrefix + 'Value__c';
const fnATD_TEXT_FIELD = nsPrefix + 'Text__c';

export default class WebFormDataEntry extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = true;

  @api recordId;
  @api inputData;
  @api createdApplicationRecordId;
  columns; // 項目定義および入力データを格納するコンポーネントの変数
  objectApiName = onAPPLICATION_OBJECT;
  detailIds = []; // columns での Index 取得用配列
  isChanged = false; // 変更の有無

  /**
  * @description : 初期化処理。データが渡された場合はそれを元に入力項目を構成、そうでない場合は申請定義明細を元に構成
  */
  connectedCallback() {

    // inputData が空だったら実行
    if (!this.inputData) {
      const params = {
        recordId: this.recordId
      }
      getApplicationTemplateDetailsJson(params)
        .then((ret) => {
          let localColumns = JSON.parse(ret);
          for (let i = 0; i < localColumns.length; i++) {

            // チェックボックスの場合の画面表示切替え用
            if (localColumns[i][fnATD_DATATYPE_FIELD] === 'チェックボックス') {
              if (localColumns[i][fnATD_TEXT_FIELD] === 'true') localColumns[i]['isCheckboxChecked'] = true;
              else localColumns[i]['isCheckboxChecked'] = false;
            }

            // 項目が選択リストだった場合は、選択肢の項目値からコンボボックスの選択肢形式に変換
            if (localColumns[i][fnATD_DATATYPE_FIELD] === '選択リスト') {
              let options = [];
              let arrayOptions = localColumns[i][fnATD_OPTIONS_FIELD].split(',');
              for (let j = 0; j < arrayOptions.length; j++) {
                let option = {
                  label: arrayOptions[j],
                  value: arrayOptions[j]
                }
                options.push(option);
              }
              localColumns[i]['PicklistValues'] = options;
            }

            // 格納変数内での位置検索用に配列に ID を代入
            this.detailIds.push(localColumns[i].Id);
          }
          this.columns = [...localColumns];
          console.log(this.columns);
        })
        .catch((err) => {
          console.log(err);
        })
    } else {
      // inputData に値が入っている(次ページから戻ってきた)場合には渡された値を代入
      this.columns = JSON.parse(this.inputData);
      // 検索用配列を生成
      for (let i = 0; i < this.columns.length; i++) this.detailIds.push(this.columns[i]['Id']);
    }
  }

  /**
  * @description  : 入力ページで各項目に値を入力した場合の処理
  **/
  handleChangeValue(evt) {
    // 入力された項目の格納変数内での位置を確認。もし見つからなければ終了
    const idx = this.detailIds.indexOf(evt.target.dataset.id);
    if (idx < 0) return;

    // 変更フラグを true に設定
    this.isChanged = true;

    // データタイプがチェックボックスだった場合のみ、設定する値の取り方を変更
    let datatype = this.columns[idx][fnATD_DATATYPE_FIELD];
    if (datatype === 'チェックボックス'){
      this.columns[idx][fnATD_VALUE_FIELD] = evt.target.checked;
      this.columns[idx]['isCheckboxChecked'] = evt.target.checked;
    } else {
      this.columns[idx][fnATD_VALUE_FIELD] = evt.target.value; // チェックボックス以外は値をそのまま代入
    } 
  }

  /**
  * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
  */
  handleClickPagePrevious() {
    this.dispatchEvent(new CustomEvent("changepageprevious", {
      detail: {
        currentpage: 'dataentry',
      }
    }))
  }

  /**
  * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
  */
  handleClickPageNext() {
    this.dispatchEvent(new CustomEvent("changepagenext", {
      detail: {
        currentpage: 'dataentry',
        inputData: JSON.stringify(this.columns),
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