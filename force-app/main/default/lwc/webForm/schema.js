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
  "objApplicationTemplate__c." + fnAT_TITLE_FIELD,
  "objApplicationTemplate__c." + fnAT_CATEGORY_FIELD,
  "objApplicationTemplate__c." + fnAT_DESCRIPTION_FIELD,
  "objApplicationTemplate__c." + fnAT_CONDITION_FIELD,
  "objApplicationTemplate__c." + fnAT_CLOSEDATE_FIELD,
  "objApplicationTemplate__c." + fnAT_STATUS_FIELD,
  "objApplicationTemplate__c." + fnAT_ISAGREEMENTCHECKBOXENABLED_FIELD,
  "objApplicationTemplate__c." + fnAT_AGREEMENTCHECKBOXTEXT_FIELD,
  "objApplicationTemplate__c." + fnAT_ISFILEUPLOADACCEPTED_FIELD,
  "objApplicationTemplate__c." + fnAT_FILEUPLOADDESCRIPTION_FIELD,
  "objApplicationTemplate__c." + fnAT_ISCONFIRMATIONCHECKBOXENABLED_FIELD,
  "objApplicationTemplate__c." + fnAT_CONFIRMATIONCHECKDESCRIPTION_FIELD,
  "objApplicationTemplate__c." + fnAT_THANKYOUPAGEDESCRIPTION_FIELD
];
