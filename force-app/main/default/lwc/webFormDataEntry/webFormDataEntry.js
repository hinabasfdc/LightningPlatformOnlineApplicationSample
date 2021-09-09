import { LightningElement, api, track } from "lwc";
import {
  onAPPLICATION_OBJECT,
  fnATD_DATATYPE_FIELD,
  fnATD_TEXT_FIELD,
  fnATD_OPTIONS_FIELD,
  fnATD_VALUE_FIELD,
  fnATD_REQUIRED_FIELD,
  fnATD_NAME_FIELD,
  fnATD_PAGE_NUMBER,
  fnATD_ROW_NUMBER
} from "c/appTemplateSchema";
import getApplicationTemplateDetailsJson from "@salesforce/apex/DAF_RecordOperationApexController.getApplicationTemplateDetailsJson";

export default class WebFormDataEntry extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = true;

  @api inputData;
  @api currentInputPage;
  @api createdApplicationRecordId;
  @api appTemplate;

  @track pages;
  objectApiName = onAPPLICATION_OBJECT;

  /**
   * @description : 初期化処理。データが渡された場合はそれを元に入力項目を構成、そうでない場合は申請定義明細を元に構成
   */
  connectedCallback() {
    if (this.inputData) {
      // inputData に値が入っている(次ページから戻ってきた)場合には渡された値を代入
      const data = JSON.parse(this.inputData);
      this.pages = this.convertDetailsDataIntoPages(data);
      return;
    }
    getApplicationTemplateDetailsJson({
      recordId: this.appTemplate?.fields.Id.value
    })
      .then((ret) => {
        const data = ret ? JSON.parse(ret) : [];
        this.pages = this.convertDetailsDataIntoPages(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  get columns() {
    const cols = this.getPageCols(this.currentInputPage);
    return cols;
  }

  get zeroColumns() {
    return !this.columns || this.columns.length === 0;
  }

  convertDetailsDataIntoPages = (data) => {
    return data
      .reduce((ps, d) => {
        if (d[fnATD_DATATYPE_FIELD] === "チェックボックス") {
          d.isCheckboxChecked = d[fnATD_TEXT_FIELD] === "true";
        }
        // 項目が選択リストだった場合は、選択肢の項目値からコンボボックスの選択肢形式に変換
        if (d[fnATD_DATATYPE_FIELD] === "選択リスト") {
          d.PicklistValues = d[fnATD_OPTIONS_FIELD]?.split(",").map((o) => {
            return {
              label: o,
              value: o
            };
          });
        }
        if (ps[d[fnATD_PAGE_NUMBER] - 1]) {
          if (ps[d[fnATD_PAGE_NUMBER] - 1].rows[d[fnATD_ROW_NUMBER] - 1]) {
            ps[d[fnATD_PAGE_NUMBER] - 1].rows[
              d[fnATD_ROW_NUMBER] - 1
            ].cols.push(d);
          } else {
            ps[d[fnATD_PAGE_NUMBER] - 1].rows[d[fnATD_ROW_NUMBER] - 1] = {
              row: d[fnATD_ROW_NUMBER],
              cols: [d]
            };
          }
        } else {
          ps[d[fnATD_PAGE_NUMBER] - 1] = {
            page: d[fnATD_PAGE_NUMBER],
            rows: []
          };
          // 今は１列１行
          ps[d[fnATD_PAGE_NUMBER] - 1].rows[d[fnATD_ROW_NUMBER] - 1] = {
            row: d[fnATD_ROW_NUMBER],
            cols: [d]
          };
        }
        return ps;
      }, [])
      .map((p) => {
        if (!p) {
          return null;
        }
        const rows = p.rows
          .map((r) => {
            if (!r) {
              return null;
            }
            const cols = r.cols.filter((c) => c);
            return { ...r, cols };
          })
          .filter((r) => r);
        return { ...p, rows };
      })
      .filter((p) => p);
  };

  getPageCols = (inputPageNumber) => {
    const page = this.pages?.find((p) => p.page === inputPageNumber) ?? null;
    if (!page) {
      return [];
    }

    return page.rows.reduce((cols, r) => {
      return [...cols, ...r.cols];
    }, []);
  };

  /**
   * @description  : 入力ページで各項目に値を入力した場合の処理
   **/
  handleChangeValue(evt) {
    // 入力された項目の格納変数内での位置を確認。もし見つからなければ終了
    const cIndex = this.columns.findIndex(
      (c) => c.Id === evt.target.dataset.id
    );
    if (cIndex === -1) {
      return;
    }

    const col = this.columns[cIndex];
    if (col[fnATD_DATATYPE_FIELD] === "チェックボックス") {
      // データタイプがチェックボックスだった場合のみ、設定する値の取り方を変更
      col[fnATD_VALUE_FIELD] = evt.target.checked;
      col.isCheckboxChecked = evt.target.checked;
    } else {
      // チェックボックス以外は値をそのまま代入
      col[fnATD_VALUE_FIELD] = evt.target.value;
    }
  }

  /**
   * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPagePrevious() {
    const cols = this.pages.reduce((columns, p) => {
      const pageCols = this.getPageCols(p.page);
      return [...columns, ...pageCols];
    }, []);
    this.dispatchEvent(
      new CustomEvent("changepageprevious", {
        detail: {
          inputPage: this.currentInputPage,
          data: JSON.stringify(cols)
        }
      })
    );
  }

  /**
   * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPageNext(e) {
    e.stopPropagation();
    if (this._isRequiredValuesCheck()) {
      const cols = this.pages.reduce((columns, p) => {
        const pageCols = this.getPageCols(p.page);
        return [...columns, ...pageCols];
      }, []);

      this.dispatchEvent(
        new CustomEvent("changepagenext", {
          detail: {
            inputPage: this.currentInputPage,
            data: JSON.stringify(cols)
          }
        })
      );
    }
  }

  /**
   * @description : 必須項目に全て値が入力されているかの確認
   * @return : 必須項目には値が全て入っている or このまま続けるとされた場合は true を返す
   */
  _isRequiredValuesCheck() {
    // 実運用時には、未入力であれば先に進めなくする & より詳細な形式チェックを行うなどをすべき
    const targetId = this.columns.findIndex(
      (c) =>
        c[fnATD_REQUIRED_FIELD] &&
        c[fnATD_DATATYPE_FIELD] !== "チェックボックス" &&
        !c[fnATD_VALUE_FIELD]
    );
    return targetId >= 0
      ? confirm(
          `項目「 ${this.columns[targetId][fnATD_NAME_FIELD]} 」が入力されていません。このまま続けますか？`
        )
      : true;
  }
}
