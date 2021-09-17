import { ShowToastEvent } from "lightning/platformShowToastEvent";

/**
 * @description  : トースト表示
 **/
export const showToast = (self, title, message, variant) => {
  const event = new ShowToastEvent({
    title: title,
    message: message,
    variant: variant
  });
  self.dispatchEvent(event);
};

/**
 * @description  : 指定された URL パラメータの値を返す(c__XXXX のパラメータ名にする必要あり)
 **/
export const getURLParameter = (key) => {
  return new URL(window.location.href).searchParams.get(key);
};

/**
 * @description : Template - Page - Row - Detail Tree Structure
 */
export const buildTemplateTree = (details) => {
  if (details.length === 0) {
    return {};
  }

  const t = {
    ...details[0].AppTemplateRow__r.AppTemplatePage__r
      .objApplicationTemplate__r,
    appTemplatePages__r: []
  };
  for (let i = 0; i < details.length; i++) {
    const d = { ...details[i] };
    let page = t.appTemplatePages__r.find(
      (p) => p.Id === d.AppTemplateRow__r.AppTemplatePage__r.Id
    );
    if (!page) {
      t.appTemplatePages__r.push({
        ...d.AppTemplateRow__r.AppTemplatePage__r,
        appTemplateRows__r: []
      });
      page = t.appTemplatePages__r.find(
        (p) => p.Id === d.AppTemplateRow__r.AppTemplatePage__r.Id
      );
    }

    let row = page.appTemplateRows__r.find(
      (r) => r.Id === d.AppTemplateRow__r.Id
    );
    if (!row) {
      page.appTemplateRows__r.push({
        ...d.AppTemplateRow__r,
        appTemplateDetails__r: []
      });
      row = page.appTemplateRows__r.find(
        (r) => r.Id === d.AppTemplateRow__r.Id
      );
    }

    if (d.DataType__c === "チェックボックス") {
      d.isCheckboxChecked = d.Text__c === "true";
    }
    // 項目が選択リストだった場合は、選択肢の項目値からコンボボックスの選択肢形式に変換
    if (d.DataType__c === "選択リスト") {
      d.PicklistValues = d.Options__c?.split(",").map((o) => {
        return {
          label: o,
          value: o
        };
      });
    }

    row.appTemplateDetails__r.push(d);
  }
  return t;
};

export const flattenAppTemplate = (appTemplate) => {
  return appTemplate.appTemplatePages__r
    .map((p) => {
      return p.appTemplateRows__r.map((r) => {
        return JSON.parse(JSON.stringify(r.appTemplateDetails__r));
      });
    })
    .flat(3);
};

export const sanitizeHtml = (str) => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};
// Page : Stepの大区分
export const PAGE_SELECTOR = "selector";
export const PAGE_OVERVIEW = "overview";
export const PAGE_DATA_ENTRY = "dataentry";
export const PAGE_ATTACH_FILE = "attachfile";
export const PAGE_CONFIRM = "confirm";
export const PAGE_COMPLETE = "complete";
// Step
export const STEP_SELECTOR = {
  id: PAGE_SELECTOR,
  label: "",
  page: PAGE_SELECTOR,
  order: null
};

export const STEP_OVERVIEW = {
  id: PAGE_OVERVIEW,
  label: "手続き概要",
  page: PAGE_OVERVIEW,
  order: null
};
export const STEP_FILE_ATTACH = {
  id: PAGE_ATTACH_FILE,
  label: "ファイル添付",
  page: PAGE_ATTACH_FILE,
  order: null
};
export const STEP_CONFIRM = {
  id: PAGE_CONFIRM,
  label: "確認",
  page: PAGE_CONFIRM,
  order: null
};
export const STEP_COMPLETE = {
  id: PAGE_COMPLETE,
  label: "完了",
  page: PAGE_COMPLETE,
  order: null
};
