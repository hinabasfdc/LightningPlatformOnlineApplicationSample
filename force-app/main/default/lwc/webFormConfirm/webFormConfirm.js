import { LightningElement, api, track } from "lwc";
import upsertApplication from "@salesforce/apex/DAF_RecordOperationApexController.upsertApplication";
import upsertApplicationDetails from "@salesforce/apex/DAF_RecordOperationApexController.upsertApplicationDetails";
import createContentDocumentLink from "@salesforce/apex/DAF_FileAttachementApexController.createContentDocumentLink";
import {
  onAPPLICATION_OBJECT,
  fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD,
  fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD,
  fnAT_ISFILEUPLOADACCEPTED_FIELD,
  fnA_APPTEMP_FIELD,
  fnATD_CATEGORY_FIELD,
  fnATD_STDCOLUMNNAME_FIELD,
  fnATD_VALUE_FIELD,
  fnAD_APP_FIELD,
  fnAD_APPTEMPDET_FIELD,
  fnATD_ISTEXT_FIELD,
  fnAD_TEXT_FIELD,
  fnATD_ISLONGTEXTAREA_FIELD,
  fnAD_LONGTEXTAREA_FIELD,
  fnATD_ISNUMBER_FIELD,
  fnAD_NUMBER_FIELD,
  fnATD_ISMAIL_FIELD,
  fnATD_ISURL_FIELD,
  fnATD_ISDATE_FIELD,
  fnATD_ISTIME_FIELD,
  fnATD_ISCURRENCY_FIELD,
  fnATD_ISCHECKBOX_FIELD,
  fnATD_ISPICKLIST_FIELD
} from "c/appTemplateSchema";

export default class WebFormConfirm extends LightningElement {
  buttonPreviousEnabled = true;
  buttonNextEnabled = false;

  @api inputData;
  @api uploadedFileDocumentIds;
  @api appTemplate;
  @track columns;
  objectApiName = onAPPLICATION_OBJECT;
  createdAppRecordId;

  // 申請定義の各種項目値を返す getter
  get checkboxConfirmEnabled() {
    return !!this.appTemplate.fields[fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD]
      .value;
  }
  get checkboxConfirmText() {
    return (
      this.appTemplate.fields[fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD].value ??
      "内容を確認しました"
    );
  }
  get isFileUploadAccepted() {
    return !!this.appTemplate.fields[fnAT_ISFILEUPLOADACCEPTED_FIELD].value;
  }
  get numOfUploadedFiled() {
    const files = JSON.parse(this.uploadedFileDocumentIds);
    return files.length;
  }

  /**
   * @description : 初期化処理。データをコンポーネントの columns に展開
   */
  connectedCallback() {
    if (this.inputData) {
      this.columns = JSON.parse(this.inputData);
    }

    if (!this.checkboxConfirmEnabled) {
      this.buttonNextEnabled = true;
    }
  }

  /**
   * @description : 同意チェックボックスの有効化を「次へ」ボタンに連動
   */
  handleChangeConfirmCheck(evt) {
    this.buttonNextEnabled = evt.target.checked;
  }

