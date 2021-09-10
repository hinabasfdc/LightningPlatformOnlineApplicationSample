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
    if (String.isBlank(recordId)) {
      return null;
    }

    String retval = '';
    List<objApplicationTemplateDetail__c> atds = [
      SELECT
        Id,
        Name,
        Description__c,
        Options__c,
        Required__c,
        SortOrder__c,
        RowNumber__c,
        PageNumber__c,
        StdColumnName__c,
        DataType__c,
        Category__c,
        Value__c,
        objApplicationTemplate__r.InputPageNames__c
      FROM objApplicationTemplateDetail__c
      WHERE objApplicationTemplate__c = :recordId
      ORDER BY SortOrder__c ASC
    ];
    if (atds.size() > 0) {
      retval = System.JSON.serialize(atds);
    }
    return retval;
  }

  @AuraEnabled
  public static Boolean deletePage(
    Id templateId,
    List<Id> detailIds,
    Integer pageNumber,
    String pageName
  ) {
    try {
      objApplicationTemplate__c template = [
        SELECT Id, InputPageNames__c
        FROM objApplicationTemplate__c
        WHERE Id = :templateId
      ];

      if (String.isBlank(template.InputPageNames__c)) {
        return false;
      }
      List<String> pageNames = template.InputPageNames__c.split(',');
      /*
      // TODO: 申請定義レイアウトオブジェクトにする。
      if (pageNames.size() < pageNumber) {
        return false;
      }
      if (pageNames[pageNumber - 1] != pageName) {
        return false;
      }
      */

      Integer pageIndex = null;
      for (Integer i = 0; i < pageNames.size(); i++) {
        if (pageName == pageNames[i]) {
          pageIndex = i;
        }
      }
      if (pageIndex == null) {
        return false;
      }

      pageNames.remove(pageIndex);
      template.InputPageNames__c = String.join(pageNames, ',');
      update template;

      List<objApplicationTemplateDetail__c> deleteTargetDetails = [
        SELECT Id
        FROM objApplicationTemplateDetail__c
        WHERE Id IN :detailIds
      ];

      delete deleteTargetDetails;

      List<objApplicationTemplateDetail__c> details = [
        SELECT Id, PageNumber__c
        FROM objApplicationTemplateDetail__c
        WHERE objApplicationTemplate__c = :templateId
        ORDER BY PageNumber__c ASC
      ];
      Integer newPageNum = 0;
      Integer prevPage = 0;
      for (objApplicationTemplateDetail__c detail : details) {
        Integer existingPageNum = Integer.valueOf(detail.PageNumber__c);
        if (prevPage != existingPageNum) {
          prevPage = existingPageNum;
          newPageNum++;
        }

        detail.PageNumber__c = newPageNum;
      }
      update details;

      return true;
    } catch (Exception e) {
      System.debug(e);
      return false;
    }
  }

  @AuraEnabled
  public static List<objApplicationTemplateDetail__c> saveApplicationTemplateDetails(
    Id recordId,
    String pageNames,
    String details
  ) {
    try {
      List<objApplicationTemplateDetail__c> data = (List<objApplicationTemplateDetail__c>) JSON.deserialize(
        details,
        List<objApplicationTemplateDetail__c>.class
      );
      objApplicationTemplate__c template = [
        SELECT Id, InputPageNames__c
        FROM objApplicationTemplate__c
        WHERE Id = :recordId
      ];
      template.InputPageNames__c = pageNames;
      update template;

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
