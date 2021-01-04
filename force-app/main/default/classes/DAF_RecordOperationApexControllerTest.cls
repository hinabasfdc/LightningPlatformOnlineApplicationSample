@isTest
public with sharing class DAF_RecordOperationApexControllerTest {
  @TestSetup
  static void setup() {
    Date closedate = System.Date.today();

    List<jpseps__objApplicationTemplate__c> ats = new List<jpseps__objApplicationTemplate__c>();
    jpseps__objApplicationTemplate__c at1 = new jpseps__objApplicationTemplate__c(
      Name = 'テスト用申請手続き1',
      jpseps__Status__c = '公開中',
      jpseps__CloseDate__c = closedate.addDays(1)
    );
    ats.add(at1);
    jpseps__objApplicationTemplate__c at2 = new jpseps__objApplicationTemplate__c(
      Name = 'テスト用申請手続き2',
      jpseps__Status__c = '下書き',
      jpseps__CloseDate__c = closedate.addDays(1)
    );
    ats.add(at2);
    insert ats;

    List<jpseps__objApplicationTemplateDetail__c> atds = new List<jpseps__objApplicationTemplateDetail__c>();
    jpseps__objApplicationTemplateDetail__c atd1 = new jpseps__objApplicationTemplateDetail__c(
      jpseps__objApplicationTemplate__c = ats[0].Id,
      Name = '氏名',
      jpseps__Category__c = '標準',
      jpseps__StdColumnName__c = 'FirstnameKanji__c'
    );
    atds.add(atd1);
    jpseps__objApplicationTemplateDetail__c atd2 = new jpseps__objApplicationTemplateDetail__c(
      jpseps__objApplicationTemplate__c = ats[0].Id,
      Name = '事業者名',
      jpseps__Category__c = 'カスタム',
      jpseps__DataType__c = 'テキスト'
    );
    atds.add(atd2);
    insert atds;

    jpseps__objApplication__c a = new jpseps__objApplication__c(
      jpseps__objApplicationTemplate__c = ats[0].Id,
      jpseps__FirstnameKanji__c = 'アストロ'
    );
    insert a;

    jpseps__objApplicationDetail__c ad = new jpseps__objApplicationDetail__c(
      jpseps__objApplication__c = a.Id,
      jpseps__objApplicationTemplateDetail__c = atds[1].Id,
      jpseps__Text__c = 'アストロフォース'
    );
    insert ad;
  }

  @isTest
  static void testGetActiveApplications() {
    List<jpseps__objApplicationTemplate__c> records = DAF_RecordOperationApexController.getActiveApplications(
      false
    );
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testGetActiveApplicationsIncludeDraft() {
    List<jpseps__objApplicationTemplate__c> records = DAF_RecordOperationApexController.getActiveApplications(
      true
    );
    System.assertEquals(2, records.size());
  }

  @isTest
  static void testGetApplicationTemplateDetailsJson() {
    jpseps__objApplicationTemplate__c at = [
      SELECT Id
      FROM jpseps__objApplicationTemplate__c
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
    jpseps__objApplication__c a = [
      SELECT Id
      FROM jpseps__objApplication__c
      WHERE jpseps__FirstnameKanji__c = 'アストロ'
      LIMIT 1
    ];
    String ret = DAF_RecordOperationApexController.getApplicationStdColumns(
      a.Id
    );

    List<Object> records = (List<Object>) System.JSON.deserializeUntyped(ret);
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testGetApplicationStdColumnsWithNoParameter() {
    String ret = DAF_RecordOperationApexController.getApplicationStdColumns('');
    System.assertEquals(true, String.isBlank(ret));
  }

  @isTest
  static void testGetApplicationCustomColumns() {
    jpseps__objApplication__c a = [
      SELECT Id
      FROM jpseps__objApplication__c
      WHERE jpseps__FirstnameKanji__c = 'アストロ'
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
    jpseps__objApplicationTemplate__c at = [
      SELECT Id
      FROM jpseps__objApplicationTemplate__c
      WHERE Name = 'テスト用申請手続き1'
      LIMIT 1
    ];
    jpseps__objApplication__c a = new jpseps__objApplication__c(
      jpseps__objApplicationTemplate__c = at.Id,
      jpseps__FirstnameKanji__c = 'コーディ'
    );
    String ret = DAF_RecordOperationApexController.upsertApplication(
      System.JSON.serialize(a)
    );
    System.assertEquals(true, String.isNotBlank(ret));

    jpseps__objApplicationTemplateDetail__c atd = [
      SELECT Id
      FROM jpseps__objApplicationTemplateDetail__c
      WHERE Name = '事業者名'
      LIMIT 1
    ];
    List<jpseps__objApplicationDetail__c> ads = new List<jpseps__objApplicationDetail__c>();
    jpseps__objApplicationDetail__c ad = new jpseps__objApplicationDetail__c(
      jpseps__objApplicationTemplateDetail__c = atd.Id,
      jpseps__objApplication__c = ret,
      jpseps__Text__c = 'アストロカンパニー'
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
