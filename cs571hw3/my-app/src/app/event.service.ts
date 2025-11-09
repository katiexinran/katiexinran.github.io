import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private backendUrl = 'http://localhost:8080/api'; // Your backend base URL

  constructor(private http: HttpClient) {}

  getHealth(): Observable<any> {
    return this.http.get(`${this.backendUrl}/health`);
  }

  searchEvents(keyword: string, latlong: string, radius: number): Observable<any> {
    const params = `?keyword=${keyword}&latlong=${latlong}&radius=${radius}`;
    return this.http.get(`${this.backendUrl}/search${params}`);
  }
}
