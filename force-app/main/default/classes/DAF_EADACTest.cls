@isTest
public with sharing class DAF_EADACTest {
  @TestSetup
  static void setup() {
    jpseps__objApplicationTemplate__c at = new jpseps__objApplicationTemplate__c(
      Name = 'テスト用申請手続き'
    );
    insert at;

    List<jpseps__objApplicationTemplateDetail__c> atds = new List<jpseps__objApplicationTemplateDetail__c>();
    jpseps__objApplicationTemplateDetail__c atd1 = new jpseps__objApplicationTemplateDetail__c(
      jpseps__objApplicationTemplate__c = at.Id,
      Name = '氏名',
      jpseps__Category__c = '標準'
    );
    atds.add(atd1);
    jpseps__objApplicationTemplateDetail__c atd2 = new jpseps__objApplicationTemplateDetail__c(
      jpseps__objApplicationTemplate__c = at.Id,
      Name = '事業者名',
      jpseps__Category__c = 'カスタム'
    );
    atds.add(atd2);
    insert atds;

    jpseps__objApplication__c a = new jpseps__objApplication__c(
      jpseps__objApplicationTemplate__c = at.Id,
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
  static void testGetApplicationTemplates() {
    List<jpseps__objApplicationTemplate__c> records = DAF_ExportApplicationDataApexController.getApplicationTemplates();
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testGetApplicationData() {
    jpseps__objApplication__c at = [
      SELECT Id, jpseps__objApplicationTemplate__c
      FROM jpseps__objApplication__c
      WHERE jpseps__FirstnameKanji__c = :'アストロ'
      LIMIT 1
    ];
    List<jpseps__objApplication__c> records = DAF_ExportApplicationDataApexController.getApplicationData(
      at.jpseps__objApplicationTemplate__c
    );
    System.assertEquals(1, records.size());
  }

  @isTest
  static void testNoParameter() {
    List<jpseps__objApplication__c> records = DAF_ExportApplicationDataApexController.getApplicationData(
      ''
    );
    System.assertEquals(null, records);
  }

  @isTest
  static void testInvalidParameter() {
    List<jpseps__objApplication__c> records = DAF_ExportApplicationDataApexController.getApplicationData(
      'ABCDEDF'
    );
    System.assertEquals(0, records.size());
  }
}
