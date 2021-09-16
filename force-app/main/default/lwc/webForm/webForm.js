import { LightningElement, api, wire, track } from "lwc";
import getApplicationTemplateDetails from "@salesforce/apex/DAF_RecordOperationApexController.getApplicationTemplateDetails";
import insertApplication from "@salesforce/apex/DAF_RecordOperationApexController.insertApplication";
import {
  showToast,
  getURLParameter,
  buildTemplateTree,
  PAGE_DATA_ENTRY,
  PAGE_ATTACH_FILE,
  PAGE_COMPLETE,
  PAGE_CONFIRM,
  PAGE_OVERVIEW,
  PAGE_SELECTOR,
  STEP_SELECTOR,
  STEP_COMPLETE,
  STEP_CONFIRM,
  STEP_FILE_ATTACH,
  STEP_OVERVIEW,
  flattenAppTemplate
} from "c/webFormUtils";
import {
  fnAD_APPTEMPDET_FIELD,
  fnAD_APP_FIELD,
  fnAD_LONGTEXTAREA_FIELD,
  fnAD_NUMBER_FIELD,
  fnAD_TEXT_FIELD,
  fnATD_CATEGORY_FIELD,
  fnATD_ISCHECKBOX_FIELD,
  fnATD_ISCURRENCY_FIELD,
  fnATD_ISDATE_FIELD,
  fnATD_ISNUMBER_FIELD,
  fnATD_ISPICKLIST_FIELD,
  fnATD_ISTEXT_FIELD,
  fnATD_ISTIME_FIELD,
  fnATD_STDCOLUMNNAME_FIELD,
  fnATD_VALUE_FIELD,
  fnA_APPTEMP_FIELD
} from "c/appTemplateSchema";

const NEXT = "next";
const PREV = "previous";

export default class WebForm extends LightningElement {
  // TODO: Pageをやめて、Stepだけにする。

  // WebFormAppSelector に渡す。true の場合は下書きのものも選択肢に含める(動作確認用)
  @api includeDraftApp = false;
  // WebFormAttachFile に渡す。プレビュー画像表示 URL を書き換える
  @api isCommunityPage = false;
  @api previewFor;
  @api recordId;

  // 矢羽の表示ラベルと現在位置の初期化
  @api overviewPageLabel;
  @api fileAttachPageLabel;
  @api confirmPageLabel;
  @api completePageLabel;

  // 入力データもここに保存。
  @track appTemplate;

  @track steps = []; // ステップ一覧
  @track currentStep = null; // 現在選択されているステップ

  createdAppRecord = null; // 作成された申請レコードの SalesforceID
  uploadedFileDocumentIds = ""; // アップロードしたファイルの SalesforceID を格納しておく。JSON 化するので文字列

  /**
   * @description: 初期化。行うのはページ表示状態の初期設定のみ
   */
  connectedCallback() {
    this.initSteps();

    // URL パラメータ c__templateId をチェックし、直接 overviews 画面に遷移
    const c__templateId = getURLParameter("c__templateId");
    if (c__templateId) {
      console.log(c__templateId);
      // event オブジェクト構造を模倣
      this.handleNextPage({
        detail: {
          data: c__templateId
        }
      });
      return;
    }

    this.currentStep = this.steps[0];
  }

  @wire(getApplicationTemplateDetails, { recordId: "$recordId" })
  wiredAppTemplateDetails({ data, error }) {
    if (data) {
      this.appTemplate = buildTemplateTree(data);
      const inputSteps = this.appTemplate.appTemplatePages__r
        ?.map((p) => {
          return {
            id: p.Id,
            label: p.Name,
            page: PAGE_DATA_ENTRY,
            order: null,
            inputStepOrder: p.Order__c
          };
        })
        .sort((a, b) => a.inputStepOrder - b.inputStepOrder) ?? [];

      // テンプレートデータを取得したら、入力ページとそれ以外のページを合体させ、
      // Stepsとして扱う。
      this.steps = [
        STEP_SELECTOR,
        STEP_OVERVIEW,
        ...inputSteps,
        STEP_FILE_ATTACH,
        STEP_CONFIRM,
        STEP_COMPLETE
      ].map((s, i) => {
        s.order = i + 1; // orderを確定させる。
        return s;
      });

      if (this.previewFor) {
        // プレビュー用途は、入力画面の最初のステップ or 概要説明画面を見せる。
        this.currentStep =
          this.previewFor === "入力" ? this.steps[2] : this.steps[1];
      }
    } else if (error) {
      console.error(error);
      showToast(this, "[Error] wiredAppTemplateDetails", error, "error");
    }
  }

