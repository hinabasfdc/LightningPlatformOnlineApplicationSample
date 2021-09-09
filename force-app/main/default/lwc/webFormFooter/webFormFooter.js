import { LightningElement, api } from "lwc";

export default class WebFormFooter extends LightningElement {
  @api buttonPreviousLabel;
  @api buttonPreviousEnabled = false;
  @api buttonCancelLabel;
  @api buttonCancelEnabled = false;
  @api buttonNextLabel;
  @api buttonNextEnabled = false;

  get isButtonPreviousDisabled() {
    return !this.buttonPreviousEnabled;
  }
  get isButtonCancelDisabled() {
    return !this.buttonPreviousEnabled;
  }
  get isButtonNextDisabled() {
    return !this.buttonNextEnabled;
  }

  handleClickPagePrevious() {
    this.dispatchEvent(new CustomEvent("clickpageprevious"));
  }

  handleClickCancel() {
    this.dispatchEvent(new CustomEvent("clickcancel"));
  }

  handleClickPageNext = () => {
    this.dispatchEvent(new CustomEvent("clickpagenext"));
  };
}
