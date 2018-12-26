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
          .scaleExtent([1 / 2, 8])
          .on('zoom', this.zoom));

        const codeSections: CodeSection[] = [];

        for (const list of this.interpretedInstructions) {
          for (let i = 0; i < list.length; ++i) {
            if (list[i].opcode.startsWith('75')) {
              const addr = this.getRelativeAdressByte(list[list.length - 1].addr, list[i]);
              if (addr > list[i].addr) {
                // If - forward jump
              } else {
                // Loop - backward jump
                const addrIndex = this.getInstructionIndex(list, addr);
                codeSections.push(new CodeSection(addrIndex, i, 'LOOP:'));

                if (addrIndex === -1) {
                  console.log(addr.toString(16));
                  console.log(list[i]);
                }
              }
            }
          }
        }

        const data = this.buildTree(this.interpretedInstructions, codeSections);

        const tree = d3.tree().size([this.svg.clientWidth, this.svg.clientHeight]);
        const root = d3.hierarchy(data);
        tree(root);

        d3.select(this.g)
          .selectAll('line.link')
          .data(root.links())
          .enter()
          .append('line')
          .classed('link', true)
          .attr('x1', function (d: any) {
            return d.source.x;
          })
          .attr('y1', function (d: any) {
            return d.source.y;
          })
          .attr('x2', function (d: any) {
            return d.target.x;
          })
          .attr('y2', function (d: any) {
            return d.target.y;
          });

        d3.select(this.g)
          .selectAll('rect.node')
          .data(root.descendants())
          .enter()
          .append('rect')
          .classed('node', true)
          .attr('x', function (d: any) {
            return d.x;
          })
          .attr('y', function (d: any) {
            return d.y;
          })
          .attr('width', function (d: any) {
            const txt = d.data.content.split('\n');
            let maxLength = txt[0].length;
            for (const i of txt) {
              if (i.length > maxLength) {
                maxLength = i.length;
              }
            }

            return maxLength * 10;
          })
          .attr('height', function (d: any) {
            const txt = d.data.content.split('\n');

            return txt.length * 21;
          });

        d3.select(this.g)
          .selectAll('text.type')
          .data(root.descendants())
          .enter()
          .append('text')
          .text(d => d.data.type)
          .attr('class', 'type')
          .attr('x', function (d: any) {
            return d.x + 50;
          })
          .attr('y', function (d: any) {
            return d.y - 5;
          });

        const text = d3.select(this.g)
          .selectAll('text.text')
          .data(root.descendants())
          .enter()
          .append('text')
          .attr('x', function (d: any) {
            return d.x;
          })
          .attr('y', function (d: any) {
            return d.y;
          });

        text.selectAll('tspan.text')
          .data(d => d.data.content.split('\n'))
          .enter()
          .append('tspan')
          .attr('class', 'text')
          .text(d => d)
          .attr('x', 500)
          .attr('dy', 22);
      }
    }
  }

  private getRelativeAdressByte(lastInstrAdress: number, instruction: InterpretedInstruction) {
    let relativeJumpAdress = parseInt(instruction.op1, 16) + instruction.addr + instruction.opcode.length / 2;
    if (relativeJumpAdress > lastInstrAdress) {
      relativeJumpAdress = relativeJumpAdress - 0x100;
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
      postStartIndex = codeSections[codeSections.length - 1].endIndex + 1;
      postStopIndex = list.length - 1;
    } else {
      preStartIndex = 0;
      preStopIndex = list.length - 1;
    }

    let children: Node[] = [];
    const root = new Node(this.buildInstrString(list, preStartIndex, preStopIndex), '', children);

    for (const section of codeSections) {
      children.push(new Node(this.buildInstrString(list, section.startIndex, section.endIndex), section.type, children = []));
    }

    if (codeSections.length > 0) {
      children.push(new Node(this.buildInstrString(list, postStartIndex, postStopIndex), ''));
    }

    return root;
  }

  private buildInstrString(instructions: InterpretedInstruction[], startIndex: number, stopIndex: number): string {
    console.log('srt: ' + startIndex);
    console.log('stp: ' + stopIndex);

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

      instrString = instrString + '\n' + tmp;
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
