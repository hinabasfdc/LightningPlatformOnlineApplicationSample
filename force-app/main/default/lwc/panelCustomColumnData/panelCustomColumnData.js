import { LightningElement, api, wire } from 'lwc';
import getApplicationCustomColumns from '@salesforce/apex/DAF_RecordOperationApexController.getApplicationCustomColumns';
import upsertApplicationDetails from '@salesforce/apex/DAF_RecordOperationApexController.upsertApplicationDetails';

//申請定義明細のオブジェクト・各項目のAPI参照名
import OPTIONS_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.Options__c';
import TEXT_FIELD from '@salesforce/schema/objApplicationDetail__c.Text__c';
import LONGTEXTAREA_FIELD from '@salesforce/schema/objApplicationDetail__c.LongTextArea__c';
import NUMBER_FIELD from '@salesforce/schema/objApplicationDetail__c.Number__c';
import DATATYPE_FIELD from '@salesforce/schema/objApplicationDetail__c.DataType__c';

export default class PanelCustomColumnData extends LightningElement {
  @api recordId;

  // レコードの値格納用変数
  recordApplicationDetails;
  recordApplicationDetailIds = [];
  previousRecordApplicationDetails;

  // 表示状態設定用変数
  isModeView = true;
  isModeEdit = false;

  // 各所で項目名を使えるように getter 化
  get fieldnameApplicationTenplateDetailR() { return 'objApplicationTemplateDetail__r' };
  get fieldnameOptions() { return OPTIONS_FIELD['fieldApiName'] };
  get fieldnameText() { return TEXT_FIELD['fieldApiName'] };
  get fieldnameLongTextArea() { return LONGTEXTAREA_FIELD['fieldApiName'] };
  get fieldnameNumber() { return NUMBER_FIELD['fieldApiName'] };
  get fieldnameDataType() { return DATATYPE_FIELD['fieldApiName'] };

  /**
  * @description  : 申請のカスタム項目データを取得する wire
  **/
  @wire(getApplicationCustomColumns, {
    recordId: '$recordId'
  })
  wiredGetApplicationCustomColumns({ data, error }) {
    if (data) {

      let array = JSON.parse(data);
      for (let i = 0; i < array.length; i++) {

        // 各項目ごとに値が変更されたかの状態記録用
        array[i]['isRecordValueChanged'] = false;

        // 画面表示切替え用。デフォルト値設定後にデータ型に応じて true に設定
        array[i]['isText__c'] = false;
        array[i]['isLongTextArea__c'] = false;
        array[i]['isNumber__c'] = false;
        array[i]['isDate__c'] = false;
        array[i]['isTime__c'] = false;
        array[i]['isCurrency__c'] = false;
        array[i]['isCheckbox__c'] = false;
        array[i]['isPickList__c'] = false;

        if (array[i][this.fieldnameDataType] === '数値') array[i]['isNumber__c'] = true;
        else if (array[i][this.fieldnameDataType] === '日付') array[i]['isDate__c'] = true;
        else if (array[i][this.fieldnameDataType] === '時間') array[i]['isTime__c'] = true;
        else if (array[i][this.fieldnameDataType] === 'チェックボックス') array[i]['isCheckbox__c'] = true;
        else if (array[i][this.fieldnameDataType] === '通貨') array[i]['isCurrency__c'] = true;
        else if (array[i][this.fieldnameDataType] === 'ロングテキストエリア') array[i]['isLongTextArea__c'] = true;
        else if (array[i][this.fieldnameDataType] === '選択リスト') array[i]['isPickList__c'] = true;
        else array[i]['isText__c'] = true;

        // チェックボックスの場合の画面表示切替え用
        if (array[i].DataType__c === 'チェックボックス') {
          if (array[i].Text__c === 'true') array[i].isCheckboxChecked = true;
          else array[i].isCheckboxChecked = false;
        }

        // データ型が選択リストの場合は、選択肢を生成
        if (array[i].DataType__c === '選択リスト') {
          let options = []
          //カンマ区切りをオブジェクトの配列に変換
          let arrayOptions = array[i][this.fieldnameApplicationTenplateDetailR][this.fieldnameOptions].split(',');
          for (let j = 0; j < arrayOptions.length; j++) {
            let option = {
              label: arrayOptions[j],
              value: arrayOptions[j]
            }
            options.push(option);
          }
          array[i]['PickListValues'] = options;
        }

        // 値変更時の検索に使用するために Id の配列を生成
        this.recordApplicationDetailIds.push(array[i].Id);
      }

      // 各種追加が完了した配列を共通変数に代入
      this.recordApplicationDetails = array;
    } else if (error) {
      console.log(error);
    }
  }

