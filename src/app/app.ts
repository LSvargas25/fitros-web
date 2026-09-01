import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from "./shared/confirm-dialog/confirm-dialog/confirm-dialog";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialog],
  standalone:true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FitRos-app');
}
