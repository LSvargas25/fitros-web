import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit {

  title = '';
  subtitle?: string;

  searchTerm = '';
  showSearch = true;

  @Input() userName = 'Luis Vargas';
  @Input() userRole = 'Admin';
  @Input() notificationCount = 0;

  @Output() menuClick = new EventEmitter<void>();

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateRouteData());

    this.updateRouteData();
  }

  private updateRouteData(): void {
    let current = this.route;

    while (current.firstChild) {
      current = current.firstChild;
    }

    this.title = current.snapshot.data['title'] || '';
    this.subtitle = current.snapshot.data['subtitle'];
  }

  get userInitials(): string {
    if (!this.userName) return '?';

    return this.userName
      .split(' ')
      .map(x => x[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
  }

  onSearch(): void {
    console.log('Search:', this.searchTerm);
  }

  onProfileClick(): void {
    console.log('Open profile menu');
  }

  onLogout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
