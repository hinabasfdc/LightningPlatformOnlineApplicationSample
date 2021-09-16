public with sharing class DAF_TestTemplateCreator {
  static String APPTEMP_NAME = '市役所市民広場利用申請';

  // TODO: ページ、行　のシステムにする。

  @AuraEnabled
  public static string createTestTemplate() {
    List<objApplicationTemplate__c> ats = [
      SELECT Id, Name
      FROM objApplicationTemplate__c
      WHERE Name = :APPTEMP_NAME
    ];
    System.debug(ats);
    if (ats.size() > 0) {
      return '作成済みです。';
    }

    objApplicationTemplate__c at = new objApplicationTemplate__c(
      Name = APPTEMP_NAME,
      Category__c = '01_くらし',
      Description__c = '<p>くらうど市役所にある市民広場の利用申請です。</p>',
      Condition__c = '<p>くらうど市にお住まいの方が申込できます。</p><p>利用予定日の7日前までに申し込んでください。</p>',
      Status__c = '公開中',
      CloseDate__c = System.Date.valueOf('2030-12-31'),
      isAgreementCheckboxEnabled__c = true,
      AgreementCheckText__c = '条件を確認しました。',
      isFileUploadAccepted__c = true,
      FileUploadDescription__c = '<p>利用目的・内容がわかるものがあれば添付してください。</p>',
      isConfirmationCheckboxEnabled__c = true,
      ConfirmationCheckDescription__c = '内容を確認しました。',
      ThankyouPageDescription__c = '<p>申請を受け付けました。</p>'
    );
    insert at;

    objApplicationTemplatePage__c ap1 = new objApplicationTemplatePage__c(
      Name = 'ページ1',
      Order__c = 1,
      objApplicationTemplate__c = at.Id
    );
    insert ap1;
    objApplicationTemplatePage__c ap2 = new objApplicationTemplatePage__c(
      Name = 'ページ2',
      Order__c = 2,
      objApplicationTemplate__c = at.Id
    );
    insert ap2;

    List<objApplicationTemplateRow__c> rows = new List<objApplicationTemplateRow__c>();
    objApplicationTemplateRow__c ar1_1 = new objApplicationTemplateRow__c(
      Order__c = 1,
      AppTemplatePage__c = ap1.Id
    );
    rows.add(ar1_1);
    objApplicationTemplateRow__c ar1_2 = new objApplicationTemplateRow__c(
      Order__c = 2,
      AppTemplatePage__c = ap1.Id
    );
    rows.add(ar1_2);

    objApplicationTemplateRow__c ar2_1 = new objApplicationTemplateRow__c(
      Order__c = 1,
      AppTemplatePage__c = ap2.Id
    );
    rows.add(ar2_1);
    objApplicationTemplateRow__c ar2_2 = new objApplicationTemplateRow__c(
      Order__c = 2,
      AppTemplatePage__c = ap2.Id
    );
    rows.add(ar2_2);
    objApplicationTemplateRow__c ar2_3 = new objApplicationTemplateRow__c(
      Order__c = 3,
      AppTemplatePage__c = ap2.Id
    );
    rows.add(ar2_3);

    insert rows;

    List<objApplicationTemplateDetail__c> atds = new List<objApplicationTemplateDetail__c>();
    atds.add(
      new objApplicationTemplateDetail__c(
        objApplicationTemplate__c = at.Id,
        Name = '姓',
        Category__c = '標準',
        StdColumnName__c = 'LastnameKanji__c',
        AppTemplateRow__c = ar1_1.Id,
        ColumnOrder__c = 1
      )
    );
    atds.add(
      new objApplicationTemplateDetail__c(
        objApplicationTemplate__c = at.Id,
        Name = '名',
        Category__c = '標準',
        StdColumnName__c = 'FirstnameKanji__c',
        AppTemplateRow__c = ar1_2.Id,
        ColumnOrder__c = 1
      )
    );
    atds.add(
      new objApplicationTemplateDetail__c(
        objApplicationTemplate__c = at.Id,
        Name = 'メールアドレス',
        Category__c = '標準',
        StdColumnName__c = 'Mail__c',
        AppTemplateRow__c = ar2_1.Id,
        ColumnOrder__c = 1
      )
    );
    atds.add(
      new objApplicationTemplateDetail__c(
        objApplicationTemplate__c = at.Id,
        Name = '利用日',
        Category__c = 'カスタム',
        DataType__c = '日付',
        AppTemplateRow__c = ar2_2.Id,
        ColumnOrder__c = 1
      )
    );
    atds.add(
      new objApplicationTemplateDetail__c(
        objApplicationTemplate__c = at.Id,
        Name = '利用エリア',
        Category__c = 'カスタム',
        DataType__c = '選択リスト',
        Options__c = '東側,西側',
        AppTemplateRow__c = ar2_3.Id,
        ColumnOrder__c = 1
      )
    );
    atds.add(
      new objApplicationTemplateDetail__c(
        objApplicationTemplate__c = at.Id,
        Name = '利用目的',
        Category__c = 'カスタム',
        DataType__c = 'ロングテキストエリア	',
        AppTemplateRow__c = ar2_3.Id,
        ColumnOrder__c = 2
      )
    );
    insert atds;

    return 'テンプレート「市役所市民広場利用申請」を作成しました';
  }
}
