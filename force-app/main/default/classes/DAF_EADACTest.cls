@isTest
public with sharing class DAF_EADACTest {

    @TestSetup
    static void setup(){
        objApplicationTemplate__c at = new objApplicationTemplate__c(Name='テスト用申請手続き');
        insert at;

        List<objApplicationTemplateDetail__c> atds = new List<objApplicationTemplateDetail__c>();
        objApplicationTemplateDetail__c atd1 = new objApplicationTemplateDetail__c(objApplicationTemplate__c=at.Id,Name='氏名',Category__c='標準');
        atds.add(atd1);
        objApplicationTemplateDetail__c atd2 = new objApplicationTemplateDetail__c(objApplicationTemplate__c=at.Id,Name='事業者名',Category__c='カスタム');
        atds.add(atd2);
        insert atds;

        objApplication__c a = new objApplication__c(objApplicationTemplate__c=at.Id,FirstnameKanji__c='アストロ');
        insert a;

        objApplicationDetail__c ad = new objApplicationDetail__c(objApplication__c=a.Id,objApplicationTemplateDetail__c=atds[1].Id,Text__c='アストロフォース');
        insert ad;
    }

    @isTest
    static void testGetApplicationTemplates(){
        String ret = DAF_ExportApplicationDataApexController.getApplicationTemplates();

        List<Object> records = (List<Object>) System.JSON.deserializeUntyped(ret);
        System.assertEquals(1, records.size());
    }  

    @isTest
    static void testGetApplicationData(){
        objApplication__c at = [SELECT Id FROM objApplication__c WHERE FirstnameKanji__c=:'アストロ' LIMIT 1];
        String ret = DAF_ExportApplicationDataApexController.getApplicationData(at.Id);
        System.assertEquals(True, String.isBlank(ret));
    }  

    @isTest
    static void testNoParameter(){
        String ret = DAF_ExportApplicationDataApexController.getApplicationData('');
        System.assertEquals(True, String.isBlank(ret));
    }  

    @isTest
    static void testInvalidParameter(){
        String ret = DAF_ExportApplicationDataApexController.getApplicationData('ABCDEDF');
        System.assertEquals(True, String.isBlank(ret));
    }  

}
