import { LightningElement, api } from "lwc";

export default class WebForm extends LightningElement {
  // WebFormAppSelector に渡す。true の場合は下書きのものも選択肢に含める(動作確認用)
  @api includeDraftApp = false;
  // WebFormAttachFile に渡す。プレビュー画像表示 URL を書き換える
  @api isCommunityPage = false;

  // 矢羽の表示ラベルと現在位置の初期化
  activeSteps = "手続き概要,入力,ファイル添付,確認,完了";
  currentStep = "手続き概要";

  // サブコンポーネントにまたがって使用する変数を定義 & 初期化
  currentPage = "selector"; // ページ遷移現在位置
  selectedAppId = ""; // 選択された手続きの SalesforceID
  applicationTemplate = {}; // 選択された手続き定義を格納 (getRecord での取得形式)
  inputData = ""; // 入力された値を格納しておく。JSON 化するので文字列
  createdAppRecordId = ""; // 作成された申請レコードの SalesforceID
  uploadedFileDocumentIds = ""; // アップロードしたファイルの SalesforceID を格納しておく。JSON 化するので文字列
  pages = new Map(); // ページの表示状態を格納しておく

  // ページの状態を取得する getter
  get displayPageSelector() {
    return this.pages.get("selector");
  }
  get displayPageOverview() {
    return this.pages.get("overview");
  }
  get displayPageDataEntry() {
    return this.pages.get("dataentry");
  }
  get displayPageAttachFile() {
    return this.pages.get("attachfile");
  }
  get displayPageConfirm() {
    return this.pages.get("confirm");
  }
  get displayPageComplete() {
    return this.pages.get("complete");
  }

  /**
   * @description: 初期化。行うのはページ表示状態の初期設定のみ
   */
  connectedCallback() {
    // ページの表示状態を初期化
    let localPages = new Map();
    localPages.set("selector", true);
    localPages.set("overview", false);
    localPages.set("dataentry", false);
    localPages.set("attachfile", false);
    localPages.set("confirm", false);
    localPages.set("complete", false);
    this.pages = new Map(localPages);

    // URL パラメータ c__templateId をチェックし、直接 overviews 画面に遷移
    let c__templateId = this._getURLParameter("c__templateId");
    if (c__templateId) {
      // event オブジェクト構造を模倣
      const o = {
        detail: {
          currentpage: "selector",
          selectedappid: c__templateId
        }
      };
      this.handleNextPage(o);
    }
  }

  /**
   * @description: 各ページコンポーネントから呼び出される「次へ」相当のボタンが押された時の処理関数
   */
  handleNextPage(evt) {
    console.log("handleNextPage");
    let currentPage = evt.detail.currentpage;

    if (currentPage === "selector") {
      if (evt.detail["selectedappid"])
        this.selectedAppId = evt.detail["selectedappid"];
      else return;

      // いったん selector まで戻った場合は入力値を空にする
      this.inputData = "";
    } else if (currentPage === "overview") {
      this.applicationTemplate = evt.detail["applicationTemplate"];

      this.currentStep = "入力";
    } else if (currentPage === "dataentry") {
      this.inputData = evt.detail["inputData"];

      this.currentStep = "ファイル添付";
    } else if (currentPage === "attachfile") {
      this.uploadedFileDocumentIds = evt.detail["uploadedFileDocumentIds"];

      this.currentStep = "確認";
    } else if (currentPage === "confirm") {
      this.createdAppRecordId = evt.detail["createdAppRecordId"];

      this.currentStep = "完了";
    } else if (currentPage === "complete") {
      // 完了画面から次へ移動は手続き選択画面のみ。各変数を初期状態へ
      this.currentStep = "";
      this.selectedAppId = "";
      this.applicationTemplate = {};
      this.inputData = "";
      this.createdAppRecordId = "";
      this.uploadedFileDocumentIds = "";
    }
    this._movePage(currentPage, "next");
  }

  /**
   * @description: 各ページコンポーネントから呼び出される「戻る」相当のボタンが押された時の処理関数
   */
  handlePreviousPage(evt) {
    console.log("handlePreviousPage");
    let currentPage = evt.detail["currentpage"];

    if (currentPage === "selector") {
      return;
    } else if (currentPage === "overview") {
      this.selectedApplicationId = "";
      this.currentStep = "";
    } else if (currentPage === "dataentry") {
      this.currentStep = "手続き概要";
    } else if (currentPage === "attachfile") {
      this.currentStep = "入力";
    } else if (currentPage === "confirm") {
      this.currentStep = "ファイル添付";
    } else if (currentPage === "complete") {
      this.currentStep = "確認";
    }
    this._movePage(currentPage, "previous");
  }

  /**
   * @description: ページ移動を処理する内部関数
   */
  _movePage(currentPage, direction) {
    let localPages = new Map(this.pages);
    let arrayPages = [...localPages.keys()];
    let currentPageIdx = arrayPages.indexOf(currentPage);

    if (direction === "next") {
      if (currentPageIdx >= 0 && currentPageIdx + 1 < arrayPages.length) {
        for (let page of localPages.keys()) localPages.set(page, false);
        localPages.set(arrayPages[currentPageIdx + 1], true);
      } else if (currentPageIdx + 1 == arrayPages.length) {
        for (let page of localPages.keys()) localPages.set(page, false);
        // 手続き選択ページに戻る
        localPages.set(arrayPages[0], true);
      }
    } else if (direction === "previous") {
      if (currentPageIdx >= 1 && currentPageIdx < arrayPages.length) {
        for (let page of localPages.keys()) localPages.set(page, false);
        localPages.set(arrayPages[currentPageIdx - 1], true);
      }
    }
    this.pages = new Map(localPages);
  }

  /**
   * @description  : 指定された URL パラメータの値を返す(c__XXXX のパラメータ名にする必要あり)
   **/
  _getURLParameter(key) {
    return new URL(window.location.href).searchParams.get(key);
  }
}
