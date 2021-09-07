import { LightningElement, api } from "lwc";

const PAGE_SELECTOR = "selector";
const PAGE_OVERVIEW = "overview";
const PAGE_DATA_ENTRY = "dataentry";
const PAGE_ATTACH_FILE = "attachfile";
const PAGE_CONFIRM = "confirm";
const PAGE_COMPLETE = "complete";

export default class WebForm extends LightningElement {
  // WebFormAppSelector に渡す。true の場合は下書きのものも選択肢に含める(動作確認用)
  @api includeDraftApp = false;
  // WebFormAttachFile に渡す。プレビュー画像表示 URL を書き換える
  @api isCommunityPage = false;

  // 矢羽の表示ラベルと現在位置の初期化
  activeSteps = "手続き概要,入力,ファイル添付,確認,完了";
  currentStep = "手続き概要";

  // サブコンポーネントにまたがって使用する変数を定義 & 初期化
  currentPage = PAGE_SELECTOR; // ページ遷移現在位置
  selectedAppId = ""; // 選択された手続きの SalesforceID
  applicationTemplate = {}; // 選択された手続き定義を格納 (getRecord での取得形式)
  inputData = ""; // 入力された値を格納しておく。JSON 化するので文字列
  createdAppRecordId = ""; // 作成された申請レコードの SalesforceID
  uploadedFileDocumentIds = ""; // アップロードしたファイルの SalesforceID を格納しておく。JSON 化するので文字列
  pages;

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
    // ページの順序を初期化
    this.pages = [
      PAGE_SELECTOR,
      PAGE_OVERVIEW,
      PAGE_DATA_ENTRY,
      PAGE_ATTACH_FILE,
      PAGE_CONFIRM,
      PAGE_COMPLETE
    ];

    // URL パラメータ c__templateId をチェックし、直接 overviews 画面に遷移
    let c__templateId = this._getURLParameter("c__templateId");
    if (c__templateId) {
      this.currentPage = PAGE_SELECTOR;
      // event オブジェクト構造を模倣
      this.handleNextPage({
        detail: {
          data: c__templateId
        }
      });
    }
  }

  /**
   * @description: 各ページコンポーネントから呼び出される「次へ」相当のボタンが押された時の処理関数
   */
  handleNextPage(evt) {
    console.log("handleNextPage");

    const { data } = evt?.detail;

    switch (this.currentPage) {
      case PAGE_SELECTOR:
        if (!data) {
          break;
        }
        this.selectedAppId = data;
        // いったん selector まで戻った場合は入力値を空にする
        this.inputData = "";
        break;
      case PAGE_OVERVIEW:
        this.applicationTemplate = data;
        this.currentStep = "入力";
        break;
      case PAGE_DATA_ENTRY:
        this.inputData = data;
        this.currentStep = "ファイル添付";
        break;
      case PAGE_ATTACH_FILE:
        this.uploadedFileDocumentIds = data;
        this.currentStep = "確認";
        break;
      case PAGE_CONFIRM:
        this.createdAppRecordId = data;
        this.currentStep = "完了";
        break;
      case PAGE_COMPLETE:
        // 完了画面から次へ移動は手続き選択画面のみ。各変数を初期状態へ
        this.currentStep = "";
        this.selectedAppId = "";
        this.applicationTemplate = {};
        this.inputData = "";
        this.createdAppRecordId = "";
        this.uploadedFileDocumentIds = "";
        break;
      default:
    }
    this._movePage("next");
  }

  /**
   * @description: 各ページコンポーネントから呼び出される「戻る」相当のボタンが押された時の処理関数
   */
  handlePreviousPage() {
    console.log("handlePreviousPage");
    switch (this.currentPage) {
      case PAGE_SELECTOR:
        return;
      case PAGE_OVERVIEW:
        this.selectedApplicationId = "";
        this.currentStep = "";
        break;
      case PAGE_DATA_ENTRY:
        this.currentStep = "手続き概要";
        break;
      case PAGE_ATTACH_FILE:
        this.currentStep = "入力";
        break;
      case PAGE_CONFIRM:
        this.currentStep = "ファイル添付";
        break;
      case PAGE_COMPLETE:
        this.currentStep = "確認";
        break;
      default:
        return;
    }
    this._movePage("previous");
  }

  /**
   * @description: ページ移動を処理する内部関数
   */
  _movePage(direction) {
    const pageIndex = this.pages.indexOf(this.currentPage);
    if (pageIndex === -1) {
      return;
    }
    if (direction === "next") {
      this.currentPage =
        pageIndex <= this.pages.length
          ? this.pages[pageIndex + 1]
          : this.pages[0];
    } else if (direction === "previous") {
      this.currentPage =
        pageIndex === 0 ? this.pages[0] : this.pages[pageIndex - 1];
    }
  }

  /**
   * @description  : 指定された URL パラメータの値を返す(c__XXXX のパラメータ名にする必要あり)
   **/
  _getURLParameter(key) {
    return new URL(window.location.href).searchParams.get(key);
  }
}
