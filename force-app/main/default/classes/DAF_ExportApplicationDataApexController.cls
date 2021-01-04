/**
 * @description       : オンライン申請パッケージ データエクスポート(一覧出力)用 Apex クラス
 * @author            : Hiroyuki Inaba @ Salesforce
 * @last modified on  : 2020-12-30
 **/
public with sharing class DAF_ExportApplicationDataApexController {
    
  /**
   * @description : 選択リストでの選択用に登録されている申請定義の一覧を取得して返す
   * @return List : 申請定義のリスト
   **/
  @AuraEnabled(cacheable=true)
  public static List<jpseps__objApplicationTemplate__c> getApplicationTemplates() {
    return [SELECT Id, Name FROM jpseps__objApplicationTemplate__c];
  }

  /**
   * @description    : 指定された申請データを取得して返す
   * @param recordId : 申請定義の ID
   * @return List    : 登録された申請データの一覧
   **/
  @AuraEnabled(cacheable=true)
  public static List<jpseps__objApplication__c> getApplicationData(
    String recordId
  ) {
    if (String.isBlank(recordId))
      return null;

    String retval = '';
    String DefinedStandardColumns = '';

    // 定義された標準項目の API 参照名を取得してカンマ区切りの文字列に
    List<jpseps__objApplicationTemplateDetail__c> atds = [
      SELECT jpseps__StdColumnName__c
      FROM jpseps__objApplicationTemplateDetail__c
      WHERE
        jpseps__objApplicationTemplate__c = :recordId
        AND jpseps__Category__c = '標準'
      ORDER BY jpseps__SortOrder__c ASC
    ];
    if (atds.size() > 0)
      for (Integer i = 0; i < atds.size(); i++)
        if(String.isNotBlank(atds[i].jpseps__StdColumnName__c))
          DefinedStandardColumns += atds[i].jpseps__StdColumnName__c + ',';

    // データ抽出の SOQL を組み立てて実行し、返却
    return Database.query(
      'SELECT Id,Name,' +
      DefinedStandardColumns +
      '(SELECT Id,jpseps__DataType__c,jpseps__Text__c,jpseps__Number__c,jpseps__LongTextArea__c FROM jpseps__objApplication__c.jpseps__objApplicationDetail__r ORDER BY jpseps__SortOrder__c ASC) FROM jpseps__objApplication__c WHERE jpseps__objApplicationTemplate__c =:recordId ORDER BY CreatedDate DESC'
    );
  }
}
