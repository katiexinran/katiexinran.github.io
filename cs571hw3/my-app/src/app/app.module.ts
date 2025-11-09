import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // ✅ add this line
import { HttpClientModule } from '@angular/common/http'; // ✅ and this one

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule, // ✅ add here
    HttpClientModule // ✅ add here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
