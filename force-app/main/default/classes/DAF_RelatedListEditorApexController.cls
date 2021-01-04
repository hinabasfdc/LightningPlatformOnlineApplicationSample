/**
 * @description       : オンライン申請パッケージ 項目定義コンポーネント用 Apex クラス
 * @author            : Hiroyuki Inaba @ Salesforce
 * @last modified on  : 2020-12-30
 **/
public with sharing class DAF_RelatedListEditorApexController {
  /**
   * @description      : 申請に使う項目定義の一覧を返します
   * @param recordId   : 申請定義のレコードID
   * @return String    : JSON 形式 の取得した一覧
   **/
  @AuraEnabled(cacheable=true)
  public static String getApplicationTemplateDetailRecordIds(String recordId) {
    if (String.isBlank(recordId))
      return null;

    String retval = '';
    List<objApplicationTemplateDetail__c> atds = [
      SELECT Id, Name, jpseps__SortOrder__c
      FROM jpseps__objApplicationTemplateDetail__c
      WHERE jpseps__objApplicationTemplate__c = :recordId
      ORDER BY jpseps__SortOrder__c ASC
    ];
    if (atds.size() > 0)
      retval = System.JSON.serialize(atds);

    return retval;
  }
}
