// 名前空間の前置詞、および各項目の API 参照名を定義
export const nsPrefix = "";
export const fnAT_TITLE_FIELD = "Name";
export const fnAT_CATEGORY_FIELD = nsPrefix + "Category__c";
export const fnAT_DESCRIPTION_FIELD = nsPrefix + "Description__c";
export const fnAT_CONDITION_FIELD = nsPrefix + "Condition__c";
export const fnAT_CLOSEDATE_FIELD = nsPrefix + "CloseDate__c";
export const fnAT_STATUS_FIELD = nsPrefix + "Status__c";
export const fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD =
  nsPrefix + "isAgreementCheckboxEnabled__c";
export const fnAT_AGREEMENTCHECKBOXTEXT_FIELD =
  nsPrefix + "AgreementCheckText__c";
export const fnAT_ISFILEUPLOADACCEPTED_FIELD =
  nsPrefix + "isFileUploadAccepted__c";
export const fnAT_FILEUPLOADDESCRIPTION_FIELD =
  nsPrefix + "FileUploadDescription__c";
export const fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD =
  nsPrefix + "isConfirmationCheckboxEnabled__c";
export const fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD =
  nsPrefix + "ConfirmationCheckDescription__c";
export const fnAT_THANKYOUPAGEDESCRIPTION_FIELD =
  nsPrefix + "ThankyouPageDescription__c";

// getRecord で取得するようにオブジェクト名を付加した配列を生成
export const GETRECORD_FIELDS = [
  "Id",
  fnAT_TITLE_FIELD,
  fnAT_CATEGORY_FIELD,
  fnAT_DESCRIPTION_FIELD,
  fnAT_CONDITION_FIELD,
  fnAT_CLOSEDATE_FIELD,
  fnAT_STATUS_FIELD,
  fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD,
  fnAT_AGREEMENTCHECKBOXTEXT_FIELD,
  fnAT_ISFILEUPLOADACCEPTED_FIELD,
  fnAT_FILEUPLOADDESCRIPTION_FIELD,
  fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD,
  fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD,
  fnAT_THANKYOUPAGEDESCRIPTION_FIELD
].map((f) => `objApplicationTemplate__c.${f}`);

/* 定義詳細 */
// 名前空間、オブジェクト・項目の API 参照名を定義
export const onAPPLICATION_OBJECT = nsPrefix + "objApplication__c";
export const fnATD_DATATYPE_FIELD = nsPrefix + "DataType__c";
export const fnATD_OPTIONS_FIELD = nsPrefix + "Options__c";
export const fnATD_VALUE_FIELD = nsPrefix + "Value__c";
export const fnATD_TEXT_FIELD = nsPrefix + "Text__c";
export const fnATD_REQUIRED_FIELD = nsPrefix + "Required__c";
export const fnATD_NAME_FIELD = "Name";
export const fnATD_CATEGORY_FIELD = nsPrefix + "Category__c";
export const fnATD_STDCOLUMNNAME_FIELD = nsPrefix + "StdColumnName__c";
export const fnATD_ISTEXT_FIELD = nsPrefix + "isText__c";
export const fnATD_ISLONGTEXTAREA_FIELD = nsPrefix + "isLongTextArea__c";
export const fnATD_ISNUMBER_FIELD = nsPrefix + "isNumber__c";
export const fnATD_ISDATE_FIELD = nsPrefix + "isDate__c";
export const fnATD_ISTIME_FIELD = nsPrefix + "isTime__c";
export const fnATD_ISCURRENCY_FIELD = nsPrefix + "isCurrency__c";
export const fnATD_ISCHECKBOX_FIELD = nsPrefix + "isCheckbox__c";
export const fnATD_ISPICKLIST_FIELD = nsPrefix + "isPicklist__c";

export const fnAD_TEXT_FIELD = nsPrefix + "Text__c";
export const fnAD_LONGTEXTAREA_FIELD = nsPrefix + "LongTextArea__c";
export const fnAD_NUMBER_FIELD = nsPrefix + "Number__c";
export const fnAD_APP_FIELD = nsPrefix + "objApplication__c";
export const fnAD_APPTEMPDET_FIELD =
  nsPrefix + "objApplicationTemplateDetail__c";

export const fnA_APPTEMP_FIELD = nsPrefix + "objApplicationTemplate__c";
export const fnA_RELATION = nsPrefix + "objApplicationDetail__r";

export const DATATYPE_TEXT = "テキスト";
export const DATATYPE_LONG_TEXT_AREA = "ロングテキストエリア";
export const DATATYPE_EMAIL = "メール";
export const DATATYPE_URL = "URL";
export const DATATYPE_NUMBER = "数値";
export const DATATYPE_CURRENCY = "通貨";
export const DATATYPE_DATE = "日付";
export const DATATYPE_TIME = "時間";
export const DATATYPE_CHECKBOX = "チェックボックス";
export const DATATYPE_PICKLIST = "選択リスト";
