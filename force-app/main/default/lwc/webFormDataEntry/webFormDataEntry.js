import { LightningElement, api, track } from "lwc";
import {
  onAPPLICATION_OBJECT,
  fnATD_DATATYPE_FIELD,
  fnATD_TEXT_FIELD,
  fnATD_OPTIONS_FIELD,
  fnATD_PAGE_NUMBER,
  fnATD_ROW_NUMBER
} from "c/appTemplateSchema";

export default class WebFormDataEntry extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = true;

  @api currentStep;
  @api createdApplicationRecordId;
  @api appTemplate;

  @track pages;
  objectApiName = onAPPLICATION_OBJECT;

  get selectedPage() {
    return this.appTemplate.appTemplatePages__r.find(
      (p) => p.Id === this.currentStep.id
    );
  }

  convertDetailsDataIntoPages = (data) => {
    return data
      .reduce((ps, d) => {
        const detail = { ...d };

        if (detail.DataType__c === "チェックボックス") {
          detail.isCheckboxChecked = detail[fnATD_TEXT_FIELD] === "true";
        }
        // 項目が選択リストだった場合は、選択肢の項目値からコンボボックスの選択肢形式に変換
        if (detail[fnATD_DATATYPE_FIELD] === "選択リスト") {
          detail.PicklistValues = detail[fnATD_OPTIONS_FIELD]
            ?.split(",")
            .map((o) => {
              return {
                label: o,
                value: o
              };
            });
        }
        if (ps[detail[fnATD_PAGE_NUMBER] - 1]) {
          if (
            ps[detail[fnATD_PAGE_NUMBER] - 1].rows[detail[fnATD_ROW_NUMBER] - 1]
          ) {
            ps[detail[fnATD_PAGE_NUMBER] - 1].rows[
              detail[fnATD_ROW_NUMBER] - 1
            ].cols.push(detail);
          } else {
            ps[detail[fnATD_PAGE_NUMBER] - 1].rows[
              detail[fnATD_ROW_NUMBER] - 1
            ] = {
              row: detail[fnATD_ROW_NUMBER],
              cols: [detail]
            };
          }
        } else {
          ps[detail[fnATD_PAGE_NUMBER] - 1] = {
            page: detail[fnATD_PAGE_NUMBER],
            rows: []
          };
          // 今は１列１行
          ps[detail[fnATD_PAGE_NUMBER] - 1].rows[detail[fnATD_ROW_NUMBER] - 1] =
            {
              row: detail[fnATD_ROW_NUMBER],
              cols: [detail]
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
  handleChangeValue(e) {
    const updatedRows = this.selectedPage.appTemplateRows__r.map((r) => {
      const details = r.appTemplateDetails__r.map((d) => {
        if (d.Id !== e.target.dataset.id) {
          return d;
        }

        const detail = { ...d };
        if (detail.DataType__c === "チェックボックス") {
          // データタイプがチェックボックスだった場合のみ、設定する値の取り方を変更
          detail.Value__c = e.target.checked;
          detail.isCheckboxChecked = e.target.checked;
        } else {
          // チェックボックス以外は値をそのまま代入
          detail.Value__c = e.target.value;
        }
        return detail;
      });
      return { ...r, appTemplateDetails__r: details };
    });

    this.dispatchEvent(
      new CustomEvent("changeinput", {
        detail: { ...this.selectedPage, appTemplateRows__r: updatedRows }
      })
    );
  }

  /**
   * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPagePrevious() {
    this.dispatchEvent(new CustomEvent("changepageprevious"));
  }

  /**
   * @description : 「次へ」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPageNext(e) {
    if (this._isRequiredValuesCheck()) {
      this.dispatchEvent(new CustomEvent("changepagenext"));
    }
  }

  /**
   * @description : 必須項目に全て値が入力されているかの確認
   * @return : 必須項目には値が全て入っている or このまま続けるとされた場合は true を返す
   */
  _isRequiredValuesCheck() {
    // 実運用時には、未入力であれば先に進めなくする & より詳細な形式チェックを行うなどをすべき
    const rows = this.selectedPage.appTemplateRows__r;
    for (let i = 0; i < rows.length; i++) {
      const details = rows[i].appTemplateDetails__r;
      for (let j = 0; j < details.length; j++) {
        const d = details[j];
        if (
          d.Required__c &&
          d.DataType__c !== "チェックボックス" &&
          !d.Value__c
        ) {
          return confirm(
            `項目「${d.Name}」が入力されていません。このまま続けますか？`
          );
        }
      }
    }
    return true;
  }
}
