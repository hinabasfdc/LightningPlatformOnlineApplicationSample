@isTest
public with sharing class DAF_RelatedListEditorApexControllerTest {
  @TestSetup
  static void setup() {
    objApplicationTemplate__c at = new objApplicationTemplate__c(
      Name = 'テスト用申請手続き'
    );
    insert at;

    List<objApplicationTemplateDetail__c> atds = new List<objApplicationTemplateDetail__c>();
    objApplicationTemplateDetail__c atd1 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = at.Id,
      Name = '氏名',
      Category__c = '標準'
    );
    atds.add(atd1);
    objApplicationTemplateDetail__c atd2 = new objApplicationTemplateDetail__c(
      objApplicationTemplate__c = at.Id,
      Name = '事業者名',
      Category__c = 'カスタム'
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
    String ret = DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecords(
      ''
    );
    System.assertEquals(true, String.isBlank(ret));
  }

  @isTest
  static void testinvalidParameter() {
    List<objApplicationTemplateDetail__c> records = DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecords(
      'ABCDEFG'
    );
    System.assertEquals(null, records);
  }
}