  /**
  * @description  : 画面上で値が変更された場合に格納用変数に設定
  **/
  handleChangeValue(evt) {
    // 変更が発生している項目のインデックスを特定(万が一無ければ完了)
    const idx = this.recordApplicationDetailIds.indexOf(evt.target.dataset.id);
    if (idx < 0) return;

    // データタイプごとに適した格納項目に値を設定
    const datatype = this.recordApplicationDetails[idx][this.fieldnameDataType];
    if (datatype === 'チェックボックス') {
      this.recordApplicationDetails[idx][this.fieldnameText] = evt.target.checked;
      this.recordApplicationDetails[idx].isCheckboxChecked = evt.target.checked;
    }
    else if (datatype === '数値' || datatype === '通貨') this.recordApplicationDetails[idx][this.fieldnameNumber] = evt.target.value;
    else if (datatype === 'ロングテキストエリア') this.recordApplicationDetails[idx][this.fieldnameLongTextArea] = evt.target.value;
    else this.recordApplicationDetails[idx][this.fieldnameText] = evt.target.value;

    // 変更があったことを記録
    this.recordApplicationDetails[idx]['isRecordValueChanged'] = true;
  }

  /**
  * @description  : 画面表示を編集モードに変更
  **/
  handleClickEditMode(evt) {
    // キャンセルボタンを押した時に元に戻せるように変更前の値を退避
    this.previousRecordApplicationDetails = JSON.stringify(this.recordApplicationDetails);
    // 表示変更
    this.isModeEdit = true;
    this.isModeView = false;
  }

  /**
  * @description  : キャンセルボタンが押されたときの処理
  **/
  handleClickCancel() {
    // 退避させておいた値で上書き
    this.recordApplicationDetails = JSON.parse(this.previousRecordApplicationDetails);
    // 表示変更
    this.isModeEdit = false;
    this.isModeView = true;
  }

  /**
  * @description  : 保存ボタンが押されたときの処理
  **/
  handleClickSave() {
    // 保存用データとして Apex に渡す配列
    let a = [];

    // 変更されたとなっている値を抽出し、保存用データとして格納
    const records = this.recordApplicationDetails;
    for (let i = 0; i < records.length; i++) {
      // 変更なければスキップ
      if (!records[i].isRecordValueChanged) continue;

      // レコード相当のオブジェクトを作成
      let o = {
        Id: records[i]['Id'],
      };
      if (records[i][this.fieldnameNumber]) o[this.fieldnameNumber] = records[i][this.fieldnameNumber];
      else if (records[i][this.fieldnameLongTextArea]) o[this.fieldnameLongTextArea] = records[i][this.fieldnameLongTextArea];
      else o[this.fieldnameText] = records[i][this.fieldnameText];

      // 保存用データの配列に追加
      a.push(o);
    }
    // 何もデータがなければ終了
    if (a.length < 1) return;

    // Apex メソッドに渡す用にパラメータをセット(データは JSON 化)
    const params = {
      customs: JSON.stringify(a)
    };
    upsertApplicationDetails(params)
      .then((ret) => {
        // 変更フラグを元に戻す
        for(let i = 0; i < this.recordApplicationDetails.length; i++){
          this.recordApplicationDetails[i]['isRecordValueChanged'] = false;
        }
        
        // 表示モードを変更
        this.isModeEdit = false;
        this.isModeView = true;
      })
      .catch((err) => {
        console.log(err);
      })
  }

}