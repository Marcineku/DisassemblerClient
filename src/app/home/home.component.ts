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

  constructor(private app: AppService) { }

  ngOnInit() {
  }

  onPicked(input: HTMLInputElement) {
    const file = input.files[0];
    if (file) {
      this.selectedTab = 0;
      this.app.upload(file).subscribe(
        data => {
          this.interpretedInstructions = data;
          input.value = null;

          if (this.interpretedInstructions) {
            if (this.interpretedInstructions.length > 0) {
              this.isGraphDisabled = false;
            } else {
              this.isGraphDisabled = true;
            }
          }
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
