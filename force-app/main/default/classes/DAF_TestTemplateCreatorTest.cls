@isTest
public with sharing class DAF_TestTemplateCreatorTest {

    @isTest
    static void testCreation(){
        String ret = DAF_TestTemplateCreator.createTestTemplate();
        System.assertEquals(True, String.isNotBlank(ret));
    }
}
