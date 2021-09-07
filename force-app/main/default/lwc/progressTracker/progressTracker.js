import { LightningElement, api } from "lwc";

export default class ProgressTracker extends LightningElement {
  idxCurrent = 0;
  @api activeSteps;
  @api currentStep;
  @api type = "path";
  @api variant = "base";
  @api isCardStyle = false;
  @api isAroundMargin = false;
  @api isDisplayMoveButton = false;
  @api isTextScroll = false;

  _isDisplayMoveButton = false;

  get divClass() {
    let divClass = "";
    if (this.isAroundMargin) divClass += "slds-var-p-around_medium ";
    if (this.isCardStyle) divClass += "slds-card ";
    return divClass;
  }

  get isTypePath() {
    return this.type === "path" ? true : false;
  }

  renderedCallback() {
    if (this.step && this.type === "path") {
      const el = this.template.querySelector(".slds-path__nav");
      if (el && el.scrollWidth > 0 && this.idxCurrent > 3) {
        el.scrollLeft =
          this.getStepWidth(el.scrollWidth) * (this.idxCurrent - 2);
      }

      if (!this._isDisplayMoveButton && el.scrollWidth > el.clientWidth) {
        console.log("[LWC-ProgressTracker] display move button");
        this._isDisplayMoveButton = true;
      }
    }
  }

  get steps() {
    if (this.activeSteps && this.activeSteps.length > 0) {
      let isDone = true;
      return this.activeSteps.map((s, i) => {
        if (s === this.currentStep) {
          isDone = false;
          this.idxCurrent = i;
        }
        const sanitized = this.sanitize(s);
        return {
          Id: `step_${i}`,
          isDone: isDone,
          isCurrent: s === this.currentStep,
          label: sanitized,
          value: sanitized
        };
      });
    }
    return [];
  }

  connectedCallback() {
    this._isDisplayMoveButton = this.isDisplayMoveButton;
  }

  sanitize(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  handleClickLeft() {
    const el = this.template.querySelector(".slds-path__nav");
    el.scrollLeft -= this.getStepWidth(el.scrollWidth);
  }

  handleClickRight() {
    const el = this.template.querySelector(".slds-path__nav");
    el.scrollLeft += this.getStepWidth(el.scrollWidth);
  }

  getStepWidth(w) {
    return Math.floor(w / this.steps.length);
  }
}