  updatePageInputData(e) {
    console.log("updatePageInputData", e.detail);

    const pageIndex = this.appTemplate.appTemplatePages__r.findIndex(
      (p) => p.Id === this.currentStep.id
    );
    if (pageIndex === -1) {
      return;
    }
    this.appTemplate.appTemplatePages__r[pageIndex] = e.detail;
  }

  async handleFormSubmit() {
    try {
      console.log("handleFormSubmit");
      const details = flattenAppTemplate(this.appTemplate);
      console.log(details);

      // 申請/申請詳細/関連ファイル作成
      this.createdAppRecord = await this.insertApp(details);
      console.log(this.createdAppRecord);
      if (!this.createdAppRecord) {
        throw new Error("No Application Template Id");
      }

      // WebForm のメソッドを呼び出し
      this.handleNextPage();
    } catch (err) {
      console.error(err);
    }
  }

  // 標準項目のデータ登録用オブジェクト作成し、申請手続き ID と、すでに登録されていた場合は ID を設定
  // 値格納変数から、標準項目の値を抽出し、データ登録用オブジェクトに追加
  async insertApp(details) {
    const app = details
      .filter(
        (d) =>
          d[fnATD_CATEGORY_FIELD] === "標準" &&
          d[fnATD_STDCOLUMNNAME_FIELD] &&
          d[fnATD_VALUE_FIELD]
      )
      .reduce(
        (params, d) => {
          params[d[fnATD_STDCOLUMNNAME_FIELD]] = d[fnATD_VALUE_FIELD];
          return params;
        },
        { Id: null, [fnA_APPTEMP_FIELD]: this.appTemplate?.Id ?? null }
      );

    // データ登録用の配列を設定
    const appDetails = details
      .filter((d) => d[fnATD_CATEGORY_FIELD] === "カスタム")
      .map((d) => {
        const v = d[fnATD_VALUE_FIELD];
        return {
          [fnAD_APP_FIELD]: null,
          [fnAD_APPTEMPDET_FIELD]: d.Id,
          Id: null, // d.detailRecordIdはありえるのか？？
          [fnAD_TEXT_FIELD]:
            d[fnATD_ISTEXT_FIELD] ||
            d.isMail__c ||
            d[fnATD_ISDATE_FIELD] ||
            d[fnATD_ISTIME_FIELD] ||
            d[fnATD_ISCHECKBOX_FIELD] ||
            d[fnATD_ISPICKLIST_FIELD]
              ? !!v || v === false || v === 0 // false, 0, number, stringを許容（array, objectは入らない想定)
                ? "" + v
                : null
              : null,
          [fnAD_LONGTEXTAREA_FIELD]:
            d.isLongTextArea__c || d.isURL__c ? v : null,
          [fnAD_NUMBER_FIELD]:
            d[fnATD_ISNUMBER_FIELD] || d[fnATD_ISCURRENCY_FIELD] ? v : null
        };
      });

    // データ登録Apex メソッドを呼び出し
    try {
      const appRecord = await insertApplication({
        app,
        appDetails,
        fileDocumentIds: this.uploadedFileDocumentIds
      });
      return appRecord;
    } catch (err) {
      console.error("Inserting application record failed", err);
      throw new Error("Inserting application record failed");
    }
  }

