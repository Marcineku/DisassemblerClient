import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpEventType, HttpRequest} from '@angular/common/http';
import {last, map} from 'rxjs/operators';

export interface InterpretedInstruction {
  addr: number;
  opcode: string;
  mnemo: string;
  op1: string;
  op2: string;
  op3: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) {}

  upload(file: File) {
    if (!file) {
      return;
    }

    const formData: FormData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', 'file', formData, {
      reportProgress: true
    });
    return this.http.request(req).pipe(
      map(event => this.getHttpEvent(event)),
      last()
    );
  }

  private getHttpEvent(event: HttpEvent<any>) {
    switch (event.type) {
      case HttpEventType.Response:
        return event.body;
    }
  }
}
