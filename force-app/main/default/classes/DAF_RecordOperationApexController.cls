/**
 * @description       : オンライン申請パッケージ 各種オブジェクトレコード操作用 Apex クラス
 * @author            : Hiroyuki Inaba @ Salesforce
 * @last modified on  : 2020-01-09
 **/
public with sharing class DAF_RecordOperationApexController {
  /**
   * @description           : 申請定義の一覧を返す
   * @param includeDraftApp : 下書きの申請も含めるかどうかのフラグ
   * @return Lis            : 申請定義一覧 オブジェクトの配列
   **/
  @AuraEnabled(cacheable=true)
  public static List<objApplicationTemplate__c> getActiveApplications(
    Boolean includeDraftApp
  ) {
    if (includeDraftApp) {
      // 下書きのものも含めて返却
      return [
        SELECT Id, Name, Description__c, Category__c
        FROM objApplicationTemplate__c
        WHERE
          (Status__c = '公開中'
          OR Status__c = '下書き')
          AND CloseDate__c >= TODAY
        ORDER BY Category__c, Name ASC
      ];
    } else {
      // 公開中で、期限が本日より先のもののみ抽出し返却
      return [
        SELECT Id, Name, Description__c, Category__c
        FROM objApplicationTemplate__c
        WHERE Status__c = '公開中' AND CloseDate__c >= TODAY
        ORDER BY Category__c, Name ASC
      ];
    }
  }

  /**
   * @description      : 指定された申請定義の明細で定義されている標準項目名を配列にして返す
   * @param recordId   : 申請の ID
   * @return List<String> : 標準項目の一覧 String 型の配列
   **/
  @AuraEnabled(cacheable=true)
  public static List<String> getApplicationStdColumns(String recordId) {
    if (String.isBlank(recordId)) {
      return null;
    }
    // 申請のレコード詳細画面で使用するので、recordId が申請の ID になるため、申請定義の ID を取得
    List<objApplication__c> apps = [
      SELECT objApplicationTemplate__c
      FROM objApplication__c
      WHERE Id = :recordId
      LIMIT 1
    ];
    if (apps == null || apps.size() == 0) {
      return null;
    }
    // 申請定義明細から標準項目の API 参照名一覧を崇取得して 配列に格納
    List<objApplicationTemplateDetail__c> atds = [
      SELECT StdColumnName__c
      FROM objApplicationTemplateDetail__c
      WHERE
        objApplicationTemplate__c = :apps[0].objApplicationTemplate__c
        AND Category__c = '標準'
      ORDER BY ColumnOrder__c ASC
    ];
    if (atds == null || atds.size() == 0) {
      return null;
    }

    List<String> arrayColumns = new List<String>();
    for (Integer i = 0; i < atds.size(); i++) {
      arrayColumns.add(atds[i].StdColumnName__c);
    }

    return arrayColumns;
  }

  /**
   * @description      : 指定された申請の明細を返す
   * @param recordId   : 申請の ID
   * @return List<objApplicationDetail__c> : 申請明細の一覧 オブジェクト型の配列
   **/
  @AuraEnabled(cacheable=true)
  public static List<objApplicationDetail__c> getApplicationCustomColumns(
    String recordId
  ) {
    if (String.isBlank(recordId)) {
      return null;
    }
    // 申請明細データを ColumnOrder__c で並べかえ。
    // また、選択肢も画面での編集中に使うので取得。
    return [
      SELECT
        Id,
        Name,
        ColumnName__c,
        Text__c,
        LongTextArea__c,
        Number__c,
        DataType__c,
        objApplicationTemplateDetail__r.Options__c
      FROM objApplicationDetail__c
      WHERE objApplication__c = :recordId
      ORDER BY ColumnOrder__c ASC
    ];
  }

  /**
   * @description      : 申請データを保存する
   * @param app        : 申請オブジェクトのデータ
   * @param appDetails : 申請詳細オブジェクトのデータ
   * @param fileDocumentIds : アップロードされたファイルのIDをJSON形式にしたもの
   * @return objApplication__c : 新たに払い出された申請レコード
   **/
  @AuraEnabled
  public static objApplication__c insertApplication(
    objApplication__c app,
    List<objApplicationDetail__c> appDetails,
    String fileDocumentIds
  ) {
    if (app == null || appDetails == null || appDetails.size() === 0) {
      return null;
    }
    app.Phase__c = '提出済み';
    insert app;
    System.debug(app);

    for (objApplicationDetail__c detail : appDetails) {
      detail.objApplication__c = app.Id;
    }

    insertApplicationDetails(appDetails);

    DAF_FileAttachementApexController.createContentDocumentLink(
      app.Id,
      fileDocumentIds
    );

    // Nameがないので、再度SOQL
    return [
      SELECT
        Id,
        Name,
        ApplicationName__c,
        Birthdate__c,
        Building__c,
        City__c,
        Comment__c,
        FirstnameKanji__c,
        FirstnameYomi__c,
        Gender__c,
        JobCategory__c,
        LastnameKanji__c,
        LastnameYomi__c,
        Mail__c,
        Phase__c,
        State__c,
        Status__c,
        Street__c,
        Tel__c,
        Zipcode__c,
        objApplicationTemplate__c
      FROM objApplication__c
      WHERE Id = :app.Id
    ];
  }

  /**
   * @description      : 申請詳細データを保存する
   * @param appDetails : 申請詳細オブジェクトのデータ
   * @return List<Id> : 新たに払い出された申請詳細レコードのID（複数）
   **/
  private static List<Id> insertApplicationDetails(
    List<objApplicationDetail__c> appDetails
  ) {
    if (appDetails == null || appDetails.size() == 0) {
      return null;
    }
    // 保存
    insert appDetails;
    return new List<Id>(
      new Map<Id, objApplicationDetail__c>(appDetails).keySet()
    );
  }

  /**
   * @description      : 申請詳細データを更新する
   * @param appDetails : 申請詳細オブジェクトのデータ
   * @return String    : 更新した申請詳細レコードの SalesforceID
   **/
  @AuraEnabled
  public static List<Id> updateApplicationDetails(
    List<objApplicationDetail__c> appDetails
  ) {
    if (appDetails == null || appDetails.size() == 0) {
      return null;
    }
    // 保存
    update appDetails;
    return new List<Id>(
      new Map<Id, objApplicationDetail__c>(appDetails).keySet()
    );
  }

  @AuraEnabled(cacheable=true)
  public static List<objApplicationTemplateDetail__c> getApplicationTemplateDetails(
    String recordId
  ) {
    if (String.isBlank(recordId)) {
      return null;
    }
    try {
      List<objApplicationTemplateDetail__c> details = [
        SELECT
          Id,
          Name,
          Category__c,
          DataType__c,
          Description__c,
          Options__c,
          Required__c,
          StdColumnName__c,
          Value__c,
          isCheckbox__c,
          isCurrency__c,
          isDate__c,
          isLongTextArea__c,
          isMail__c,
          isNumber__c,
          isPicklist__c,
          isStdColumn__c,
          isText__c,
          isTime__c,
          isURL__c,
          RowNumber__c,
          PageNumber__c,
          ColumnOrder__c,
          AppTemplateRow__r.Id,
          AppTemplateRow__r.Order__c,
          AppTemplateRow__r.AppTemplatePage__r.Id,
          AppTemplateRow__r.AppTemplatePage__r.Name,
          AppTemplateRow__r.AppTemplatePage__r.Order__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.Id,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.Name,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.Description__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.Category__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.Status__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.Condition__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.CloseDate__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.isAgreementCheckboxEnabled__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.AgreementCheckText__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.isFileUploadAccepted__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.FileUploadDescription__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.isConfirmationCheckboxEnabled__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.ConfirmationCheckDescription__c,
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__r.ThankyouPageDescription__c
        FROM objApplicationTemplateDetail__c
        WHERE
          AppTemplateRow__r.AppTemplatePage__r.objApplicationTemplate__c = :recordId
        ORDER BY
          AppTemplateRow__r.AppTemplatePage__r.Order__c,
          AppTemplateRow__r.Order__c,
          ColumnOrder__c,
          Id
      ];

      return details;
    } catch (Exception e) {
      System.debug(e);
      return null;
    }
  }
}
