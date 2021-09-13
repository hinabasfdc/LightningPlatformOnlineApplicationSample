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
  public static List<objApplicationTemplateDetail__c> getApplicationTemplateDetailRecords(
    String recordId
  ) {
    if (String.isBlank(recordId)) {
      return null;
    }
    try {
      return [
        SELECT
          Id,
          Name,
          Description__c,
          Options__c,
          Required__c,
          StdColumnName__c,
          DataType__c,
          Category__c,
          Value__c,
          ColumnOrder__c,
          AppTemplateRow__r.Id,
          AppTemplateRow__r.Order__c,
          AppTemplateRow__r.AppTemplatePage__r.Id,
          AppTemplateRow__r.AppTemplatePage__r.Name,
          AppTemplateRow__r.AppTemplatePage__r.Order__c
        FROM objApplicationTemplateDetail__c
        WHERE objApplicationTemplate__c = :recordId
        ORDER BY
          AppTemplateRow__r.AppTemplatePage__r.Order__c,
          AppTemplateRow__r.Order__c,
          ColumnOrder__c,
          Id
      ];
    } catch (Exception e) {
      return null;
    }
  }

  @AuraEnabled
  public static Boolean deletePage(Id pageId) {
    try {
      objApplicationTemplatePage__c page = [
        SELECT Id, (SELECT Id FROM appTemplateRows__r)
        FROM objApplicationTemplatePage__c
        WHERE Id = :pageId
      ];

      if (page == null || page.appTemplateRows__r == null) {
        return false;
      }

      Map<Id, objApplicationTemplateRow__c> rowMap = new Map<Id, objApplicationTemplateRow__c>(
        page.appTemplateRows__r
      );
      List<id> rowIds = new List<Id>(rowMap.keySet());
      List<objApplicationTemplateRow__c> rows = rowMap.values();

      List<objApplicationTemplateDetail__c> details = [
        SELECT Id
        FROM objApplicationTemplateDetail__c
        WHERE appTemplateRow__r.Id IN :rowIds
      ];

      delete details;
      delete rows;
      delete page;

      return true;
    } catch (Exception e) {
      System.debug(e);
      return false;
    }
  }

  @AuraEnabled
  public static Boolean deleteRow(Id rowId, Boolean shouldDeletePage) {
    try {
      objApplicationTemplateRow__c row = [
        SELECT Id, AppTemplatePage__c, (SELECT Id FROM appTemplateDetails__r)
        FROM objApplicationTemplateRow__c
        WHERE Id = :rowId
      ];

      List<objApplicationTemplateDetail__c> details = row.appTemplateDetails__r;

      if (row == null || row.appTemplateDetails__r == null) {
        return false;
      }

      delete details;
      delete row;
      if (shouldDeletePage) {
        objApplicationTemplatePage__c page = [
          SELECT Id
          FROM objApplicationTemplatePage__c
          WHERE Id = :row.AppTemplatePage__c
        ];
        delete page;
      }

      return true;
    } catch (Exception e) {
      System.debug(e);
      return false;
    }
  }

  @AuraEnabled
  public static List<objApplicationTemplateDetail__c> saveApplicationTemplateDetails(
    Id recordId,
    String details
  ) {
    try {
      List<objApplicationTemplateDetail__c> data = (List<objApplicationTemplateDetail__c>) JSON.deserialize(
        details,
        List<objApplicationTemplateDetail__c>.class
      );

      // TODO: update pages, rows, fields.

      for (objApplicationTemplateDetail__c detail : data) {
        if (String.isBlank(detail.objApplicationTemplate__c)) {
          detail.objApplicationTemplate__c = recordId;
        }
      }
      upsert data;
      return data;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
