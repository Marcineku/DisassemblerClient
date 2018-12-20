import {Component, Input, OnInit} from '@angular/core';
import * as d3 from 'd3';
import {InterpretedInstruction} from '../app.service';

@Component({
  selector: 'app-graph',
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

  @Input('currentTab') set  _currentTab(currentTab: string) {
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

        const instructions = [];
        instructions.push(this.interpretedInstructions[0][0]);
        instructions.push(this.interpretedInstructions[0][1]);
        instructions.push(this.interpretedInstructions[0][2]);

        this.addNode(instructions, 40, 100);
        this.addNode(instructions, 40, 200);

        const tree = d3.tree().size([1000, 628]);
      }
    }
  }

  constructor() { }

  ngOnInit() { }

  private zoom() {
    const g = document.getElementsByTagName('g')[0];
    d3.select(g).attr('transform', d3.event.transform);
  }

  private addNode(instructions: InterpretedInstruction[], x: number, y: number) {
    const padding = 20;

    const width = 100;
    const height = 22 * instructions.length;

    d3.select(this.g).append('rect')
      .attr('width', width).attr('height', height)
      .attr('x', x).attr('y', y)
      .style('fill', 'white');

    let ty = y;
    for (const i of instructions) {
      d3.select(this.g).append('text').text(i.mnemo + ' ' + i.op1 + ', ' + i.op2 + ', ' + i.op3)
        .attr('x', x + padding)
        .attr('y', ty + padding);
      ty += 20;
    }
  }

  private clear() {
    const graph = document.getElementById('graph');
    while (graph.firstChild) {
      graph.removeChild(graph.firstChild);
    }
  }
}
