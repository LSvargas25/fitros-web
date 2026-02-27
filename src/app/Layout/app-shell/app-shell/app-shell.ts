import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../sidebar/sidebar/sidebar';
import { Topbar } from '../../topbar/topbar/topbar';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Sidebar, Topbar, RouterOutlet],
  templateUrl: './app-shell.html'
})
export class AppShell {}
