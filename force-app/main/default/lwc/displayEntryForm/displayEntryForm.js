import { LightningElement, track } from 'lwc';

// 使用する Apex メソッドのインポート
import getActiveApplications from '@salesforce/apex/DAF_RecordOperationApexController.getActiveApplications';
import getApplicationTemplate from '@salesforce/apex/DAF_RecordOperationApexController.getApplicationTemplate';
import getApplicationTemplateDetails from '@salesforce/apex/DAF_RecordOperationApexController.getApplicationTemplateDetails';
import upsertApplication from '@salesforce/apex/DAF_RecordOperationApexController.upsertApplication';
import upsertApplicationDetails from '@salesforce/apex/DAF_RecordOperationApexController.upsertApplicationDetails';
import updatePhaseToSubmitted from '@salesforce/apex/DAF_RecordOperationApexController.updatePhaseToSubmitted';

// 各項目のAPI参照名
import ATD_DATATYPE_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.DataType__c';
import ATD_OPTIONS_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.Options__c';
import ATD_VALUE_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.Value__c';
import ATD_CATEGORY_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.Category__c';
import ATD_STDCOLUMNNAME_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.StdColumnName__c';
import ATD_ISTEXT_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isText__c';
import ATD_ISLONGTEXTAREA_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isLongTextArea__c';
import ATD_ISNUMBER_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isNumber__c';
import ATD_ISMAIL_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isMail__c';
import ATD_ISURL_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isURL__c';
import ATD_ISDATE_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isDate__c';
import ATD_ISTIME_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isTime__c';
import ATD_ISCURRENCY_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isCurrency__c';
import ATD_ISCHECKBOX_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isCheckbox__c';
import ATD_ISPICKLIST_FIELD from '@salesforce/schema/objApplicationTemplateDetail__c.isPicklist__c';

import AD_APP_FIELD from '@salesforce/schema/objApplicationDetail__c.objApplication__c';
import AD_APPTEMPDET_FIELD from '@salesforce/schema/objApplicationDetail__c.objApplicationTemplateDetail__c';
import AD_TEXT_FIELD from '@salesforce/schema/objApplicationDetail__c.Text__c';
import AD_LONGTEXTAREA_FIELD from '@salesforce/schema/objApplicationDetail__c.LongTextArea__c';
import AD_NUMBER_FIELD from '@salesforce/schema/objApplicationDetail__c.Number__c';

import A_APPTEMP_FIELD from '@salesforce/schema/objApplication__c.objApplicationTemplate__c';

export default class DisplayEntryForm extends LightningElement {

  get fnATD_DATATYPE_FIELD() { return ATD_DATATYPE_FIELD['fieldApiName'] };
  get fnATD_OPTIONS_FIELD() { return ATD_OPTIONS_FIELD['fieldApiName'] };
  get fnATD_VALUE_FIELD() { return ATD_VALUE_FIELD['fieldApiName'] };
  get fnATD_CATEGORY_FIELD() { return ATD_CATEGORY_FIELD['fieldApiName'] };
  get fnATD_STDCOLUMNNAME_FIELD() { return ATD_STDCOLUMNNAME_FIELD['fieldApiName'] };
  get fnATD_ISTEXT_FIELD() { return ATD_ISTEXT_FIELD['fieldApiName'] };
  get fnATD_ISLONGTEXTAREA_FIELD() { return ATD_ISLONGTEXTAREA_FIELD['fieldApiName'] };
  get fnATD_ISNUMBER_FIELD() { return ATD_ISNUMBER_FIELD['fieldApiName'] };
  get fnATD_ISMAIL_FIELD() { return ATD_ISMAIL_FIELD['fieldApiName'] };
  get fnATD_ISURL_FIELD() { return ATD_ISURL_FIELD['fieldApiName'] };
  get fnATD_ISDATE_FIELD() { return ATD_ISDATE_FIELD['fieldApiName'] };
  get fnATD_ISTIME_FIELD() { return ATD_ISTIME_FIELD['fieldApiName'] };
  get fnATD_ISCURRENCY_FIELD() { return ATD_ISCURRENCY_FIELD['fieldApiName'] };
  get fnATD_ISCHECKBOX_FIELD() { return ATD_ISCHECKBOX_FIELD['fieldApiName'] };
  get fnATD_ISPICKLIST_FIELD() { return ATD_ISPICKLIST_FIELD['fieldApiName'] };

