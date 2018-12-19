import {Directive, Input} from '@angular/core';

@Directive({
  selector: '[appJump]'
})
export class JumpDirective {

  constructor() { }

  @Input('appJump') elementNo: number;
  @Input() jumpAddress: number;
}
