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
  private instructions: InterpretedInstruction[];
  private entryPoint = 0;
  private graph: Graph;
  private zoomBehaviour;
  private zoomApplied = false;

  constructor() { }
  ngOnInit() { }

  @Input('interpretedInstructions') set _interpretedInstructions(interpretedInstructions: InterpretedInstruction[][]) {
    this.interpretedInstructions = JSON.parse(JSON.stringify(interpretedInstructions));

    if (this.interpretedInstructions && this.interpretedInstructions.length > 0) {
      this.entryPoint = this.interpretedInstructions[0][0].addr;
      this.interpretedInstructions[0].shift();

      this.instructions = [];
      for (const list of this.interpretedInstructions) {
        for (const i of list) {
          this.instructions.push(i);
        }
      }

      this.needToUpdate = true;
    }
  }

  @Input('currentTab') set _currentTab(currentTab: string) {
    if (currentTab === 'Graph') {
      if (this.needToUpdate) {
        this.clear();
        this.needToUpdate = false;

        if (!this.zoomApplied) {
          this.zoomApplied = true;
          this.svg = document.getElementById('graph');
          this.zoomBehaviour = d3.zoom().on('zoom', this.zoom);
          d3.select(this.svg).call(this.zoomBehaviour);
        }

        d3.select(this.svg).transition().call(this.zoomBehaviour.transform, d3.zoomIdentity);
        d3.select(this.svg).append('g');
        this.g = document.getElementsByTagName('g')[0];

        // Drawing graph
        const startIndex = this.getInstructionIndex(this.entryPoint);

        const stack: number[] = [];
        const prog: string[] = [];
        const locations: string[] = [];

        stack.push(-1);
        const codeSections: CodeSection[] = [];
        this.graph = new Graph(this.instructions, this.g, 50, 150);

        let p = startIndex;
        prog.push('START');
        let x = 0;
        for (let ip = startIndex; ip < this.instructions.length; ++ip) {
          const instruction = this.instructions[ip];

          if (instruction.opcode.startsWith('E8')) {
            // CALL
            prog.push(ip.toString(10));
            prog.push('CALL');

            const addr = this.getRelativeAddressDWord(instruction);

            const location = 'LOC_' + this.instructions[p].addr.toString(16).padStart(8, '0').toUpperCase();
            if (!locations.includes(location)) {
              locations.push(location);
              codeSections.push(new CodeSection(stack.length, p, ip, location, addr));
            }

            stack.push(ip + 1);
            ip = this.getInstructionIndex(addr);

            if (ip === -1) {
              console.log(addr);
              console.log(instruction);
            }

            p = ip;
            --ip;
          } else if (instruction.mnemo.match('RET')) {
            prog.push(ip.toString(10));

            // const index = stack.pop();

            const location = 'LOC_' + this.instructions[p].addr.toString(16).padStart(8, '0').toUpperCase();
            if (!locations.includes(location)) {
              locations.push(location);
              codeSections.push(new CodeSection(stack.length, p, ip, location, this.instructions[0].addr));
            }

            ip = stack.pop();
            p = ip;

            if (ip === -1) {
              prog.push('EXIT');
              break;
            } else {
              prog.push('RET');
            }

            --ip;
          } else if (instruction.opcode.startsWith('E9')) {
            // JMP rel32
            prog.push(ip.toString(10));
            prog.push('JMP');

            const addr = this.getRelativeAddressDWord(instruction);

            const location = 'LOC_' + this.instructions[p].addr.toString(16).padStart(8, '0').toUpperCase();
            if (!locations.includes(location)) {
              locations.push(location);
              codeSections.push(new CodeSection(stack.length, p, ip, location, addr));
            }

            ip = this.getInstructionIndex(addr);
            p = ip;

            --ip;
          } else if (instruction.opcode.startsWith('EB')) {
            // JMP rel8
            prog.push(ip.toString(10));
            prog.push('JMP');

            const addr = this.getRelativeAddressByte(instruction);

            const location = 'LOC_' + this.instructions[p].addr.toString(16).padStart(8, '0').toUpperCase();
            if (!locations.includes(location)) {
              locations.push(location);
              codeSections.push(new CodeSection(stack.length, p, ip, location, addr));
            }

            ip = this.getInstructionIndex(addr);
            p = ip;

            --ip;
          } else if (instruction.opcode.startsWith('74') || instruction.opcode.startsWith('75')) {
            // JZ rel8
            prog.push(ip.toString(10));

            const addr = this.getRelativeAddressByte(instruction);

            const location = 'LOC_' + this.instructions[p].addr.toString(16).padStart(8, '0').toUpperCase();
            if (!locations.includes(location)) {
              locations.push(location);
              codeSections.push(new CodeSection(stack.length, p, ip, location, addr));
            }

            p = ip;
            ++p;

            stack.push(ip + 1);
            ip = this.getInstructionIndex(addr);

            if (ip === -1) {
              console.log(addr);
              console.log(instruction);
            }

            p = ip;
            --ip;
          }

          prog.push(ip.toString(10));

          ++x;
          if (x > 3 * this.instructions.length) {
            break;
          }
        }

        this.graph.drawCodeSections(codeSections);

        // console.log(prog);
        // console.log(codeSections);
        // console.log(locations);

        for (let i = 0; i < codeSections.length; ++i) {
          for (let j = 0; j < codeSections.length; ++j) {
            if (codeSections[i].header === codeSections[j].header && codeSections[i] !== codeSections[j]) {
               // console.log(codeSections[i]);
            }
          }
        }
      }
    }
  }

  private getRelativeAddressByte(instruction: InterpretedInstruction) {
    let relativeJumpAdress = parseInt(instruction.op1, 16) + instruction.addr + instruction.opcode.length / 2;
    if (parseInt(instruction.op1, 16) > 0x7F) {
      relativeJumpAdress = relativeJumpAdress - 0x100;
    }
    return relativeJumpAdress;
  }

  private getRelativeAddressDWord(instruction: InterpretedInstruction) {
    let relativeJumpAdress = parseInt(instruction.op1, 16) + instruction.addr + instruction.opcode.length / 2;
    if (parseInt(instruction.op1, 16) > 0x7F000000) {
      relativeJumpAdress = relativeJumpAdress - 0x100000000;
    }
    return relativeJumpAdress;
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

  reset() {
    d3.select(this.svg).transition().duration(1000).call(this.zoomBehaviour.transform, d3.zoomIdentity);
  }

  private getInstructionIndex(address: number): number {
    for (let i = 0; i < this.instructions.length; ++i) {
      if (this.instructions[i].addr === address) {
        return i;
      }
    }

    return -1;
  }
}

