@isTest
public with sharing class DAF_RecordOperationApexControllerTest {
  @TestSetup
  static void setup() {
    Date closedate = System.Date.today();

    List<objApplicationTemplate__c> ats = new List<objApplicationTemplate__c>();
    objApplicationTemplate__c at1 = new objApplicationTemplate__c(
      Name = 'テスト用申請手続き1',
      Status__c = '公開中',
      CloseDate__c = closedate.addDays(1)
    );
    ats.add(at1);
    objApplicationTemplate__c at2 = new objApplicationTemplate__c(
      Name = 'テスト用申請手続き2',
      Status__c = '下書き',
      CloseDate__c = closedate.addDays(1)
    );
    ats.add(at2);
    insert ats;

    List<objApplicationTemplatePage__c> pages = new List<objApplicationTemplatePage__c>();
    objApplicationTemplatePage__c ap1 = new objApplicationTemplatePage__c(
      Name = 'ページ1',
      Order__c = 1,
      objApplicationTemplate__c = at1.Id
    );
    pages.add(ap1);
    objApplicationTemplatePage__c ap2 = new objApplicationTemplatePage__c(
      Name = 'ページ2',
      Order__c = 2,
      objApplicationTemplate__c = at1.Id
    );
    pages.add(ap2);
    objApplicationTemplatePage__c ap3 = new objApplicationTemplatePage__c(
      Name = 'ページ1',
      Order__c = 1,
      objApplicationTemplate__c = at2.Id
    );
    pages.add(ap3);
    insert pages;

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

    objApplicationTemplateRow__c ar2_1 = new objApplicationTemplateRow__c(
      Order__c = 1,
      AppTemplatePage__c = ap2.Id
    );
    rows.add(ar2_1);

    objApplicationTemplateRow__c ar1_1_2 = new objApplicationTemplateRow__c(
      Order__c = 1,
      AppTemplatePage__c = ap3.Id
    );
    rows.add(ar1_1_2);

    insert rows;

    List<objApplicationTemplateDetail__c> atds = new List<objApplicationTemplateDetail__c>();
    objApplicationTemplateDetail__c atd1 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = ats[0].Id,
      Name = '氏名',
      Category__c = '標準',
      StdColumnName__c = 'FirstnameKanji__c',
      AppTemplateRow__c = ar1_1.Id,
      ColumnOrder__c = 1
    );
    atds.add(atd1);
    objApplicationTemplateDetail__c atd2 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = ats[0].Id,
      Name = '事業者名',
      Category__c = 'カスタム',
      DataType__c = 'テキスト',
      AppTemplateRow__c = ar1_1.Id,
      ColumnOrder__c = 2
    );
    atds.add(atd2);

    objApplicationTemplateDetail__c atd3 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = ats[0].Id,
      Name = '氏名',
      Category__c = '標準',
      StdColumnName__c = 'LastnameKanji__c',
      AppTemplateRow__c = ar1_2.Id,
      ColumnOrder__c = 1
    );
    atds.add(atd3);
    objApplicationTemplateDetail__c atd4 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = ats[0].Id,
      Name = '概要',
      Category__c = 'カスタム',
      DataType__c = 'ロングテキスト',
      AppTemplateRow__c = ar1_2.Id,
      ColumnOrder__c = 2
    );
    atds.add(atd4);

    objApplicationTemplateDetail__c atd5 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = ats[0].Id,
      Name = 'よみ',
      Category__c = '標準',
      DataType__c = 'FirstnameYomi__c',
      AppTemplateRow__c = ar2_1.Id,
      ColumnOrder__c = 1
    );
    atds.add(atd5);

    objApplicationTemplateDetail__c atd6 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = ats[1].Id,
      Name = 'よみ',
      Category__c = '標準',
      DataType__c = 'Mail__c',
      AppTemplateRow__c = ar1_1_2.Id,
      ColumnOrder__c = 1
    );
    atds.add(atd6);

    insert atds;

    objApplication__c a = new objApplication__c(
      objApplicationTemplate__c = ats[0].Id,
      FirstnameKanji__c = 'アストロ'
    );
    insert a;

    objApplicationDetail__c ad = new objApplicationDetail__c(
      objApplication__c = a.Id,
      objApplicationTemplateDetail__c = atds[1].Id,
      Text__c = 'アストロフォース'
    );
    insert ad;
  }

  @isTest
  static void testGetActiveApplications() {
    List<objApplicationTemplate__c> records = DAF_RecordOperationApexController.getActiveApplications(
      false
    );
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testGetActiveApplicationsIncludeDraft() {
    List<objApplicationTemplate__c> records = DAF_RecordOperationApexController.getActiveApplications(
      true
    );
    System.assertEquals(2, records.size());
  }

  @isTest
  static void testGetApplicationTemplateDetails() {
    objApplicationTemplate__c at = [
      SELECT Id
      FROM objApplicationTemplate__c
      WHERE Name = 'テスト用申請手続き1'
      LIMIT 1
    ];
    List<objApplicationTemplateDetail__c> records = DAF_RecordOperationApexController.getApplicationTemplateDetails(
      at.Id
    );

    System.assertEquals(5, records.size());
  }

  @isTest
  static void testGetApplicationTemplateDetailsJsonWithNoParameter() {
    List<objApplicationTemplateDetail__c> records = DAF_RecordOperationApexController.getApplicationTemplateDetails(
      ''
    );
    System.assertEquals(null, records);
  }

  @isTest
  static void testGetApplicationStdColumns() {
    objApplication__c a = [
      SELECT Id
      FROM objApplication__c
      WHERE FirstnameKanji__c = 'アストロ'
      LIMIT 1
    ];
    List<String> columns = DAF_RecordOperationApexController.getApplicationStdColumns(
      a.Id
    );

    System.assertEquals(3, columns.size());
  }

  @isTest
  static void testGetApplicationStdColumnsWithNoParameter() {
    List<String> ret = DAF_RecordOperationApexController.getApplicationStdColumns(
      ''
    );
    System.assertEquals(ret, null);
  }

  @isTest
  static void testGetApplicationStdColumnsWithUnexistingRecord() {
    List<String> columns = DAF_RecordOperationApexController.getApplicationStdColumns(
      '適当なやつ'
    );
    System.assertEquals(null, columns);
  }

  @isTest
  static void testGetApplicationCustomColumns() {
    objApplication__c a = [
      SELECT Id
      FROM objApplication__c
      WHERE FirstnameKanji__c = 'アストロ'
      LIMIT 1
    ];
    List<objApplicationDetail__c> records = DAF_RecordOperationApexController.getApplicationCustomColumns(
      a.Id
    );
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testGetApplicationCustomColumnsWithNoParameter() {
    List<objApplicationDetail__c> ret = DAF_RecordOperationApexController.getApplicationCustomColumns(
      ''
    );
    System.assertEquals(null, ret);
  }

  @isTest
  static void testUpsertApplication() {
    objApplicationTemplate__c at = [
      SELECT Id
      FROM objApplicationTemplate__c
      WHERE Name = 'テスト用申請手続き1'
      LIMIT 1
    ];
    objApplication__c a = new objApplication__c(
      objApplicationTemplate__c = at.Id,
      FirstnameKanji__c = 'コーディ'
    );

    objApplicationTemplateDetail__c atd = [
      SELECT Id
      FROM objApplicationTemplateDetail__c
      WHERE Name = '事業者名'
      LIMIT 1
    ];
    List<objApplicationDetail__c> ads = new List<objApplicationDetail__c>();
    objApplicationDetail__c ad = new objApplicationDetail__c(
      objApplicationTemplateDetail__c = atd.Id,
      Text__c = 'アストロカンパニー'
    );
    ads.add(ad);

    objApplication__c ret = DAF_RecordOperationApexController.insertApplication(
      a,
      ads,
      null
    );
    System.assertEquals(false, String.isBlank(ret.Id));
  }

  @isTest
  static void testUpdateApplicationDetails() {
    List<objApplicationDetail__c> ads = [
      SELECT Id
      FROM objApplicationDetail__c
      WHERE Text__c = 'アストロフォース'
    ];
    for (objApplicationDetail__c ad : ads) {
      ad.Text__c = 'アストロカンパニー';
    }

    List<Id> detailIds = DAF_RecordOperationApexController.updateApplicationDetails(
      ads
    );

    System.assertEquals(1, detailIds.size());
  }

  @isTest
  static void testUpsertApplicationWithNoParameter() {
    objApplication__c ret = DAF_RecordOperationApexController.insertApplication(
      null,
      null,
      null
    );
    System.assertEquals(null, ret);
  }

  @isTest
  static void testUpsertApplicationDetailsWithNoParameter() {
    List<Id> ret = DAF_RecordOperationApexController.updateApplicationDetails(
      null
    );
    System.assertEquals(null, ret);
  }
}