  get fnAD_TEXT_FIELD() { return AD_TEXT_FIELD['fieldApiName'] };
  get fnAD_LONGTEXTAREA_FIELD() { return AD_LONGTEXTAREA_FIELD['fieldApiName'] };
  get fnAD_NUMBER_FIELD() { return AD_NUMBER_FIELD['fieldApiName'] };
  get fnAD_APP_FIELD() { return AD_APP_FIELD['fieldApiName'] };
  get fnAD_APPTEMPDET_FIELD() { return AD_APPTEMPDET_FIELD['fieldApiName'] };

  get fnA_APPTEMP_FIELD() { return A_APPTEMP_FIELD['fieldApiName'] };

  // 矢羽用変数
  steps = ['手続き選択', '概要・条件の確認', '入力', 'ファイル添付', '内容確認', '完了']
  activesteps = []
  currentstep = '手続き選択';

  // 手続き選択ページ用変数
  activeapplications;
  isApplicationSelected = false;
  isSelectionPageNextDisabled = true;
  selectedAppTempRecordId = '';

  // 概要・条件確認ページ用変数
  applicationtemplate;
  isApplicationTemplateLoaded = false;
  isStartPageNextDisabled = true;

  // 入力ページ用変数
  columns;
  detailids = [];
  isApplicationTemplateDetailsLoaded = false;
  ischanged = false;
  createdApplicationRecordId = '';
  isUpsertDisabled = false;

  // ファイル添付ページ用変数
  attachedfiles;

  // 確認ページ用変数
  isConfirmationPageNextDisabled = true;

  // 完了ページ用変数
  mgmtCode;

  // 現在地の設定用変数
  @track phase = {
    isSelectionPage: false,
    isStartPage: false,
    isEntryPage: false,
    isConfirmationPage: false,
    isAttachmentFilePage: false,
    isThankyouPage: false,
  }
  currentPhase = 'isSelectionPage';

  /**
  * @description  : コンポーネント読込完了時に実行
  **/
  connectedCallback() {

    // 矢羽初期化用関数呼び出し
    this._initSteps();

    // 有効な手続き一覧を取得して、選択リストにセット
    getActiveApplications()
      .then((ret) => {
        if (ret) {
          const arrayObjects = JSON.parse(ret);
          let arrayIds = []
          let arrayOptions = [];
          for (let i = 0; i < arrayObjects.length; i++) {
            let option = {
              label: arrayObjects[i]['Name'],
              value: arrayObjects[i]['Id']
            }
            arrayIds.push(arrayObjects[i]['Id']);
            arrayOptions.push(option);
          }

          this.activeapplications = arrayOptions;

          // URL パラメータ c__templateId をチェックし、指定された ID が取得したリストに存在すれば選択を実行
          let c__templateId = this._getURLParameter('c__templateId');
          if(c__templateId && arrayIds.indexOf(c__templateId) >= 0){
            // event オブジェクト構造を模倣
            const o = {
              target: {
                value: c__templateId
              }
            }
            this.handleChangeApplicationCombobox(o);
          }

          this._setPhase('isSelectionPage');
        }
      })
      .catch((err) => {
        console.log(err);
      })
  }

  /**
  * @description  : 手続きが選択された場合の処理
  **/
  handleChangeApplicationCombobox(evt) {
    // 最初に選択された場合
    if (!this.selectedAppTempRecordId) {
      this.selectedAppTempRecordId = evt.target.value;
      this.isApplicationSelected = true;
      this.isSelectionPageNextDisabled = false; // 次へボタンの有効化
    } else {
      // 違う手続きが選択された場合
      if (this.selectedAppTempRecordId != evt.target.value) {
        this.selectedAppTempRecordId = evt.target.value;
        this.isApplicationSelected = true;
        this.isSelectionPageNextDisabled = false;

        // 次のページから戻ってきた可能性を考慮し、申請定義情報を再読み込みするようにフラグを変更
        this.isApplicationTemplateLoaded = false;
        this.isApplicationTemplateDetailsLoaded = false;
      }
    }
  }