class CodeSection {
  level: number;
  startIndex: number;
  stopIndex: number;
  header: string;

  targetAddress: number;

  constructor(level: number, startIndex: number, stopIndex: number, header: string, targetAddress: number) {
    this.level = level;
    this.startIndex = startIndex;
    this.stopIndex = stopIndex;
    this.header = header;
    this.targetAddress = targetAddress;
  }
}

class Graph {
  private readonly instructions: InterpretedInstruction[];
  private readonly padX;
  private readonly padY;
  private readonly g: Element;

  private nodes: Node[] = [];

  private currX = 0;
  private currY = 0;

  constructor(instructions: InterpretedInstruction[], g: Element, padX: number, padY: number) {
    this.instructions = instructions;
    this.g = g;
    this.padX = padX;
    this.padY = padY;
  }

  drawCodeSections(codeSections: CodeSection[]) {
    for (const codeSection of codeSections) {
      const node = new Node(this.instructions, codeSection);
      this.nodes.push(node);
    }

    for (let i = 0; i < this.nodes.length; ++i) {
      const node = this.nodes[i];

      if (i > 0) {
        const previousNode = this.nodes[i - 1];

        if (node.level > 1) {
          const nodesFromPreviousLevel: Node[] = [];
          for (const j of this.nodes) {
            if (j.level === node.level - 1) {
              nodesFromPreviousLevel.push(j);
            }
          }
          let maxWidth = nodesFromPreviousLevel[0].width;
          for (const j of  nodesFromPreviousLevel) {
            if (j.width > maxWidth) {
              maxWidth = j.width;
            }
          }
          this.currX = (maxWidth + this.padX) * (node.level - 1);
        } else {
          this.currX = 0;
        }

        this.currY += previousNode.height + this.padY;
      }

      node.x = this.currX;
      node.y = this.currY;
      this.drawNode(node);
    }

    for (let i = 0; i < this.nodes.length; ++i) {
      const node = this.nodes[i];
      const instruction = this.instructions[node.stopIndex];
      if (instruction.opcode.startsWith('E8')) {
        const target = this.getNode(node.targetAddress);
        if (target != null) {
          this.drawLine(node, target);
        }
      } else if (instruction.opcode.startsWith('74') || instruction.opcode.startsWith('75')) {
        let target = this.getNode(node.targetAddress);
        if (target != null) {
          this.drawLine(node, target);
        }

        target = this.getNextNodeOnSameLevel(i);
        if (target != null) {
          this.drawLine(node, target);
        }
      } else if (instruction.opcode.startsWith('EB') || instruction.opcode.startsWith('E9')) {
        const target = this.getNode(node.targetAddress);
        if (target != null) {
          this.drawLine(node, target);
        }
      } else if (instruction.mnemo.match('RET')) {
        const target = this.getNextNodeOnSameLevel(this.getPreviousCallNodeIndex(i));
        if (target != null) {
          this.drawLine(node, target);
        }
      }
    }
  }

