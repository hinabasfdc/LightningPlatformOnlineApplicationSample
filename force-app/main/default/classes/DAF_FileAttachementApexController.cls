/**
 * @description       : オンライン申請パッケージ 添付ファイル管理用 Apex クラス
 * @author            : Hiroyuki Inaba @ Salesforce
 * @last modified on  : 2020-12-30
 **/
public with sharing class DAF_FileAttachementApexController {

  /**
   * @description            : 指定されたレコードIDに添付された(関連のある)ファイルのリストを返します
   * @param documentIdsJson  : ドキュメントID の配列を JSON 化したもの
   * @return List            : JSON 形式 の取得したファイル(Content Version)レコード一覧
   **/
  @AuraEnabled
  public static String getContentVersionListJson(String documentIdsJson) {
    if (String.isBlank(documentIdsJson))
      return null;

    String retval = '';
    // 取得した ContentDocumentId を配列に変換
    List<String> ids = (List<String>) System.JSON.deserialize(
      documentIdsJson,
      List<String>.class
    );
    // ContentVersion から、削除されていない・最新のレコードのみを取得し、存在すれば JSON 化して返り値としてセット
    List<ContentVersion> cvs = [
      SELECT
        Id,
        ContentDocumentId,
        Title,
        FileType,
        ContentSize,
        ContentModifiedDate
      FROM ContentVersion
      WHERE ContentDocumentId IN :ids AND isLatest = TRUE AND isDeleted = FALSE
    ];
    if (cvs.size() > 0)
      retval = System.JSON.serialize(cvs);

    // JSON 形式 もしくは空文字を返却
    return retval;
  }

  /**
   * @description            : 指定されたレコードIDとドキュメントIDの配列を紐つける ContentDocumentLink レコードを作成する
   * @param recordId         : 紐づけるレコード
   * @param documentIdsJson  : ドキュメントID の配列を JSON 化したもの
   * @return String          : 作成したレコード一覧を JSON 化したもの
   **/
  @AuraEnabled
  public static String createContentDocumentLink(
    String recordId,
    String documentIdsJson
  ) {
    if (String.isBlank(recordId) || String.isBlank(documentIdsJson))
      return null;

    String retval = '';
    // 取得した ContentDocumentId を配列に変換
    List<String> ids = (List<String>) System.JSON.deserialize(
      documentIdsJson,
      List<String>.class
    );
    List<ContentDocumentLink> cdls = new List<ContentDocumentLink>();
    for (Integer i = 0; i < ids.size(); i++) {
      ContentDocumentLink cdl = new ContentDocumentLink(
        ContentDocumentId = ids[i],
        LinkedEntityId = recordId,
        ShareType = 'V',
        Visibility = 'AllUsers'
      );
      cdls.add(cdl);
    }
    insert cdls;
    retval = System.JSON.serialize(cdls);

    // JSON 形式 もしくは空文字を返却
    return retval;
  }

  /**
   * @description      : 指定されたレコードIDのファイルを削除する
   * @param recordId   : 削除するファイルの ContentDocumentId
   **/
  @AuraEnabled
  public static void deleteFile(String recordId) {
    if (String.isBlank(recordId))
      return;

    // ContentDocument のレコードを削除することで、連動して関連オブジェクトのレコードに波及してくれる
    ContentDocument cd = new ContentDocument(Id = recordId);
    delete cd;
  }
}