  /**
  * @description  : 手続きの条件への同意チェックボックスの操作に応じた処理
  **/
  handleChangeAgreementCheckbox(evt) {
    // 次へボタンの有効化切替え
    evt.target.checked ? this.isStartPageNextDisabled = false : this.isStartPageNextDisabled = true;
  }

  /**
  * @description  : 動作確認用 入力データをオブジェクトに記録するかどうかのフラグ設定
  **/
  handleChangeUpsertCheckbox(evt) {
    evt.target.checked ? this.isUpsertDisabled = true : this.isUpsertDisabled = false;
  }

  /**
  * @description  : 入力内容確認チェックボックスの操作に応じた処理
  **/
  handleChangeConfirmationCheckbox(evt) {
    evt.target.checked ? this.isConfirmationPageNextDisabled = false : this.isConfirmationPageNextDisabled = true;
  }

  /**
  * @description  : 次へボタンを押したときの処理
  **/
  handleClickNextPage() {
    // 現在地が手続き選択ページ
    if (this.currentPhase === 'isSelectionPage') {
      this._setPhase('isStartPage');
      this._nextStep();
      this._setStartPage();

      // 現在地が概要・条件確認ページ
    } else if (this.currentPhase === 'isStartPage') {
      this._setPhase('isEntryPage');
      this._nextStep();
      this._setEntryPage();

      // 現在地が入力ページの場合
    } else if (this.currentPhase === 'isEntryPage') {
      // データ登録を行う関数を呼び出し
      this._upsertApplication();
      this._setPhase('isAttachmentFilePage');
      this._nextStep();

      // 現在地がファイル添付の場合
    } else if (this.currentPhase === 'isAttachmentFilePage') {
      this._setPhase('isConfirmationPage');
      this._nextStep();
      this._setConfirmationPage();

      // 現在地が内容確認ページの場合
    } else if (this.currentPhase === 'isConfirmationPage') {
      // 進捗フェーズを変更する関数を呼び出し
      this._updatePhaseToSubmitted();
      this._setPhase('isThankyouPage');
      this._nextStep();

    }
  }