  private getPreviousCallNodeIndex(index: number) {
    for (let i = index; i >= 0; --i) {
      if (this.instructions[this.nodes[i].stopIndex].opcode.startsWith('E8') && this.nodes[index].level > this.nodes[i].level) {
        return i;
      }
    }

    return null;
  }

  private getNextNodeOnSameLevel(index: number): Node {
    for (let i = index + 1; i < this.nodes.length; ++i) {
      if (this.nodes[i].level === this.nodes[index].level) {
        return this.nodes[i];
      }
    }

    return null;
  }

  private getNode(address: number): Node {
    for (const i of this.nodes) {
      if (this.instructions[i.startIndex].addr === address) {
        return i;
      }
    }

    return null;
  }

  private drawNode(node: Node) {
    d3.select(this.g).append('rect').classed('node', true).attr('x', node.x).attr('y', node.y)
      .attr('width', node.width).attr('height', node.height);
    d3.select(this.g).append('text').classed('header', true).text(node.header).attr('x', node.x).attr('y', node.y - 5);
    const text = d3.select(this.g).append('text').attr('x', node.x + 10).attr('y', node.y);
    text.selectAll('tspan.text').data(node.content.split('\n')).enter().append('tspan').attr('class', 'text').text(d => d)
      .attr('x', function () {
        return d3.select(this.parentNode).attr('x');
      }).attr('dy', 16);
  }

  private drawLine0(x1, x2, y1, y2) {
    d3.select(this.g).append('line').classed('link', true)
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2);
  }

  private drawLine(source: Node, target: Node) {
    const x1 = source.x + source.width / 2;
    const y1 = source.y + source.height;
    const x2 = target.x + target.width / 2;
    const y2 = target.y;
    d3.select(this.g).append('line').classed('link', true)
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2);
  }
}

class Node extends CodeSection {
  x: number;
  y: number;
  width: number;
  height: number;

  content: string;

  constructor(instructions: InterpretedInstruction[], codeSection: CodeSection) {
    super(codeSection.level, codeSection.startIndex, codeSection.stopIndex, codeSection.header, codeSection.targetAddress);

    this.content = this.buildInstrString(instructions, this.startIndex, this.stopIndex);

    const text = this.content.split('\n');
    let maxLength = text[0].length;
    for (const i of text) {
      if (i.length > maxLength) {
        maxLength = i.length;
      }
    }
    this.width = maxLength * 12;
    this.height = text.length * 16;
  }

  private buildInstrString(instructions: InterpretedInstruction[], startIndex: number, stopIndex: number): string {
    let intCounter = 0;

    let instrString = '';
    for (let i = startIndex; i <= stopIndex; ++i) {
      const instr = instructions[i];
      let tmp = instr.addr.toString(16).padStart(8, '0').toUpperCase() + ' ' + instr.mnemo.trim();
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
