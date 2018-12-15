import { Component, OnInit } from '@angular/core';
import {AppService, InterpretedInstruction} from '../app.service';

@Component({
  selector: 'app-disassembly',
  templateUrl: './disassembly.component.html',
  styleUrls: ['./disassembly.component.css']
})
export class DisassemblyComponent implements OnInit {
  interpretedInstructions: InterpretedInstruction[][];

  constructor(private app: AppService) { }

  ngOnInit() { }

  onPicked(input: HTMLInputElement) {
    const file = input.files[0];
    if (file) {
      this.app.upload(file).subscribe(
        data => {
          this.interpretedInstructions = data;
        }
      );
    }
  }
}
