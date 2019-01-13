import {AfterViewChecked, Component, Input, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {InterpretedInstruction} from '../app.service';
import * as Clusterize from 'clusterize.js';

@Component({
  selector: 'app-disassembly',
  templateUrl: './disassembly.component.html',
  styleUrls: ['./disassembly.component.css']
})
export class DisassemblyComponent implements OnInit, OnDestroy, AfterViewChecked {
  private interpretedInstructions: InterpretedInstruction[][];
  private listener;
  private clusterize: Clusterize;
  private liHeight = -1;
  private scrollValue = 0;
  private entryPoint = 0;

  @Input('interpretedInstructions') set _interpretedInstructions(interpretedInstructions: InterpretedInstruction[][]) {
    this.interpretedInstructions = JSON.parse(JSON.stringify(interpretedInstructions));

    if (this.interpretedInstructions && this.interpretedInstructions.length > 0) {
      this.entryPoint = this.interpretedInstructions[0][0].addr;
      this.interpretedInstructions[0].shift();

      this.update();
    }
  }

  @Input('currentTab') set  _currentTab(currentTab: string) {
    if (currentTab === 'Disassembly' && this.clusterize) {
      document.getElementById('scrollArea').scrollTop = this.scrollValue;
      this.clusterize.refresh(true);
    }
  }

  scroll(event: Event) {
    this.scrollValue = event.srcElement.scrollTop;
  }

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.listener = this.renderer.listen('document', 'click', event => {
      const el = event.srcElement;
      const elNo = el.getAttribute('appjump');
      if (elNo != null && elNo !== -1) {
        document.getElementById('scrollArea').scrollTop = el.offsetHeight * elNo + el.offsetHeight;
      }
    });
  }

  ngAfterViewChecked() {
    if (this.liHeight === -1) {
      this.liHeight = document.getElementsByClassName('clusterize-no-data').item(0).clientHeight;
    }
  }

  ngOnDestroy() {
    this.listener.dispose();
    this.clusterize.destroy(true);
  }

  goto(address: string) {
    const addr = parseInt(address, 16);
    for (let i = 0; i < this.interpretedInstructions.length; ++i) {
      for (let j = 0; j < this.interpretedInstructions[i].length; ++j) {
        const instr = this.interpretedInstructions[i][j];
        if (instr.addr === addr) {
          this.scrollValue = j * this.liHeight + this.liHeight;
          document.getElementById('scrollArea').scrollTop = this.scrollValue;
          return;
        }
      }
    }
  }

  private update() {
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

        const relativeJumpAdress = this.getRelativeAdress(instruction);
        const absoluteJumpAdress = this.getAbsoluteAdress(instruction);

        if (instruction.mnemo.match('JMP')) {
          if (instruction.mnemo.trim().length > 3) {
            if (instruction.opcode.startsWith('E9', 2) || instruction.opcode.startsWith('EB', 2)) {
              const elNo = this.getElNo(relativeJumpAdress);
              op1 = `<span appJump="${elNo}">${instruction.op1}</span>`;
            } else if (instruction.opcode.startsWith('FF')) {
              op1 = '<span>' + instruction.op1 + '</span>';
            }
          } else {
            if (instruction.opcode.startsWith('E9') || instruction.opcode.startsWith('EB')) {
              const elNo = this.getElNo(relativeJumpAdress);
              op1 = `<span appJump="${elNo}">${instruction.op1}</span>`;
            } else if (instruction.opcode.startsWith('FF')) {
              op1 = '<span>' + instruction.op1 + '</span>';
            }
          }
        } else if (instruction.mnemo.match('CALL')) {
          if (instruction.opcode.startsWith('E8')) {
            const elNo = this.getElNo(relativeJumpAdress);
            op1 = `<span appJump="${elNo}">${instruction.op1}</span>`;
          } else if (instruction.opcode.startsWith('FF')) {
            // const elNo = this.getElNo(absoluteJumpAdress);
            // op1 = `<span appJump="${elNo}">${instruction.op1}</span>`;
            op1 = `<span>${instruction.op1}</span>`;
          }
        } else {
          op1 = '<span>' + instruction.op1 + '</span>';
        }


        let entry = '';
        if (instruction.addr === this.entryPoint) {
          entry = 'entry';
        }

        row.push(`<li id="${instruction.addr}" class="${entry}">`
          + hex.toUpperCase().padEnd(12, ' ')
          + instruction.opcode.padEnd(22, ' ')
          + instruction.mnemo.trim().padEnd(18, ' ')
          + op1
          + op2
          + op3
          + '</li>');
      }
    }

    if (this.clusterize) {
      this.clusterize.update(row);
    } else {
      this.clusterize = new Clusterize({
        rows: row,
        scrollId: 'scrollArea',
        contentId: 'contentArea'
      });
    }

    this.scrollValue = this.getElNo(this.entryPoint) * this.liHeight + this.liHeight;
    document.getElementById('scrollArea').scrollTop = this.scrollValue;
  }

  private getElNo(relativeJumpAddress: number) {
    for (const iList of this.interpretedInstructions) {
      for (let i = 0; i < iList.length; ++i) {
        if (relativeJumpAddress === iList[i].addr) {
          return i;
        }
      }
    }

    return -1;
  }

  private getRelativeAdress(instruction: InterpretedInstruction) {
    let relativeJumpAdress = parseInt(instruction.op1, 16) + instruction.addr + instruction.opcode.length / 2;
    if (relativeJumpAdress > 0xFFFFFFFF) {
      relativeJumpAdress = relativeJumpAdress - 0x100000000;
    }
    return relativeJumpAdress;
  }

  private getAbsoluteAdress(instruction: InterpretedInstruction) {
    let absoluteJumpAdress = parseInt(instruction.op1, 16);
    if (absoluteJumpAdress > 0xFFFFFFFF) {
      absoluteJumpAdress = absoluteJumpAdress - 0x100000000;
    }
    return absoluteJumpAdress;
  }
}
