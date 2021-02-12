import { Component, Input, OnInit, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.css']
})
export class TextInputComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() type = 'text';

  /**
   * dependency inject @Self. ensures that angular will always inject what we're doing here locally inside this component
   */
  constructor(@Self() public ngControl: NgControl) {
    this.ngControl.valueAccessor = this;
  }

  /*
    these three methods are required. Don't need to do anything with them. just need them.
    functions will be created by the ControlValueAccessor itself.
  */
  writeValue(obj: any): void {
  }
  registerOnChange(fn: any): void {
  }
  registerOnTouched(fn: any): void {
  }

}
