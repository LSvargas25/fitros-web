import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../../topbar/topbar/topbar';
import { Sidebar } from '../../sidebar/sidebar/sidebar';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterOutlet, Topbar, Sidebar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {}
