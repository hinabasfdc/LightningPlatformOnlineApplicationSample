// Page/Fieldの状態
export const STATUS_DRAFT = "draft";
export const STATUS_SAVED = "saved";

export const formatPages = (raw) => {
  // ページ
  console.log(raw[0].objApplicationTemplate__r.InputPageNames__c);
  const pageNames =
    raw[0].objApplicationTemplate__r.InputPageNames__c?.split(",")?.map((p) =>
      p.trim()
    ) ?? [];

  let currentPageIndex = -1;
  let previousPageNumber = -1;
  // メニュー表示用にプロパティを追加
  const ps = raw
    .sort((a, b) => {
      const ap = a.PageNumber__c ?? 1;
      const bp = b.PageNumber__c ?? 1;
      return ap - bp;
    })
    .reduce((pages, d) => {
      const page = d.PageNumber__c ?? 1;
      const row = d.RowNumber__c ?? 1;
      const order = d.SortOrder__c ?? 1;
      const pageIndex =
        previousPageNumber === page ? currentPageIndex : ++currentPageIndex;
      previousPageNumber = page;
      const rowIndex = row - 1;
      if (!pages[pageIndex]) {
        pages[pageIndex] = {
          id: `page${page}`,
          status: STATUS_SAVED,
          page,
          rows: [],
          name: pageNames[pageIndex] ?? `入力ページ${page}`,
          fieldCount: 0
        };
      }
      if (!pages[pageIndex].rows[rowIndex]) {
        pages[pageIndex].rows[rowIndex] = {
          row,
          fields: []
        };
      }
      if (d.objApplicationTemplate__r) {
        delete d.objApplicationTemplate__r;
      }
      pages[pageIndex].rows[rowIndex].fields.push({
        id: `field${page}_${row}_${order}`,
        order,
        status: STATUS_SAVED,
        data: d,
        displayName: d.Name
      });
      return pages;
    }, []);

  return ps.map((p) => {
    const fieldCount = p.rows.reduce((total, r) => {
      return total + r.fields.length;
    }, 0);
    return { ...p, fieldCount };
  });
};

export const formatPagesForSave = (pages) => {
  const ps = pages.sort((a, b) => a.page - b.page);
  const pageNames = ps.map((p) => p.name).join(",");
  const details = ps.reduce((ds, p) => {
    const rows = p.rows.reduce((rs, r) => {
      const rfs = r.fields.map((f) => {
        return { ...f, page: p.page, row: r.row };
      });
      return [...rs, ...rfs];
    }, []);
    return [...ds, ...rows];
  }, []);

  // format page numbers
  let currentPageShouldBe = 0;
  let prevPage = 0;
  let currentRowShouldBe = 0;
  let prevRow = 0;
  let currentOrderShouldBe = 0;

  // page, row, orderを揃える
  for (let i = 0; i < details.length; i++) {
    if (details[i].page !== prevPage) {
      // 次のページ
      prevPage = details[i].page;
      details[i].page = ++currentPageShouldBe;
      prevRow = 0;
      currentRowShouldBe = 0;
    } else {
      // 前のページと同じ
      details[i].page = currentPageShouldBe;
    }

    if (details[i].row !== prevRow) {
      // 次の列
      prevRow = details[i].row;
      details[i].row = ++currentRowShouldBe;
      currentOrderShouldBe = 0;
    } else {
      // 前の列と同じ
      details[i].row = currentRowShouldBe;
    }
    details[i].order = ++currentOrderShouldBe;

    details[i].data.PageNumber__c = details[i].page;
    details[i].data.RowNumber__c = details[i].row;
    details[i].data.SortOrder__c = details[i].order;
  }
  return { details: JSON.stringify(details.map((d) => d.data)), pageNames };
};
