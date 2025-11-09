import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { EventService } from './event.service';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ make this component standalone
  imports: [CommonModule, FormsModule, HttpClientModule], // ✅ import modules here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Event Search';
  keyword = '';
  latlong = '34.0522,-118.2437'; // default LA coords
  radius = 10;
  events: any[] = [];
  errorMessage = '';

  constructor(private eventService: EventService) {}

  checkHealth() {
    this.eventService.getHealth().subscribe({
      next: (res) => alert('Backend OK: ' + JSON.stringify(res)),
      error: (err) => alert('Backend error: ' + err.message),
    });
  }

  search() {
    this.errorMessage = '';
    this.events = [];
    this.eventService.searchEvents(this.keyword, this.latlong, this.radius).subscribe({
      next: (data) => {
        // Adjust depending on your API shape
        this.events = data._embedded?.events || [];
        if (!this.events.length) this.errorMessage = 'No events found.';
      },
      error: (err) => {
        this.errorMessage = 'Error fetching events.';
        console.error(err);
      },
    });
  }
}
