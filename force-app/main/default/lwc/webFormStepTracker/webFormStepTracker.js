import { api, LightningElement } from "lwc";
import { PAGE_SELECTOR } from "c/webFormUtils";
export default class WebFormStepTracker extends LightningElement {
  // 同名の進捗が入る可能性がある為、projectTracker.jsを加工。
  @api
  steps;
  @api
  currentStep;

  get displaySteps() {
    return (
      this.steps
        ?.filter((s) => !!s.label)
        .map((s) => {
          const ns = { ...s };
          ns.isDone = s.order < this.currentStep.order;
          ns.isCurrent = s.order === this.currentStep.order;
          ns.className = `slds-path__item ${
            ns.isDone
              ? "slds-is-complete"
              : ns.isCurrent
              ? `slds-is-active slds-is-current`
              : `slds-is-incomplete`
          }`;
          return ns;
        }) ?? []
    );
  }

  isDisplayMoveButton = false;

  renderedCallback() {
    if (this.shouldDisplay) {
      const el = this.template.querySelector(".slds-path__nav");
      if (!el) {
        return;
      }
      if (el && el.scrollWidth > 0 && this.currentStep.order > 3) {
        el.scrollLeft =
          this.getStepWidth(el.scrollWidth) * (this.currentStep.order - 2);
      }

      if (!this.isDisplayMoveButton && el.scrollWidth > el.clientWidth) {
        this.isDisplayMoveButton = true;
      }
    }
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

  get shouldDisplay() {
    return (
      !!this.steps &&
      this.steps.length > 0 &&
      !!this.currentStep &&
      this.currentStep.page !== PAGE_SELECTOR
    );
  }
}