  /**
  * @description  : 戻るボタンを押したときの処理
  **/
  handleClickPreviousPage() {
    // 現在地が内容確認ページの場合
    if (this.currentPhase === 'isConfirmationPage') {
      this._setPhase('isAttachmentFilePage');
      this._previousStep();

      // 現在地がファイル添付の場合
    } else if (this.currentPhase === 'isAttachmentFilePage') {
      this._setPhase('isEntryPage');
      this._setEntryPage();
      this._previousStep();

      // 現在地が入力ページの場合
    } else if (this.currentPhase === 'isEntryPage') {
      this._setPhase('isStartPage');
      this._setStartPage();
      this._previousStep();

      // 現在地が概要・条件確認ページ
    } else if (this.currentPhase === 'isStartPage') {
      this._setPhase('isSelectionPage');
      this._previousStep();

    }
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

  /**
  * @description  : 矢羽の初期化処理
  **/
  _initSteps() {
    let activesteps = [];
    for (let i = 0; i < this.steps.length; i++) {
      let step = {
        label: this.steps[i],
        value: this.steps[i]
      }
      activesteps.push(step);
    }
    this.activesteps = activesteps;
    this.currentstep = this.steps[0];
  }

  /**
  * @description  : 次へボタンが押された際のステップ変数の変更処理
  **/
  _nextStep() {
    const idx = this.steps.indexOf(this.currentstep);
    if (idx < 0 || idx >= this.steps.length) return;

    this.currentstep = this.steps[idx + 1];
  }

  /**
  * @description  : 戻るボタンが押された際のステップ変数の変更処理
  **/
  _previousStep() {
    const idx = this.steps.indexOf(this.currentstep);
    if (idx <= 0) return;

    this.currentstep = this.steps[idx - 1];
  }

  /**
  * @description  : 概要・条件確認ページの初期化処理
  **/
  _setStartPage() {
    // もし申請手続きの定義レコード ID が変数に格納されていなければ終了
    if (!this.selectedAppTempRecordId) return;

    // 次へボタンを無効化
    this.isStartPageNextDisabled = true;

    // 申請手続きが読み込まれてなければ読み込む
    if (!this.isApplicationTemplateLoaded) {
      const params = {
        recordId: this.selectedAppTempRecordId
      }
      getApplicationTemplate(params)
        .then((ret) => {
          this.applicationtemplate = JSON.parse(ret);
          // もし条件への同意確認が不要であれば次へボタンを有効化
          this.applicationtemplate[0].isAgreementCheckboxEnabled__c ? this.isStartPageNextDisabled = true : this.isStartPageNextDisabled = false;
          this.isApplicationTemplateLoaded = true;
        })
        .catch((err) => {
          console.log(err);
        })

      // すでに読み込み済みの場合
    } else {
      this.applicationtemplate[0].isAgreementCheckboxEnabled__c ? this.isStartPageNextDisabled = true : this.isStartPageNextDisabled = false;
    }
  }

  /**
  * @description  : データ入力ページの初期化
  **/
  _setEntryPage() {
    // もし申請手続きの定義レコード ID が変数に格納されていなければ終了
    if (!this.selectedAppTempRecordId) return;

    this.ischanged = false;
    this.isUpsertDisabled = false;

    // 申請手続き定義明細が読み込まれていなければ読み込み
    if (!this.isApplicationTemplateDetailsLoaded) {
      const params = {
        recordId: this.selectedAppTempRecordId
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
            this.detailids.push(customcolumns[i].Id);
          }

          this.columns = customcolumns;
          this.isApplicationTemplateDetailsLoaded = true;
        })
        .catch((err) => {
          console.log(err);
        })
    }
  }

  /**
  * @description  : データ登録(標準項目)を実行(戻るボタンを考慮し Upsert)
  **/
  _upsertApplication() {
    // 変更無し or 動作確認用にフラグ設定されている場合は終了
    if (!this.ischanged || this.isUpsertDisabled) return;

    // 標準項目のデータ登録用オブジェクト作成し、申請手続き ID と、すでに登録されていた場合は ID を設定
    let std = {};
    std[this.fnA_APPTEMP_FIELD] = this.selectedAppTempRecordId;
    if (this.createdApplicationRecordId) std['Id'] = this.createdApplicationRecordId;

    // 値格納変数から、標準項目の値を抽出し、データ登録用オブジェクトに追加
    for (let i = 0; i < this.columns.length; i++) if (this.columns[i][this.fnATD_CATEGORY_FIELD] === '標準' && this.columns[i][this.fnATD_STDCOLUMNNAME_FIELD] && this.columns[i][this.fnATD_VALUE_FIELD]) std[this.columns[i][this.fnATD_STDCOLUMNNAME_FIELD]] = this.columns[i][this.fnATD_VALUE_FIELD];

    // データ登録用オブジェクトを JSON 化して、Apex メソッドを呼び出し
    const params = {
      std: JSON.stringify(std)
    };
    upsertApplication(params)
      .then((ret) => {
        if (ret) {
          // 登録によって付与されたレコード ID を取得し、カスタム項目のデータ登録を実行する関数を呼び出し
          this.createdApplicationRecordId = ret;
          this.__upsertApplicationDetails(ret);
        }
      })
      .catch((err) => {
        console.log(err);
      })
  }

  /**
  * @description  : データ登録(カスタム項目)を実行(戻るボタンを考慮し Upsert)
  **/
  __upsertApplicationDetails(recordId) {
    // レコードIDが無い場合は終了
    if (!recordId) return;

    // データ登録用の配列を設定
    let customs = [];
    for (let i = 0; i < this.columns.length; i++) {
      if (this.columns[i][this.fnATD_CATEGORY_FIELD] === 'カスタム') {
        // 一項目分のデータを格納するオブジェクトを作成し、申請および申請定義明細のレコード ID を設定
        let custom = {};
        custom[this.fnAD_APP_FIELD] = recordId;
        custom[this.fnAD_APPTEMPDET_FIELD] = this.columns[i]['Id'];
        // データがすでに作成されている場合は更新用に ID を設定
        if (this.columns[i]['detailRecordId']) custom['Id'] = this.columns[i]['detailRecordId'];

        // データ型に応じて、適切な項目に値を代入
        if (this.columns[i][this.fnATD_ISTEXT_FIELD]) custom[this.fnAD_TEXT_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISLONGTEXTAREA_FIELD]) custom[this.fnAD_LONGTEXTAREA_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISNUMBER_FIELD]) custom[this.fnAD_NUMBER_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISMAIL_FIELD]) custom[this.fnAD_TEXT_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISURL_FIELD]) custom[this.fnAD_LONGTEXTAREA_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISDATE_FIELD]) custom[this.fnAD_TEXT_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISTIME_FIELD]) custom[this.fnAD_TEXT_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISCURRENCY_FIELD]) custom[this.fnAD_NUMBER_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISCHECKBOX_FIELD]) custom[this.fnAD_TEXT_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];
        else if (this.columns[i][this.fnATD_ISPICKLIST_FIELD]) custom[this.fnAD_TEXT_FIELD] = this.columns[i][this.fnATD_VALUE_FIELD];

        customs.push(custom);
      }
    }

    // データ登録用オブジェクトの配列を JSON 化して、Apex メソッドを呼び出し
    const params = {
      customs: JSON.stringify(customs)
    };
    upsertApplicationDetails(params)
      .then((ret) => {
        const retvals = JSON.parse(ret);

        // 申請明細定義のレコード ID と作成された申請明細レコード ID のマッピングを作成
        let createdRecords = {};
        for (let i = 0; i < retvals.length; i++) createdRecords[retvals[i][this.fnAD_APPTEMPDET_FIELD]] = retvals[i]['Id'];

        // データ保管用オブジェクト配列に作成された申請明細レコードの ID を設定
        for (let j = 0; j < this.columns.length; j++) if (this.columns[j][this.fnATD_CATEGORY_FIELD] === 'カスタム') this.columns[j]['detailRecordId'] = createdRecords[this.columns[j]['Id']];

      })
      .catch((err) => {
        console.log(err);
      })
  }

  /**
  * @description  : ファイル添付ページ初期化用
  **/
  _setAttachmentFilePage() {
    if (!this.createdApplicationRecordId) return;
    // 現時点では特段の処理無し
  }

  /**
  * @description  : 内容確認ページ初期化用
  **/
  _setConfirmationPage() {
    this.isConfirmationPageNextDisabled = true;
    // 現時点では特段の処理無し
  }

  /**
  * @description  : 進捗状況を提出済みに変更する
  **/
  _updatePhaseToSubmitted() {
    const params = {
      recordId: this.createdApplicationRecordId
    };
    updatePhaseToSubmitted(params)
      .then((ret) => {
        // 自動採番される管理番号を変数に格納
        if (ret) this.mgmtCode = ret;
      })
      .catch((err) => {
        window.console.log(err);
      })
  }

  /**
  * @description  : 矢羽の進捗状況を変更する
  **/
  _setPhase(index) {
    if (this.phase.hasOwnProperty(index)) {
      // this.phase の全ての値を false に設定
      for (let k in this.phase) this.phase[k] = false;

      // 渡された進捗を true に設定し、currentPhase にも代入
      this.phase[index] = true;
      this.currentPhase = index;
    }
  }

  /**
  * @description  : 指定された URL パラメータの値を返す(c__XXXX のパラメータ名にする必要あり)
  **/
  _getURLParameter(key){
    return new URL(window.location.href).searchParams.get(key);
  }

}