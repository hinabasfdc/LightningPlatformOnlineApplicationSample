public with sharing class DAF_TestTemplateCreator {
  static String APPTEMP_NAME = '市役所市民広場利用申請';

  @AuraEnabled
  public static string createTestTemplate() {
    List<jpseps__objApplicationTemplate__c> ats = [
      SELECT Id, Name
      FROM jpseps__objApplicationTemplate__c
      WHERE Name = :APPTEMP_NAME
    ];
    System.debug(ats);
    if (ats.size() > 0)
      return '作成済みです。';

    jpseps__objApplicationTemplate__c at = new jpseps__objApplicationTemplate__c(
      Name = APPTEMP_NAME,
      jpseps__Category__c = '01_くらし',
      jpseps__Description__c = '<p>くらうど市役所にある市民広場の利用申請です。</p>',
      jpseps__Condition__c = '<p>くらうど市にお住まいの方が申込できます。</p><p>利用予定日の7日前までに申し込んでください。</p>',
      jpseps__Status__c = '公開中',
      jpseps__CloseDate__c = System.Date.valueOf('2030-12-31'),
      jpseps__isAgreementCheckboxEnabled__c = true,
      jpseps__AgreementCheckText__c = '条件を確認しました。',
      jpseps__isFileUploadAccepted__c = true,
      jpseps__FileUploadDescription__c = '<p>利用目的・内容がわかるものがあれば添付してください。</p>',
      jpseps__isConfirmationCheckboxEnabled__c = true,
      jpseps__ConfirmationCheckDescription__c = '内容を確認しました。',
      jpseps__ThankyouPageDescription__c = '<p>申請を受け付けました。</p>'
    );
    insert at;

    List<jpseps__objApplicationTemplateDetail__c> atds = new List<jpseps__objApplicationTemplateDetail__c>();
    atds.add(
      new jpseps__objApplicationTemplateDetail__c(
        jpseps__objApplicationTemplate__c = at.Id,
        Name = '姓',
        jpseps__Category__c = '標準',
        jpseps__StdColumnName__c = 'jpseps__LastnameKanji__c',
        jpseps__SortOrder__c = 1
      )
    );
    atds.add(
      new jpseps__objApplicationTemplateDetail__c(
        jpseps__objApplicationTemplate__c = at.Id,
        Name = '名',
        jpseps__Category__c = '標準',
        jpseps__StdColumnName__c = 'jpseps__FirstnameKanji__c',
        jpseps__SortOrder__c = 2
      )
    );
    atds.add(
      new jpseps__objApplicationTemplateDetail__c(
        jpseps__objApplicationTemplate__c = at.Id,
        Name = 'メールアドレス',
        jpseps__Category__c = '標準',
        jpseps__StdColumnName__c = 'jpseps__Mail__c',
        jpseps__SortOrder__c = 3
      )
    );
    atds.add(
      new jpseps__objApplicationTemplateDetail__c(
        jpseps__objApplicationTemplate__c = at.Id,
        Name = '利用日',
        jpseps__Category__c = 'カスタム',
        jpseps__DataType__c = '日付',
        jpseps__SortOrder__c = 4
      )
    );
    atds.add(
      new jpseps__objApplicationTemplateDetail__c(
        jpseps__objApplicationTemplate__c = at.Id,
        Name = '利用エリア',
        jpseps__Category__c = 'カスタム',
        jpseps__DataType__c = '選択リスト',
        jpseps__Options__c = '東側,西側',
        jpseps__SortOrder__c = 5
      )
    );
    insert atds;

    return 'テンプレート「市役所市民広場利用申請」を作成しました';
  }
}