  /**
   * @description  : データ登録(標準項目)を実行 await で呼び出されるので Promise を返す
   **/
  _upsertApplicationSync() {
    return new Promise((resolve, reject) => {
      // 標準項目のデータ登録用オブジェクト作成し、申請手続き ID と、すでに登録されていた場合は ID を設定
      // 値格納変数から、標準項目の値を抽出し、データ登録用オブジェクトに追加
      const std = this.columns
        .filter(
          (c) =>
            c[fnATD_CATEGORY_FIELD] === "標準" &&
            c[fnATD_STDCOLUMNNAME_FIELD] &&
            c[fnATD_VALUE_FIELD]
        )
        .reduce(
          (params, c) => {
            params[c[fnATD_STDCOLUMNNAME_FIELD]] = c[fnATD_VALUE_FIELD];
            return params;
          },
          { [fnA_APPTEMP_FIELD]: this.appTemplate?.fields?.Id?.value ?? null }
        );

      console.log(std);
      // データ登録用オブジェクトを JSON 化して、Apex メソッドを呼び出し
      const params = {
        std: JSON.stringify(std)
      };
      upsertApplication(params)
        .then((ret) => {
          if (ret) {
            resolve(ret);
          } else {
            reject("_upsertApplicationSync: no record id.");
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * @description  : データ登録(カスタム項目)を実行 await で呼び出されるので Promise を返す
   **/
  _upsertApplicationDetailsSync(recordId) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] _upsertApplicationDetails");

      // レコードIDが無い場合は終了
      if (!recordId) {
        resolve();
      }

      // データ登録用の配列を設定
      const customs = this.columns
        .filter((c) => c[fnATD_CATEGORY_FIELD] === "カスタム")
        .map((c) => {
          const v = c[fnATD_VALUE_FIELD];
          return {
            [fnAD_APP_FIELD]: recordId,
            [fnAD_APPTEMPDET_FIELD]: c.Id,
            Id: c.detailRecordId ?? null,
            [fnAD_TEXT_FIELD]:
              c[fnATD_ISTEXT_FIELD] ||
              c[fnATD_ISMAIL_FIELD] ||
              c[fnATD_ISDATE_FIELD] ||
              c[fnATD_ISTIME_FIELD] ||
              c[fnATD_ISCHECKBOX_FIELD] ||
              c[fnATD_ISPICKLIST_FIELD]
                ? v
                : null,
            [fnAD_LONGTEXTAREA_FIELD]:
              c[fnATD_ISLONGTEXTAREA_FIELD] || c[fnATD_ISURL_FIELD] ? v : null,
            [fnAD_NUMBER_FIELD]:
              c[fnATD_ISNUMBER_FIELD] || c[fnATD_ISCURRENCY_FIELD] ? v : null
          };
        });

      // カスタム項目が無い場合は終了
      if (customs.length === 0) {
        resolve();
      }

      console.log(customs);

      // データ登録用オブジェクトの配列を JSON 化して、Apex メソッドを呼び出し
      const params = {
        customs: JSON.stringify(customs)
      };
      upsertApplicationDetails(params)
        .then((ret) => {
          const retvals = JSON.parse(ret);

          // データ保管用オブジェクト配列に作成された申請明細レコードの ID を設定
          this.columns = this.columns.map((c) => {
            if (c[fnATD_CATEGORY_FIELD] !== "カスタム") {
              return c;
            }
            const detailTemplate = retvals.find(
              (v) => v[fnAD_APPTEMPDET_FIELD] === c.Id
            );
            if (!detailTemplate) {
              return c;
            }
            c.detailRecordId = detailTemplate.Id;
            return c;
          });
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * @description  : データ登録(ファイル添付)を実行 await で呼び出されるので Promise を返す
   **/
  _createAttachmentFileLink() {
    return new Promise((resolve, reject) => {
      const params = {
        recordId: this.createdAppRecordId,
        documentIdsJson: this.uploadedFileDocumentIds
      };
      createContentDocumentLink(params)
        .then((ret) => {
          resolve(ret);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * @description : 「戻る」ボタンを押した時の処理(WebForm のメソッドをコール)
   */
  handleClickPagePrevious() {
    this.dispatchEvent(
      new CustomEvent("changepageprevious", {
        detail: {
          currentpage: "confirm"
        }
      })
    );
  }

  /**
   * @description : 「次へ」ボタンを押した時の処理(データの登録処理を実行した後に、WebForm のメソッドをコール)
   */
  async handleClickPageNext() {
    try {
      // 親の申請レコード
      this.createdAppRecordId = await this._upsertApplicationSync();
      console.log(this.createdAppRecordId);
      // 子の申請明細レコード
      await this._upsertApplicationDetailsSync(this.createdAppRecordId);
      // ファイルの紐付け
      if (this.uploadedFileDocumentIds) {
        const uploadedFileDocumentIds = JSON.parse(
          this.uploadedFileDocumentIds
        );
        if (uploadedFileDocumentIds.length > 0) {
          await this._createAttachmentFileLink();
        }
      }

      // WebForm のメソッドを呼び出し
      this.dispatchEvent(
        new CustomEvent("changepagenext", {
          detail: {
            data: this.createdAppRecordId
          }
        })
      );
    } catch (err) {
      console.log(err);
    }
  }
}
