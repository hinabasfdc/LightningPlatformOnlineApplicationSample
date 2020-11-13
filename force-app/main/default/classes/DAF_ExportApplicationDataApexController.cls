/**
 * @description       : オンライン申請パッケージ データエクスポート(一覧出力)用 Apex クラス
 * @author            : Hiroyuki Inaba @ Salesforce
 * @last modified on  : 2020-10-31
**/
public with sharing class DAF_ExportApplicationDataApexController {

    /**
    * @description  : 選択リストでの選択用に登録されている申請定義の一覧を取得して返す
    * @return string: JSON 化されたレコード一覧
    **/
    @AuraEnabled(cacheable=true)
    public static string getApplicationTemplates(){
        String retval = '';

        // Id と表示名を取得し JSON 化
        List<objApplicationTemplate__c> apps= [SELECT Id,Name FROM objApplicationTemplate__c];
        if(apps.size() > 0) retval = System.JSON.serialize(apps);

        return retval;
    }

    /**
    * @description      : 指定された申請データを取得して返す
    * @param recordId   : 申請定義の ID
    * @return string    : JSON 化されたレコード一覧
    **/
    @AuraEnabled(cacheable=true)
    public static string getApplicationData(String recordId){
        if(String.isBlank(recordId)) return null;
        
        String retval = '';
        String DefinedStandardColumns = '';

        // 定義された標準項目の API 参照名を取得してカンマ区切りの文字列に
        List<objApplicationTemplateDetail__c> atds = [SELECT StdColumnName__c FROM objApplicationTemplateDetail__c WHERE objApplicationTemplate__c=:recordId AND Category__c='標準' ORDER BY SortOrder__c ASC];
        if(atds.size() > 0) for(Integer i = 0; i < atds.size(); i++) DefinedStandardColumns += atds[i].StdColumnName__c + ',';

        // データ抽出の SOQL を組み立てて実行し、データを JSON 化して返り値に格納
        List<objApplication__c> appdatas = Database.query('SELECT Id,Name,' + DefinedStandardColumns + '(SELECT Id,DataType__c,Text__c,Number__c,LongTextArea__c FROM objApplication__c.objApplicationDetail__r ORDER BY SortOrder__c ASC) FROM objApplication__c WHERE objApplicationTemplate__c =:recordId ORDER BY CreatedDate DESC');
        if(appdatas.size() > 0) retval = System.JSON.serialize(appdatas);

        return retval;
    }
}
