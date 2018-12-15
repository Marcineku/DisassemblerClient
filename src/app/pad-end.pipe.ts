import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'padEnd'
})
export class PadEndPipe implements PipeTransform {

  transform(value: string, length: number): any {
    return value.padEnd(length, ' ');
  }

}
