import {Component, OnInit, Renderer2} from '@angular/core';
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

  interpretedInstructions: InterpretedInstruction[][] = [];

  constructor(private app: AppService) { }

  ngOnInit() {
  }

  onPicked(input: HTMLInputElement) {
    const file = input.files[0];
    if (file) {
      this.app.upload(file).subscribe(
        data => {
          this.interpretedInstructions = data;

          if (this.interpretedInstructions.length > 0) {
            this.isGraphDisabled = false;
          } else {
            this.isGraphDisabled = true;
          }
        }
      );
    }
  }

  tabSwap(event: MatTabChangeEvent) {
    if (event.tab.textLabel === 'Disassembly') {
      this.currentTab = 'Disassembly';
    } else if (event.tab.textLabel === 'Graph') {
      this.currentTab = 'Graph';
    }
  }
}
