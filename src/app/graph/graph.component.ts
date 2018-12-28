import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {InterpretedInstruction} from '../app.service';

@Component({
  selector: 'app-graph',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {
  private svg: Element;
  private g: Element;

  private needToUpdate = false;

  private interpretedInstructions: InterpretedInstruction[][];

  @Input('interpretedInstructions') set _interpretedInstructions(interpretedInstructions: InterpretedInstruction[][]) {
    this.interpretedInstructions = interpretedInstructions;

    if (this.interpretedInstructions && this.interpretedInstructions.length > 0) {
      this.needToUpdate = true;
    }
  }

  @Input('currentTab') set _currentTab(currentTab: string) {
    if (currentTab === 'Graph') {
      if (this.needToUpdate) {
        this.clear();
        this.needToUpdate = false;

        // Drawing graph
        this.svg = document.getElementById('graph');
        d3.select(this.svg).append('g');
        this.g = document.getElementsByTagName('g')[0];
        d3.select(this.svg).call(d3.zoom()
          .scaleExtent([1 / 2, 20])
          .on('zoom', this.zoom));

        const codeSections: CodeSection[] = [];

        for (const list of this.interpretedInstructions) {
          for (let i = 0; i < list.length; ++i) {
            if (list[i].opcode.startsWith('75')) {
              const addr = this.getRelativeAddressByte(list[list.length - 1].addr, list[i]);
              if (addr > list[i].addr) {
                // If - forward jump
              } else {
                // Loop - backward jump
                const addrIndex = this.getInstructionIndex(list, addr);
                const type = 'LOOP:';
                codeSections.push(new CodeSection(addrIndex, i, type));
              }
            } else if (list[i].opcode.startsWith('E8')) {
              if (codeSections.length > 0) {
                codeSections.push(new CodeSection(this.getLastSection(codeSections).endIndex + 1, i, ''));
              } else {
                codeSections.push(new CodeSection(0, i, ''));
              }

              const addr = this.getRelativeAddressDWord(list[list.length - 1].addr, list[i]);
              list[i].op1 = 'LOC_' + addr.toString(16).toUpperCase().padStart(8, '0');
              const addrIndex = this.getInstructionIndex(list, addr);
              const retIndex = this.getRetIndexAfterIndex(list, addrIndex);
              const type = 'LOC_ ' + addr.toString(16).toUpperCase().padStart(8, '0') + ' CALL:';
              codeSections.push(new CodeSection(addrIndex, retIndex, type));
            }
          }
        }

        const data = this.buildTree(this.interpretedInstructions, codeSections);

        const tree = d3.tree().size([this.svg.clientWidth, this.svg.clientHeight]);
        const root = d3.hierarchy(data);
        tree(root);

        d3.select(this.g)
          .selectAll('rect.node')
          .data(root.descendants())
          .enter()
          .append('rect')
          .classed('node', true)
          .attr('width', function (d: any) {
            const txt = d.data.content.split('\n');
            let maxLength = txt[0].length;
            for (const i of txt) {
              if (i.length > maxLength) {
                maxLength = i.length;
              }
            }

            d.data.width = maxLength * 12;
            return d.data.width;
          })
          .attr('height', function (d: any) {
            const txt = d.data.content.split('\n');

            d.data.height = txt.length * 16;
            return d.data.height;
          })
          .attr('x', function (d: any) {
            d.data.x = d.x - d.data.width / 2;
            return d.data.x;
          })
          .attr('y', function (d: any) {
            if (d.parent) {
              d.data.y = d.parent.data.y + d.parent.data.height + 100;
              return d.data.y;
            } else {
              d.data.y = d.y;
              return d.data.y;
            }
          });

        d3.select(this.g)
          .selectAll('text.type')
          .data(root.descendants())
          .enter()
          .append('text')
          .text(d => d.data.type)
          .attr('class', 'type')
          .attr('x', function (d: any) {
            return d.data.x;
          })
          .attr('y', function (d: any) {
            return d.data.y - 5;
          });

        const text = d3.select(this.g)
          .selectAll('text.text')
          .data(root.descendants())
          .enter()
          .append('text')
          .attr('x', function (d: any) {
            return d.data.x + 10;
          })
          .attr('y', function (d: any) {
            return d.data.y;
          });

        text.selectAll('tspan.text')
          .data(d => d.data.content.split('\n'))
          .enter()
          .append('tspan')
          .attr('class', 'text')
          .text(d => d)
          .attr('x', function () {
            return d3.select(this.parentNode).attr('x');
          })
          .attr('dy', 16);

        d3.select(this.g)
          .selectAll('line.link')
          .data(root.links())
          .enter()
          .append('line')
          .classed('link', true)
          .attr('x1', function (d: any) {
            return d.source.data.x + d.source.data.width / 2;
          })
          .attr('y1', function (d: any) {
            return d.source.data.y + d.source.data.height;
          })
          .attr('x2', function (d: any) {
            return d.target.data.x + d.target.data.width / 2;
          })
          .attr('y2', function (d: any) {
            return d.target.data.y;
          });

        for (const section of codeSections) {
          console.log('Start: ' + section.startIndex + ' Stop: ' + section.endIndex);
        }
      }
    }
  }

  private getRelativeAddressByte(lastInstrAdress: number, instruction: InterpretedInstruction) {
    let relativeJumpAdress = parseInt(instruction.op1, 16) + instruction.addr + instruction.opcode.length / 2;
    if (relativeJumpAdress > lastInstrAdress) {
      relativeJumpAdress = relativeJumpAdress - 0x100;
    }
    return relativeJumpAdress;
  }

  private getRelativeAddressDWord(lastInstrAdress: number, instruction: InterpretedInstruction) {
    let relativeJumpAdress = parseInt(instruction.op1, 16) + instruction.addr + instruction.opcode.length / 2;
    if (relativeJumpAdress > lastInstrAdress) {
      relativeJumpAdress = relativeJumpAdress - 0x100000000;
    }
    return relativeJumpAdress;
  }

  constructor() {
  }

  ngOnInit() {
  }

  private zoom() {
    const g = document.getElementsByTagName('g')[0];
    d3.select(g).attr('transform', d3.event.transform);
  }

  private clear() {
    const graph = document.getElementById('graph');
    while (graph.firstChild) {
      graph.removeChild(graph.firstChild);
    }
  }

  private getInstructionIndex(list: InterpretedInstruction[], address: number): number {
    let index = -1;

    for (let i = 0; i < list.length; ++i) {
      if (list[i].addr === address) {
        index = i;
        return index;
      }
    }

    return index;
  }

  private getRetIndexAfterIndex(list: InterpretedInstruction[], address: number): number {
    for (let i = address; i < list.length; ++i) {
      if (list[i].mnemo.match('[RET] | [JUMP]')) {
        return i;
      }
    }

    return -1;
  }

  private getLastSection(codeSections: CodeSection[]) {
    let _section = null;

    for (const section of codeSections) {
      if (section.type.length === 0 || section.type.match('LOOP')) {
        _section =  section;
      }
    }

    return _section;
  }

  private buildTree(instructions: InterpretedInstruction[][], codeSections: CodeSection[]): Node {
    const list: InterpretedInstruction[] = [];
    for (const i of instructions) {
      for (const j of i) {
        list.push(j);
      }
    }

    let preStartIndex;
    let preStopIndex;
    let postStartIndex;
    let postStopIndex;
    if (codeSections.length > 0) {
      preStartIndex = 0;
      preStopIndex = codeSections[0].startIndex - 1;
      postStartIndex = this.getLastSection(codeSections).endIndex + 1;
      postStopIndex = list.length - 1;
    } else {
      preStartIndex = 0;
      preStopIndex = list.length - 1;
    }

    let children: Node[] = [];
    let root = new Node(this.buildInstrString(list, preStartIndex, preStopIndex), '', children);

    let haveBeginningSection = false;
    if (codeSections.length > 0 && codeSections[0].startIndex === 0) {
      root = new Node(this.buildInstrString(list, codeSections[0].startIndex, codeSections[0].endIndex), codeSections[0].type, children);
      haveBeginningSection = true;
    }

    for (const section of codeSections) {
      if (haveBeginningSection) {
        haveBeginningSection = false;
        continue;
      }

      children.push(new Node(this.buildInstrString(list, section.startIndex, section.endIndex), section.type, children = []));
    }

    if (codeSections.length > 0 && postStartIndex < postStopIndex) {
      children.push(new Node(this.buildInstrString(list, postStartIndex, postStopIndex), ''));
    }

    return root;
  }

  private buildInstrString(instructions: InterpretedInstruction[], startIndex: number, stopIndex: number): string {
    let intCounter = 0;

    let instrString = '';
    for (let i = startIndex; i <= stopIndex; ++i) {
      const instr = instructions[i];
      let tmp = instr.mnemo;
      if (instr.op1.length > 0) {
        tmp = tmp + ' ' + instr.op1;

        if (instr.op2.length > 0) {
          tmp = tmp + ', ' + instr.op2;

          if (instr.op3.length > 0) {
            tmp = tmp + ', ' + instr.op3;
          }
        }
      }

      if (!tmp.match('INT 3')) {
        if (intCounter > 0) {
          instrString = instrString + '\n' + '------------';
          instrString = instrString + '\n' + 'INT 3 |x' + intCounter + '|';
          instrString = instrString + '\n' + '------------';
          intCounter = 0;
        }

        instrString = instrString + '\n' + tmp.trim();
      } else {
        ++intCounter;
      }
    }

    return instrString;
  }
}

class CodeSection {
  startIndex: number;
  endIndex: number;
  type: string;

  constructor(startIndex: number, endIndex: number, type: string) {
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.type = type;
  }
}

class Node {
  x: number;
  y: number;
  width: number;
  height: number;

  content: string;
  type: string;
  children: Node[];

  constructor(content: string, type: string, children: Node[] = []) {
    this.content = content;
    this.type = type;
    this.children = children;
  }
}
