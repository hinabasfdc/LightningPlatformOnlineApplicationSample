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
export const fnAT_PAGE_NAMES_FIELD = nsPrefix + "InputPageNames__c";

// getRecord で取得するようにオブジェクト名を付加した配列を生成
export const GETRECORD_FIELDS = [
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
  fnAT_THANKYOUPAGEDESCRIPTION_FIELD,
  fnAT_PAGE_NAMES_FIELD
].map((f) => `objApplicationTemplate__c.${f}`);
