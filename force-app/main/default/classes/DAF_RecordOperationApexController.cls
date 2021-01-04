/**
 * @description       : オンライン申請パッケージ 各種オブジェクトレコード操作用 Apex クラス
 * @author            : Hiroyuki Inaba @ Salesforce
 * @last modified on  : 2020-12-30
 **/
public with sharing class DAF_RecordOperationApexController {
  /**
   * @description           : 申請定義の一覧を返す
   * @param includeDraftApp : 下書きの申請も含めるかどうかのフラグ
   * @return Lis            : 申請定義一覧 オブジェクトの配列
   **/
  @AuraEnabled(cacheable=true)
  public static List<jpseps__objApplicationTemplate__c> getActiveApplications(
    Boolean includeDraftApp
  ) {
    if (includeDraftApp) {
      // 下書きのものも含めて返却
      return [
        SELECT Id, Name, jpseps__Description__c, jpseps__Category__c
        FROM jpseps__objApplicationTemplate__c
        WHERE
          (jpseps__Status__c = '公開中'
          OR jpseps__Status__c = '下書き')
          AND jpseps__CloseDate__c >= TODAY
      ];
    } else {
      // 公開中で、期限が本日より先のもののみ抽出し返却
      return [
        SELECT Id, Name, jpseps__Description__c, jpseps__Category__c
        FROM jpseps__objApplicationTemplate__c
        WHERE jpseps__Status__c = '公開中' AND jpseps__CloseDate__c >= TODAY
      ];
    }
  }

  /**
   * @description      : 指定された申請定義の明細を返す
   * @param recordId   : 申請定義の ID
   * @return String    : JSON 化された申請定義明細の一覧 オブジェクトの配列
   **/
  @AuraEnabled(cacheable=true)
  public static String getApplicationTemplateDetailsJson(String recordId) {
    if (String.isBlank(recordId))
      return null;

    String retval = '';
    // SortOrder__c の昇順で並び替えて、データがあれば JSON 化して返り値にセット
    List<jpseps__objApplicationTemplateDetail__c> atds = [
      SELECT
        Id,
        Name,
        jpseps__Category__c,
        jpseps__isStdColumn__c,
        jpseps__StdColumnName__c,
        jpseps__Description__c,
        jpseps__SortOrder__c,
        jpseps__DataType__c,
        jpseps__Value__c,
        jpseps__Required__c,
        jpseps__Options__c,
        jpseps__isText__c,
        jpseps__isLongTextArea__c,
        jpseps__isNumber__c,
        jpseps__isMail__c,
        jpseps__isUrl__c,
        jpseps__isDate__c,
        jpseps__isTime__c,
        jpseps__isCheckbox__c,
        jpseps__isCurrency__c,
        jpseps__isPicklist__c
      FROM jpseps__objApplicationTemplateDetail__c
      WHERE jpseps__objApplicationTemplate__c = :recordId
      ORDER BY jpseps__SortOrder__c ASC
    ];
    if (atds.size() > 0)
      retval = System.JSON.serialize(atds);

    return retval;
  }

  /**
   * @description      : 指定された申請定義の明細で定義されている標準項目名を配列にして返す
   * @param recordId   : 申請の ID
   * @return String    : JSON 化された標準項目の一覧 String 型の配列
   **/
  @AuraEnabled(cacheable=true)
  public static String getApplicationStdColumns(String recordId) {
    if (String.isBlank(recordId))
      return null;

    String retval = '';
    List<String> arrayColumns = new List<String>();

    // 申請のレコード詳細画面で使用するので、recordId が申請の ID になるため、申請定義の ID を取得
    List<jpseps__objApplication__c> apps = [
      SELECT jpseps__objApplicationTemplate__c
      FROM jpseps__objApplication__c
      WHERE Id = :recordId
      LIMIT 1
    ];
    if (apps.size() > 0) {
      // 申請定義明細から標準項目の API 参照名一覧を崇取得して 配列に格納
      List<jpseps__objApplicationTemplateDetail__c> atds = [
        SELECT jpseps__StdColumnName__c
        FROM jpseps__objApplicationTemplateDetail__c
        WHERE
          jpseps__objApplicationTemplate__c = :apps[0]
            .jpseps__objApplicationTemplate__c
          AND jpseps__Category__c = '標準'
        ORDER BY jpseps__SortOrder__c ASC
      ];
      if (atds.size() > 0)
        for (Integer i = 0; i < atds.size(); i++)
          arrayColumns.add(atds[i].jpseps__StdColumnName__c);

      // データがあれば、配列を JSON 化して返り値に格納
      if (arrayColumns.size() > 0)
        retval = System.JSON.serialize(arrayColumns);
    }

    return retval;
  }

  /**
   * @description      : 指定された申請の明細を返す
   * @param recordId   : 申請の ID
   * @return String    : JSON 化された申請明細の一覧 オブジェクト型の配列
   **/
  @AuraEnabled(cacheable=true)
  public static String getApplicationCustomColumns(String recordId) {
    if (String.isBlank(recordId))
      return null;
    String retval = '';

    // 申請明細データを SortOrder__c で並べかえ。また、選択肢も画面での編集中に使うので取得して、データがあれば JSON 化して返り値に格納
    List<jpseps__objApplicationDetail__c> ads = [
      SELECT
        Id,
        Name,
        jpseps__ColumnName__c,
        jpseps__Text__c,
        jpseps__LongTextArea__c,
        jpseps__Number__c,
        jpseps__DataType__c,
        jpseps__objApplicationTemplateDetail__r.jpseps__Options__c
      FROM jpseps__objApplicationDetail__c
      WHERE jpseps__objApplication__c = :recordId
      ORDER BY jpseps__SortOrder__c ASC
    ];
    if (ads.size() > 0)
      retval = System.JSON.serialize(ads);

    return retval;
  }

  /**
   * @description      : 申請データを保存する
   * @param std        : JSON 化された申請オブジェクトのデータ
   * @return String    : 新たに払い出された、あるいは更新したレコードの SalesforceID
   **/
  @AuraEnabled
  public static String upsertApplication(String std) {
    if (String.isBlank(std))
      return null;
    String retval = '';

    // JSON を申請オブジェクト型にキャストして upsert し、ID を返り値に格納
    jpseps__objApplication__c aps = (jpseps__objApplication__c) System.JSON.deserialize(
      std,
      jpseps__objApplication__c.class
    );
    aps.Phase__c = '提出済み';
    upsert aps;
    retval = aps.Id;

    return retval;
  }

  /**
   * @description      : 申請明細データを保存する
   * @param customs    : JSON 化された申請明細オブジェクトのデータ オブジェクトの配列
   * @return String    : 新たに払い出された、あるいは更新したレコードの SalesforceID
   **/
  @AuraEnabled
  public static String upsertApplicationDetails(String customs) {
    if (String.isBlank(customs))
      return null;
    String retval = '';

    // いったんオブジェクトの配列型にキャスト
    List<Object> records = (List<Object>) System.JSON.deserializeUntyped(
      customs
    );
    if (records.size() > 0) {
      // ループしながら申請明細オブジェクト型にキャストし配列に追加
      List<jpseps__objApplicationDetail__c> ads = new List<jpseps__objApplicationDetail__c>();
      for (Integer i = 0; i < records.size(); i++)
        ads.add(
          (jpseps__objApplicationDetail__c) JSON.deserialize(
            JSON.serialize(records[i]),
            jpseps__objApplicationDetail__c.class
          )
        );

      // 保存して、データを JSON 化して返す
      upsert ads;
      retval = System.JSON.serialize(ads);
    }

    return retval;
  }
}