  /**
   * @description: 各ページコンポーネントから呼び出される「次へ」相当のボタンが押された時の処理関数
   */
  handleNextPage(evt) {
    const { data } = evt?.detail ?? {};
    // プレビュー用途では、入力ページの遷移を除いてページングは許容しない。
    if (this.previewFor) {
      if (this.currentStep.page === PAGE_DATA_ENTRY) {
        // 次のステップが入力ページなら、進める
        const currentStepIndex = this.steps.findIndex(
          (s) => s.id === this.currentStep.id
        );
        if (this.steps[currentStepIndex + 1].page === PAGE_DATA_ENTRY) {
          this.currentStep = this.steps[currentStepIndex + 1];
        }
      }
      return;
    }

    switch (this.currentStep.page) {
      case PAGE_SELECTOR:
        if (!data) {
          break;
        }
        this.recordId = data;
        this.appTemplate = null;
        break;
      case PAGE_OVERVIEW:
      case PAGE_DATA_ENTRY:
      case PAGE_CONFIRM:
        break;
      case PAGE_ATTACH_FILE:
        this.uploadedFileDocumentIds = data;
        break;
      case PAGE_COMPLETE:
        // 完了画面から次へ移動は手続き選択画面のみ。各変数を初期状態へ
        this.recordId = null;
        this.appTemplate = null;
        this.createdAppRecord = null;
        this.uploadedFileDocumentIds = null;
        this.initSteps();
        this.currentStep = this.steps[0];
        return;
      default:
    }
    this._movePage(NEXT);
  }

  /**
   * @description: 各ページコンポーネントから呼び出される「戻る」相当のボタンが押された時の処理関数
   */
  handlePreviousPage() {
    // プレビュー用途では、入力ページの遷移を除いてページングは許容しない。
    if (this.previewFor) {
      if (this.currentStep.page === PAGE_DATA_ENTRY) {
        // 次のステップが入力ページなら、戻る
        const currentStepIndex = this.steps.findIndex(
          (s) => s.id === this.currentStep.id
        );
        if (this.steps[currentStepIndex - 1].page === PAGE_DATA_ENTRY) {
          this.currentStep = this.steps[currentStepIndex - 1];
        }
      }
      return;
    }

    if (this.currentStep.page === PAGE_OVERVIEW) {
      this.recordId = "";
    }
    this._movePage(PREV);
  }

  /**
   * @description: ページ移動を処理する内部関数
   */
  _movePage(direction) {
    const currentStepIndex = this.steps.findIndex(
      (s) => s.id === this.currentStep.id
    );

    if (currentStepIndex === -1) {
      return;
    }
    if (direction === NEXT) {
      this.currentStep =
        currentStepIndex === this.steps.length - 1
          ? this.steps[0] // 完了時に次へでリセット
          : this.steps[currentStepIndex + 1]; // +1
    } else if (direction === PREV) {
      this.currentStep =
        currentStepIndex === 0
          ? this.steps[0] //
          : this.steps[currentStepIndex - 1]; // Go back
    }
  }

  initSteps() {
    this.steps = [STEP_SELECTOR, STEP_OVERVIEW].map((s, i) => {
      s.order = i + 1; // orderを確定させる。
      return s;
    });
    this.currentStep = this.steps[0];
  }

  // ページの状態を取得する getter
  get displayPageSelector() {
    return this.currentStep?.page === PAGE_SELECTOR;
  }
  get displayPageOverview() {
    return this.currentStep?.page === PAGE_OVERVIEW;
  }
  get displayPageDataEntry() {
    return this.currentStep?.page === PAGE_DATA_ENTRY;
  }
  get displayPageAttachFile() {
    return this.currentStep?.page === PAGE_ATTACH_FILE;
  }
  get displayPageConfirm() {
    return this.currentStep?.page === PAGE_CONFIRM;
  }
  get displayPageComplete() {
    return this.currentStep?.page === PAGE_COMPLETE;
  }
}
