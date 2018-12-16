import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material';
import { MaterialModule } from '../material-module';
import { APIInterceptor } from './http-interceptors/api-interceptor';
import { DisassemblyComponent } from './disassembly/disassembly.component';
import { JumpDirective } from './jump.directive';

@NgModule({
  declarations: [
    AppComponent,
    DisassemblyComponent,
    JumpDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MaterialModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: APIInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
