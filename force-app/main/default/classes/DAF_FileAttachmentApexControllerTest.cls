@isTest
public with sharing class DAF_FileAttachmentApexControllerTest {
  @testSetup
  static void setup() {
    List<Account> accs = new List<Account>();
    Account acc1 = new Account(Name = 'Test1');
    accs.add(acc1);

    Account acc2 = new Account(Name = 'Test2');
    accs.add(acc2);
    insert accs;

    List<ContentVersion> cvs = new List<ContentVersion>();
    ContentVersion cv = new ContentVersion();
    cv.PathOnClient = 'test.jpg';
    cv.Title = 'TestImage';
    cv.VersionData = Blob.valueOf('ABC');
    cvs.add(cv);

    ContentVersion cv2 = new ContentVersion();
    cv2.PathOnClient = 'test2.jpg';
    cv2.Title = 'TestImage2';
    cv2.VersionData = Blob.valueOf('XYZ');
    cvs.add(cv2);

    insert cvs;
  }

  @isTest
  static void testGetContentVersionList() {
    List<ContentVersion> cvs = [SELECT ContentDocumentId FROM ContentVersion];
    List<String> ids = new List<String>();
    for (Integer i = 0; i < cvs.size(); i++) {
      ids.add(cvs[i].ContentDocumentId);
    }

    String ret = DAF_FileAttachementApexController.getContentVersionListJson(
      System.JSON.serialize(ids)
    );
    List<Object> records = (List<Object>) System.JSON.deserializeUntyped(ret);
    System.assertEquals(2, records.size());
  }

  @isTest
  static void testGetContentVersionListWithNoParameter() {
    DAF_FileAttachementApexController.getContentVersionListJson('');
  }

  @isTest
  static void testCreateContentDocumentLink() {
    List<ContentVersion> cvs = [SELECT ContentDocumentId FROM ContentVersion];
    List<String> ids = new List<String>();
    for (Integer i = 0; i < cvs.size(); i++) {
      ids.add(cvs[i].ContentDocumentId);
    }

    Account acc = [SELECT Id FROM Account WHERE Name = 'Test1' LIMIT 1];

    String ret = DAF_FileAttachementApexController.createContentDocumentLink(
      acc.Id,
      System.JSON.serialize(ids)
    );
    List<Object> records = (List<Object>) System.JSON.deserializeUntyped(ret);
    System.assertEquals(2, records.size());
  }

  @isTest
  static void testCreateContentDocumentLinkWithNoRecordId() {
    List<ContentVersion> cvs = [SELECT ContentDocumentId FROM ContentVersion];
    List<String> ids = new List<String>();
    for (Integer i = 0; i < cvs.size(); i++) {
      ids.add(cvs[i].ContentDocumentId);
    }

    String ret = DAF_FileAttachementApexController.createContentDocumentLink(
      '',
      System.JSON.serialize(ids)
    );
    System.assertEquals(null, ret);
  }

  @isTest
  static void testCreateContentDocumentLinkWithNoDocumentIds() {
    Account acc = [SELECT Id FROM Account WHERE Name = 'Test1' LIMIT 1];

    String ret = DAF_FileAttachementApexController.createContentDocumentLink(
      acc.Id,
      ''
    );
    System.assertEquals(null, ret);
  }

  @isTest
  static void testDeleteFile() {
    ContentVersion cv = [
      SELECT ContentDocumentId
      FROM ContentVersion
      WHERE Title = 'TestImage2'
    ];
    DAF_FileAttachementApexController.deleteFile(cv.ContentDocumentId);
  }

  @isTest
  static void testDeleteFileWithNoParameter() {
    DAF_FileAttachementApexController.deleteFile('');
  }
}
