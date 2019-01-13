import {Component, OnInit} from '@angular/core';
import {AppService, InterpretedInstruction} from '../app.service';
import {MatTabChangeEvent} from '@angular/material';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentTab = 'Disassembly';
  isGraphDisabled = true;
  selectedTab = 0;

  interpretedInstructions: InterpretedInstruction[][] = [];

  isInterpretingFailed = false;
  errorMessage = '';

  constructor(private app: AppService) { }

  ngOnInit() {
  }

  onPicked(input: HTMLInputElement) {
    const file = input.files[0];
    if (file) {
      this.selectedTab = 0;
      this.app.uploadFile(file).subscribe(
        data => {
          this.interpretedInstructions = data;
          input.value = null;
          this.isInterpretingFailed = false;
          this.errorMessage = '';

          if (this.interpretedInstructions) {
            if (this.interpretedInstructions.length > 0) {
              this.isGraphDisabled = false;
            } else {
              this.isGraphDisabled = true;
            }
          }
        },
        err => {
          console.error(err);
          input.value = null;
          this.isInterpretingFailed = true;
          this.errorMessage = 'File error: ' + err.error.message;
        }
      );
    }
  }

  onSubmit(input: HTMLTextAreaElement) {
    if (input.value.length > 0) {
      this.selectedTab = 0;
      this.app.uploadText(input.value).subscribe(
        data => {
          this.isInterpretingFailed = false;
          this.errorMessage = '';
          this.interpretedInstructions = data;

          if (this.interpretedInstructions) {
            if (this.interpretedInstructions.length > 0) {
              this.isGraphDisabled = false;
            } else {
              this.isGraphDisabled = true;
            }
          }
        },
        err => {
          console.error(err);
          this.isInterpretingFailed = true;
          this.errorMessage = 'Bytecode error: ' + err.error.message;
        }
      );
    }
  }

  tabSwap(event: MatTabChangeEvent) {
    if (event.tab.textLabel === 'Disassembly') {
      this.currentTab = 'Disassembly';
      this.selectedTab = 0;
    } else if (event.tab.textLabel === 'Graph') {
      this.currentTab = 'Graph';
      this.selectedTab = 1;
    }
  }
}
