import { ShowToastEvent } from "lightning/platformShowToastEvent";

/**
 * @description  : トースト表示
 **/
export const showToast = (self, title, message, variant) => {
  const event = new ShowToastEvent({
    title: title,
    message: message,
    variant: variant
  });
  self.dispatchEvent(event);
};

/**
 * @description  : 指定された URL パラメータの値を返す(c__XXXX のパラメータ名にする必要あり)
 **/
export const getURLParameter = (key) => {
  return new URL(window.location.href).searchParams.get(key);
};
