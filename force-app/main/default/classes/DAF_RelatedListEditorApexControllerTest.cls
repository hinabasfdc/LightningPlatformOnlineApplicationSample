@isTest
public with sharing class DAF_RelatedListEditorApexControllerTest {
  @TestSetup
  static void setup() {
    objApplicationTemplate__c at = new objApplicationTemplate__c(
      Name = 'テスト用申請手続き'
    );
    insert at;

    objApplicationTemplatePage__c ap1 = new objApplicationTemplatePage__c(
      Name = 'ページ1',
      Order__c = 1,
      objApplicationTemplate__c = at.Id
    );
    insert ap1;

    List<objApplicationTemplateRow__c> rows = new List<objApplicationTemplateRow__c>();
    objApplicationTemplateRow__c ar1_1 = new objApplicationTemplateRow__c(
      Order__c = 1,
      AppTemplatePage__c = ap1.Id
    );
    rows.add(ar1_1);
    objApplicationTemplateRow__c ar1_2 = new objApplicationTemplateRow__c(
      Order__c = 2,
      AppTemplatePage__c = ap1.Id
    );
    rows.add(ar1_2);

    insert rows;

    List<objApplicationTemplateDetail__c> atds = new List<objApplicationTemplateDetail__c>();
    objApplicationTemplateDetail__c atd1 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = at.Id,
      Name = '氏名',
      Category__c = '標準',
      AppTemplateRow__c = ar1_1.Id,
      ColumnOrder__c = 1
    );
    atds.add(atd1);
    objApplicationTemplateDetail__c atd2 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = at.Id,
      Name = '事業者名',
      Category__c = 'カスタム',
      AppTemplateRow__c = ar1_1.Id,
      ColumnOrder__c = 2
    );
    atds.add(atd2);

    insert atds;
  }

  @isTest
  static void testIds() {
    objApplicationTemplate__c at = [
      SELECT Id
      FROM objApplicationTemplate__c
      WHERE Name = :'テスト用申請手続き'
      LIMIT 1
    ];
    List<objApplicationTemplateDetail__c> records = DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecords(
      at.Id
    );

    System.assertEquals(2, records.size());
  }

  @isTest
  static void testNoParameter() {
    List<objApplicationTemplateDetail__c> ret = DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecords(
      ''
    );
    System.assertEquals(null, ret);
  }

  @isTest
  static void testinvalidParameter() {
    List<objApplicationTemplateDetail__c> records = DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecords(
      'ABCDEFG'
    );
    System.assertEquals(0, records.size());
  }

  @isTest
  static void testDeletePage() {
    objApplicationTemplatePage__c ap1 = [
      SELECT Id
      FROM objApplicationTemplatePage__c
      WHERE Name = 'ページ1'
    ];

    Boolean res = DAF_RelatedListEditorApexController.deletePage(ap1.Id);
    System.assertEquals(true, res);
  }

  @isTest
  static void testInvalidDeletePage() {
    Boolean res = DAF_RelatedListEditorApexController.deletePage(null);
    System.assertEquals(false, res);
  }

  @isTest
  static void testDeleteRow() {
    objApplicationTemplatePage__c ap = [
      SELECT Id, (SELECT Id FROM appTemplateRows__r)
      FROM objApplicationTemplatePage__c
      WHERE Name = 'ページ1'
    ];
    System.assertEquals(2, ap.appTemplateRows__r.size());

    Boolean res1 = DAF_RelatedListEditorApexController.deleteRow(
      ap.appTemplateRows__r[0].Id,
      false
    );
    System.assertEquals(true, res1);
    Boolean res2 = DAF_RelatedListEditorApexController.deleteRow(
      ap.appTemplateRows__r[1].Id,
      true
    );

    System.assertEquals(true, res2);

    Boolean res3 = DAF_RelatedListEditorApexController.deleteRow(null, false);
    System.assertEquals(false, res3);
  }

  @isTest
  static void testDeleteColumn() {
    List<objApplicationTemplateDetail__c> atds = [
      SELECT Id
      FROM objApplicationTemplateDetail__c
    ];

    System.assertEquals(2, atds.size());
    Boolean res1 = DAF_RelatedListEditorApexController.deleteColumn(
      atds[0].Id,
      false,
      false
    );
    System.assertEquals(true, res1);
    Boolean res2 = DAF_RelatedListEditorApexController.deleteColumn(
      atds[1].Id,
      true,
      true
    );
    System.assertEquals(true, res1);

    Boolean res3 = DAF_RelatedListEditorApexController.deleteColumn(
      null,
      true,
      true
    );
    System.assertEquals(false, res3);
  }

  @isTest
  static void testSaveApplicationTemplateDetails() {
    List<objApplicationTemplateDetail__c> atds = [
      SELECT
        Id,
        ColumnOrder__c,
        objApplicationTemplate__c,
        AppTemplateRow__r.Id,
        AppTemplateRow__r.Order__c,
        AppTemplateRow__r.AppTemplatePage__r.Id,
        AppTemplateRow__r.AppTemplatePage__r.Name,
        AppTemplateRow__r.AppTemplatePage__r.Order__c
      FROM objApplicationTemplateDetail__c
    ];

    DAF_RelatedListEditorApexController.AppRow row = new DAF_RelatedListEditorApexController.AppRow();
    row.id = atds[0].AppTemplateRow__r.Id;
    row.order = Integer.valueOf(atds[0].AppTemplateRow__r.Order__c);
    row.columns = atds;

    DAF_RelatedListEditorApexController.AppPage page = new DAF_RelatedListEditorApexController.AppPage();
    page.id = atds[0].AppTemplateRow__r.AppTemplatePage__r.Id;
    page.order = Integer.valueOf(
      atds[0].AppTemplateRow__r.AppTemplatePage__r.Order__c
    );
    page.name = atds[0].AppTemplateRow__r.AppTemplatePage__r.Name;
    page.rows = new List<DAF_RelatedListEditorApexController.AppRow>{ row };

    List<DAF_RelatedListEditorApexController.AppPage> pages = new List<DAF_RelatedListEditorApexController.AppPage>{
      page
    };
    String pagesStr = JSON.serialize(pages);

    List<objApplicationTemplateDetail__c> res1 = DAF_RelatedListEditorApexController.saveApplicationTemplateDetails(
      atds[0].objApplicationTemplate__c,
      pagesStr
    );

    System.assertEquals(2, res1.size());
  }
}
