// Page/Fieldの状態
export const STATUS_DRAFT = "draft";
export const STATUS_SAVED = "saved";

export const formatPages = (details) => {
  // ページと行のデータを持つ詳細のみ表示。
  if (!details || details.length === 0) {
    return [];
  }
  const ps = details
    .filter(
      (d) =>
        d.AppTemplateRow__r?.AppTemplatePage__r?.Id && d.AppTemplateRow__r?.Id
    )
    .reduce((pages, d) => {
      const detail = {
        ...d,
        status: STATUS_SAVED,
        get displayName() {
          const name = this.Name ?? `項目名未入力 ${this.ColumnOrder__c}`;
          if (!this.Category__c) {
            return name;
          }
          return `${name} [${this.Category__c}] ${
            this.Category__c === "標準"
              ? this.StdColumnName__c ?? ""
              : this.DataType__c ?? ""
          }`;
        }
      };
      const page = pages.find(
        (p) => p.id === d.AppTemplateRow__r.AppTemplatePage__r.Id
      );
      if (!page) {
        pages.push({
          id: d.AppTemplateRow__r.AppTemplatePage__r.Id,
          name: d.AppTemplateRow__r.AppTemplatePage__r.Name,
          get displayName() {
            return this.name ?? `ページ名未入力 ${this.order}`;
          },
          order: d.AppTemplateRow__r.AppTemplatePage__r.Order__c,
          status: STATUS_SAVED,
          rows: [
            {
              id: d.AppTemplateRow__r.Id,
              order: d.AppTemplateRow__r.Order__c,
              columns: [detail],
              get displayName() {
                return `${this.order}行目 : ${this.columns
                  .map((c) => c.Name)
                  .join(", ")}`;
              }
            }
          ]
        });
        return pages;
      }
      const row = page.rows.find((r) => r.id === d.AppTemplateRow__r.Id);
      if (!row) {
        page.rows.push({
          id: d.AppTemplateRow__r.Id,
          order: d.AppTemplateRow__r.Order__c,
          columns: [detail],
          get displayName() {
            return `${this.order}行目 : ${this.columns
              .map((c) => c.Name)
              .join(", ")}`;
          }
        });
        return pages;
      }
      row.columns.push(detail);
      return pages;
    }, [])
    .map((p) => {
      p.rows.forEach((r) => {
        r.columns.sort((a, b) => a.ColumnOrder__c - b.ColumnOrder__c);
      });
      p.rows.sort((a, b) => a.order - b.order);
      return p;
    });
  return ps;
};

export const addNewPage = (pages) => {
  const lastPage = pages.length > 0 ? pages[pages.length - 1] : { order: 0 };
  const newPageOrder = lastPage.order + 1;
  pages.push({
    id: null,
    order: newPageOrder,
    status: STATUS_DRAFT,
    rows: [],
    name: `新規ページ${newPageOrder}`,
    get displayName() {
      return this.name ?? `ページ名未入力 ${this.order}`;
    }
  });
  return pages;
};
export const addNewRow = (rows) => {
  const lastItem = rows.length > 0 ? rows[rows.length - 1] : { order: 0 };
  const newOrder = lastItem.order + 1;
  rows.push({
    id: null,
    order: newOrder,
    status: STATUS_DRAFT,
    columns: [],
    get displayName() {
      return `${this.order}行目 : ${this.columns
        .map((c) => c.Name)
        .join(", ")}`;
    }
  });
  return rows;
};
export const addNewColumn = (columns) => {
  const lastItem =
    columns.length > 0 ? columns[columns.length - 1] : { ColumnOrder__c: 0 };
  const newOrder = lastItem.ColumnOrder__c + 1;
  columns.push({
    Id: null,
    status: STATUS_DRAFT,
    get displayName() {
      const name = this.Name ?? `項目名未入力 ${this.ColumnOrder__c}`;
      if (!this.Category__c) {
        return name;
      }
      return `${name} [${this.Category__c}] ${
        this.Category__c === "標準"
          ? this.StdColumnName__c ?? ""
          : this.DataType__c ?? ""
      }`;
    },
    ColumnOrder__c: newOrder,
    Name: `新規項目${newOrder}`,
    Description__c: null,
    Options__c: null,
    Required__c: null,
    StdColumnName__c: null,
    DataType__c: null,
    Category__c: null,
    Value__c: null,
    AppTemplateRow__r: {
      Order__c: null,
      AppTemplatePage__r: {
        Id: null,
        Name: null,
        Order__c: null
      }
    }
  });
  return columns;
};

export const findAnyDraft = (pages) => {
  return !!pages?.find((p) => {
    return (
      p &&
      (p.status === STATUS_DRAFT ||
        !!p.rows.find((r) => r.columns.find((f) => f.status === STATUS_DRAFT)))
    );
  });
};

export const formatPagesForSave = (pages) => {
  return {
    pagesStr: JSON.stringify(
      pages.map((p) => {
        return {
          ...p,
          rows: p.rows.map((r) => {
            return {
              ...r,
              columns: r.columns.map((c) => {
                delete c.AppTemplateRow__r;
                return c;
              })
            };
          })
        };
      })
    )
  };
};

export const sortOrder = (dir, order, targetArray, orderKey) => {
  const indx = targetArray.findIndex((t) => t[orderKey] === order);
  if (
    indx === -1 ||
    (indx === 0 && dir === "up") ||
    (indx === targetArray.length - 1 && dir === "down")
  ) {
    return;
  }
  const targetIndex = dir === "up" ? indx - 1 : indx + 1;
  const swapTarget = targetArray[targetIndex];
  const swapTargetOrder = targetArray[targetIndex][orderKey];
  const originalOrder = targetArray[indx][orderKey];
  targetArray[targetIndex] = targetArray[indx];
  targetArray[indx] = swapTarget;
  targetArray[indx][orderKey] = originalOrder;
  targetArray[targetIndex][orderKey] = swapTargetOrder;
  targetArray[indx].status = targetArray[targetIndex].status = STATUS_DRAFT;
};
