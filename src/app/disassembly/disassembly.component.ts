import { Component, OnInit } from '@angular/core';
import { AppService, InterpretedInstruction } from '../app.service';
import * as Clusterize from 'clusterize.js';

@Component({
  selector: 'app-disassembly',
  templateUrl: './disassembly.component.html',
  styleUrls: ['./disassembly.component.css']
})
export class DisassemblyComponent implements OnInit {
  scroll = 0;

  interpretedInstructions: InterpretedInstruction[][] = [];

  constructor(private app: AppService) {}

  ngOnInit() {
  }

  onPicked(input: HTMLInputElement) {
    const file = input.files[0];
    if (file) {
      this.app.upload(file).subscribe(
        data => {
          this.interpretedInstructions = data;

          const row = [];
          for (const instructionList of this.interpretedInstructions) {
            for (const instruction of instructionList) {
              let hex = instruction.addr.toString(16);
              if (hex.length < 8) {
                hex = hex.padStart(8, '0');
              }

              let op1 = '';

              let op2 = '';
              if (instruction.op2.length > 0) {
                op2 = '<span>, ' + instruction.op2 + '</span>';
              }

              let op3 = '';
              if (instruction.op3.length > 0) {
                op3 = '<span>, ' + instruction.op3 + '</span>';
              }

              let relativeJumpAdress = parseInt(instruction.op1, 16) + instruction.addr + instruction.opcode.length / 2;
              if (relativeJumpAdress > 0xFFFFFFFF) {
                relativeJumpAdress = relativeJumpAdress - 0x100000000;
              }

              let absoluteJumpAdress = parseInt(instruction.op1, 16);
              if (absoluteJumpAdress > 0xFFFFFFFF) {
                absoluteJumpAdress = absoluteJumpAdress - 0x100000000;
              }

              if (instruction.mnemo.match('JMP')) {
                if (instruction.opcode.startsWith('E9') || instruction.opcode.startsWith('EB')) {
                  op1 = '<a id="' + instruction.addr + '">' + instruction.op1 + '</a>';
                } else if (instruction.opcode.startsWith('FF')) {
                  op1 = '<a href="#' + absoluteJumpAdress + '">' + instruction.op1 + '</a>';
                }
              } else if (instruction.mnemo.match('CALL')) {
                if (instruction.opcode.startsWith('E8')) {
                  op1 = '<a href="#' + relativeJumpAdress + '">' + instruction.op1 + '</a>';
                } else if (instruction.opcode.startsWith('FF')) {
                  op1 = '<a href="#' + absoluteJumpAdress + '">' + instruction.op1 + '</a>';
                }
              } else {
                op1 = '<span>' + instruction.op1 + '</span>';
              }

              row.push('<li>'
                + hex.toUpperCase().padEnd(12, ' ')
                + instruction.opcode.padEnd(20, ' ')
                + instruction.mnemo.trim().padEnd(10, ' ')
                + op1
                + op2
                + op3
                + '</li>');
            }
          }

          const clusterize = new Clusterize({
            rows: row,
            scrollId: 'scrollArea',
            contentId: 'contentArea'
          });

          document.getElementById('contentArea').onclick = function (e) {
            const src = e.srcElement;
            if (src.id) {
              const item = src.parentElement.childNodes.item(0);
              const list = item.toString().split(' ');

              console.log('Click' + src.id, e);
              console.log(item.textContent);
            }
          };
        }
      );
    }
  }

  updateScroll(value: number) {
    document.getElementById('scrollArea').scrollTop = document.getElementById('scrollArea').scrollTop + 19;
    this.scroll = document.getElementById('scrollArea').scrollTop;
  }

  scrollTo(event) {
    document.getElementById('scrollArea').scrollTop = document.getElementById('scrollArea').scrollTop + 19;
  }
}
