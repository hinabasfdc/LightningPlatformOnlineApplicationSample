import { LightningElement, api, wire, track } from "lwc";
import { getRecord } from "lightning/uiRecordApi";
import { GETRECORD_FIELDS } from "c/appTemplateSchema";
import { showToast, getURLParameter } from "c/webFormUtils";
const PAGE_SELECTOR = "selector";
const PAGE_OVERVIEW = "overview";
const PAGE_DATA_ENTRY = "dataentry";
const PAGE_ATTACH_FILE = "attachfile";
const PAGE_CONFIRM = "confirm";
const PAGE_COMPLETE = "complete";
const PAGES = [
  PAGE_SELECTOR,
  PAGE_OVERVIEW,
  PAGE_DATA_ENTRY,
  PAGE_ATTACH_FILE,
  PAGE_CONFIRM,
  PAGE_COMPLETE
];

const STEP_OVERVIEW = "手続き概要";
const STEP_FILE_ATTACH = "ファイル添付";
const STEP_CONFIRM = "確認";
const STEP_COMPLETE = "完了";

const NEXT = "next";
const PREV = "previous";

export default class WebForm extends LightningElement {
  // WebFormAppSelector に渡す。true の場合は下書きのものも選択肢に含める(動作確認用)
  @api includeDraftApp = false;
  // WebFormAttachFile に渡す。プレビュー画像表示 URL を書き換える
  @api isCommunityPage = false;
  @api previewFor;
  @api recordId;

  // 矢羽の表示ラベルと現在位置の初期化
  @track
  activeSteps = [];
  @track
  appTemplate;
  @track
  inputPages = [];
  currentStep = "";
  currentInputPage = 1;

  // サブコンポーネントにまたがって使用する変数を定義 & 初期化
  currentPage = PAGE_SELECTOR; // ページ遷移現在位置
  inputData = ""; // 入力された値を格納しておく。JSON 化するので文字列
  createdAppRecordId = ""; // 作成された申請レコードの SalesforceID
  uploadedFileDocumentIds = ""; // アップロードしたファイルの SalesforceID を格納しておく。JSON 化するので文字列
  pages = PAGES; // ページの順序を初期化

  /**
   * @description : 選択された申請手続きのレコードを取得する(実運用においては状態や有効期限をチェックして処理を行うべき。その場合は uiRecordApi ではなくカスタム Apex メソッドの方が適しているかもしれない)
   */
  @wire(getRecord, { recordId: "$recordId", fields: GETRECORD_FIELDS })
  wiredGetTemplateRecord({ data, error }) {
    if (data) {
      // 申請定義が見つかった場合
      this.appTemplate = data;

      const inputPages =
        this.appTemplate?.fields?.InputPageNames__c?.value?.split(",") ?? [];
      if (inputPages.length === 0) {
        inputPages.push("入力");
      }
      this.inputPages = inputPages;
      this.activeSteps = [
        STEP_OVERVIEW,
        ...inputPages,
        STEP_FILE_ATTACH,
        STEP_CONFIRM,
        STEP_COMPLETE
      ];
      if (this.previewFor) {
        this.currentStep =
          this.previewFor === "入力" ? inputPages[0] : STEP_OVERVIEW;
      }
    } else if (error) {
      console.error(error);
      showToast(this, "wiredGetRecordId", error, "error");
    }
  }

  // ページの状態を取得する getter
  get displayPageSelector() {
    return this.currentPage === PAGE_SELECTOR;
  }
  get displayPageOverview() {
    return this.currentPage === PAGE_OVERVIEW;
  }
  get displayPageDataEntry() {
    return this.currentPage === PAGE_DATA_ENTRY;
  }
  get displayPageAttachFile() {
    return this.currentPage === PAGE_ATTACH_FILE;
  }
  get displayPageConfirm() {
    return this.currentPage === PAGE_CONFIRM;
  }
  get displayPageComplete() {
    return this.currentPage === PAGE_COMPLETE;
  }

  /**
   * @description: 初期化。行うのはページ表示状態の初期設定のみ
   */
  connectedCallback() {
    // URL パラメータ c__templateId をチェックし、直接 overviews 画面に遷移
    const c__templateId = getURLParameter("c__templateId");
    if (c__templateId) {
      this.currentPage = PAGE_SELECTOR;
      // event オブジェクト構造を模倣
      this.handleNextPage({
        detail: {
          data: c__templateId
        }
      });
    }

    if (this.previewFor) {
      this.currentPage =
        this.previewFor === "入力" ? PAGE_DATA_ENTRY : PAGE_OVERVIEW;
    }
  }

