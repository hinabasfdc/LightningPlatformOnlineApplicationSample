@isTest
public with sharing class DAF_FileAttachmentApexControllerTest {

    @testSetup static void setup(){
        List<Account> accs = new List<Account>();
        Account acc1 = new Account(Name='Test1');
        accs.add(acc1);
        Account acc2 = new Account(Name='Test2');
        accs.add(acc2);
        insert accs;

        ContentVersion cv = new ContentVersion();
        cv.PathOnClient = 'test.jpg';
        cv.Title = 'Test Image';
        cv.VersionData = Blob.valueOf('XYZ');
        insert cv;

        ContentVersion cv2 = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];

        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.ContentDocumentId = cv2.ContentDocumentId;
        cdl.LinkedEntityId = accs[0].Id;
        cdl.ShareType = 'V';
        insert cdl;
    }

    @isTest
    static void testFileAttached(){
        Account acc = [SELECT Id FROM Account WHERE Name='Test1' LIMIT 1];
        String retval = DAF_FileAttachementApexController.getAttachedFileList(acc.Id);
        System.assertEquals(False,String.isBlank(retval));
    }

    @isTest
    static void testNoFileAttached(){ 
        Account acc = [SELECT Id FROM Account WHERE Name='Test2' LIMIT 1];
        String retval = DAF_FileAttachementApexController.getAttachedFileList(acc.Id);
        System.assertEquals(True,String.isBlank(retval));
    }

    @isTest
    static void testNoRecordId(){
        String retval = DAF_FileAttachementApexController.getAttachedFileList(null);
        System.assertEquals(True,String.isBlank(retval));        
    }

    @isTest
    static void testDeleteFile(){
        Account acc = [SELECT Id FROM Account WHERE Name='Test1' LIMIT 1];
        ContentDocumentLink cdl = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId=:acc.Id];
        DAF_FileAttachementApexController.deleteFile(cdl.ContentDocumentId);
    }

    @isTest
    static void testDeleteFileWithNoParameter(){
        DAF_FileAttachementApexController.deleteFile('');
    }

}

