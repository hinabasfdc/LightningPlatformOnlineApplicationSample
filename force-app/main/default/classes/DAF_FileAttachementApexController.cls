/**
 * @description       : オンライン申請パッケージ 添付ファイル管理用 Apex クラス
 * @author            : Hiroyuki Inaba @ Salesforce
 * @last modified on  : 2020-10-30
**/
public with sharing class DAF_FileAttachementApexController {

    /**
    * @description      : 指定されたレコードIDに添付された(関連のある)ファイルのリストを返します
    * @param recordId   : 親レコードID
    * @return String    : JSON 形式 の取得したファイル(Content Version)レコード一覧
    **/
    @AuraEnabled(cacheable=true)
    public static String getAttachedFileList(String recordId){
        if(String.isBlank(recordId)) return null;

        String retval = '';
        // 添付されたファイルの ContentDocumentId 一覧を取得
        List<ContentDocumentLink> cdls = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId=:recordId];
        if(cdls.size()>0){
            // 取得した ContentDocumentId を配列に変換
            List<String> ids = new List<String>();
            for(Integer i = 0; i < cdls.size(); i++) ids.add(cdls[i].ContentDocumentId);
            // ContentVersion から、削除されていない・最新のレコードのみを取得し、存在すれば JSON 化して返り値としてセット
            List<ContentVersion> cvs = [SELECT Id,ContentDocumentId,Title,FileType,ContentSize,ContentModifiedDate FROM ContentVersion WHERE ContentDocumentId IN :ids AND isLatest = true AND isDeleted = false];
            if(cvs.size()>0) retval = System.JSON.serialize(cvs);            
        }

        // JSON 形式 もしくは空文字を返却
        return retval;
    }

    /**
    * @description      : 指定されたレコードIDのファイルを削除する
    * @param recordId   : 削除するファイルの ContentDocumentId
    **/
    @AuraEnabled
    public static void deleteFile(String recordId){
        if(String.isBlank(recordId)) return;

        // ContentDocument のレコードを削除することで、連動して関連オブジェクトのレコードに波及してくれる
        ContentDocument cd = new ContentDocument(Id=recordId);
        delete cd;
    }
}
