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
  public static Boolean deleteColumn(
    Id columnId,
    Boolean shouldDeletePage,
    Boolean shouldDeleteRow
  ) {
    try {
      objApplicationTemplateDetail__c column = [
        SELECT Id, AppTemplateRow__c, AppTemplateRow__r.AppTemplatePage__c
        FROM objApplicationTemplateDetail__c
        WHERE Id = :columnId
      ];

      if (column == null) {
        return false;
      }

      if (shouldDeleteRow && column.AppTemplateRow__c != null) {
        List<objApplicationTemplateRow__c> page = [
          SELECT Id
          FROM objApplicationTemplateRow__c
          WHERE Id = :column.AppTemplateRow__c
        ];
        delete page;
      }

      if (
        shouldDeletePage &&
        column.AppTemplateRow__r != null &&
        column.AppTemplateRow__r.AppTemplatePage__c != null
      ) {
        List<objApplicationTemplatePage__c> page = [
          SELECT Id
          FROM objApplicationTemplatePage__c
          WHERE Id = :column.AppTemplateRow__r.AppTemplatePage__c
        ];
        delete page;
      }

      delete column;

      return true;
    } catch (Exception e) {
      System.debug(e);
      return false;
    }
  }

  public class AppPage {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public Integer order;
    @AuraEnabled
    public List<AppRow> rows;
  }

  public class AppRow {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public Integer order;
    @AuraEnabled
    public List<objApplicationTemplateDetail__c> columns;
  }

  @AuraEnabled
  public static List<objApplicationTemplateDetail__c> saveApplicationTemplateDetails(
    Id recordId,
    String pagesStr
  ) {
    try {
      List<AppPage> ps = (List<AppPage>) JSON.deserialize(
        pagesStr,
        List<AppPage>.class
      );

      List<objApplicationTemplatePage__c> pages = new List<objApplicationTemplatePage__c>();
      for (AppPage p : ps) {
        objApplicationTemplatePage__c page = new objApplicationTemplatePage__c();
        page.Id = p.id;
        page.Order__c = p.order;
        page.objApplicationTemplate__c = recordId;
        page.Name = p.name;
        pages.add(page);
      }

      upsert pages;

      List<objApplicationTemplateRow__c> rows = new List<objApplicationTemplateRow__c>();
      for (objApplicationTemplatePage__c page : pages) {
        for (AppPage p : ps) {
          if (page.Order__c == p.order) {
            for (AppRow r : p.rows) {
              objApplicationTemplateRow__c row = new objApplicationTemplateRow__c();
              row.Id = r.id;
              row.Order__c = r.order;
              row.AppTemplatePage__c = page.Id;
              rows.add(row);
            }
          }
        }
      }
      upsert rows;

      System.debug(rows);

      List<objApplicationTemplateDetail__c> cols = new List<objApplicationTemplateDetail__c>();
      for (AppPage p : ps) {
        for (objApplicationTemplatePage__c page : pages) {
          if (page.Order__c != p.order) {
            continue;
          }
          for (objApplicationTemplateRow__c row : rows) {
            if (row.AppTemplatePage__c != page.Id) {
              continue;
            }
            for (AppRow r : p.rows) {
              if (r.order != row.Order__c) {
                continue;
              }
              for (objApplicationTemplateDetail__c c : r.columns) {
                c.AppTemplateRow__c = row.Id;
                c.objApplicationTemplate__c = recordId;
                c.Required__c = c.Required__c == true ? true : false;
                cols.add(c);
              }
            }
          }
        }
      }
      for (objApplicationTemplateDetail__c col : cols) {
        System.debug(col);
      }
      upsert cols;

      return cols;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
