import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hex'
})
export class HexPipe implements PipeTransform {

  transform(value: number): string {
    let hex = value.toString(16);
    if (hex.length < 8) {
      hex = hex.padStart(8, '0');
    }
    return hex;
  }

}