  /**
   * @description: 各ページコンポーネントから呼び出される「次へ」相当のボタンが押された時の処理関数
   */
  handleNextPage(evt) {
    const { data, inputPage } = evt?.detail ?? {};

    if (this.previewFor) {
      if (this.currentPage === PAGE_DATA_ENTRY) {
        this.inputData = data;
        if (inputPage !== this.inputPages.length) {
          this.currentInputPage++;
        }
      }
      return;
    }

    switch (this.currentPage) {
      case PAGE_SELECTOR:
        if (!data) {
          break;
        }
        this.recordId = data;
        // いったん selector まで戻った場合は入力値を空にする
        this.inputData = "";
        break;
      case PAGE_OVERVIEW:
        break;
      case PAGE_DATA_ENTRY:
        if (!inputPage) {
          return;
        }
        this.inputData = data;
        if (inputPage !== this.inputPages.length) {
          this.currentInputPage++;
          this.currentStep = this.inputPages[this.currentInputPage - 1];
          return;
        }
        break;
      case PAGE_ATTACH_FILE:
        this.uploadedFileDocumentIds = data;
        break;
      case PAGE_CONFIRM:
        this.createdAppRecordId = data;
        break;
      case PAGE_COMPLETE:
        // 完了画面から次へ移動は手続き選択画面のみ。各変数を初期状態へ
        this.recordId = null;
        this.appTemplate = null;
        this.inputData = null;
        this.createdAppRecordId = null;
        this.uploadedFileDocumentIds = null;
        this.currentInputPage = 1;
        break;
      default:
    }
    this._movePage(NEXT);
  }

  /**
   * @description: 各ページコンポーネントから呼び出される「戻る」相当のボタンが押された時の処理関数
   */
  handlePreviousPage(evt) {
    const { data, inputPage } = evt?.detail ?? {};
    if (this.previewFor) {
      if (this.currentPage === PAGE_DATA_ENTRY) {
        this.inputData = data;
        if (inputPage > 1) {
          this.currentInputPage--;
          this.currentStep = this.inputPages[this.currentInputPage - 1];
        }
      }
      return;
    }

    if (this.currentPage === PAGE_OVERVIEW) {
      this.selectedApplicationId = "";
    } else if (this.currentPage === PAGE_DATA_ENTRY) {
      if (!inputPage) {
        return;
      }
      this.inputData = data;
      if (inputPage > 1) {
        this.currentInputPage--;
        return;
      }
    }
    this._movePage(PREV);
  }

  /**
   * @description: ページ移動を処理する内部関数
   */
  _movePage(direction) {
    const pageIndex = this.pages.indexOf(this.currentPage);
    if (pageIndex === -1) {
      return;
    }
    if (direction === NEXT) {
      // 完了時に次へでリセット
      this.currentPage =
        pageIndex === this.pages.length - 1
          ? this.pages[0]
          : this.pages[pageIndex + 1];
    } else if (direction === PREV) {
      this.currentPage =
        pageIndex === 0 ? this.pages[0] : this.pages[pageIndex - 1];
    }
    this.setCurrentStep(direction);
  }

  setCurrentStep(dir) {
    switch (this.currentPage) {
      case PAGE_SELECTOR:
        this.currentStep = null;
        break;
      case PAGE_OVERVIEW:
        this.currentStep = STEP_OVERVIEW;
        break;
      case PAGE_DATA_ENTRY:
        this.currentStep =
          dir === NEXT
            ? this.inputPages[0]
            : this.inputPages[this.inputPages.length - 1];
        this.currentInputPage = dir === NEXT ? 1 : this.inputPages.length;
        break;
      case PAGE_ATTACH_FILE:
        this.currentStep = STEP_FILE_ATTACH;
        break;
      case PAGE_CONFIRM:
        this.currentStep = STEP_CONFIRM;
        break;
      case PAGE_COMPLETE:
        this.currentStep = STEP_COMPLETE;
        break;
      default:
        break;
    }
  }
}
