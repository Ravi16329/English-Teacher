import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Tutor } from './tutor/tutor';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet , Tutor , FormsModule , NgClass , CommonModule, FormsModule, DatePipe ],
  templateUrl: './app.html',
  styleUrls:[ './app.css']
})
export class App {
  protected title = 'English-Teacher';
}
