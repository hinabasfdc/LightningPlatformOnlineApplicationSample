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

    List<objApplicationTemplateDetail__c> atds = new List<objApplicationTemplateDetail__c>();
    objApplicationTemplateDetail__c atd1 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = ats[0].Id,
      Name = '氏名',
      Category__c = '標準',
      StdColumnName__c = 'FirstnameKanji__c'
    );
    atds.add(atd1);
    objApplicationTemplateDetail__c atd2 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = ats[0].Id,
      Name = '事業者名',
      Category__c = 'カスタム',
      DataType__c = 'テキスト'
    );
    atds.add(atd2);
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
  static void testGetApplicationTemplateDetailsJson() {
    objApplicationTemplate__c at = [
      SELECT Id
      FROM objApplicationTemplate__c
      WHERE Name = 'テスト用申請手続き1'
      LIMIT 1
    ];
    String ret = DAF_RecordOperationApexController.getApplicationTemplateDetailsJson(
      at.Id
    );

    List<Object> records = (List<Object>) System.JSON.deserializeUntyped(ret);
    System.assertEquals(2, records.size());
  }

  @isTest
  static void testGetApplicationTemplateDetailsJsonWithNoParameter() {
    String ret = DAF_RecordOperationApexController.getApplicationTemplateDetailsJson(
      ''
    );
    System.assertEquals(true, String.isBlank(ret));
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

    System.assertEquals(1, columns.size());
  }

  @isTest
  static void testGetApplicationStdColumnsWithNoParameter() {
    String ret = DAF_RecordOperationApexController.getApplicationStdColumns('');
    System.assertEquals(true, String.isBlank(ret));
  }

  @isTest
  static void testGetApplicationCustomColumns() {
    objApplication__c a = [
      SELECT Id
      FROM objApplication__c
      WHERE FirstnameKanji__c = 'アストロ'
      LIMIT 1
    ];
    String ret = DAF_RecordOperationApexController.getApplicationCustomColumns(
      a.Id
    );

    List<Object> records = (List<Object>) System.JSON.deserializeUntyped(ret);
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testGetApplicationCustomColumnsWithNoParameter() {
    String ret = DAF_RecordOperationApexController.getApplicationCustomColumns(
      ''
    );
    System.assertEquals(true, String.isBlank(ret));
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
    String ret = DAF_RecordOperationApexController.upsertApplication(
      System.JSON.serialize(a)
    );
    System.assertEquals(true, String.isNotBlank(ret));

    objApplicationTemplateDetail__c atd = [
      SELECT Id
      FROM objApplicationTemplateDetail__c
      WHERE Name = '事業者名'
      LIMIT 1
    ];
    List<objApplicationDetail__c> ads = new List<objApplicationDetail__c>();
    objApplicationDetail__c ad = new objApplicationDetail__c(
      objApplicationTemplateDetail__c = atd.Id,
      objApplication__c = ret,
      Text__c = 'アストロカンパニー'
    );
    ads.add(ad);
    String rets = DAF_RecordOperationApexController.upsertApplicationDetails(
      System.JSON.serialize(ads)
    );

    List<Object> records = (List<Object>) System.JSON.deserializeUntyped(rets);
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testUpsertApplicationWithNoParameter() {
    String ret = DAF_RecordOperationApexController.upsertApplication('');
    System.assertEquals(true, String.isBlank(ret));
  }

  @isTest
  static void testUpsertApplicationDetailsWithNoParameter() {
    String ret = DAF_RecordOperationApexController.upsertApplicationDetails('');
    System.assertEquals(true, String.isBlank(ret));
  }
}
