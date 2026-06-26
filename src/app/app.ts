import { Component, signal } from '@angular/core';
import { NorwayMapComponent } from './norway-map/norway-map';

@Component({
  selector: 'app-root',
  imports: [NorwayMapComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('norway-map');
}
