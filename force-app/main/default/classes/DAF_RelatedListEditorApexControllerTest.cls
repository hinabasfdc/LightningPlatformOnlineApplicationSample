@isTest
public with sharing class DAF_RelatedListEditorApexControllerTest {
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
  }

  @isTest
  static void testIds() {
    jpseps__objApplicationTemplate__c at = [
      SELECT Id
      FROM jpseps__objApplicationTemplate__c
      WHERE Name = :'テスト用申請手続き'
      LIMIT 1
    ];
    String ret = DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecordIds(
      at.Id
    );

    List<Object> records = (List<Object>) System.JSON.deserializeUntyped(ret);
    System.assertEquals(2, records.size());
  }

  @isTest
  static void testNoParameter() {
    String ret = DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecordIds(
      ''
    );
    System.assertEquals(true, String.isBlank(ret));
  }

  @isTest
  static void testinvalidParameter() {
    String ret = DAF_RelatedListEditorApexController.getApplicationTemplateDetailRecordIds(
      'ABCDEFG'
    );
    System.assertEquals(true, String.isBlank(ret));
  }
}
