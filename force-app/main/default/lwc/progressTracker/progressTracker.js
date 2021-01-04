import { LightningElement, api } from 'lwc';

export default class ProgressTracker extends LightningElement {
  steps;
  idxCurrent = 0;
  @api activeSteps = '手続き概要,入力,ファイル添付,登録内容確認,完了';
  @api currentStep = '入力';
  @api type = 'path';
  @api variant = 'base';
  @api isCardStyle = false;
  @api isAroundMargin = false;
  @api isDisplayMoveButton = false;
  @api isTextScroll = false;

  get divClass() {
    let divClass = '';
    if (this.isAroundMargin) divClass += 'slds-var-p-around_medium ';
    if (this.isCardStyle) divClass += 'slds-card ';
    return divClass;
  }

  get isTypePath() {
    return (this.type === 'path') ? true : false;
  }

  renderedCallback() {
    if (this.type === 'path') {
      const el = this.template.querySelector('.slds-path__nav');
      if (el && el.scrollWidth > 0 && this.idxCurrent > 3) {
        el.scrollLeft = this.getStepWidth(el.scrollWidth) * (this.idxCurrent - 2);
      }

      if (!this.isDisplayMoveButton && el.scrollWidth > el.clientWidth) {
        console.log('[LWC-ProgressTracker] display move button');
        this.isDisplayMoveButton = true;
      }
    }
  }

  connectedCallback() {
    if (this.activeSteps) {
      const array = this.activeSteps.split(',');
      let localSteps = [];
      let isComplete = (array.includes(this.currentStep)) ? true : false;
      let isCurrent = false;

      for (let i = 0; i < array.length; i++) {

        if (array[i] === this.currentStep) {
          isComplete = false;
          isCurrent = true;
          this.idxCurrent = i;
        }

        const o = {
          Id: i,
          isComplete: isComplete,
          isCurrent: isCurrent,
          label: this.sanitize(array[i]),
          value: this.sanitize(array[i])
        }
        localSteps.push(o);

        if (array[i] === this.currentStep) {
          isCurrent = false;
        }

      }

      this.steps = [...localSteps];
    }
  }

  sanitize(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  handleClickLeft() {
    const el = this.template.querySelector('.slds-path__nav');
    el.scrollLeft -= this.getStepWidth(el.scrollWidth);
  }

  handleClickRight() {
    const el = this.template.querySelector('.slds-path__nav');
    el.scrollLeft += this.getStepWidth(el.scrollWidth);
  }

  getStepWidth(w) {
    return Math.floor(w / this.steps.length);
  }

}