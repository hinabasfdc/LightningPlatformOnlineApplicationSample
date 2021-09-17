@isTest
public with sharing class DAF_EADACTest {
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

    insert rows;

    List<objApplicationTemplateDetail__c> atds = new List<objApplicationTemplateDetail__c>();
    objApplicationTemplateDetail__c atd1 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = at.Id,
      Name = '氏名',
      Category__c = '標準',
      StdColumnName__c = 'FirstnameKanji__c',
      AppTemplateRow__c = ar1_1.Id,
      ColumnOrder__c = 1
    );

    atds.add(atd1);
    objApplicationTemplateDetail__c atd2 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = at.Id,
      Name = '事業者名',
      Category__c = 'カスタム',
      AppTemplateRow__c = ar1_1.Id,
      ColumnOrder__c = 1
    );
    atds.add(atd2);
    insert atds;

    objApplication__c a = new objApplication__c(
      objApplicationTemplate__c = at.Id,
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
  static void testGetApplicationTemplates() {
    List<objApplicationTemplate__c> records = DAF_ExportApplicationDataApexController.getApplicationTemplates();
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testGetApplicationData() {
    objApplication__c at = [
      SELECT Id, objApplicationTemplate__c
      FROM objApplication__c
      WHERE FirstnameKanji__c = :'アストロ'
      LIMIT 1
    ];
    List<objApplication__c> records = DAF_ExportApplicationDataApexController.getApplicationData(
      at.objApplicationTemplate__c
    );
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testNoParameter() {
    List<objApplication__c> records = DAF_ExportApplicationDataApexController.getApplicationData(
      ''
    );
    System.assertEquals(null, records);
  }

  @isTest
  static void testInvalidParameter() {
    List<objApplication__c> records = DAF_ExportApplicationDataApexController.getApplicationData(
      'ABCDEDF'
    );
    System.assertEquals(0, records.size());
  }
}
