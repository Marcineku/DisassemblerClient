import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jumpAddress'
})
export class JumpAddressPipe implements PipeTransform {

  transform(value: string, addr: number, opcodeLength: number): any {
    let int = parseInt(value, 16) + addr + opcodeLength / 2;
    if (int > 0xFFFFFFFF) {
      int = int - 0x100000000;
    }
    return int;
  }

}
