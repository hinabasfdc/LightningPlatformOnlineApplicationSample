import { LightningElement, api, wire } from 'lwc';
import getApplicationCustomColumns from '@salesforce/apex/DAF_RecordOperationApexController.getApplicationCustomColumns';
import upsertApplicationDetails from '@salesforce/apex/DAF_RecordOperationApexController.upsertApplicationDetails';

const nsPrefix = '';

//申請定義明細のオブジェクト・各項目のAPI参照名
const fnATD_OPTIONS_FIELD = nsPrefix + 'Options__c';
const fnATD_DATATYPE_FIELD = nsPrefix + 'DataType__c';
const fnAD_TEXT_FIELD = nsPrefix + 'Text__c';
const fnAD_LONGTEXTAREA_FIELD = nsPrefix + 'LongTextArea__c';
const fnAD_NUMBER_FIELD = nsPrefix + 'Number__c';

const fnATD_Relation = nsPrefix + 'objApplicationTemplateDetail__r';

const fnATD_ISTEXT_FIELD = nsPrefix + 'isText__c';
const fnATD_ISLONGTEXTAREA_FIELD = nsPrefix + 'isLongTextArea__c';
const fnATD_ISNUMBER_FIELD = nsPrefix + 'isNumber__c';
const fnATD_ISMAIL_FIELD = nsPrefix + 'isMail__c';
const fnATD_ISURL_FIELD = nsPrefix + 'isURL__c';
const fnATD_ISDATE_FIELD = nsPrefix + 'isDate__c';
const fnATD_ISTIME_FIELD = nsPrefix + 'isTime__c';
const fnATD_ISCURRENCY_FIELD = nsPrefix + 'isCurrency__c';
const fnATD_ISCHECKBOX_FIELD = nsPrefix + 'isCheckbox__c';
const fnATD_ISPICKLIST_FIELD = nsPrefix + 'isPicklist__c';

export default class PanelCustomColumnData extends LightningElement {
  @api recordId = 'a030l000008LGIzAAO';

  // レコードの値格納用変数
  recordApplicationDetails;
  recordApplicationDetailIds = [];
  previousRecordApplicationDetails;

  // 表示状態設定用変数
  isModeView = true;
  isModeEdit = false;

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
        array[i][fnATD_ISTEXT_FIELD] = false;
        array[i][fnATD_ISLONGTEXTAREA_FIELD] = false;
        array[i][fnATD_ISNUMBER_FIELD] = false;
        array[i][fnATD_ISDATE_FIELD] = false;
        array[i][fnATD_ISTIME_FIELD] = false;
        array[i][fnATD_ISCURRENCY_FIELD] = false;
        array[i][fnATD_ISCHECKBOX_FIELD] = false;
        array[i][fnATD_ISPICKLIST_FIELD] = false;

        if (array[i][fnATD_DATATYPE_FIELD] === '数値') array[i][fnATD_ISNUMBER_FIELD] = true;
        else if (array[i][fnATD_DATATYPE_FIELD] === '日付') array[i][fnATD_ISDATE_FIELD] = true;
        else if (array[i][fnATD_DATATYPE_FIELD] === '時間') array[i][fnATD_ISTIME_FIELD] = true;
        else if (array[i][fnATD_DATATYPE_FIELD] === 'チェックボックス') array[i][fnATD_ISCHECKBOX_FIELD] = true;
        else if (array[i][fnATD_DATATYPE_FIELD] === '通貨') array[i][fnATD_ISCURRENCY_FIELD] = true;
        else if (array[i][fnATD_DATATYPE_FIELD] === 'ロングテキストエリア') array[i][fnATD_ISLONGTEXTAREA_FIELD] = true;
        else if (array[i][fnATD_DATATYPE_FIELD] === 'URL') array[i][fnATD_ISLONGTEXTAREA_FIELD] = true;
        else if (array[i][fnATD_DATATYPE_FIELD] === 'メール') array[i][fnATD_ISTEXT_FIELD] = true;
        else if (array[i][fnATD_DATATYPE_FIELD] === '選択リスト') array[i][fnATD_ISPICKLIST_FIELD] = true;
        else array[i][fnATD_ISTEXT_FIELD] = true;

        // チェックボックスの場合の画面表示切替え用
        if (array[i][fnATD_DATATYPE_FIELD] === 'チェックボックス') {
          if (array[i][fnAD_TEXT_FIELD] === 'true') array[i].isCheckboxChecked = true;
          else array[i].isCheckboxChecked = false;
        }

        // データ型が選択リストの場合は、選択肢を生成
        if (array[i][fnATD_DATATYPE_FIELD] === '選択リスト') {
          let options = []
          //カンマ区切りをオブジェクトの配列に変換
          let arrayOptions = array[i][fnATD_Relation][fnATD_OPTIONS_FIELD].split(',');
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
        this.recordApplicationDetailIds.push(array[i]['Id']);
      }

      // 各種追加が完了した配列を共通変数に代入
      this.recordApplicationDetails = [...array];
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
    const datatype = this.recordApplicationDetails[idx][fnATD_DATATYPE_FIELD];
    if (datatype === 'チェックボックス') {
      this.recordApplicationDetails[idx][fnAD_TEXT_FIELD] = evt.target.checked;
      this.recordApplicationDetails[idx].isCheckboxChecked = evt.target.checked;
    }
    else if (datatype === '数値' || datatype === '通貨') this.recordApplicationDetails[idx][fnATD_ISNUMBER_FIELD] = evt.target.value;
    else if (datatype === 'ロングテキストエリア') this.recordApplicationDetails[idx][fnAD_LONGTEXTAREA_FIELD] = evt.target.value;
    else this.recordApplicationDetails[idx][fnAD_TEXT_FIELD] = evt.target.value;

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
      if (records[i][fnATD_ISNUMBER_FIELD]) o[fnATD_ISNUMBER_FIELD] = records[i][fnATD_ISNUMBER_FIELD];
      else if (records[i][fnAD_LONGTEXTAREA_FIELD]) o[fnAD_LONGTEXTAREA_FIELD] = records[i][fnAD_LONGTEXTAREA_FIELD];
      else o[fnAD_TEXT_FIELD] = records[i][fnAD_TEXT_FIELD];

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